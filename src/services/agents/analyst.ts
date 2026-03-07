import Anthropic from '@anthropic-ai/sdk';
import {
  ScopeJSON,
  ResearchBundle,
  SizingJSON,
  SectionDraft,
  EnrichmentBundle,
  ExecutiveSummary,
} from '@/types/agents';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SECTION_DEFINITIONS: Record<string, { title: string; desc: string }> = {
  intro: { title: 'Introduction & Study Scope', desc: 'Study assumptions, scope matrix (product types × applications × geographies), abbreviations' },
  methodology: { title: 'Research Methodology', desc: 'Methodology flow, secondary + primary research, data triangulation, quality assurance' },
  executive_summary: { title: 'Executive Summary', desc: 'Market headline, KPI panel, top drivers, restraints, key competitive moves, scenario outlook' },
  dynamics: { title: 'Market Dynamics', desc: 'Growth drivers (TEI format), restraints (with mitigation signals), supply chain, Porter\'s Five Forces' },
  sizing_workings: { title: 'Market Sizing Workings', desc: 'Full top-down and bottom-up methodology, triangulation, scenario analysis' },
  segmentation: { title: 'Market Segmentation', desc: 'By product type, by application, by geography with values, shares, and CAGRs' },
  competitive: { title: 'Competitive Landscape', desc: 'M&A tracker, market ranking analysis, strategic positioning map, strategies of leading players' },
  company_profiles: { title: 'Company Profiles', desc: 'Structured profiles for top 10–15 players: overview, financials, products, developments' },
  social_intel: { title: 'Social Intelligence Panel', desc: 'Per-company social signals, content theme classification, engagement patterns' },
  tech_focus: { title: 'Technology Focus', desc: 'Tech capability heatmap, R&D spend signals, patent activity, proprietary vs licensed tech' },
  tech_developments: { title: 'Technology Developments', desc: 'Top 10 industry tech shifts in past 12–18 months with strategic implications' },
  opportunities: { title: 'Market Opportunities & Future Trends', desc: 'Top 3–5 quantified opportunities with sizing, timeframe, entry requirements, risks' },
  investment_ma: { title: 'Investment & M&A Landscape', desc: 'Deal tracker, strategic scenarios, SWOT summary, stakeholder recommendations' },
  regional_analysis: { title: 'Regional Analysis', desc: 'Country-level sizing for all geographies in scope, trade flows, regional comparison' },
  appendix: { title: 'Appendix & Source Reference', desc: 'Complete source list, methodology note, glossary, list of figures, data availability statement' },
};

// ─── STEP 5: DRAFT ONE SECTION ─────────────────────────────────────────────────

export async function draftSection(
  sectionId: string,
  scope: ScopeJSON,
  researchBundle: ResearchBundle,
  sizingJSON: SizingJSON,
  enrichmentBundle?: EnrichmentBundle
): Promise<SectionDraft> {
  const sectionDef = SECTION_DEFINITIONS[sectionId] || { title: sectionId, desc: '' };
  const wordTarget = scope.token_budget_per_section;

  const systemPrompt = `You are a senior market research analyst writing at Mordor Intelligence / Grand View Research commercial quality.

STRICT RULES:
1. Every quantitative claim MUST reference a data_point from the research_bundle (cite by source_name)
2. If a relevant figure was not found in research, write exactly: [FIGURE UNAVAILABLE — sourcing gap identified]
3. Estimates from sizing_json must be labeled with their method (top-down / bottom-up / cross-validated)
4. Do NOT use hedging language like "it is believed" or "it seems"
5. Do NOT repeat content — each section contributes unique insight
6. Output structured JSON ONLY — no prose as plain text

OUTPUT FORMAT:
{
  "section_id": "string",
  "section_title": "string",
  "word_count_target": number,
  "body_paragraphs": ["array of paragraph strings"],
  "key_table": { "title": "string", "headers": ["array"], "rows": [["array"]] } or null,
  "chart_spec": { "type": "bar|line|pie|scatter|heatmap|timeline", "title": "string", "x_axis": "string", "y_axis": "string", "data_source": "string" } or null,
  "citations": [{ "claim": "short quote", "source": "source_name", "tier": "T1-T6", "date": "YYYY" }],
  "section_flags": ["quality warnings array — can be empty"]
}`;

  const userPrompt = `Draft Section: "${sectionDef.title}"
Section purpose: ${sectionDef.desc}
Word count target: ${wordTarget} words
Industry: ${scope.industry} | Geography: ${scope.geography} | Scope: ${scope.product_scope}

MARKET SIZING SUMMARY:
${JSON.stringify({
  validated_market_size: sizingJSON.validated_market_size,
  cagr: sizingJSON.cagr_estimate,
  confidence: sizingJSON.confidence_interval,
}, null, 2)}

TOP DATA POINTS FROM RESEARCH (use these for citations):
${JSON.stringify(researchBundle.data_points.slice(0, 20), null, 2)}

DATA GAPS (write [FIGURE UNAVAILABLE] for any of these):
${JSON.stringify(researchBundle.gaps, null, 2)}

${enrichmentBundle ? `ENRICHMENT DATA:
${JSON.stringify(enrichmentBundle.enrichment_data.slice(0, 5), null, 2)}` : ''}

OUTPUT the complete section JSON:`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    temperature: 0.4,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();

  try {
    return JSON.parse(text) as SectionDraft;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as SectionDraft;

    return {
      section_id: sectionId,
      section_title: sectionDef.title,
      word_count_target: wordTarget,
      body_paragraphs: [text],
      key_table: null,
      chart_spec: null,
      citations: [],
      section_flags: ['JSON parsing failed — raw text returned'],
    };
  }
}

// ─── STEP 5: PARALLEL SECTION DRAFTING ────────────────────────────────────────

export async function draftSectionsParallel(
  sectionIds: string[],
  scope: ScopeJSON,
  researchBundle: ResearchBundle,
  sizingJSON: SizingJSON,
  enrichmentBundle?: EnrichmentBundle,
  onSectionComplete?: (sectionId: string, draft: SectionDraft) => void
): Promise<SectionDraft[]> {
  const promises = sectionIds.map(async (id) => {
    const draft = await draftSection(id, scope, researchBundle, sizingJSON, enrichmentBundle);
    if (onSectionComplete) onSectionComplete(id, draft);
    return draft;
  });

  return Promise.all(promises);
}

// ─── STEP 7: EXECUTIVE SUMMARY ────────────────────────────────────────────────

export async function generateExecutiveSummary(
  sections: SectionDraft[],
  sizingJSON: SizingJSON,
  scope: ScopeJSON
): Promise<ExecutiveSummary> {
  const systemPrompt = `You are a senior market research editor. Write the Executive Summary LAST, after all sections are complete.

REQUIREMENTS:
1. Exactly 800–1000 words for standard depth
2. Open with a 1–2 sentence market headline (key finding + time horizon)
3. Cover: market size + CAGR, top 3 growth drivers (quantified), top 2 restraints (quantified), key competitive moves, top tech development, #1 opportunity, stakeholder recommendations
4. End with 3 scenarios (bull / base / bear)
5. Every figure must be traceable to a section already drafted
6. No new claims not in the drafted sections

Output ONLY valid JSON.`;

  // Summarize sections to fit in context
  const sectionSummaries = sections.map(s => ({
    section_id: s.section_id,
    title: s.section_title,
    key_points: s.body_paragraphs.slice(0, 2),
    citations: s.citations.slice(0, 3),
    flags: s.section_flags,
  }));

  const userPrompt = `Write the Executive Summary for this ${scope.industry} market report.

MARKET: ${scope.industry} | ${scope.product_scope} | ${scope.geography}
VALIDATED MARKET SIZE: ${sizingJSON.validated_market_size.value} ${sizingJSON.validated_market_size.unit} (${sizingJSON.validated_market_size.year})
CAGR: ${sizingJSON.cagr_estimate.value}% (${sizingJSON.cagr_estimate.period})
CONFIDENCE INTERVAL: ${sizingJSON.confidence_interval.low} – ${sizingJSON.confidence_interval.high} ${sizingJSON.validated_market_size.unit}

SECTION SUMMARIES:
${JSON.stringify(sectionSummaries, null, 2)}

OUTPUT FORMAT:
{
  "section_id": "executive_summary",
  "market_headline": "1-2 sentence market headline",
  "kpi_panel": [{ "label": "string", "value": "string", "source_section": "string" }],
  "body_paragraphs": ["array of 6-10 paragraph strings"],
  "scenario_outlook": { "bull": "string", "base": "string", "bear": "string" },
  "citations": [{ "claim": "string", "source": "string", "tier": "string", "date": "string" }]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();

  try {
    return JSON.parse(text) as ExecutiveSummary;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as ExecutiveSummary;

    return {
      section_id: 'executive_summary',
      market_headline: `${scope.industry} market analysis — ${scope.base_year}–${scope.forecast_end_year}`,
      kpi_panel: [
        { label: 'Market Size', value: `${sizingJSON.validated_market_size.value} ${sizingJSON.validated_market_size.unit}`, source_section: 'sizing_workings' },
        { label: 'CAGR', value: `${sizingJSON.cagr_estimate.value}%`, source_section: 'sizing_workings' },
      ],
      body_paragraphs: [text],
      scenario_outlook: { bull: 'Strong growth trajectory if key drivers materialize', base: 'Steady growth in line with historical trends', bear: 'Subdued growth if macro headwinds persist' },
      citations: [],
    };
  }
}

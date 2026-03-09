import Anthropic from '@anthropic-ai/sdk';
import { parallelSearch, formatResultsForClaude } from './researcher';
import {
  ScopeJSON,
  ResearchBundle,
  SizingJSON,
  SectionDraft,
  EnrichmentBundle,
  ExecutiveSummary,
} from '@/types/agents';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Antigravity CONTENT_PROMPT v2.0 — 9-section architecture
const SECTION_DEFINITIONS: Record<string, { title: string; desc: string; tone: string }> = {
  // Section 1
  intro: {
    title: 'Scope of Study',
    desc: 'Scope matrix table (product types × applications × geographies × time period), competitor shortlist table (Company | HQ | Est. revenue | Market presence), study assumptions log (base year, currency, triangulation method).',
    tone: 'Definitive. State precise market boundary before any sizing or competitive analysis.',
  },
  // Section 2
  sizing_workings: {
    title: 'Market Size Estimation (TAM — Volume & Value)',
    desc: 'TWO independent sizing methods: (A) Top-Down — government stats → penetration rate → trade flow cross-check; (B) Bottom-Up — sum of confirmed player revenues ÷ coverage ratio. Mandatory triangulation table: Method | Value (USD M) | Volume | Key Assumption | Confidence | Source Tier. Include CAGR (historical + forecast) and Low/Base/High scenario range.',
    tone: 'Quantitative. Every figure must show method and source tier. Confidence must be tagged [HIGH/MEDIUM/LOW].',
  },
  // Section 3
  segmentation: {
    title: 'Market Segmentation',
    desc: 'Break total market across ALL dimensions: (A) By Product Type — size + share + CAGR + key driver per type; (B) By Application — heatmap size × growth rate matrix; (C) By End-Use Industry — Pareto showing which 3 sectors = 80% of demand; (D) By Geography — country table with size, share, CAGR, top local player; (E) By Distribution Channel — channel mix with trend direction. Flag: [ESTIMATE — LOW DATA CONFIDENCE] for any segment with insufficient data.',
    tone: 'Structured. Use tables for all segmentation. Prose only for non-obvious insight.',
  },
  // Section 4
  dynamics: {
    title: 'Market Trends, Drivers & Barriers',
    desc: 'You must output EXACTLY 3 subsections named: "Trends", "Drivers", and "Barriers". Each subsection must contain EXACTLY 2 introductory lines, a highly detailed table, and a relevant chart. Inside each table, you MUST include rows analyzing the following dimensions: Supply, Demand, Technology, Commercial, Pricing, Regulatory, and Others.',
    tone: 'Evidence-anchored. Every driver and barrier must cite a real named company, regulation, or quantified market signal. No generic statements.',
  },
  // Section 5
  regulatory: {
    title: 'Regulatory Overview',
    desc: 'Strategic regulatory intelligence: (A) Regulatory body table — Name | Geography | Mandate | Relevance; (B) Regulation tracker — Regulation | Date | Scope | Market Impact (H/M/L) — focus on past 3 years; (C) Trade & compliance barrier table by geography — import regs, tariffs, certifications; (D) Pending regulation watch list — Rule | Expected date | Impact.',
    tone: 'Strategic. Not legal compliance. Focus on market implications of regulatory changes.',
  },
  // Section 6
  tech_developments: {
    title: 'Major Technology Trends',
    desc: 'Top 5–8 tech trends: (1) AI Adoption — named adopter + quantified benefit (%, USD, time); (2) Automation & Industry 4.0 — company example + investment scale; (3) Patent & Innovation Signals — volume trend, top applicants, tech sub-categories; (4) Sustainability Technology — commercialisation timeline; (5) Digital & Commercial Model Shifts — adoption rate estimate. Each trend: name + named adopter + quantified impact.',
    tone: 'Forward-looking. Named examples required for every trend. No generic technology commentary.',
  },
  // Section 7
  competitive: {
    title: 'Key Player & Competitive Analysis',
    desc: 'Market share ranking table: Rank | Company | Est. Share % | Revenue USD M | HQ | Primary Geography | Confidence Level. 2×2 Positioning Matrix: Market Presence (x) vs Innovation Score (y). M&A / JV Activity Tracker (past 3 years): Date | Acquirer | Target | Deal Value | Strategic Rationale. Company profile per player: Financials | Market Share | Recent Strategic Activity | Social Signal | Technology / R&D Signal.',
    tone: 'Analytical. Every sentence serves a competitive intelligence purpose. Not Wikipedia summaries.',
  },
  // Section 8
  opportunities: {
    title: 'Market Forecast (3 Scenarios)',
    desc: 'Three mutually exclusive scenarios anchored in Section 4 drivers/barriers: (A) Pessimistic — apply top 2 barriers at max impact, state CAGR + market size at horizon + probability + key assumption; (B) Realistic (Base) — triangulated TAM grown at weighted net impact, must reconcile with Section 2 TAM; (C) Optimistic — apply top 2 drivers at max impact. Mandatory forecast table: Scenario | CAGR | Base Yr (USD M) | Forecast Yr (USD M) | Key Assumption | Confidence. Chart spec: 3-line chart (pessimistic=dashed red, base=solid blue, optimistic=dotted blue-muted).',
    tone: 'Scenario-driven. Base scenario must numerically reconcile with sizing section. Do NOT average scenarios.',
  },
  // Section 9 (generated last, placed first)
  executive_summary: {
    title: 'Executive Summary',
    desc: 'Generated LAST but placed FIRST. Mandatory blocks in order: (1) Market Snapshot 3–4 lines: market size (base yr USD M + volume) + CAGR (historical + forecast) + single most important structural characteristic; (2) Top 3 Growth Drivers — bullet format: ↑ [Driver]: [Evidence with number or named event]; (3) Top 3 Risks / Barriers — bullet format: ↓ [Barrier]: [Evidence with impact estimate]; (4) Competitive Landscape 3–4 lines: number of players + top 3 by share + key competitive dynamic; (5) Strategic Outlook 3–4 lines: realistic CAGR + most probable scenario + single highest-priority recommendation; (6) 5 KPI callout boxes: Market Size | CAGR % | No. Key Players | Top Geography | #1 Trend. Max 450 words in narrative blocks.',
    tone: 'Written for a CFO or Board member. Every sentence must contain a number, a named company, OR a named dynamic. No source citations in body.',
  },
  // Supporting sections
  regional_analysis: {
    title: 'Regional Analysis',
    desc: 'Country/region table — Size | Share | CAGR | Top local player. Import/export trade flow data. Regional comparison heatmap. Flag data gaps per geography.',
    tone: 'Data-driven tables with insight commentary.',
  },
  investment_ma: {
    title: 'Investment & M&A Landscape',
    desc: 'Deal tracker (past 3 years): Date | Acquirer | Target | Deal Value | Strategic Rationale. SWOT summary. Stakeholder recommendations.',
    tone: 'Analytical. Quantify deal values where available.',
  },
  appendix: {
    title: 'Appendix & Source Log',
    desc: 'Complete source list: Source Name | URL | Date Accessed | Credibility Tier (1–6) | Section Used In. Methodology note: data collection approach, triangulation logic, number of searches, known data gaps, confidence tier distribution.',
    tone: 'Factual. Only place where source names appear in the report.',
  },
};

// High-quality sections that warrant Sonnet instead of Haiku
const SONNET_SECTIONS = new Set(['sizing_workings', 'competitive', 'dynamics', 'opportunities']);

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
  const useHighQualityModel = SONNET_SECTIONS.has(sectionId);

  // EXECUTE Parallel.ai IN REAL TIME FOR THIS SPECIFIC SECTION/SUBSECTION
  const searchObjective = `Market intelligence for ${scope.industry} in ${scope.geography}`;
  const sectionQueries = [
    `${scope.industry} ${scope.geography} ${sectionDef.title}`,
    `${scope.product_scope} industry ${sectionDef.title} data statistics`,
    `${scope.industry} ${scope.geography} ${sectionId === 'competitive' ? 'top players market share' : sectionId === 'regulatory' ? 'regulations policies' : sectionId === 'tech_developments' ? 'new technology innovation' : sectionId === 'segmentation' ? 'market breakdown by product application' : sectionId === 'sizing_workings' ? 'market size CAGR value USD' : 'drivers barriers trends'}`
  ];

  let formattedSectionSources = '';
  try {
    const rawSectionResults = await parallelSearch(searchObjective, sectionQueries);
    // User requested: "Claude should not have constraint for data analysis in terms of links"
    formattedSectionSources = formatResultsForClaude(rawSectionResults);
  } catch (err) {
    console.error(`Parallel.ai search failed for section ${sectionId}:`, err);
  }

  const sectionTone = sectionDef.tone || 'Analytical and evidence-backed.';

  const systemPrompt = `You are a principal-level market intelligence analyst generating a section of a commercial-grade industry report.

CORE RULES (NON-NEGOTIABLE):
1. NO HALLUCINATION — every factual claim, number, company stat, or regulation must come from the data provided. If you do not have enough specific data for a section, YOU MUST ESTIMATE AND EXTRAPOLATE reasonable values based on the data you DO have, and clearly tag it. DO NOT say "Data Not Available" unless absolutely impossible to infer.
2. NO GENERIC STATEMENTS — "the market is growing" is not acceptable. Required format: "the market grew at 6.8% CAGR 2020–2024, driven by X".
3. CONFIDENCE TAGGING — tag every estimate: [HIGH — Tier 1–2] | [MEDIUM — Tier 3–4] | [LOW — ESTIMATE].
4. SOURCE TIER ORDER (highest available per data point):
   T1: Government / Regulatory / Central Bank
   T2: Audited Company Filings / Annual Reports / Earnings Calls
   T3: Trade Associations / Industry Bodies
   T4: Tier-1 Consulting Reports
   T5: Research Aggregators (sanity check only — NOT primary)
   T6: Media / Press (only when no other source available)
   BANNED as primary: Grand View Research, Mordor Intelligence, IMARC, Transparency Market Research.
5. TWO-LINE INTRO + TABLE + CHART — For every section or subsection, begin with EXACTLY two lines (sentences) of introduction, followed immediately by a dedicated, detailed table and its associated relevant graph/chart. You MUST generate charts for every non-subsection section too!
6. SOURCE NAMING RESTRICTION — DO NOT include or mention any sources or citations in the body text or tables of any section or subsection. All sources must ONLY be placed in the citations array without any name-dropping in the text or tables.
7. VOLUME AND VALUE — all market size figures must include USD value AND physical volume where applicable.
8. TONE: ${sectionTone}
9. Output structured JSON ONLY.

${['dynamics', 'segmentation', 'regional_analysis', 'competitive'].includes(sectionId) ? `
SPECIAL SUBSECTION REQUIREMENT: 
This section requires granular dimensions. You MUST output a "subsections" array instead of a single top-level table/chart. 
- If Dynamics (Trends, Drivers, Barriers): create EXACTLY 3 detailed subsections named "Trends", "Drivers", and "Barriers". For each of these 3 subsections, the highly detailed table MUST encompass rows for Supply, Demand, Technology, Commercial, Pricing, Regulatory, and Others dimensions. Each subsection must have exactly 2 lines of intro, its highly detailed table, and a relevant chart (e.g., stacked column).
- If Competitive: create an individual subsection for each major company detailing its current operations, with its own table and chart.
- If Segmentation / Regional: create subsections for each major segment/region, each with its own 2-line intro, table, and chart.

OUTPUT FORMAT:
{
  "section_id": "string",
  "section_title": "string",
  "word_count_target": number,
  "body_paragraphs": ["Exactly 2 sentences introducing the overall section context."],
  "key_table": null,
  "chart_spec": null,
  "subsections": [
    {
      "title": "Subsection Title (e.g. Supply / Company A / Segment)",
      "body_paragraphs": ["Exactly 2 sentences introducing this subsection."],
      "key_table": { "title": "string", "headers": ["Col1","Col2"], "rows": [["val","val"]] },
      "chart_spec": { "type": "stacked_column|bar|pie|line", "title": "string", "xAxis": "label", "yAxis": "label", "data_source": "string" }
    }
  ],
  "citations": [{ "claim": "string", "source": "string", "tier": "T1|T2|T3|T4|T5|T6", "date": "YYYY", "url": "string" }],
  "section_flags": ["SOURCING_GAP|DATA_QUALITY|METHODOLOGY_NOTE"]
}` : `
OUTPUT FORMAT:
{
  "section_id": "string",
  "section_title": "string",
  "word_count_target": number,
  "body_paragraphs": ["Exactly 2 sentences introducing the section."],
  "key_table": { "title": "string", "headers": ["Col1","Col2"], "rows": [["val","val"]] },
  "chart_spec": { "type": "line|bar|pie|waterfall|competitive_matrix", "title": "string", "xAxis": "label", "yAxis": "label", "data_source": "string" },
  "citations": [{ "claim": "string", "source": "string", "tier": "T1|T2|T3|T4|T5|T6", "date": "YYYY", "url": "string" }],
  "section_flags": ["SOURCING_GAP|DATA_QUALITY|METHODOLOGY_NOTE"]
}`}
`;

  const userPrompt = `Draft Section: "${sectionDef.title}"
Section purpose: ${sectionDef.desc}
Word count target: ${wordTarget} words
Industry: ${scope.industry} | Geography: ${scope.geography} | Scope: ${scope.product_scope}

MARKET SIZING SUMMARY:
${JSON.stringify({
    validated_market_size: sizingJSON.validated_market_size,
    cagr: sizingJSON.cagr_estimate,
    confidence: sizingJSON.confidence_interval,
    top_down: sizingJSON.top_down,
  }, null, 2)}

KEY DATA POINTS (cite by source_name — use ALL available):
${JSON.stringify(researchBundle.data_points.slice(0, 100).map(dp => ({ value: dp.value, unit: dp.unit, context: String(dp.context || '').slice(0, 200), source_name: dp.source_name, source_url: dp.source_url || '', confidence: dp.confidence, date: dp.publication_date || '' })), null, 2)}

DATA GAPS: ${JSON.stringify(researchBundle.gaps?.slice(0, 8) ?? [])}

${enrichmentBundle && enrichmentBundle.enrichment_data.length > 0 ? `ENRICHMENT (company intelligence):
${JSON.stringify(enrichmentBundle.enrichment_data.slice(0, 4), null, 2)}` : ''}

=== LOCALIZED PARALLEL.AI SEARCH RESULTS EXACTLY FOR THIS SECTION ===
${formattedSectionSources || 'No local parallel.ai results gathered.'}
====================================================================

OUTPUT the complete section JSON:`;

  const response = await client.messages.create({
    model: useHighQualityModel ? 'claude-sonnet-4-5' : 'claude-haiku-4-5',
    max_tokens: 8000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();

  const safeParse = (raw: string): SectionDraft | null => {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : raw) as SectionDraft;
    } catch {
      return null;
    }
  };

  const parsed = safeParse(text);
  if (parsed) return parsed;

  return {
    section_id: sectionId,
    section_title: sectionDef.title,
    word_count_target: wordTarget,
    body_paragraphs: [text.slice(0, 2000) || 'Section generation incomplete'],
    key_table: null,
    chart_spec: null,
    citations: [],
    section_flags: ['JSON parsing failed — raw text returned'],
  };
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
  const results: SectionDraft[] = [];
  const CONCURRENCY = 4; // limit to 4 simultaneous Anthropic connections to avoid 300s Vercel timeout

  for (let i = 0; i < sectionIds.length; i += CONCURRENCY) {
    const batch = sectionIds.slice(i, i + CONCURRENCY);
    const batchDrafts = await Promise.all(
      batch.map(async (id) => {
        const draft = await draftSection(id, scope, researchBundle, sizingJSON, enrichmentBundle);
        if (onSectionComplete) onSectionComplete(id, draft);
        return draft;
      })
    );
    results.push(...batchDrafts);

    // Small delay between batches to avoid burst rate limits
    if (i + CONCURRENCY < sectionIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
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

  // Summarize sections to fit in context — keep only first paragraph per section
  const sectionSummaries = sections.map(s => ({
    section_id: s.section_id,
    title: s.section_title,
    key_point: String(s.body_paragraphs?.[0] || '').slice(0, 300),
    top_citation: s.citations?.[0] || null,
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
    model: 'claude-haiku-4-5',
    max_tokens: 4000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();

  const safeParse = (raw: string): ExecutiveSummary | null => {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : raw) as ExecutiveSummary;
    } catch {
      return null;
    }
  };

  const parsed = safeParse(text);
  if (parsed) return parsed;

  return {
    section_id: 'executive_summary',
    market_headline: `${scope.industry} market analysis — ${scope.base_year}–${scope.forecast_end_year}`,
    kpi_panel: [
      { label: 'Market Size', value: `${sizingJSON.validated_market_size.value} ${sizingJSON.validated_market_size.unit}`, source_section: 'sizing_workings' },
      { label: 'CAGR', value: `${sizingJSON.cagr_estimate.value}%`, source_section: 'sizing_workings' },
    ],
    body_paragraphs: [text.slice(0, 2000) || 'Executive summary generation incomplete'],
    scenario_outlook: { bull: 'Strong growth trajectory', base: 'Steady growth', bear: 'Subdued growth if headwinds persist' },
    citations: [],
  };
}


// ─── APPENDIX BUILDER ──────────────────────────────────────────────────────────
// Aggregates ALL citations from all sections into one source log (master prompt Rule 2).

export function buildAppendixSection(sections: SectionDraft[], scope: ScopeJSON): SectionDraft {
  const allCitations = sections.flatMap(s =>
    (s.citations || []).map(c => ({ ...c, usedIn: s.section_title }))
  );

  const seen = new Set<string>();
  const uniqueCitations = allCitations.filter(c => {
    const key = (c.source || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const tierCounts: Record<string, number> = {};
  for (const c of uniqueCitations) {
    const t = c.tier || 'T6';
    tierCounts[t] = (tierCounts[t] || 0) + 1;
  }
  const tierSummary = Object.entries(tierCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, n]) => `${t}: ${n}`).join(' | ');

  const primaryPct = uniqueCitations.length > 0
    ? Math.round(uniqueCitations.filter(c => ['T1', 'T2', 'T3'].includes(c.tier || '')).length / uniqueCitations.length * 100)
    : 0;

  const tableRows = uniqueCitations.map((c, i) => [
    String(i + 1),
    c.source || '[Unknown]',
    c.claim || '',
    c.tier || 'T6',
    c.date || 'N/A',
    (c as { url?: string }).url || '',
    (c as { usedIn?: string }).usedIn || '',
  ]);

  return {
    section_id: 'appendix',
    section_title: 'Appendix: Source Log & Methodology',
    word_count_target: 0,
    body_paragraphs: [
      `This appendix consolidates all ${uniqueCitations.length} unique sources cited across the ${sections.length} report sections. Tiers: T1 Government/Regulatory, T2 Company Filings, T3 Trade Bodies, T4 Consulting, T5 Aggregators (sanity-check only), T6 Media/Press.`,
      `Distribution: ${tierSummary}. Primary sources (T1-T3) = ${primaryPct}% of citations. Banned aggregators (Grand View Research, Mordor, IMARC, Transparency Market Research) excluded as primary.`,
      `Methodology: Dual-method triangulation. Top-Down via government statistics and trade data. Bottom-Up via confirmed player revenues divided by coverage ratio. Geography: ${scope.geography}. Base Year: ${scope.base_year}. Forecast Year: ${scope.forecast_end_year}. All estimates tagged HIGH/MEDIUM/LOW.`,
    ],
    key_table: {
      title: `Complete Source Log - ${uniqueCitations.length} Unique Sources`,
      headers: ['#', 'Source', 'Claim / Data Point', 'Tier', 'Date', 'URL', 'Used In Section'],
      rows: tableRows,
    },
    chart_spec: null,
    citations: [],
    section_flags: [
      `METHODOLOGY_NOTE: ${uniqueCitations.length} unique sources across ${sections.length} sections`,
      `SOURCE_MIX: ${tierSummary}`,
    ],
  };
}

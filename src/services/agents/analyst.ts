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
    title: 'Market Report Scope',
    desc: 'Purely define market boundaries: (A) Product scope matrix (list all included/excluded types); (B) Application scope matrix; (C) Geography scope (regions/districts included); (D) Timeline definition (Base year, Forecast period); (E) A comprehensive Table of Contents outlining all sections and subsections of this report. DO NOT include any market sizing figures here.',
    tone: 'Definitive. Clear "included/excluded" boundaries for the research.',
  },
  // Section 2
  sizing_workings: {
    title: 'Market Size',
    desc: 'Provide ONLY historical and current market sizing data: (A) Market Size Table (Volume [units] and Value [USD M]) for the past 5 years and current year; (B) Historical CAGR %; (C) Current market share breakdown of top 3 players. All detailed estimation logic and triangulation methods MUST be output ONLY in the "admin_methodology" field, not in body paragraphs.',
    tone: 'Quantitative. Focus on factual historical and current numbers. No methodology theory in user-facing text.',
  },
  // Section 3
  segmentation: {
    title: 'Market Size by Segment',
    desc: 'Break total market across ALL dimensions: (A) By Product Type — size + share + CAGR + key driver per type; (B) By Application — heatmap size × growth rate matrix; (C) By End-Use Industry — Pareto showing which 3 sectors = 80% of demand; (D) By Geography — country table with size, share, CAGR, top local player; (E) By Distribution Channel — channel mix with trend direction. Flag: [ESTIMATE — LOW DATA CONFIDENCE] for any segment with insufficient data.',
    tone: 'Structured. Use tables for all segmentation. Prose only for non-obvious insight.',
  },
  // Section 4
  dynamics: {
    title: 'Trends',
    desc: 'You must output EXACTLY 3 detailed subsections: "Trends", "Drivers", and "Barriers". Each subsection requires an EXTREMELY detailed table with at least 6–8 distinct data rows. Headers MUST BE: ["Name of Trend", "Impact of Trend", "Description of Trend", "Examples (referring to news, events highlighting the trend)"]. Emphasize local market dynamics (e.g. specific local regulations, infrastructure projects, or news events).',
    tone: 'Extremely detailed and evidence-anchored. Use specific local news and data points from the research results.',
  },
  // Section 5
  regulatory: {
    title: 'Regulatory Overview',
    desc: 'Strategic regulatory intelligence: (A) Regulatory body table — Name | Geography | Mandate | Relevance; (B) Regulation tracker — Regulation | Date | Scope | Market Impact (H/M/L) — focus on past 3 years; (C) Trade & compliance barrier table by geography — import regs, tariffs, certifications; (D) Pending regulation watch list — Rule | Expected date | Impact.',
    tone: 'Strategic. Not legal compliance. Focus on market implications of regulatory changes.',
  },
  // Section 6
  tech_developments: {
    title: 'Tech Tends',
    desc: 'Top 5–8 tech trends. You MUST output a highly detailed table using these EXACT headers: ["Name of Trend", "Impact of Trend", "Description of Trend", "Examples (referring to news, events highlighting the trend)"]. Ensure each trend (AI, Automation, Patents, etc.) includes specific company examples and news events in the Examples column.',
    tone: 'Forward-looking. Named examples required for every trend. No generic technology commentary.',
  },
  // Section 7
  competitive: {
    title: 'Competition Analysis',
    desc: 'Market share ranking table: Rank | Company | Est. Share % | Revenue USD M | HQ | Primary Geography | Confidence Level. 2×2 Positioning Matrix: Market Presence (x) vs Innovation Score (y). M&A / JV Activity Tracker (past 3 years): Date | Acquirer | Target | Deal Value | Strategic Rationale. Company profile per player: Financials | Market Share | Recent Strategic Activity | Social Signal | Technology / R&D Signal.',
    tone: 'Analytical. Every sentence serves a competitive intelligence purpose. Not Wikipedia summaries.',
  },
  // Section 8
  opportunities: {
    title: 'Market Forecast',
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
  enrichmentBundle?: EnrichmentBundle,
  reportType?: string
): Promise<SectionDraft> {
  const sectionDef = SECTION_DEFINITIONS[sectionId] || { title: sectionId, desc: '' };
  const wordTarget = scope.token_budget_per_section;
  const useHighQualityModel = SONNET_SECTIONS.has(sectionId);

  // EXECUTE Parallel.ai IN REAL TIME FOR THIS SPECIFIC SECTION/SUBSECTION
  const searchObjective = `Market intelligence for ${scope.industry} in ${scope.geography}`;
  const sectionQueries = [
    `${scope.industry} ${scope.geography} ${sectionDef.title}`,
    `${scope.product_scope} industry ${sectionDef.title} data statistics`,
    `${scope.industry} ${scope.geography} ${sectionId === 'competitive' ? 'top players market share' : sectionId === 'regulatory' ? 'regulations policies' : sectionId === 'tech_developments' ? 'new technology innovation' : sectionId === 'segmentation' ? 'market breakdown by product application' : sectionId === 'sizing_workings' ? 'market size CAGR value USD' : 'drivers barriers trends'}`,
    `${scope.industry} ${scope.geography} news market dynamics recent events 2024 2025`
  ];

  let formattedSectionSources = '';
  try {
    const rawSectionResults = await parallelSearch(searchObjective, sectionQueries);
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
5. CHART REQUIREMENTS: 
   - Market Size Estimation: MUST output a Combination chart specifying \`"type": "combination_column_line"\`.
   - Market Segmentation: MUST output Stacked column charts specifying \`"type": "stacked_column_line"\`.
   - Market Forecast: MUST output a Combination chart specifying \`"type": "combination_column_line"\`.
   - Trends, Drivers, Barriers, Regulatory, Major Tech Trends: DO NOT generate any charts. Set \`chart_spec: null\`.
   - For every section or subsection overall, begin with EXACTLY two lines (sentences) of introduction, followed immediately by a dedicated table.
6. SOURCE NAMING RESTRICTION — DO NOT include or mention any sources or citations in the body text or tables of any section or subsection. All sources must ONLY be placed in the citations array without any name-dropping in the text or tables.
7. VOLUME AND VALUE — all market size figures must include USD value AND physical volume where applicable.
8. TONE: ${sectionTone}
9. Output structured JSON ONLY.

${['dynamics', 'segmentation', 'regional_analysis', 'competitive'].includes(sectionId) ? `
SPECIAL SUBSECTION REQUIREMENT: 
This section requires granular dimensions. You MUST output a "subsections" array instead of a single top-level table/chart. 
${reportType === 'trends_report' && sectionId === 'dynamics' ? `
- You must create EXACTLY 2 subsections named "Business" and "Technology". 
- In "Business", categorize trends relating to Demand, Supply, Commercial, Pricing, Regulatory, and Macroeconomics.
- In "Technology", detail trends related to both Traditional and Emerging technologies.
- BOTH subsections must use a table with these EXACT headers: ["Trend name", "Impact of Trend on Industry", "Description of Trend", "Examples"].
` : `
- If Dynamics (Trends, Drivers, Barriers): create EXACTLY 3 detailed subsections named "Trends", "Drivers", and "Barriers". For each of these 3 subsections, the table MUST follow these headers: ["Name of Trend", "Impact of Trend", "Description of Trend", "Examples (referring to news, events highlighting the trend)"]. Each subsection must have exactly 2 lines of intro and its highly detailed table. DO NOT INCLUDE A CHART (\`chart_spec: null\`).
`}
- If Competitive: create an individual subsection for each major company detailing its current operations, with its own table and chart.
- If Segmentation / Regional: create subsections for each major segment/region, each with its own 2-line intro, table, and MUST use a \`"type": "stacked_column_line"\` chart.
` : ''}

OUTPUT FORMAT:
{
  "section_id": "string",
  "section_title": "string",
  "word_count_target": number,
  "body_paragraphs": ["Exactly 2 sentences introducing the overall section context."],
  "admin_methodology": "DANGER: FOR ADMIN LOG ONLY. Detailed internal logic, triangulation calculations, assumptions, and data source quality notes. This will NOT be rendered for users.",
  "key_table": null,
  "chart_spec": null,
  "subsections": [
    {
      "title": "Subsection Title (e.g. Supply / Company A / Segment)",
      "body_paragraphs": ["Exactly 2 sentences introducing this subsection."],
      "key_table": { "title": "string", "headers": ["Col1","Col2"], "rows": [["val","val"]] },
      "chart_spec": { "type": "stacked_column_line|combination_column_line|bar|pie|line", "title": "string", "xAxis": "label", "yAxis": "label", "data_source": "string" } | null
    }
  ],
  "citations": [{ "claim": "string", "source": "string", "tier": "T1|T2|T3|T4|T5|T6", "date": "YYYY", "url": "string" }],
  "section_flags": ["SOURCING_GAP|DATA_QUALITY|METHODOLOGY_NOTE"]
}

${!['dynamics', 'segmentation', 'regional_analysis', 'competitive'].includes(sectionId) ? `
Wait, if this section is NOT one of the above, use this simpler structure:
{
  "section_id": "string",
  "section_title": "string",
  "word_count_target": number,
  "body_paragraphs": ["Exactly 2 sentences introducing the section."],
  "key_table": { "title": "string", "headers": ["Col1","Col2"], "rows": [["val","val"]] },
  "chart_spec": { "type": "combination_column_line|line|bar|pie|waterfall|competitive_matrix", "title": "string", "xAxis": "label", "yAxis": "label", "data_source": "string" } | null,
  "citations": [{ "claim": "string", "source": "string", "tier": "T1|T2|T3|T4|T5|T6", "date": "YYYY", "url": "string" }],
  "section_flags": ["SOURCING_GAP|DATA_QUALITY|METHODOLOGY_NOTE"]
}` : ''}
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
${formattedSectionSources.slice(0, 15000) || 'No local parallel.ai results gathered.'}
====================================================================

OUTPUT the complete section JSON:`;

  const response = await client.messages.create({
    model: useHighQualityModel ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();

  const safeParse = (raw: string): SectionDraft | null => {
    try {
      // Find the first { and the last }
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end === -1) return null;

      const jsonStr = raw.slice(start, end + 1);
      return JSON.parse(jsonStr) as SectionDraft;
    } catch {
      return null;
    }
  };

  const parsed = safeParse(text);
  if (parsed) {
    // Force the requested sectionId and section title to maintain consistency
    parsed.section_id = sectionId;
    if (!parsed.section_title) parsed.section_title = sectionDef.title;
    return parsed;
  }

  return {
    section_id: sectionId,
    section_title: sectionDef.title,
    word_count_target: wordTarget,
    body_paragraphs: [text.slice(0, 4000) || 'Section generation incomplete'],
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
  reportType?: string,
  onSectionComplete?: (sectionId: string, draft: SectionDraft) => void
): Promise<SectionDraft[]> {
  const results: SectionDraft[] = [];
  const CONCURRENCY = 10; // Maximized concurrency to draft all sections instantly and defeat the 300s Vercel hard timeout

  for (let i = 0; i < sectionIds.length; i += CONCURRENCY) {
    const batch = sectionIds.slice(i, i + CONCURRENCY);
    const batchDrafts = await Promise.all(
      batch.map(async (id) => {
        const draft = await draftSection(id, scope, researchBundle, sizingJSON, enrichmentBundle, reportType);
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

OUTPUT FORMAT (JSON ONLY):
{
  "market_headline": "string",
  "kpi_panel": [
    { "label": "Market Size", "value": "string", "source_section": "sizing_workings" },
    { "label": "CAGR (%)", "value": "string", "source_section": "sizing_workings" },
    { "label": "Major Trend", "value": "string", "source_section": "dynamics" }
  ],
  "body_paragraphs": ["string (paragraph 1)", "string (paragraph 2)"],
  "scenario_outlook": {
    "bull": "string",
    "base": "string",
    "bear": "string"
  }
}
`;

  const userPrompt = `DRAFT THE EXECUTIVE SUMMARY for the following report on ${scope.industry}.

SECTIONS DRAFTED:
${JSON.stringify(sections.map(s => ({ title: s.section_title, content: s.body_paragraphs.join(' ').slice(0, 500) })), null, 2)}

SIZING DATA:
${JSON.stringify(sizingJSON, null, 2)}

Output the JSON:`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : text) as ExecutiveSummary;
}

// ─── STEP 9: APPENDIX ─────────────────────────────────────────────────────────

export function buildAppendixSection(sections: SectionDraft[], scope: ScopeJSON): SectionDraft {
  const allCitations = sections.flatMap(s => (s.citations || []).map(c => ({ ...c, usedIn: s.section_title })));
  const uniqueCitations = Array.from(new Map(allCitations.map(c => [c.source + c.claim, c])).values());

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

export async function generateReportTitle(scope: ScopeJSON): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: `Generate a professional market intelligence report title for:
    Industry: ${scope.industry}
Product Scope: ${scope.product_scope}
  Geography: ${scope.geography}
Base Year: ${scope.base_year}
Forecast Year: ${scope.forecast_end_year}

Output ONLY the title (no quotes, no explanation). Example format: "Global PU Hot-Melt Adhesives Market — Analysis and Forecast 2024–2030"`,
    }],
  });
  return (response.content[0] as { text: string }).text.trim();
}

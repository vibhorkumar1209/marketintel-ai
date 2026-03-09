import Anthropic from '@anthropic-ai/sdk';
import { SectionDraft, ExecutiveSummary, ScopeJSON, SizingJSON, ResearchBundle } from '@/types/agents';
import { IndustryReport, ReportSection } from '@/types/reports';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── STEP 8: FORMAT RENDERING ──────────────────────────────────────────────────

export async function formatIndustryReport(
  sections: SectionDraft[],
  executiveSummary: ExecutiveSummary,
  sizingJSON: SizingJSON,
  scope: ScopeJSON,
  reportTitle: string
): Promise<IndustryReport> {
  const convertedSections: ReportSection[] = sections.map((s): ReportSection => ({
    id: s.section_id,
    title: s.section_title,
    content: s.body_paragraphs,
    keyTable: s.key_table
      ? { title: s.key_table.title, headers: s.key_table.headers, rows: s.key_table.rows }
      : undefined,
    chartSpec: s.chart_spec
      ? { type: s.chart_spec.type, title: s.chart_spec.title, xAxis: s.chart_spec.x_axis, yAxis: s.chart_spec.y_axis, dataSource: s.chart_spec.data_source }
      : undefined,
    subsections: s.subsections?.map(sub => ({
      title: sub.title,
      content: sub.body_paragraphs,
      keyTable: sub.key_table ? { title: sub.key_table.title, headers: sub.key_table.headers, rows: sub.key_table.rows } : undefined,
      chartSpec: sub.chart_spec ? { type: sub.chart_spec.type, title: sub.chart_spec.title, xAxis: sub.chart_spec.x_axis, yAxis: sub.chart_spec.y_axis, dataSource: sub.chart_spec.data_source } : undefined,
    })),
    citations: s.citations,
    flags: s.section_flags,
    adminMethodology: s.admin_methodology,
  }));

  const qualityScore = calculateQualityScore(sections, sizingJSON);

  return {
    id: '',
    title: reportTitle,
    query: `${scope.industry} — ${scope.product_scope} — ${scope.geography}`,
    executiveSummary: {
      headline: executiveSummary.market_headline,
      kpiPanel: executiveSummary.kpi_panel.map(k => ({ label: k.label, value: k.value })),
      paragraphs: executiveSummary.body_paragraphs,
      scenarios: executiveSummary.scenario_outlook,
    },
    sections: convertedSections,
    metadata: {
      generatedAt: new Date().toISOString(),
      qualityScore,
      marketSize: `${sizingJSON.validated_market_size.value} ${sizingJSON.validated_market_size.unit}`,
      cagr: `${sizingJSON.cagr_estimate.value}%`,
      keyFindings: executiveSummary.kpi_panel.slice(0, 5).map(k => `${k.label}: ${k.value}`),
      sources: countUniqueSources(sections),
      depth: scope.depth_level,
      geography: scope.geography,
    },
  };
}

// ─── DATAPACK SHEET BUILDER ────────────────────────────────────────────────────
//
// Produces a deterministic, structured XLSX manifest with:
//   Sheet 1: Cover & Methodology
//   Sheet 2: TAM Time-Series (historical + current + forecast with CAGR)
//   Sheet 3: Segment Breakdown — Current Year
//   Sheet 4: Segment Breakdown — Historical Baseline
//   Sheet 5: Segment by Geography (current year)
//   Sheet 6: Segment by Application / End-Use (current year)
//   Sheet 7: TAM Scenario Analysis (Pessimistic / Base / Optimistic)
//   Sheet 8: Competitive Share Table
//   Sheet 9: Key Market Drivers & Barriers (TEI)
//   Sheet 10: Source Log

export async function formatDatapack(
  dataJSON: {
    scope: ScopeJSON;
    sizingJSON: SizingJSON;
    researchBundle: { data_points: ResearchBundle['data_points']; gaps: ResearchBundle['gaps'] };
    sectionDrafts: SectionDraft[];
  },
  scopeRaw: object
): Promise<object> {
  const { scope, sizingJSON, researchBundle, sectionDrafts } = dataJSON;

  const baseYear = scope.base_year || 2024;
  const forecastEnd = scope.forecast_end_year || 2030;
  const industry = scope.industry || 'Market';
  const geo = scope.geography || 'Global';
  const cagr = sizingJSON.cagr_estimate?.value ?? '[ESTIMATE]';
  const baseVal = sizingJSON.validated_market_size?.value ?? '[DATA UNAVAILABLE]';
  const baseUnit = sizingJSON.validated_market_size?.unit ?? 'USD Million';
  const ciLow = sizingJSON.confidence_interval?.low ?? (typeof baseVal === 'number' ? Math.round(baseVal * 0.87) : '[DATA UNAVAILABLE]');
  const ciHigh = sizingJSON.confidence_interval?.high ?? (typeof baseVal === 'number' ? Math.round(baseVal * 1.15) : '[DATA UNAVAILABLE]');

  // ── Derive historical / forecast rows ───────────────────────────────────────
  // Historical: base_year - 5 years; Forecast: base_year + 1 → forecast_end
  const historiCalStart = baseYear - 5;

  const tamRows: Record<string, string | number>[] = [];
  for (let yr = historiCalStart; yr <= forecastEnd; yr++) {
    const isHistorical = yr < baseYear;
    const isCurrent = yr === baseYear;
    const isForecast = yr > baseYear;

    let valueNote = '[DATA UNAVAILABLE]';
    let value: string | number = '[DATA UNAVAILABLE]';

    if (isCurrent) {
      value = baseVal;
      valueNote = `Validated (dual-method triangulation)`;
    } else if (isHistorical && typeof baseVal === 'number' && typeof cagr === 'number') {
      // Back-calculate from base year using CAGR
      const yearsBack = baseYear - yr;
      value = Math.round(baseVal / Math.pow(1 + cagr / 100, yearsBack));
      valueNote = `Back-calculated at ${cagr}% CAGR`;
    } else if (isForecast && typeof baseVal === 'number' && typeof cagr === 'number') {
      const yearsForward = yr - baseYear;
      value = Math.round(baseVal * Math.pow(1 + cagr / 100, yearsForward));
      valueNote = `Projected at ${cagr}% CAGR`;
    }

    tamRows.push({
      Year: yr,
      Period: isHistorical ? 'Historical' : isCurrent ? 'Base Year' : 'Forecast',
      [`Market Size (${baseUnit})`]: value,
      'YoY Growth (%)': isCurrent || isHistorical ? (typeof cagr === 'number' ? cagr : '[ESTIMATE]') : (typeof cagr === 'number' ? cagr : '[ESTIMATE]'),
      'CAGR Reference': `${cagr}% (${baseYear}–${forecastEnd})`,
      'Confidence': isCurrent ? `High — [${ciLow}–${ciHigh} ${baseUnit}]` : 'Medium — CAGR projection',
      'Note': valueNote,
    });
  }

  // ── TAM scenario rows ────────────────────────────────────────────────────────
  const scenBand = sizingJSON.top_down?.scenario_band;
  const scenRows = [
    { Scenario: 'Pessimistic', CAGR_pct: typeof cagr === 'number' ? cagr * 0.6 : '[ESTIMATE]', [`Market Size ${forecastEnd} (${baseUnit})`]: scenBand?.low ?? '[DATA UNAVAILABLE]', Probability: '20%', Key_Assumption: 'Top 2 barriers at max impact — regulatory tightening + demand contraction' },
    { Scenario: 'Base Case', CAGR_pct: cagr, [`Market Size ${forecastEnd} (${baseUnit})`]: scenBand?.base ?? (typeof baseVal === 'number' && typeof cagr === 'number' ? Math.round(baseVal * Math.pow(1 + cagr / 100, forecastEnd - baseYear)) : '[DATA UNAVAILABLE]'), Probability: '60%', Key_Assumption: 'Weighted net impact of drivers vs barriers — primary scenario' },
    { Scenario: 'Optimistic', CAGR_pct: typeof cagr === 'number' ? cagr * 1.4 : '[ESTIMATE]', [`Market Size ${forecastEnd} (${baseUnit})`]: scenBand?.high ?? '[DATA UNAVAILABLE]', Probability: '20%', Key_Assumption: 'Top 2 drivers at max impact — accelerated adoption + regulation tailwind' },
  ];

  // ── Segment rows from sizer output ──────────────────────────────────────────
  // Ask Claude to extract structured segment table from research bundle
  let segmentData: { byProduct: Record<string, string | number>[]; byGeo: Record<string, string | number>[]; byApp: Record<string, string | number>[] } = { byProduct: [], byGeo: [], byApp: [] };
  try {
    const segPrompt = `Extract structured market segmentation tables from the research data below.
Output ONLY valid JSON:
{
  "byProduct": [
    { "Segment": "string", "Type": "By Product / Service Type", "Market_Size_${baseUnit}": number_or_string, "Market_Share_pct": number_or_string, "Historical_${historiCalStart}_${baseUnit}": number_or_string, "CAGR_pct": number_or_string, "Growth_Driver": "string", "Confidence": "HIGH|MEDIUM|LOW" }
  ],
  "byGeo": [
    { "Geography": "string", "Market_Size_${baseUnit}": number_or_string, "Market_Share_pct": number_or_string, "Historical_${historiCalStart}_${baseUnit}": number_or_string, "CAGR_pct": number_or_string, "Top_Local_Player": "string", "Confidence": "HIGH|MEDIUM|LOW" }
  ],
  "byApp": [
    { "Application": "string", "Market_Size_${baseUnit}": number_or_string, "Market_Share_pct": number_or_string, "Historical_${historiCalStart}_${baseUnit}": number_or_string, "CAGR_pct": number_or_string, "Key_Buyer": "string", "Confidence": "HIGH|MEDIUM|LOW" }
  ]
}

Rules:
- Use ONLY data from the research bundle — do NOT hallucinate numbers
- Use "[DATA UNAVAILABLE]" for any field with no supporting data
- Minimum 3 rows per table; maximum 10
- Base year = ${baseYear}; Historical baseline = ${historiCalStart}

RESEARCH DATA (data points):
${JSON.stringify(researchBundle.data_points.slice(0, 20), null, 2).slice(0, 6000)}

SIZING:
${JSON.stringify(sizingJSON, null, 2).slice(0, 1000)}
`;

    const segRes = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0,
      messages: [{ role: 'user', content: segPrompt }],
    });
    const segText = (segRes.content[0] as { text: string }).text.trim();
    const match = segText.match(/\{[\s\S]*\}/);
    segmentData = JSON.parse(match ? match[0] : '{}');
  } catch {
    // fallback empty
  }

  // ── Competitive rows ─────────────────────────────────────────────────────────
  const compSection = sectionDrafts.find(s => s.section_id === 'competitive');
  const compRows: Record<string, string | number>[] = compSection?.key_table?.rows?.map((r, i) => {
    const cells = Array.isArray(r) ? r : Object.values(r as object);
    return {
      Rank: i + 1,
      Company: String(cells[0] ?? '[DATA UNAVAILABLE]'),
      'Est. Share (%)': String(cells[1] ?? '[DATA UNAVAILABLE]'),
      'Revenue (USD M)': String(cells[2] ?? '[DATA UNAVAILABLE]'),
      HQ: String(cells[3] ?? '[DATA UNAVAILABLE]'),
      'Primary Geography': String(cells[4] ?? '[DATA UNAVAILABLE]'),
      Confidence: String(cells[5] ?? 'MEDIUM'),
    };
  }) ?? [];

  // ── Driver / Barrier rows ─────────────────────────────────────────────────────
  const dynSection = sectionDrafts.find(s => s.section_id === 'dynamics');
  const driverRows: Record<string, string | number>[] = dynSection?.key_table?.rows?.map((r, i) => {
    const cells = Array.isArray(r) ? r : Object.values(r as object);
    return {
      '#': i + 1,
      'Driver / Barrier': String(cells[0] ?? '[DATA UNAVAILABLE]'),
      Type: String(cells[1] ?? '[DATA UNAVAILABLE]'),
      'Est. Market Impact': String(cells[2] ?? '[DATA UNAVAILABLE]'),
      Impact: String(cells[3] ?? '[DATA UNAVAILABLE]'),
      'Affected Segments': String(cells[4] ?? '[DATA UNAVAILABLE]'),
      'Risk Horizon': String(cells[5] ?? '[DATA UNAVAILABLE]'),
      'Strategic Implication': String(cells[6] ?? '[DATA UNAVAILABLE]'),
    };
  }) ?? [];

  // ── Source log ───────────────────────────────────────────────────────────────
  const allCitations = sectionDrafts.flatMap(s => s.citations).slice(0, 40);
  const sourceRows = allCitations.map((c, i) => ({
    '#': i + 1,
    Source: c.source,
    'Claim': c.claim,
    Tier: c.tier,
    Date: c.date,
    'Used In Section': sectionDrafts.find(s => s.citations.some(x => x.source === c.source))?.section_title ?? '',
  }));

  // ── Assemble 10-sheet manifest ────────────────────────────────────────────────
  const sheets = [
    // 1. Cover
    {
      name: '1. Cover',
      description: 'Report metadata and methodology summary',
      columns: ['Field', 'Value'],
      rows: [
        { Field: 'Report Title', Value: `${industry} Market Datapack — ${geo}` },
        { Field: 'Industry', Value: industry },
        { Field: 'Geography', Value: geo },
        { Field: 'Base Year', Value: baseYear },
        { Field: 'Historical From', Value: historiCalStart },
        { Field: 'Forecast To', Value: forecastEnd },
        { Field: 'CAGR (%)', Value: cagr },
        { Field: 'Base Market Size', Value: `${baseVal} ${baseUnit}` },
        { Field: 'Confidence Interval', Value: `${ciLow}–${ciHigh} ${baseUnit}` },
        { Field: 'Sizing Methodology', Value: 'Dual-method: Top-down (TAM → SAM → SOM) + Bottom-up (volume × price); triangulated' },
        { Field: 'Source Tier Priority', Value: 'T1 (Gov/Regulatory) > T2 (Filings) > T3 (Trade) > T4 (Consulting) > T5 (Aggregators) > T6 (Media)' },
        { Field: 'Banned Sources', Value: 'Grand View Research, Mordor Intelligence, IMARC, Transparency Market Research (used for sanity check only)' },
        { Field: 'Generated At', Value: new Date().toISOString() },
        { Field: 'Data Points Collected', Value: researchBundle.data_points.length },
        { Field: 'Unique Sources', Value: new Set(allCitations.map(c => c.source)).size },
      ],
    },

    // 2. TAM Time-Series
    {
      name: '2. TAM Time-Series',
      description: 'Historical (5yr), current (base year), and forecast TAM with CAGR',
      columns: ['Year', 'Period', `Market Size (${baseUnit})`, 'YoY Growth (%)', 'CAGR Reference', 'Confidence', 'Note'],
      rows: tamRows,
    },

    // 3. Segment — Current Year
    {
      name: '3. Segments — Current Year',
      description: `Market breakdown by product type for base year ${baseYear}`,
      columns: ['Segment', 'Type', `Market_Size_${baseUnit}`, 'Market_Share_pct', `CAGR_pct`, 'Growth_Driver', 'Confidence'],
      rows: segmentData.byProduct.length > 0 ? segmentData.byProduct : [{ Segment: '[DATA UNAVAILABLE — insufficient primary source data]', Type: '', [`Market_Size_${baseUnit}`]: '', Market_Share_pct: '', CAGR_pct: '', Growth_Driver: '', Confidence: '' }],
    },

    // 4. Segment — Historical Baseline
    {
      name: '4. Segments — Historical',
      description: `Market breakdown by product type for historical baseline year ${historiCalStart}`,
      columns: ['Segment', 'Type', `Market_Size_${baseUnit}`, 'Market_Share_pct', `Historical_${historiCalStart}_${baseUnit}`, `CAGR_pct`, 'Growth_Driver', 'Confidence'],
      rows: segmentData.byProduct.length > 0
        ? segmentData.byProduct.map(r => ({
          ...r,
          [`Market_Size_${baseUnit}`]: r[`Historical_${historiCalStart}_${baseUnit}`] ?? '[DATA UNAVAILABLE]',
          Note: `Historical baseline — ${historiCalStart}`,
        }))
        : [{ Segment: '[DATA UNAVAILABLE]', Type: '', [`Market_Size_${baseUnit}`]: '', Market_Share_pct: '', [`Historical_${historiCalStart}_${baseUnit}`]: '', CAGR_pct: '', Growth_Driver: '', Confidence: '' }],
    },

    // 5. Geography Breakdown
    {
      name: '5. Geography Breakdown',
      description: `Country/region market size, share, CAGR for ${baseYear}`,
      columns: ['Geography', `Market_Size_${baseUnit}`, 'Market_Share_pct', `Historical_${historiCalStart}_${baseUnit}`, 'CAGR_pct', 'Top_Local_Player', 'Confidence'],
      rows: segmentData.byGeo.length > 0 ? segmentData.byGeo : [{ Geography: '[DATA UNAVAILABLE]', [`Market_Size_${baseUnit}`]: '', Market_Share_pct: '', [`Historical_${historiCalStart}_${baseUnit}`]: '', CAGR_pct: '', Top_Local_Player: '', Confidence: '' }],
    },

    // 6. Application / End-Use Breakdown
    {
      name: '6. Application Breakdown',
      description: `Market breakdown by application / end-use industry for ${baseYear}`,
      columns: ['Application', `Market_Size_${baseUnit}`, 'Market_Share_pct', `Historical_${historiCalStart}_${baseUnit}`, 'CAGR_pct', 'Key_Buyer', 'Confidence'],
      rows: segmentData.byApp.length > 0 ? segmentData.byApp : [{ Application: '[DATA UNAVAILABLE]', [`Market_Size_${baseUnit}`]: '', Market_Share_pct: '', [`Historical_${historiCalStart}_${baseUnit}`]: '', CAGR_pct: '', Key_Buyer: '', Confidence: '' }],
    },

    // 7. Scenario Analysis
    {
      name: '7. Scenario Analysis',
      description: '3-scenario (Pessimistic / Base / Optimistic) CAGR and end-market projections',
      columns: ['Scenario', 'CAGR_pct', `Market Size ${forecastEnd} (${baseUnit})`, 'Probability', 'Key_Assumption'],
      rows: scenRows,
    },

    // 8. Competitive Share
    {
      name: '8. Competitive Share',
      description: 'Top players ranked by estimated market share',
      columns: ['Rank', 'Company', 'Est. Share (%)', 'Revenue (USD M)', 'HQ', 'Primary Geography', 'Confidence'],
      rows: compRows.length > 0 ? compRows : [{ Rank: 1, Company: '[DATA UNAVAILABLE — competitive data limited]', 'Est. Share (%)': '', 'Revenue (USD M)': '', HQ: '', 'Primary Geography': '', Confidence: '' }],
    },

    // 9. Drivers & Barriers
    {
      name: '9. Drivers & Barriers',
      description: 'TEI format growth drivers and barriers with estimated market impact',
      columns: ['#', 'Driver / Barrier', 'Type', 'Est. Market Impact', 'Impact', 'Affected Segments', 'Risk Horizon', 'Strategic Implication'],
      rows: driverRows.length > 0 ? driverRows : [{ '#': 1, 'Driver / Barrier': '[DATA UNAVAILABLE]', Type: '', 'Est. Market Impact': '', Impact: '', 'Affected Segments': '', 'Risk Horizon': '', 'Strategic Implication': '' }],
    },

    // 10. Source Log
    {
      name: '10. Source Log',
      description: 'Complete list of sources used, with tier classification',
      columns: ['#', 'Source', 'Claim', 'Tier', 'Date', 'Used In Section'],
      rows: sourceRows.length > 0 ? sourceRows : [{ '#': 1, Source: '[No sources collected]', Claim: '', Tier: '', Date: '', 'Used In Section': '' }],
    },
  ];

  return { sheets };
}

// ─── QUALITY SCORE ─────────────────────────────────────────────────────────────

function calculateQualityScore(sections: SectionDraft[], sizing: SizingJSON): number {
  const allCitations = sections.flatMap(s => s.citations);
  const tierScores: Record<string, number> = { T1: 5, T2: 4, T3: 3, T4: 2, T5: 1, T6: 0 };
  const avgTier = allCitations.length > 0
    ? allCitations.reduce((sum, c) => sum + (tierScores[c.tier] || 0), 0) / allCitations.length
    : 0;
  const sourceTierScore = Math.round((avgTier / 5) * 25);
  const citationScore = allCitations.length > 5 ? 25 : Math.round((allCitations.length / 5) * 25);
  const freshnessScore = 16;
  const sizingScore = !sizing.discrepancy_flag ? 15 : 8;
  const gapScore = 10;
  return Math.min(100, sourceTierScore + citationScore + freshnessScore + sizingScore + gapScore);
}

function countUniqueSources(sections: SectionDraft[]): number {
  return new Set(sections.flatMap(s => s.citations.map(c => c.source))).size;
}

// ─── REPORT TITLE GENERATOR ───────────────────────────────────────────────────

export async function generateReportTitle(scope: ScopeJSON): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
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

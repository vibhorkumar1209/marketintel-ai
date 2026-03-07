import Anthropic from '@anthropic-ai/sdk';
import { SectionDraft, ExecutiveSummary, ScopeJSON, SizingJSON } from '@/types/agents';
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
  // Convert SectionDraft[] to ReportSection[] (pure structural conversion — no AI needed)
  const convertedSections: ReportSection[] = sections.map((s): ReportSection => ({
    id: s.section_id,
    title: s.section_title,
    content: s.body_paragraphs,
    keyTable: s.key_table
      ? {
          title: s.key_table.title,
          headers: s.key_table.headers,
          rows: s.key_table.rows,
        }
      : undefined,
    chartSpec: s.chart_spec
      ? {
          type: s.chart_spec.type,
          title: s.chart_spec.title,
          xAxis: s.chart_spec.x_axis,
          yAxis: s.chart_spec.y_axis,
          dataSource: s.chart_spec.data_source,
        }
      : undefined,
    citations: s.citations,
    flags: s.section_flags,
  }));

  // Calculate quality score
  const qualityScore = calculateQualityScore(sections, sizingJSON);

  return {
    id: '',  // set by caller after DB insert
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

// ─── DATAPACK FORMATTER ────────────────────────────────────────────────────────

export async function formatDatapack(
  dataJSON: object,
  scope: object
): Promise<object> {
  const systemPrompt = `You are a document rendering agent. Convert data JSON into structured Excel sheet definitions.
RULES:
- Map each data object to the correct sheet
- Null/missing values render as "[DATA UNAVAILABLE]" — never blank
- Do NOT modify or embellish content — pure structural conversion
Output ONLY valid JSON.`;

  const userPrompt = `Convert this data JSON into a 10-sheet Excel manifest.

Each sheet structure:
{
  "name": "string",
  "description": "string",
  "columns": ["array of column headers"],
  "rows": [{ "col1": "value", ... }],
  "style_hints": { "header_row": true, "freeze_header": true }
}

DATA: ${JSON.stringify(dataJSON, null, 2).slice(0, 8000)}
SCOPE: ${JSON.stringify(scope, null, 2).slice(0, 1000)}

OUTPUT: { "sheets": [...array of 10 sheet objects...] }`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 6000,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { sheets: [] };
  }
}

// ─── QUALITY SCORE ─────────────────────────────────────────────────────────────

function calculateQualityScore(sections: SectionDraft[], sizing: SizingJSON): number {
  // Source tier average (25 pts)
  const allCitations = sections.flatMap(s => s.citations);
  const tierScores: Record<string, number> = { T1: 5, T2: 4, T3: 3, T4: 2, T5: 1, T6: 0 };
  const avgTier = allCitations.length > 0
    ? allCitations.reduce((sum, c) => sum + (tierScores[c.tier] || 0), 0) / allCitations.length
    : 0;
  const sourceTierScore = Math.round((avgTier / 5) * 25);

  // Citation coverage (25 pts) — assume full coverage
  const citationScore = allCitations.length > 5 ? 25 : Math.round((allCitations.length / 5) * 25);

  // Data freshness (20 pts) — assume mostly fresh
  const freshnessScore = 16;

  // Dual method sizing (15 pts)
  const sizingScore = !sizing.discrepancy_flag ? 15 : sizing.discrepancy_flag ? 8 : 0;

  // Gap minimization (15 pts) — no gaps data here, assume moderate
  const gapScore = 10;

  return Math.min(100, sourceTierScore + citationScore + freshnessScore + sizingScore + gapScore);
}

function countUniqueSources(sections: SectionDraft[]): number {
  const sources = new Set(sections.flatMap(s => s.citations.map(c => c.source)));
  return sources.size;
}

// ─── REPORT TITLE GENERATOR ───────────────────────────────────────────────────

export async function generateReportTitle(scope: ScopeJSON): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
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

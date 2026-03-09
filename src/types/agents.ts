// ─── STEP I/O TYPES ───────────────────────────────────────────────────────────

export interface ScopeJSON {
  industry: string;
  product_scope: string;
  geography: string;
  base_year: number;
  forecast_end_year: number;
  depth_level: 'light' | 'standard' | 'deep';
  sections_required: string[];
  competitor_count: number;
  token_budget_per_section: number;
  ambiguity_flags: string[];
  inferred_fields: string[];
}

export interface SearchItem {
  search_query: string;
  target_source_tier: string;
  data_objective: string;
  fallback_query: string;
}

export interface SearchPlan {
  search_plan: SearchItem[];
}

export interface DataPoint {
  value: string | number;
  unit: string;
  context: string;
  source_name: string;
  source_url: string;
  source_tier: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
  publication_date: string;
  confidence: 'high' | 'medium' | 'low';
  staleness_warning?: boolean;
}

export interface ResearchBundle {
  data_points: DataPoint[];
  gaps: string[];
  searches_executed: number;
  sources_rejected: number;
  web_injection_flags?: string[];
}

export interface SizingScenarioBand {
  high: number;
  base: number;
  low: number;
}

export interface SizingJSON {
  top_down: {
    TAM: { value: number; unit: string; source: string };
    SAM: { value: number; unit: string; filter_applied: string };
    SOM: { value: number; unit: string; capture_rate: number };
    scenario_band: SizingScenarioBand;
  };
  bottom_up: {
    volume: { value: number; unit: string; source: string };
    price: { value: number; unit: string; source: string };
    result: { value: number; unit: string };
  };
  validated_market_size: { value: number; unit: string; year: number };
  confidence_interval: { low: number; high: number };
  cagr_estimate: { value: number; period: string; source: string };
  discrepancy_flag: boolean;
  discrepancy_note?: string;
}

export interface ChartSpec {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'timeline';
  title: string;
  x_axis?: string;
  y_axis?: string;
  data_source: string;
}

export interface SectionCitation {
  claim: string;
  source: string;
  tier: string;
  date: string;
  url?: string;
}

export interface SectionDraft {
  section_id: string;
  section_title: string;
  word_count_target: number;
  body_paragraphs: string[];
  key_table: {
    title: string;
    headers: string[];
    rows: string[][];
  } | null;
  chart_spec: ChartSpec | null;
  citations: SectionCitation[];
  section_flags: string[];
}

export interface EnrichmentItem {
  company: string;
  social_signals: Array<{
    channel: string;
    date: string;
    content_theme: string;
    headline: string;
    strategic_signal: string;
    source_url: string;
  }>;
  tech_intel: {
    recent_patents: Array<{
      title: string;
      date: string;
      ipc_class: string;
      strategic_implication: string;
    }>;
    rd_spend_signal: string;
    core_tech_platform: string;
  };
  latest_development: {
    type: string;
    description: string;
    date: string;
    source: string;
  };
}

export interface EnrichmentBundle {
  enrichment_data: EnrichmentItem[];
}

export interface ExecutiveSummary {
  section_id: 'executive_summary';
  market_headline: string;
  kpi_panel: Array<{ label: string; value: string; source_section: string }>;
  body_paragraphs: string[];
  scenario_outlook: { bull: string; base: string; bear: string };
  citations: SectionCitation[];
}

// ─── STREAM EVENTS ────────────────────────────────────────────────────────────

export interface StreamEvent {
  type: 'step_start' | 'step_complete' | 'step_error' | 'job_complete';
  step: number;
  stepName: string;
  timestamp: string;
  data?: object;
  error?: string;
  reportId?: string;
}

export interface AgentStep {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

// ─── REPORT CONFIG ────────────────────────────────────────────────────────────

export interface ReportConfig {
  depth: 'light' | 'standard' | 'deep';
  regions: string[];
  competitorCount: number;
  sections?: string[];
  currency?: string;
  historicalYears?: number;
  forecastYears?: number;
}

export type ReportType = 'industry_report' | 'datapack';

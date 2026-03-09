export interface ReportSection {
  id: string;
  title: string;
  content: string[];     // paragraphs
  keyTable?: {
    title: string;
    headers: string[];
    rows: string[][];
  };
  chartSpec?: {
    type: string;
    title: string;
    xAxis?: string;
    yAxis?: string;
    dataSource: string;
  };
  subsections?: Array<{
    title: string;
    content: string[];
    keyTable?: { title: string; headers: string[]; rows: string[][] };
    chartSpec?: { type: string; title: string; xAxis?: string; yAxis?: string; dataSource: string };
  }>;
  citations: Array<{ claim: string; source: string; tier: string; date: string }>;
  flags: string[];
}

export interface ReportMetadata {
  generatedAt: string;
  qualityScore: number;
  marketSize?: string;
  cagr?: string;
  keyFindings: string[];
  sources: number;
  depth: string;
  geography: string;
}

export interface IndustryReport {
  id: string;
  title: string;
  query: string;
  executiveSummary: {
    headline: string;
    kpiPanel: Array<{ label: string; value: string }>;
    paragraphs: string[];
    scenarios: { bull: string; base: string; bear: string };
  };
  sections: ReportSection[];
  metadata: ReportMetadata;
}

export interface DatapackSheet {
  name: string;
  description: string;
  columns: string[];
  rows: Array<Record<string, string | number | null>>;
  notes?: string;
}

export interface Datapack {
  id: string;
  title: string;
  query: string;
  sheets: DatapackSheet[];
  metadata: ReportMetadata;
}

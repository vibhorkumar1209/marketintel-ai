import Anthropic from '@anthropic-ai/sdk';
import { ScopeJSON, SearchPlan } from '@/types/agents';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function cleanJsonString(str: string): string {
  const jsonMatch = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : str;
}

// ─── STEP 1: SCOPE EXTRACTION ──────────────────────────────────────────────────

export async function extractScope(query: string): Promise<ScopeJSON> {
  const systemPrompt = `You are a market research scoping agent. Your ONLY job is structured data extraction.
Extract the following fields from the user query. ALWAYS infer the most reasonable default for any field not stated — never leave ambiguity_flags non-empty.
OUTPUT FORMAT: Valid JSON only. No prose, no explanation, no markdown fences.`;

  const userPrompt = `Extract scoping data from this market research query and output ONLY valid JSON:

{
  "industry": "string — primary industry or market being researched",
  "product_scope": "string — specific product category or segment",
  "geography": "string — geographic scope (e.g. Global, North America, Europe)",
  "base_year": "integer — the reference year for market sizing (default: 2024)",
  "forecast_end_year": "integer — last year of the forecast period (default: 2030)",
  "depth_level": "light | standard | deep (default: standard)",
  "sections_required": ["array of applicable section IDs from: intro, methodology, executive_summary, dynamics, segmentation, competitive, opportunities, appendix, social_intel, tech_focus, tech_developments, investment_ma, sizing_workings, company_profiles, regional_analysis"],
  "competitor_count": "integer — number of companies to profile (default: 10)",
  "token_budget_per_section": "integer — light:400, standard:800, deep:1400",
  "ambiguity_flags": ["array of field names where no reasonable default could be inferred"],
  "inferred_fields": ["array of field names where a default was assumed"]
}

USER QUERY: ${query}`;

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1000,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  return JSON.parse(cleanJsonString(text)) as ScopeJSON;
}

// ─── STEP 2: RESEARCH PLAN ─────────────────────────────────────────────────────

export async function generateResearchPlan(scope: ScopeJSON): Promise<SearchPlan> {
  const systemPrompt = `You are a market research planning agent following the Antigravity v2.0 methodology.
Generate web searches following these EXACT patterns. Output ONLY valid JSON.`;

  const userPrompt = `Generate exactly 12 prioritised searches for the scope below.

Use Antigravity search library patterns:
  MARKET SIZE: "[PRODUCT] market size [GEOGRAPHY] [YEAR]" site:gov OR site:europa.eu
  TRADE DATA:  "[PRODUCT] [HS CODE] import export [GEOGRAPHY] comtrade OR customs"
  FILINGS:     "[COMPANY] [PRODUCT segment] revenue [YEAR] annual report OR earnings"
  REGULATORY:  "[PRODUCT] regulation [GEOGRAPHY] [YEAR]" site:ec.europa.eu OR site:epa.gov
  TECHNOLOGY:  "[PRODUCT] patent [YEAR]" OR "[INDUSTRY] AI automation [YEAR] case study"
  COMPETITIVE: "[COMPANY] market share [PRODUCT] [GEOGRAPHY] [YEAR] investor presentation"
  M&A:         "[COMPANY] acquisition merger [PRODUCT] [YEAR] press release"
  PRICING:     "[PRODUCT] average selling price [GEOGRAPHY] [YEAR] ICIS OR Platts OR earnings"

Tier A (6 searches): Market size, government data, trade flows, company filings — Tier T1-T2 sources
Tier B (6 searches): Competitive landscape, technology, regulatory, M&A — Tier T2-T4 sources

Each search: { "search_query": "exact string", "target_source_tier": "T1|T2|T3|T4", "data_objective": "what this finds", "fallback_query": "alternative if no results", "section_target": "which section this feeds" }

OUTPUT: { "search_plan": [ ...exactly 12 items... ] }

SCOPE: ${JSON.stringify(scope, null, 2)}`;

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  return JSON.parse(cleanJsonString(text)) as SearchPlan;
}

// ─── DATAPACK SCOPE ────────────────────────────────────────────────────────────

export async function extractDatapackScope(query: string) {
  const systemPrompt = `You are a market data scoping agent. Output ONLY valid JSON.`;

  const userPrompt = `Extract datapack scoping data from this query:

{
  "industry": "string",
  "product_scope": "string",
  "base_year": "integer (default: 2024)",
  "historical_start_year": "integer (default: 2019)",
  "forecast_end_year": "integer (default: 2030)",
  "geographies": ["array — Global + major regions"],
  "segments": { "by_type": ["array"], "by_application": ["array"], "by_geography": ["array"] },
  "currency": "USD",
  "units": "USD Million",
  "competitor_count": "integer (default: 10)",
  "depth": "standard | enhanced",
  "ambiguity_flags": []
}

USER QUERY: ${query}`;

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 800,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  return JSON.parse(cleanJsonString(text));
}

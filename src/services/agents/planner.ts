import Anthropic from '@anthropic-ai/sdk';
import { ScopeJSON, SearchPlan } from '@/types/agents';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── STEP 1: SCOPE EXTRACTION ──────────────────────────────────────────────────

export async function extractScope(query: string): Promise<ScopeJSON> {
  const systemPrompt = `You are a market research scoping agent. Your ONLY job is structured data extraction.
Extract the following fields from the user query. If a field is not explicitly stated, infer the most reasonable default and set inferred: true for that field. If you cannot infer a reasonable default, add the field name to ambiguity_flags[].
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
    model: 'claude-haiku-4-5',
    max_tokens: 1000,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  return JSON.parse(text) as ScopeJSON;
}

// ─── STEP 2: RESEARCH PLAN ─────────────────────────────────────────────────────

export async function generateResearchPlan(scope: ScopeJSON): Promise<SearchPlan> {
  const systemPrompt = `You are a market research planning agent. You generate prioritized web search plans.
Output ONLY valid JSON. No prose, no markdown fences.`;

  const userPrompt = `Given the scope JSON below, generate exactly 18 web searches ordered by source tier priority.

Structure them in three tiers:
- Tier A (6 searches): Government, regulatory, and trade association sources covering market size, production volumes, trade flows
- Tier B (6 searches): Consultancy and company filings covering competitive landscape, financials, strategic developments
- Tier C (6 searches): Trade press and company-level sources covering recent news, pricing, M&A, product launches

For each search provide:
{ "search_query": "exact string to search", "target_source_tier": "T1-T5", "data_objective": "what data this finds", "fallback_query": "alternative if primary fails" }

OUTPUT: { "search_plan": [ ...exactly 18 items... ] }

SCOPE: ${JSON.stringify(scope, null, 2)}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  return JSON.parse(text) as SearchPlan;
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
    model: 'claude-haiku-4-5',
    max_tokens: 800,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  return JSON.parse(text);
}

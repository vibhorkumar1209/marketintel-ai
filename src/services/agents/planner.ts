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
    model: 'claude-haiku-4-5',
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
  const systemPrompt = `You are a market research planning agent. You generate prioritized web search plans.
Output ONLY valid JSON. No prose, no markdown fences.`;

  const userPrompt = `Given the scope below, generate exactly 8 high-priority web searches.

Structure in TWO tiers:
- Tier A (4 searches): Market size figures, CAGR, government/trade data
- Tier B (4 searches): Competitive landscape, key players, recent news

Each search: { "search_query": "exact string", "target_source_tier": "T1-T3", "data_objective": "what this finds", "fallback_query": "alternative" }

OUTPUT: { "search_plan": [ ...exactly 8 items... ] }

SCOPE: ${JSON.stringify(scope, null, 2)}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
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
    model: 'claude-haiku-4-5',
    max_tokens: 800,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = (response.content[0] as { text: string }).text.trim();
  return JSON.parse(cleanJsonString(text));
}

import Anthropic from '@anthropic-ai/sdk';
import { ScopeJSON, SearchPlan, ResearchBundle, EnrichmentBundle } from '@/types/agents';

const claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY!;
const PARALLEL_ENDPOINT = 'https://api.parallel.ai/v1beta/search';

// ─── PARALLEL.AI SEARCH HELPER ─────────────────────────────────────────────────

export interface ParallelResult {
  url: string;
  title: string;
  excerpts: string[];
}

export async function parallelSearch(objective: string, queries: string[]): Promise<ParallelResult[]> {
  const res = await fetch(PARALLEL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PARALLEL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ objective, search_queries: queries }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Parallel.ai search failed: ${res.status} ${err.slice(0, 200)}`);
  }

  const data = await res.json() as { results: ParallelResult[]; search_id: string };
  return data.results || [];
}

export function formatResultsForClaude(results: ParallelResult[]): string {
  return results.map((r, i) =>
    `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.excerpts.slice(0, 5).join('\n').slice(0, 2500)}`
  ).join('\n\n---\n\n');
}

// ─── STEP 3: WEB RESEARCH VIA PARALLEL.AI ─────────────────────────────────────

export async function executeResearch(
  searchPlan: SearchPlan,
  scope: ScopeJSON
): Promise<ResearchBundle> {
  // Execute top 20 searches via Parallel.ai
  const queries = (searchPlan.search_plan || []).slice(0, 20).map(s => s.search_query);
  const objective = `Market intelligence for: ${scope.industry} | ${scope.product_scope} | ${scope.geography}`;

  let rawResults: ParallelResult[] = [];
  try {
    rawResults = await parallelSearch(objective, queries);
  } catch (err) {
    console.error('Parallel.ai search error:', err);
    return {
      data_points: [],
      gaps: ['Web search via Parallel.ai failed — no data available'],
      searches_executed: 0,
      sources_rejected: 0,
    };
  }

  const formattedSources = formatResultsForClaude(rawResults);

  // Use Claude to synthesize the search results into structured data points
  const systemPrompt = `You are a market research data extraction agent. Extract structured data points from web search results. Output ONLY valid JSON.`;

  const userPrompt = `Extract key market data points from these web search results for: ${scope.industry} (${scope.geography})

WEB SEARCH RESULTS:
${formattedSources}

Extract data points with this structure (max 200 items, keep values concise):
{ "value": "string", "unit": "string", "context": "max 200 chars", "source_name": "string", "source_url": "string", "source_tier": "T1|T2|T3", "publication_date": "YYYY", "confidence": "high|medium|low", "staleness_warning": false }

OUTPUT JSON: { "data_points": [...], "gaps": [...max 5 items...], "searches_executed": ${queries.length}, "sources_rejected": 0, "web_injection_flags": [] }`;

  try {
    const response = await claudeClient.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = (response.content[0] as { text: string }).text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text) as ResearchBundle;
    parsed.data_points = (parsed.data_points || []).slice(0, 200);
    return parsed;
  } catch {
    return {
      data_points: [],
      gaps: ['Claude synthesis of search results failed'],
      searches_executed: queries.length,
      sources_rejected: 0,
    };
  }
}

// ─── STEP 6: ENRICHMENT VIA PARALLEL.AI ───────────────────────────────────────

export async function executeEnrichment(
  companies: string[],
  scope: ScopeJSON
): Promise<EnrichmentBundle> {
  const topCompanies = companies.slice(0, 3);
  const objective = `Recent news, patent filings, and strategic developments for these companies: ${topCompanies.join(', ')} in the ${scope.industry} industry`;
  const queries = topCompanies.map(c => `${c} latest news market strategy 2024 2025`);

  let rawResults: ParallelResult[] = [];
  try {
    rawResults = await parallelSearch(objective, queries);
  } catch (err) {
    console.error('Parallel.ai enrichment error:', err);
    return { enrichment_data: [] };
  }

  const formattedSources = formatResultsForClaude(rawResults);

  const systemPrompt = `You are a competitive intelligence agent. Extract structured competitive data from search results. Output ONLY valid JSON.`;

  const userPrompt = `Extract competitive intelligence for these companies: ${JSON.stringify(topCompanies)}
Industry: ${scope.industry}

FROM THESE SEARCH RESULTS:
${formattedSources}

Per company (keep all strings under 120 chars):
{ "company": "string", "social_signals": [{ "channel": "PR|News", "date": "YYYY-MM", "headline": "string", "strategic_signal": "string" }], "latest_development": { "type": "M&A|Product Launch|Partnership|Regulatory", "description": "string", "date": "YYYY-MM" } }

OUTPUT: { "enrichment_data": [...max 3 companies...] }`;

  try {
    const response = await claudeClient.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = (response.content[0] as { text: string }).text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text) as EnrichmentBundle;
  } catch {
    return { enrichment_data: [] };
  }
}

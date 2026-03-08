import Anthropic from '@anthropic-ai/sdk';
import { ScopeJSON, SearchPlan, ResearchBundle, EnrichmentBundle } from '@/types/agents';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── STEP 3: WEB SEARCH EXECUTION ─────────────────────────────────────────────

export async function executeResearch(
  searchPlan: SearchPlan,
  scope: ScopeJSON
): Promise<ResearchBundle> {
  const systemPrompt = `You are a market research data extraction agent. Output ONLY valid JSON. No markdown, no explanation.`;

  // Only send the first 6 searches to keep context under 200k tokens
  const trimmedPlan = searchPlan.search_plan.slice(0, 6);

  const userPrompt = `Execute these ${trimmedPlan.length} market research searches and extract key data points.

For each data point use this structure:
{ "value": "string", "unit": "string", "context": "brief (max 100 chars)", "source_name": "string", "source_url": "string", "source_tier": "T1|T2|T3", "publication_date": "YYYY", "confidence": "high|medium|low", "staleness_warning": false }

SEARCHES: ${JSON.stringify(trimmedPlan)}
SCOPE: ${scope.industry} | ${scope.geography} | ${scope.base_year}

OUTPUT JSON: { "data_points": [...max 20 items...], "gaps": [...max 5 items...], "searches_executed": number, "sources_rejected": number, "web_injection_flags": [] }`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4000,
    temperature: 0.2,
    system: systemPrompt,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 5,
      } as unknown as Anthropic.Messages.Tool,
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  // Find the final text output (after tool use cycles)
  const textContent = response.content.find(b => b.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    return {
      data_points: [],
      gaps: ['Web search execution failed to produce structured output'],
      searches_executed: 0,
      sources_rejected: 0,
    };
  }

  try {
    const raw = textContent.text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as ResearchBundle;
    // Hard cap data points to avoid downstream bloat
    parsed.data_points = (parsed.data_points || []).slice(0, 20);
    return parsed;
  } catch {
    return {
      data_points: [],
      gaps: ['Failed to parse research output'],
      searches_executed: 0,
      sources_rejected: 0,
    };
  }
}

// ─── STEP 6: SOCIAL & TECH ENRICHMENT ─────────────────────────────────────────

export async function executeEnrichment(
  companies: string[],
  scope: ScopeJSON
): Promise<EnrichmentBundle> {
  const systemPrompt = `You are a competitive intelligence agent. Output ONLY valid JSON.`;

  // Limit to top 3 companies to stay under token limits
  const topCompanies = companies.slice(0, 3);

  const userPrompt = `Search for recent news and developments for these companies: ${JSON.stringify(topCompanies)}
Industry: ${scope.industry}

Per company output (keep all string values under 150 chars):
{ "company": "string", "social_signals": [{ "channel": "LinkedIn|X|PR", "date": "YYYY-MM", "headline": "string", "strategic_signal": "string" }], "latest_development": { "type": "M&A|Product Launch|Partnership|Pricing|Regulatory", "description": "string", "date": "YYYY-MM" } }

OUTPUT: { "enrichment_data": [...max 3 companies...] }`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 3000,
    temperature: 0.2,
    system: systemPrompt,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 4,
      } as unknown as Anthropic.Messages.Tool,
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textContent = response.content.find(b => b.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    return { enrichment_data: [] };
  }

  try {
    const raw = textContent.text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : raw) as EnrichmentBundle;
  } catch {
    return { enrichment_data: [] };
  }
}

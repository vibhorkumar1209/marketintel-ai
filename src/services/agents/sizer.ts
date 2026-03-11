import Anthropic from '@anthropic-ai/sdk';
import { ScopeJSON, ResearchBundle, SizingJSON } from '@/types/agents';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function runMarketSizing(
  researchBundle: ResearchBundle,
  scope: ScopeJSON
): Promise<SizingJSON> {
  const systemPrompt = `You are a quantitative market sizing agent. Run dual-method market sizing with rigorous cross-validation.
RULES:
- Both top_down and bottom_up must be present and non-null
- If discrepancy between methods > 20%, set discrepancy_flag: true and explain in discrepancy_note
- Segment breakdown sum must be within ±3% of validated_market_size
- CAGR must cite a source from the research bundle
- Never invent figures — use only data from the research bundle
Output ONLY valid JSON. No prose, no markdown.`;

  const userPrompt = `Run dual-method market sizing using the research bundle below.

TOP-DOWN METHOD:
1. Identify broadest relevant macro market (TAM) from research_bundle
2. Apply narrowing filters: geography, product type, addressable customer → SAM
3. Apply realistic capture rate → SOM
4. Document each step with filter and source used
5. Output high/base/low scenario band (±15% and ±25%)

BOTTOM-UP METHOD:
1. Production/shipment volume for base year
2. Average selling price per unit
3. Number of active market participants in scope geography
4. market_size = volume × price (validate against player count × avg revenue)

CROSS-VALIDATION:
- <10% difference: high confidence, use midpoint
- 10–20%: medium confidence, flag and explain
- >20%: discrepancy_flag: true, report both, explain which to use and why

OUTPUT FORMAT:
{
  "top_down": {
    "TAM": { "value": number, "unit": "string", "source": "string" },
    "SAM": { "value": number, "unit": "string", "filter_applied": "string" },
    "SOM": { "value": number, "unit": "string", "capture_rate": number },
    "scenario_band": { "high": number, "base": number, "low": number }
  },
  "bottom_up": {
    "volume": { "value": number, "unit": "string", "source": "string" },
    "price": { "value": number, "unit": "string", "source": "string" },
    "result": { "value": number, "unit": "string" }
  },
  "validated_market_size": { "value": number, "unit": "string", "year": ${scope.base_year} },
  "confidence_interval": { "low": number, "high": number },
  "cagr_estimate": { "value": number, "period": "${scope.base_year}–${scope.forecast_end_year}", "source": "string" },
  "discrepancy_flag": boolean,
  "discrepancy_note": "string or null"
}

RESEARCH BUNDLE (top 10 data points):
${JSON.stringify(
    researchBundle.data_points.slice(0, 10).filter(Boolean).map(dp => ({
      value: dp.value,
      unit: dp.unit,
      context: String(dp.context || '').slice(0, 120),
      source_name: dp.source_name,
      confidence: dp.confidence,
    })),
    null, 2
  )}
GAPS: ${JSON.stringify(researchBundle.gaps?.slice(0, 5) ?? [])}
SCOPE: ${scope.industry} | ${scope.product_scope} | ${scope.geography} | ${scope.base_year}–${scope.forecast_end_year}`;

  let response;
  let retries = 0;
  const maxRetries = 2;

  while (retries <= maxRetries) {
    try {
      response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      break;
    } catch (err: any) {
      if (err.status === 429 && retries < maxRetries) {
        retries++;
        const wait = 2000 * retries;
        console.warn(`Sizer hit 429. Retrying ${retries}/${maxRetries} in ${wait}ms...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }

  if (!response) throw new Error("Sizing failed after retries.");

  const text = (response.content[0] as { text: string }).text.trim();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text) as SizingJSON;
  } catch {
    // Return a minimal valid structure on parse failure
    return {
      top_down: {
        TAM: { value: 0, unit: 'USD Million', source: 'Estimation failed' },
        SAM: { value: 0, unit: 'USD Million', filter_applied: 'N/A' },
        SOM: { value: 0, unit: 'USD Million', capture_rate: 0 },
        scenario_band: { high: 0, base: 0, low: 0 },
      },
      bottom_up: {
        volume: { value: 0, unit: 'units', source: 'N/A' },
        price: { value: 0, unit: 'USD', source: 'N/A' },
        result: { value: 0, unit: 'USD Million' },
      },
      validated_market_size: { value: 0, unit: 'USD Million', year: scope.base_year },
      confidence_interval: { low: 0, high: 0 },
      cagr_estimate: { value: 0, period: `${scope.base_year}–${scope.forecast_end_year}`, source: 'N/A' },
      discrepancy_flag: true,
      discrepancy_note: 'Sizing failed — JSON response was truncated or unparseable',
    };
  }
}

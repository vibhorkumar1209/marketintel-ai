const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');


const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const prisma = new PrismaClient();

async function generateExecutiveSummary(sections, sizingJSON, scope) {
    const systemPrompt = `You are a senior market research editor. Write the Executive Summary LAST, after all sections are complete.

REQUIREMENTS:
1. Exactly 800–1000 words for standard depth
2. Open with a 1–2 sentence market headline (key finding + time horizon)
3. Cover: market size + CAGR, top 3 growth drivers (quantified), top 2 restraints (quantified), key competitive moves, top tech development, #1 opportunity, stakeholder recommendations
4. End with 3 scenarios (bull / base / bear)
5. Every figure must be traceable to a section already drafted
6. No new claims not in the drafted sections

Output ONLY valid JSON structured exactly as:
{
  "market_headline": "string",
  "kpi_panel": [ { "label": "string", "value": "string" } ],
  "body_paragraphs": [ "string" ],
  "scenario_outlook": { "bull": "string", "base": "string", "bear": "string" }
}`;

    const userPrompt = `DRAFT THE EXECUTIVE SUMMARY for the following report on ${scope.industry || 'the industry'}.

SECTIONS DRAFTED:
${JSON.stringify((sections || []).map(s => ({ title: s.title || s.section_title, content: (s.content || s.body_paragraphs || []).join(' ').slice(0, 500) })), null, 2)}

SIZING DATA:
${JSON.stringify(sizingJSON, null, 2)}

Output the JSON:`;

    const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001', // Fast, robust model
        max_tokens: 4000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
}

async function run() {
    const reports = await prisma.report.findMany({
        where: { reportType: 'industry_report' },
    });

    console.log(`Found ${reports.length} industry reports to restore Executive Summary for.`);

    for (const r of reports) {
        const metadata = r.metadata || {};
        if (metadata.executiveSummary) {
            console.log(`Report ${r.title} already has executiveSummary, skipping.`);
            continue;
        }

        console.log(`Generating Exec Summary for: ${r.title}`);
        try {
            const scope = { industry: r.title, geography: metadata.geography || 'Global' };
            const sizing = r.sizing || {};
            const execSumPayload = await generateExecutiveSummary(r.sections, sizing, scope);

            const newMetadata = {
                ...metadata,
                executiveSummary: {
                    headline: execSumPayload.market_headline,
                    kpiPanel: (execSumPayload.kpi_panel || []).map(k => ({ label: k.label, value: k.value })),
                    paragraphs: execSumPayload.body_paragraphs,
                    scenarios: execSumPayload.scenario_outlook,
                }
            };

            await prisma.report.update({
                where: { id: r.id },
                data: { metadata: newMetadata }
            });
            console.log(`Successfully restored Executive Summary for: ${r.title}`);

            // clear cache for report
            const fs = require('fs');
            const envLocal = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
            let redisUrl = '';
            for (const line of envLocal.split('\n')) {
                if (line.startsWith('REDIS_URL=')) redisUrl = line.split('=')[1].replace(/"/g, '');
            }
            if (!redisUrl && process.env.REDIS_URL) redisUrl = process.env.REDIS_URL;

            if (redisUrl) {
                const Redis = require('ioredis');
                const redis = new Redis(redisUrl);
                await redis.del(`report:${r.id}`);
                await redis.quit();
            }
        } catch (e) {
            console.error(`Failed to generate/update exec summary for ${r.id}:`, e.message);
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());

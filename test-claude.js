require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
async function test() {
    const sys = `You are an analyst.
OUTPUT FORMAT:
{
  "key_table": { "headers": ["A"], "rows": [["1"]] }
}`;
    const user = `Draft the section "Scope of Study"`;
    const res = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5000,
        temperature: 0.3,
        system: sys,
        messages: [{ role: 'user', content: user }]
    });
    console.log(res.content[0].text);
}
test().catch(console.error);

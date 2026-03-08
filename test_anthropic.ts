import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
async function run() {
  try {
    const res = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: 'Say {"hello": "world"}' }]
    });
    console.log("Success:", JSON.stringify(res.content));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();

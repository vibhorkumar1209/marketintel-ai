import Anthropic from '@anthropic-ai/sdk';
console.log("Starting test");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
async function run() {
  try {
    const list = await client.models.list();
    console.log("Models:", list.data.map((m: any) => m.id));
  } catch (e: any) {
    console.log("Error finding models:", e.message);
  }
}
run();

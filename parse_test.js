const raw = `\`\`\`json
{
  "test": 1
}
\`\`\`
Note: this is a note { with brackets }`;

const match = raw.match(/\{[\s\S]*\}/);
console.log(match[0]);

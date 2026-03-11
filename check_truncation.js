const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Checking ${reports.length} reports for truncation...`);

    for (const r of reports) {
        console.log(`\nREPORT [${r.id}] ${r.title}`);

        let sections = r.sections || [];
        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];

            // Heuristic for truncation: 
            // 1. Ends abruptly?
            // 2. Sections with empty content?
            // 3. Flags?

            if (sec.flags && sec.flags.includes('JSON parsing failed — raw text returned')) {
                console.log(`   ⚠️ Section [${sec.id || sec.title}] was flagged as failed during generation.`);
            }

            // Check if content is surprisingly short or has specific keywords
            const text = sec.content ? sec.content.join(' ') : "";
            if (text.length > 0 && text.length < 50 && !sec.subsections?.length) {
                console.log(`   ⚠️ Section [${sec.id || sec.title}] content is very short (${text.length} chars).`);
            }
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());

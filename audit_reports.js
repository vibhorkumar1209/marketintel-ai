const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Auditing ${reports.length} reports...`);

    for (const r of reports) {
        console.log(`\nAUDIT [${r.id}] ${r.title}`);

        // 1. Check sections
        const sections = r.sections || [];
        if (sections.length === 0) {
            console.log("   ⚠️ NO SECTIONS FOUND!");
        } else {
            sections.forEach((s, i) => {
                const hasContent = s.content && s.content.length > 0 && s.content[0] !== "";
                const hasSub = s.subsections && s.subsections.length > 0;
                if (!hasContent && !hasSub) {
                    console.log(`   ⚠️ Section ${i} (${s.id || s.title}) has NO content and NO subsections.`);
                }

                // Check for raw JSON string in content
                if (s.content && s.content.length === 1 && typeof s.content[0] === 'string') {
                    if (s.content[0].trim().startsWith('{') || s.content[0].trim().startsWith('```json')) {
                        console.log(`   ❌ Section ${i} (${s.id || s.title}) STILL contains raw JSON!`);
                    }
                }
            });
        }

        // 2. Check metadata
        const metadata = r.metadata || {};
        if (!metadata.executiveSummary && !metadata.keyFindings) {
            console.log("   ⚠️ Missing executiveSummary/keyFindings in metadata.");
        }

        // 3. Check sizing
        if (!r.sizing || Object.keys(r.sizing).length === 0) {
            console.log("   ⚠️ Missing sizing data.");
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());

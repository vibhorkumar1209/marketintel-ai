const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const reportId = "cmmiskmbi000510eiuxqxg395";
    const report = await prisma.report.findUnique({
        where: { id: reportId }
    });

    if (!report) {
        console.log("Report not found");
        return;
    }

    console.log("Report Title:", report.title);
    
    for (const sec of report.sections) {
        console.log(`\n--- Section: ${sec.id} (${sec.title}) ---`);
        console.log("Content Type:", typeof sec.content);
        if (Array.isArray(sec.content)) {
            console.log("Content Length:", sec.content.length);
            if (sec.content.length > 0) {
                console.log("First item sample:", String(sec.content[0]).substring(0, 200));
            }
        }
        
        if (sec.subsections) {
            console.log("Subsections found:", sec.subsections.length);
            for (const sub of sec.subsections) {
                console.log(`  Sub: ${sub.title}`);
                if (sub.content) {
                    console.log(`    Sub Content sample: ${String(sub.content[0]).substring(0, 100)}`);
                }
            }
        } else {
             console.log("No subsections.");
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());

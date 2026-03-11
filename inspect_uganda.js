const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Searching for 'Uganda Small Pump Market' report...");
    const reports = await prisma.report.findMany({
        where: {
            title: {
                contains: "Uganda",
                mode: 'insensitive'
            }
        },
        select: {
            id: true,
            title: true,
            reportType: true,
            sections: true,
            metadata: true
        }
    });

    if (reports.length === 0) {
        console.log("No report found matching 'Uganda'.");
    } else {
        for (const report of reports) {
            console.log(`\n\nREPORT [${report.id}]: ${report.title} (${report.reportType})`);
            const sections = report.sections || [];
            console.log(`Found ${sections.length} sections:`, sections.map(s => s.id || s.title));

            const trendsSection = sections.find(s => s.id === 'trends' || s.title?.toLowerCase().includes('trend') || s.id === 'dynamics');
            if (trendsSection) {
                console.log("\n--- TRENDS SECTION CONTENT ---");
                console.log(JSON.stringify(trendsSection, null, 2).substring(0, 1000));
                if (trendsSection.subsections) {
                    console.log("\n--- SUBSECTIONS ---");
                    console.log(JSON.stringify(trendsSection.subsections, null, 2).substring(0, 500));
                }
            } else {
                console.log("\nNO TRENDS SECTION FOUND.");
            }
        }
    }
}
run().catch(console.error).finally(() => prisma.$disconnect());

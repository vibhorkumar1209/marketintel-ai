const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const reports = await prisma.report.findMany({
        where: { id: "cmmjb37ad0005ouuk7bkxdd1z" }
    });
    if (reports.length > 0) {
        const r = reports[0];
        const sections = r.sections;
        const oldSec = sections.find(x => x.id === 'trends_drivers_barriers' || x.section_id === 'trends_drivers_barriers');

        if (oldSec) {
            console.log("Found old section, transforming...");
            oldSec.id = 'dynamics';
            oldSec.section_id = 'dynamics';

            const trends = oldSec.subsections.find(s => s.title === 'Trends');
            const drivers = oldSec.subsections.find(s => s.title === 'Drivers');
            const barriers = oldSec.subsections.find(s => s.title === 'Barriers');

            const businessSub = {
                title: "Business",
                content: [
                    ...(drivers ? drivers.content : []),
                    ...(barriers ? barriers.content : [])
                ],
                keyTable: {
                    title: "Business Drivers and Barriers",
                    headers: drivers && drivers.keyTable.headers ? drivers.keyTable.headers : ["Trend name", "Impact of Trend on Industry", "Description of Trend", "Examples"],
                    rows: [
                        ...(drivers && drivers.keyTable.rows ? drivers.keyTable.rows : []),
                        ...(barriers && barriers.keyTable.rows ? barriers.keyTable.rows : [])
                    ]
                }
            };

            const techSub = {
                title: "Technology",
                content: trends ? trends.content : [],
                keyTable: {
                    title: "Technology Trends",
                    headers: trends && trends.keyTable.headers ? trends.keyTable.headers : ["Trend name", "Impact of Trend on Industry", "Description of Trend", "Examples"],
                    rows: trends && trends.keyTable.rows ? trends.keyTable.rows : []
                }
            };

            oldSec.subsections = [businessSub, techSub];

            await prisma.report.update({
                where: { id: r.id },
                data: { sections }
            });
            console.log("Update complete!");
        } else {
            console.log("No old section found, maybe already dynamics?");
            const dSec = sections.find(x => x.id === 'dynamics' || x.section_id === 'dynamics');
            console.log(dSec ? "Found dynamics!" : "Not found!");
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());

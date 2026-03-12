import { PrismaClient } from '@prisma/client';
import { repairJson, safeJsonParse } from '../src/lib/json-repair';
import { SectionDraft } from '../src/types/agents';
import { ReportSection } from '../src/types/reports';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Report Data Repair ---');
  
  const reports = await prisma.report.findMany();
  console.log(`Found ${reports.length} reports to check.`);

  let totalFixed = 0;

  for (const report of reports) {
    if (!report.sections) continue;
    
    let sections = report.sections as any[];
    let reportNeedsUpdate = false;

    const fixedSections = sections.map((s: any) => {
      // Check if content[0] is a JSON string (possibly truncated)
      if (s.content?.[0] && typeof s.content[0] === 'string' && (s.content[0].trim().startsWith('{') || s.content[0].includes('```json'))) {
        const parsed = safeJsonParse<SectionDraft | null>(s.content[0], null);
        
        if (parsed && (parsed.section_id || parsed.body_paragraphs)) {
          console.log(`[FIX] Repairing section "${s.title || 'Unknown'}" in report "${report.title || report.id}"`);
          reportNeedsUpdate = true;
          totalFixed++;
          
          // Convert SectionDraft (snake_case) to ReportSection (camelCase)
          return {
            id: parsed.section_id || s.id,
            title: parsed.section_title || s.title,
            content: parsed.body_paragraphs || [],
            keyTable: parsed.key_table ? { title: parsed.key_table.title, headers: parsed.key_table.headers, rows: parsed.key_table.rows } : undefined,
            chartSpec: parsed.chart_spec ? { type: parsed.chart_spec.type, title: parsed.chart_spec.title, xAxis: parsed.chart_spec.x_axis, yAxis: parsed.chart_spec.y_axis, dataSource: parsed.chart_spec.data_source } : undefined,
            subsections: parsed.subsections?.map(sub => ({
              title: sub.title,
              content: sub.body_paragraphs,
              keyTable: sub.key_table ? { title: sub.key_table.title, headers: sub.key_table.headers, rows: sub.key_table.rows } : undefined,
              chartSpec: sub.chart_spec ? { type: sub.chart_spec.type, title: sub.chart_spec.title, xAxis: sub.chart_spec.x_axis, yAxis: sub.chart_spec.y_axis, dataSource: sub.chart_spec.data_source } : undefined,
            })),
            citations: parsed.citations || [],
            flags: [...(parsed.section_flags || []), 'REPAIRED_FROM_RAW_JSON'],
            adminMethodology: parsed.admin_methodology,
          };
        }
      }
      return s;
    });

    if (reportNeedsUpdate) {
      await prisma.report.update({
        where: { id: report.id },
        data: {
          sections: fixedSections as any,
          updatedAt: new Date(),
        },
      });
    }
  }

  console.log(`--- Repair Complete. Total sections fixed: ${totalFixed} ---`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

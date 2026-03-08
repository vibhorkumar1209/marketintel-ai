import { IndustryReport } from '@/types/reports';

// Build HTML for the report (used by Puppeteer)
export function buildReportHTML(report: IndustryReport): string {
  const sectionsHTML = report.sections.map(section => `
    <section id="${section.id}" class="report-section">
      <h2>${section.title}</h2>
      ${section.flags.length > 0 ? `<div class="quality-flag">⚠ ${section.flags.join(' | ')}</div>` : ''}
      ${section.content.map(p => `<p>${p}</p>`).join('\n')}
      ${section.keyTable ? `
        <div class="table-wrapper">
          <p class="table-title"><strong>${section.keyTable.title}</strong></p>
          <table class="data-table">
            <thead><tr>${section.keyTable.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${section.keyTable.rows.map((row, i) =>
              `<tr class="${i % 2 === 0 ? 'even' : 'odd'}">${row.map(cell => `<td>${cell || '[N/A]'}</td>`).join('')}</tr>`
            ).join('')}</tbody>
          </table>
        </div>
      ` : ''}
      ${section.chartSpec ? `<div class="chart-placeholder" data-type="${section.chartSpec.type}" data-title="${section.chartSpec.title}">[Chart: ${section.chartSpec.title}]</div>` : ''}
      ${section.citations.length > 0 ? `
        <div class="citations">
          <p class="citations-label">Sources:</p>
          ${section.citations.map(c => `<cite>${c.claim} — ${c.source} (${c.date}, ${c.tier})</cite>`).join('\n')}
        </div>
      ` : ''}
    </section>
  `).join('\n');

  const kpiPanelHTML = report.executiveSummary.kpiPanel.map(k => `
    <div class="kpi-card">
      <span class="kpi-label">${k.label}</span>
      <span class="kpi-value">${k.value}</span>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${report.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.6; background: #fff; }
    .cover { background: #1B2A4A; color: white; padding: 60px 48px; min-height: 200px; }
    .cover h1 { font-size: 24pt; font-weight: 700; margin-bottom: 12px; }
    .cover .subtitle { font-size: 13pt; opacity: 0.8; }
    .cover .meta { margin-top: 32px; font-size: 10pt; opacity: 0.6; }
    .toc { padding: 32px 48px; border-bottom: 2px solid #e0e0e0; }
    .toc h2 { color: #1B2A4A; font-size: 16pt; margin-bottom: 16px; }
    .toc ol { padding-left: 20px; }
    .toc li { margin: 6px 0; }
    .exec-summary { padding: 32px 48px; background: #f5f7fa; border-bottom: 2px solid #e0e0e0; }
    .exec-summary h2 { color: #00897B; font-size: 16pt; margin-bottom: 16px; }
    .headline { font-size: 13pt; font-weight: 600; color: #1B2A4A; margin-bottom: 20px; padding: 16px; background: #e0f2f1; border-left: 4px solid #00897B; }
    .kpi-panel { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }
    .kpi-card { background: white; border: 1px solid #cfd8dc; border-radius: 8px; padding: 14px 18px; min-width: 160px; }
    .kpi-label { display: block; font-size: 9pt; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { display: block; font-size: 15pt; font-weight: 700; color: #1B2A4A; }
    .scenarios { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 20px; }
    .scenario { padding: 12px 16px; border-radius: 6px; font-size: 10pt; }
    .scenario.bull { background: #e8f5e9; border-left: 3px solid #388e3c; }
    .scenario.base { background: #e3f2fd; border-left: 3px solid #1565c0; }
    .scenario.bear { background: #ffebee; border-left: 3px solid #c62828; }
    .scenario strong { display: block; margin-bottom: 4px; }
    .report-section { padding: 28px 48px; border-bottom: 1px solid #e0e0e0; }
    .report-section h2 { font-size: 14pt; font-weight: 700; color: #1B2A4A; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #00897B; }
    .report-section p { margin-bottom: 12px; }
    .quality-flag { background: #fff3e0; border-left: 3px solid #f57c00; padding: 8px 12px; margin-bottom: 16px; font-size: 10pt; color: #795548; }
    .table-wrapper { margin: 20px 0; overflow-x: auto; }
    .table-title { margin-bottom: 8px; font-size: 10pt; color: #455a64; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    .data-table th { background: #1B2A4A; color: white; padding: 8px 12px; text-align: left; font-weight: 600; font-size: 9pt; }
    .data-table td { padding: 7px 12px; border-bottom: 1px solid #e0e0e0; }
    .data-table tr.even td { background: #f5f7fa; }
    .chart-placeholder { background: #f5f7fa; border: 2px dashed #b0bec5; border-radius: 8px; padding: 32px; text-align: center; color: #90a4ae; margin: 16px 0; font-size: 10pt; }
    .citations { margin-top: 20px; padding-top: 16px; border-top: 1px solid #e0e0e0; }
    .citations-label { font-size: 9pt; font-weight: 600; color: #666; margin-bottom: 8px; }
    cite { display: block; font-size: 9pt; color: #546e7a; margin-bottom: 4px; font-style: normal; }
    @media print { .report-section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${report.title}</h1>
    <div class="subtitle">${report.query}</div>
    <div class="meta">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | RefractOne Industry Report Hub Platform</div>
  </div>

  <div class="toc">
    <h2>Table of Contents</h2>
    <ol>
      <li>Executive Summary</li>
      ${report.sections.map((s, i) => `<li>${s.title}</li>`).join('\n')}
    </ol>
  </div>

  <div class="exec-summary">
    <h2>Executive Summary</h2>
    <div class="headline">${report.executiveSummary.headline}</div>
    <div class="kpi-panel">${kpiPanelHTML}</div>
    ${report.executiveSummary.paragraphs.map(p => `<p>${p}</p>`).join('\n')}
    <div class="scenarios">
      <div class="scenario bull"><strong>🟢 Bull Case</strong>${report.executiveSummary.scenarios.bull}</div>
      <div class="scenario base"><strong>🔵 Base Case</strong>${report.executiveSummary.scenarios.base}</div>
      <div class="scenario bear"><strong>🔴 Bear Case</strong>${report.executiveSummary.scenarios.bear}</div>
    </div>
  </div>

  ${sectionsHTML}
</body>
</html>`;
}

// PDF generation using Puppeteer (called server-side in API route)
export async function generatePDF(report: IndustryReport): Promise<Buffer> {
  // Dynamic import of puppeteer (optional dependency)
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    const html = buildReportHTML(report);
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch {
    // Fallback: return HTML as buffer if puppeteer fails
    const html = buildReportHTML(report);
    return Buffer.from(html, 'utf-8');
  }
}

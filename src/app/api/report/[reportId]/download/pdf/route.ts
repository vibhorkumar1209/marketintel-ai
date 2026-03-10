import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { reportId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const report = await db.report.findUnique({ where: { id: params.reportId } });
  if (!report || report.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const metadata = (report.metadata || {}) as Record<string, unknown>;
  const sizing = (report.sizing || {}) as Record<string, unknown>;
  const sizingResult = (sizing as any)?.validated_market_size || {};
  const cagr = (sizing as any)?.cagr_estimate || {};
  const sections = ((report.sections || []) as Array<{
    id?: string; title?: string; content?: string[];
    flags?: string[]; citations?: Array<{ claim?: string; source?: string; date?: unknown; tier?: string }>;
    keyTable?: { title?: string; headers?: string[]; rows?: unknown[][] };
  }>);

  const getSectionTitle = (s: any) => {
    if (session?.user?.role === 'admin') return s.title || 'Section';
    if (String(s.title || '').toLowerCase().includes('appendix') || s.id === 'appendix') return 'Methodology';
    return s.title || 'Section';
  };

  const HIDE_KEYWORDS = /(source|methodology|estimation|assumption|confidence|primary)/i;

  const sectionsHTML = sections.map(s => `
    <section class="section">
      <h2>${getSectionTitle(s)}</h2>
      ${(s.flags || []).length > 0 ? `<div class="flag">${(s.flags || []).slice(0, 3).map(f => `<span>⚠ ${String(f).slice(0, 100)}</span>`).join(' ')}</div>` : ''}
      ${(s.content || [])
      .filter(p => session?.user?.role === 'admin' || !HIDE_KEYWORDS.test(p))
      .map(p => `<p>${p}</p>`).join('')}
      ${s.keyTable && s.keyTable.rows?.length ? `
        <table>
          ${s.keyTable.headers?.filter(h => session?.user?.role === 'admin' || !HIDE_KEYWORDS.test(String(h))).length ? `<thead><tr>${(s.keyTable.headers || []).filter(h => session?.user?.role === 'admin' || !HIDE_KEYWORDS.test(String(h))).map(h => `<th>${h}</th>`).join('')}</tr></thead>` : ''}
          <tbody>${(s.keyTable.rows || []).map(row => {
        const entries = Array.isArray(row) ? row : Object.values(row as object);
        const headers = s.keyTable?.headers || [];
        return `<tr>${entries.map((cell, ci) => {
          const h = headers[ci];
          if (session?.user?.role !== 'admin' && h && HIDE_KEYWORDS.test(String(h))) return null;
          return `<td>${String(cell ?? '')}</td>`;
        }).filter(tc => tc !== null).join('')}</tr>`;
      }).join('')}</tbody>
        </table>` : ''}
      ${(s.citations || []).length > 0 && session?.user?.role === 'admin' ? `
        <div class="citations">
          <strong>Sources</strong>
          ${(s.citations || []).map(c => `<cite>${String(c.claim || '')} — ${String(c.source || '')} (${String(c.date || 'N/A')}, ${String(c.tier || 'N/A')})</cite>`).join('')}
        </div>` : ''}
    </section>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${report.title}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Arial',sans-serif;font-size:11pt;color:#1a1a1a;line-height:1.65;background:#fff}
    .cover{background:#0C3649;color:#fff;padding:56px 48px;page-break-after:always}
    .cover h1{font-size:26pt;font-weight:700;margin-bottom:10px;line-height:1.2}
    .cover .sub{font-size:12pt;opacity:.75;margin-top:12px}
    .cover .kpi{display:flex;gap:32px;margin-top:40px;flex-wrap:wrap}
    .cover .kpi-item{background:rgba(255,255,255,.1);border-radius:8px;padding:16px 24px}
    .cover .kpi-item label{display:block;font-size:9pt;opacity:.6;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
    .cover .kpi-item span{font-size:18pt;font-weight:700}
    .cover .meta{margin-top:40px;font-size:9pt;opacity:.5}
    .toc{padding:40px 48px;page-break-after:always}
    .toc h2{font-size:16pt;color:#0C3649;margin-bottom:20px}
    .toc ol{padding-left:20px}.toc li{margin:8px 0;font-size:11pt}
    .section{padding:36px 48px;border-bottom:1px solid #e0e0e0;page-break-inside:avoid}
    .section h2{font-size:14pt;font-weight:700;color:#0C3649;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #3491E8}
    .section p{margin-bottom:12px}
    .flag{background:#FFF8E1;border-left:4px solid #FFCD1A;padding:8px 12px;margin-bottom:16px;font-size:9pt;color:#795548}
    table{width:100%;border-collapse:collapse;font-size:10pt;margin:20px 0}
    th{background:#0C3649;color:#fff;padding:8px 12px;text-align:left;font-size:9pt}
    td{padding:7px 12px;border-bottom:1px solid #e0e0e0}
    tr:nth-child(even) td{background:#f5f7fa}
    .citations{margin-top:20px;padding-top:12px;border-top:1px solid #e0e0e0}
    .citations strong{display:block;font-size:9pt;color:#666;margin-bottom:8px}
    cite{display:block;font-size:9pt;color:#546e7a;font-style:normal;margin-bottom:4px}
    @media print{.section{page-break-inside:avoid}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style>
</head>
<body>
  <div class="cover">
    <h1>${report.title}</h1>
    <div class="sub">${report.query || ''}</div>
    <div class="kpi">
      ${sizingResult.value ? `<div class="kpi-item"><label>Market Size</label><span>${sizingResult.value} ${sizingResult.unit || 'USD M'}</span></div>` : ''}
      ${cagr.value ? `<div class="kpi-item"><label>CAGR</label><span>${cagr.value}%</span></div>` : ''}
      ${metadata.geography ? `<div class="kpi-item"><label>Geography</label><span>${String(metadata.geography)}</span></div>` : ''}
    </div>
    <div class="meta">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | RefractOne Industry Report Hub</div>
  </div>

  <div class="toc">
    <h2>Table of Contents</h2>
    <ol>${['Executive Summary', ...sections.map(s => getSectionTitle(s))].map(t => `<li>${t}</li>`).join('')}</ol>
  </div>

  ${sectionsHTML}

  <script>window.onload=()=>window.print()</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${(report.title || 'report').replace(/[^a-z0-9]/gi, '_')}.html"`,
    },
  });
}

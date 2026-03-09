import { db } from '@/lib/db';
import { extractScope, generateResearchPlan } from '@/services/agents/planner';
import { executeResearch, executeEnrichment } from '@/services/agents/researcher';
import { runMarketSizing } from '@/services/agents/sizer';
import { draftSectionsParallel, generateExecutiveSummary, buildAppendixSection } from '@/services/agents/analyst';
import { formatIndustryReport, generateReportTitle } from '@/services/agents/formatter';
import { StreamHandler } from './stream-handler';
import { refundCredits } from '@/lib/stripe';
import { cacheReport } from '@/lib/redis';
import { ReportConfig } from '@/types/agents';

// Section IDs will be defined dynamically inside the function based on reportType

export async function runIndustryReportPipeline(
  jobId: string,
  userId: string,
  query: string,
  config: ReportConfig,
  reportType: string = 'industry_report'
) {
  const SECTION_IDS = reportType === 'trends_report' ? [
    'dynamics'
  ] : [
    'intro',            // Section 1 — Scope of Study
    'sizing_workings',  // Section 2 — Market Size Estimation
    'segmentation',     // Section 3 — Market Segmentation
    'dynamics',         // Section 4 — Trends, Drivers & Barriers
    'regulatory',       // Section 5 — Regulatory Overview
    'tech_developments',// Section 6 — Technology Trends
    'competitive',      // Section 7 — Competitive Analysis
    'opportunities',    // Section 8 — Market Forecast (3 Scenarios)
  ];

  const stream = new StreamHandler(jobId);

  try {
    // ── STEP 1: Scope Extraction ──────────────────────────────────────────
    await stream.stepStart(1, 'Scope Extraction');
    const scope = await extractScope(query);

    // Override scope with user config (ambiguity flags are ignored — use inferred defaults)
    scope.geography = (config.regions && config.regions.length > 0) ? config.regions.join(', ') : (scope.geography || 'Global');
    scope.depth_level = config.depth || 'standard';
    scope.competitor_count = config.competitorCount || 10;
    scope.token_budget_per_section = config.depth === 'deep' ? 1400 : config.depth === 'light' ? 400 : 800;
    scope.product_scope = scope.product_scope || scope.industry;

    await stream.stepComplete(1, 'Scope Extraction', { industry: scope.industry, geography: scope.geography });

    // ── STEP 2: Research Plan ─────────────────────────────────────────────
    await stream.stepStart(2, 'Research Plan');
    const searchPlan = await generateResearchPlan(scope);
    await stream.stepComplete(2, 'Research Plan', { searches_planned: searchPlan.search_plan.length });

    // ── STEP 3: Web Search Execution ──────────────────────────────────────
    await stream.stepStart(3, 'Web Research');
    const researchBundle = await executeResearch(searchPlan, scope);
    await stream.stepComplete(3, 'Web Research', {
      data_points: researchBundle.data_points.length,
      gaps: researchBundle.gaps.length,
      sources_rejected: researchBundle.sources_rejected,
    });

    // ── STEP 4: Market Sizing ─────────────────────────────────────────────
    await stream.stepStart(4, 'Market Sizing');
    const sizingJSON = await runMarketSizing(researchBundle, scope);
    await stream.stepComplete(4, 'Market Sizing', {
      market_size: sizingJSON.validated_market_size,
      cagr: sizingJSON.cagr_estimate,
      discrepancy_flag: sizingJSON.discrepancy_flag,
    });

    // ── STEP 5: Section Drafting (parallel) ───────────────────────────────
    await stream.stepStart(5, 'Drafting Report Sections');
    let sectionsCompleted = 0;
    const sectionDrafts = await draftSectionsParallel(
      SECTION_IDS,
      scope,
      researchBundle,
      sizingJSON,
      undefined,
      async (sectionId) => {
        sectionsCompleted++;
        await stream.emit({
          type: 'step_progress',
          step: 5,
          stepName: `Drafting Report Sections`,
          data: { sectionId, sectionsCompleted, totalSections: SECTION_IDS.length }
        });
      }
    );
    await stream.stepComplete(5, 'Drafting Report Sections', { sections: sectionDrafts.length });

    // ── STEP 6: Social & Tech Enrichment ─────────────────────────────────
    await stream.stepStart(6, 'Social & Technology Intelligence');
    const companies: string[] = sectionDrafts
      .find(s => s.section_id === 'competitive')
      ?.citations
      .map(c => c.source)
      .filter(Boolean)
      .slice(0, scope.competitor_count) ?? [];

    const enrichmentBundle = await executeEnrichment(
      companies.length > 0 ? companies : [`Top ${scope.industry} companies`],
      scope
    );
    await stream.stepComplete(6, 'Social & Technology Intelligence', {
      companies_enriched: enrichmentBundle.enrichment_data.length,
    });

    // ── STEP 7: Executive Summary ─────────────────────────────────────────
    await stream.stepStart(7, 'Executive Summary');
    const executiveSummary = await generateExecutiveSummary(sectionDrafts, sizingJSON, scope);
    await stream.stepComplete(7, 'Executive Summary', { headline: executiveSummary.market_headline });

    // Build appendix — aggregates all citations as source log (placed last per master prompt Rule 2)
    const appendixDraft = buildAppendixSection(sectionDrafts, scope);
    const allSectionDrafts = [...sectionDrafts, appendixDraft];

    // ── STEP 8: Format & Persist ─────────────────────────────────────────
    await stream.stepStart(8, 'Formatting Report');
    const reportTitle = await generateReportTitle(scope);
    const formattedReport = await formatIndustryReport(
      allSectionDrafts,
      executiveSummary,
      sizingJSON,
      scope,
      reportTitle
    );

    // Persist to DB
    const savedReport = await db.report.create({
      data: {
        jobId,
        userId,
        reportType,
        query,
        title: reportTitle,
        sections: formattedReport.sections as object,
        metadata: formattedReport.metadata as object,
        enrichment: enrichmentBundle as object,
        sizing: sizingJSON as object,
      },
    });

    // Update report ID
    formattedReport.id = savedReport.id;

    // Cache for fast retrieval
    await cacheReport(savedReport.id, formattedReport);

    await stream.stepComplete(8, 'Report Complete', { reportId: savedReport.id });
    await stream.jobComplete(savedReport.id);

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown pipeline error';
    await stream.stepError(0, 'Pipeline Error', errorMsg);

    // Refund credits on failure
    const job = await db.job.findUnique({ where: { id: jobId } });
    if (job) await refundCredits(userId, job.estimatedCredits);

    // Note: If Vercel forces a shutdown at 300s, this won't be hit, but normal errors will be
    await db.job.update({
      where: { id: jobId },
      data: { status: 'failed', errorMessage: errorMsg },
    });

    throw err;
  }
}

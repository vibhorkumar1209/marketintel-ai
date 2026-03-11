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
    'business',
    'technology',
  ] : [
    'intro',            // Section 1 — Market Report Scope
    'sizing_workings',  // Section 2 — Market Size
    'segmentation',     // Section 3 — Market Size by Segments
    'dynamics',         // Section 4 — Trends
    'tech_developments',// Section 5 — Tech Trends
    'competitive',      // Section 6 — Competition Analysis
    'regulatory',       // Section 7 — Regulatory Overview
    'opportunities',    // Section 8 — Market Forecast
  ];

  const stream = new StreamHandler(jobId);

  try {
    const job = await db.job.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Job not found');

    // ── STEP 1: Scope Extraction ──────────────────────────────────────────
    await stream.stepStart(1, 'Scope Extraction');
    const scope = await extractScope(query);

    // Override scope with user config
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

    // ── STEP 3: Web Search Execution (RECOVERABLE) ───────────────────────
    await stream.stepStart(3, 'Web Research');
    let researchBundle = job.researchData as any;
    if (researchBundle) {
      console.log(`[RESUME] Using cached research data for job ${jobId}`);
      await stream.stepComplete(3, 'Web Research (Resumed)', { data_points: researchBundle.data_points.length });
    } else {
      researchBundle = await executeResearch(searchPlan, scope);
      await db.job.update({
        where: { id: jobId },
        data: { researchData: researchBundle as object, updatedAt: new Date() }
      });
      await stream.stepComplete(3, 'Web Research', {
        data_points: researchBundle.data_points.length,
        gaps: researchBundle.gaps.length,
      });
    }

    // ── STEP 4: Market Sizing (RECOVERABLE) ──────────────────────────────
    await stream.stepStart(4, 'Market Sizing');
    let sizingJSON = job.sizingData as any;
    if (sizingJSON) {
      console.log(`[RESUME] Using cached sizing data for job ${jobId}`);
      await stream.stepComplete(4, 'Market Sizing (Resumed)', { market_size: sizingJSON.validated_market_size });
    } else {
      sizingJSON = await runMarketSizing(researchBundle, scope);
      await db.job.update({
        where: { id: jobId },
        data: { sizingData: sizingJSON as object, updatedAt: new Date() }
      });
      await stream.stepComplete(4, 'Market Sizing', {
        market_size: sizingJSON.validated_market_size,
        cagr: sizingJSON.cagr_estimate,
      });
    }

    // ── STEP 5: Section Drafting (RECOVERABLE) ───────────────────────────
    await stream.stepStart(5, 'Drafting Report Sections');
    let sectionDrafts = (job.draftedSections as any[]) || [];
    const completedIds = new Set(sectionDrafts.map(s => s.section_id));
    const remainingIds = SECTION_IDS.filter(id => !completedIds.has(id));

    if (remainingIds.length === 0 && sectionDrafts.length > 0) {
      console.log(`[RESUME] All sections already drafted for job ${jobId}`);
      await stream.stepComplete(5, 'Drafting Sections (Resumed)', { sections: sectionDrafts.length });
    } else {
      if (sectionDrafts.length > 0) {
        console.log(`[RESUME] Resuming drafting from ${sectionDrafts.length}/${SECTION_IDS.length} for job ${jobId}`);
      }

      const newDrafts = await draftSectionsParallel(
        remainingIds,
        scope,
        researchBundle,
        sizingJSON,
        undefined,
        reportType,
        async (sectionId, draft) => {
          sectionDrafts.push(draft);
          // Persist progress every section to survive crashes
          await db.job.update({
            where: { id: jobId },
            data: { draftedSections: sectionDrafts as object, updatedAt: new Date() }
          });

          await stream.emit({
            type: 'step_progress',
            step: 5,
            stepName: 'Drafting Report Sections',
            data: {
              sectionId,
              sectionsCompleted: sectionDrafts.length,
              totalSections: SECTION_IDS.length
            }
          });
        }
      );
      await stream.stepComplete(5, 'Drafting Report Sections', { sections: sectionDrafts.length });
    }

    // ── STEP 6: Social & Tech Enrichment ─────────────────────────────────
    await stream.stepStart(6, 'Social & Technology Intelligence');
    await stream.stepComplete(6, 'Social & Technology Intelligence', {
      note: 'Using consolidated research bundle'
    });

    // ── STEP 7: Executive Summary ─────────────────────────────────────────
    await stream.stepStart(7, 'Executive Summary');
    const executiveSummary = await generateExecutiveSummary(sectionDrafts, sizingJSON, scope);
    await stream.stepComplete(7, 'Executive Summary', { headline: executiveSummary.market_headline });

    // Build appendix
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

    // Persist to DB (upsert based on jobId)
    const savedReport = await db.report.upsert({
      where: { jobId },
      create: {
        jobId,
        userId,
        reportType,
        query,
        title: reportTitle,
        sections: formattedReport.sections as object,
        metadata: formattedReport.metadata as object,
        enrichment: null,
        sizing: sizingJSON as object,
      },
      update: {
        title: reportTitle,
        sections: formattedReport.sections as object,
        metadata: formattedReport.metadata as object,
        enrichment: null,
        sizing: sizingJSON as object,
      },
    });

    // Update report ID
    formattedReport.id = savedReport.id;
    await cacheReport(savedReport.id, formattedReport);

    await stream.stepComplete(8, 'Report Complete', { reportId: savedReport.id });
    await stream.jobComplete(savedReport.id);

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown pipeline error';
    console.error(`[PIPELINE ERROR] Job ${jobId}:`, err);

    await stream.stepError(0, 'Pipeline Error', errorMsg);

    // Only refund if we haven't successfully reached Step 5 (Drafting)
    // Drafting segments consumes substantial tokens, so we don't auto-refund after progress
    const job = await db.job.findUnique({ where: { id: jobId } });
    if (job && job.currentStep < 5) {
      await refundCredits(userId, job.estimatedCredits);
    }

    await db.job.update({
      where: { id: jobId },
      data: { status: 'failed', errorMessage: errorMsg },
    });

    throw err;
  }
}

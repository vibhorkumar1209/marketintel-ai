import { db } from '@/lib/db';
import { extractDatapackScope, generateResearchPlan } from '@/services/agents/planner';
import { executeResearch } from '@/services/agents/researcher';
import { runMarketSizing } from '@/services/agents/sizer';
import { draftSectionsParallel } from '@/services/agents/analyst';
import { formatDatapack } from '@/services/agents/formatter';
import { StreamHandler } from './stream-handler';
import { refundCredits } from '@/lib/stripe';
import { cacheReport } from '@/lib/redis';
import { ReportConfig } from '@/types/agents';

export async function runDatapackPipeline(
  jobId: string,
  userId: string,
  query: string,
  config: ReportConfig
) {
  const stream = new StreamHandler(jobId);

  try {
    // ── STEP 1: Datapack Scope ────────────────────────────────────────────
    await stream.stepStart(1, 'Scope Extraction');
    const scope = await extractDatapackScope(query);
    scope.geographies = config.regions.length > 0 ? config.regions : scope.geographies;
    await stream.stepComplete(1, 'Scope Extraction', { industry: scope.industry });

    // ── STEP 2: Data Search Plan ──────────────────────────────────────────
    await stream.stepStart(2, 'Data Search Plan');
    // Reuse the research plan generator with datapack scope
    const searchPlan = await generateResearchPlan({ ...scope, sections_required: [], ambiguity_flags: [], inferred_fields: [], token_budget_per_section: 400, depth_level: 'standard' });
    await stream.stepComplete(2, 'Data Search Plan', { searches: searchPlan.search_plan.length });

    // ── STEP 3: Data Extraction ───────────────────────────────────────────
    await stream.stepStart(3, 'Data Extraction');
    const researchBundle = await executeResearch(searchPlan, { ...scope, sections_required: [], ambiguity_flags: [], inferred_fields: [], token_budget_per_section: 400, depth_level: 'standard' });
    await stream.stepComplete(3, 'Data Extraction', { data_points: researchBundle.data_points.length });

    // ── STEP 4: Sizing & Validation ───────────────────────────────────────
    await stream.stepStart(4, 'Market Sizing & Validation');
    const sizingJSON = await runMarketSizing(researchBundle, { ...scope, sections_required: [], ambiguity_flags: [], inferred_fields: [], token_budget_per_section: 400, depth_level: 'standard' });
    await stream.stepComplete(4, 'Market Sizing', { market_size: sizingJSON.validated_market_size });

    // ── STEP 5: Content Drafting ──────────────────────────────────────────
    await stream.stepStart(5, 'Drafting Data Sections');
    const sectionDrafts = await draftSectionsParallel(
      ['competitive', 'regional_analysis', 'dynamics'],
      { ...scope, sections_required: [], ambiguity_flags: [], inferred_fields: [], token_budget_per_section: 400, depth_level: 'standard' },
      researchBundle,
      sizingJSON
    );
    await stream.stepComplete(5, 'Content Sections', { sections: sectionDrafts.length });

    // ── STEP 6: Format to Excel Structure ─────────────────────────────────
    await stream.stepStart(6, 'Generating Excel Datapack');
    const dataJSON = {
      scope,
      sizingJSON,
      researchBundle: { data_points: researchBundle.data_points, gaps: researchBundle.gaps },
      sectionDrafts,
    };
    const formattedSheets = await formatDatapack(dataJSON, scope);

    const title = `${scope.industry || 'Market'} Annual Datapack — ${scope.base_year || new Date().getFullYear()}`;

    const savedReport = await db.report.create({
      data: {
        jobId,
        userId,
        reportType: 'datapack',
        query,
        title,
        sheets: (formattedSheets as { sheets: object[] }).sheets as object,
        metadata: {
          generatedAt: new Date().toISOString(),
          qualityScore: 72,
          marketSize: `${sizingJSON.validated_market_size.value} ${sizingJSON.validated_market_size.unit}`,
          cagr: `${sizingJSON.cagr_estimate.value}%`,
          keyFindings: [],
          sources: researchBundle.data_points.length,
          depth: config.depth,
          geography: config.regions.join(', '),
        } as object,
        sizing: sizingJSON as object,
      },
    });

    await cacheReport(savedReport.id, { id: savedReport.id, title, sheets: (formattedSheets as { sheets: object[] }).sheets });

    await stream.stepComplete(6, 'Excel Datapack Ready', { reportId: savedReport.id });
    await stream.jobComplete(savedReport.id);

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown pipeline error';
    await stream.stepError(0, 'Pipeline Error', errorMsg);

    const job = await db.job.findUnique({ where: { id: jobId } });
    if (job) await refundCredits(userId, job.estimatedCredits);

    throw err;
  }
}

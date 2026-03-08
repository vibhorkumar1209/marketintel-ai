import { useState } from "react";

const C = {
  navy:    "#0c3649",
  red:     "#E63946",
  blue:    "#3491E8",
  black:   "#0A0A0A",
  navyL:   "#0e4560",
  navyXL:  "#16587a",
  surface: "#0f2535",
  card:    "#132d40",
  cardB:   "#183650",
  border:  "#1e4a68",
  text:    "#E8EDF5",
  muted:   "#7eaabf",
  white:   "#FFFFFF",
  redL:    "#ff6b75",
  blueL:   "#6ab8ff",
  bg:      "#080f16",
};

const tabs = [
  { id: "content", label: "① Content Prompt — Antigravity" },
  { id: "design",  label: "② Design Prompt — Web App" },
  { id: "usage",   label: "③ How to Use Both" },
];

// ── shared tiny components ──────────────────────────────────

const Tag = ({ color, children }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}55`,
    borderRadius: 4, padding: "2px 9px", fontSize: 11, fontWeight: 700,
    letterSpacing: 0.8, display: "inline-block",
  }}>{children}</span>
);

const SectionLabel = ({ n, children, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, marginTop: 24 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8, background: color || C.blue,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: 15, color: C.white, flexShrink: 0,
    }}>{n}</div>
    <div style={{ fontWeight: 800, color: C.text, fontSize: 16 }}>{children}</div>
  </div>
);

const Rule = ({ color }) => (
  <div style={{ height: 2, background: `linear-gradient(90deg, ${color || C.blue}, transparent)`, margin: "16px 0" }} />
);

const CopyBtn = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      background: copied ? C.navy : C.blue, color: C.white,
      border: "none", borderRadius: 6, padding: "8px 18px",
      fontWeight: 700, fontSize: 12, cursor: "pointer",
      transition: "all 0.15s", letterSpacing: 0.5,
    }}>
      {copied ? "✓ Copied!" : `Copy ${label || "Prompt"}`}
    </button>
  );
};

// ── Code / prompt block ──────────────────────────────────────
const PromptBlock = ({ text, label, color }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: color || C.navy, borderRadius: "8px 8px 0 0",
      padding: "10px 16px",
    }}>
      <span style={{ fontWeight: 700, color: C.white, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
        {label || "Prompt"}
      </span>
      <CopyBtn text={text} label={label} />
    </div>
    <pre style={{
      background: C.black, color: "#c9d8e8",
      borderRadius: "0 0 8px 8px",
      padding: "20px 20px",
      fontSize: 12.5, lineHeight: 1.75,
      overflowX: "auto", margin: 0,
      fontFamily: "'Fira Code', 'Courier New', monospace",
      border: `1px solid ${C.border}`,
      borderTop: "none",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}>{text}</pre>
  </div>
);

// ── CONTENT PROMPT TEXT ──────────────────────────────────────

const CONTENT_PROMPT = `=======================================================================
ANTIGRAVITY — MASTER PROMPT: INDUSTRY MARKET INTELLIGENCE REPORT v2.0
=======================================================================

ROLE
You are a principal-level market intelligence analyst and industry strategist.
You are generating a 150–200 page commercial-grade industry report equivalent
to a Tier 1 consulting firm's sector study. Every section must be analytical,
evidence-backed, and insight-driven — not descriptive.

-----------------------------------------------------------------------
CORE RULES (NON-NEGOTIABLE — APPLY TO ALL SECTIONS)
-----------------------------------------------------------------------
1. NO HALLUCINATION: Every factual claim, number, company stat, or regulation
   must be grounded in a search result. If no credible source is found, output:
   [DATA NOT AVAILABLE — search attempted: <query>]. Never fabricate.

2. NO SOURCE NAMES IN REPORT BODY: Citations appear only in the Appendix.
   The body reads as authoritative analysis — not a reference list.
   Do NOT write "according to X" or "as reported by Y" anywhere in Sections 1–9.

3. TABLES AND CHARTS FIRST: Wherever 3+ comparable data points exist, use a
   table. Prose provides the insight commentary the table cannot express.
   Specify chart type, axes, and data series wherever a visual is needed.

4. VOLUME AND VALUE ALWAYS: All market size figures must include both:
   — Value: USD million or billion
   — Volume: units, tonnes, MW, litres, or relevant physical measure
   Exception: pure service markets with no discrete unit.

5. INSIGHT NOT DESCRIPTION: Every section must contain at least one analytical
   conclusion that goes beyond what the raw data alone shows.
   Generic statements ("the market is growing") are not acceptable.
   Evidence-anchored statements are required ("the market grew 6.8% CAGR
   2020–2024, driven by X, with Y as the primary risk to the outlook").

6. CONFIDENCE TAGGING: Tag every estimate:
   [HIGH — Tier 1–2 source] | [MEDIUM — Tier 3–4 source] | [LOW — ESTIMATE]

7. SOURCE CREDIBILITY ORDER (use highest available tier per data point):
   Tier 1: Government / Regulatory bodies / Central Bank
   Tier 2: Audited Company Filings / Annual Reports / Earnings Calls
   Tier 3: Trade Associations / Industry Bodies
   Tier 4: Tier-1 Consulting Reports (McKinsey, Deloitte, BCG)
   Tier 5: Research Aggregators (use only for sanity check — NOT as primary)
   Tier 6: Media / Press (use only when no other source is available)
   BANNED as primary source: Grand View Research, Markets and Markets,
   Mordor Intelligence, IMARC, Transparency Market Research.

8. MINIMUM SEARCH DEPTH: Execute minimum 35 targeted web searches per full
   report. Use the query templates in Section [SEARCH LIBRARY] below.

-----------------------------------------------------------------------
INPUTS — CONFIRM BEFORE STARTING
-----------------------------------------------------------------------
Confirm the following before any search begins. Do not proceed without all
mandatory fields.

  Product / Industry   : [USER TO SPECIFY]
  Geography            : [USER TO SPECIFY — Global / Region / Country]
  Study Period         : [USER TO SPECIFY — e.g. 2020–2030]
  Segment Dimensions   : [By Type | By Application | By End-Use | By Geography | By Channel]
  Key Players to Profile: [USER TO SPECIFY — min. 8, max. 15]
  Report Depth         : [Standard: 120–150 pages | Deep: 150–200 pages]
  Excluded Sources     : [e.g. Grand View, Mordor — already banned per Rule 7]
  Client Context       : [Optional: specific questions or use case]

-----------------------------------------------------------------------
SECTION 1 — SCOPE OF STUDY
-----------------------------------------------------------------------
PURPOSE: Define the precise market boundary before any sizing or competitive
analysis. This prevents scope drift and ensures all search queries are
correctly targeted.

SEARCH INSTRUCTIONS:
  S1-A: Search "[PRODUCT] market definition industry classification [GEOGRAPHY]"
        + "[PRODUCT] HS code OR NAICS code OR CPC code"
        Extract: official taxonomy, accepted sub-categories, exclusions.

  S1-B: Search "[PRODUCT] market segments [GEOGRAPHY] [YEAR]"
        + "[PRODUCT] application segments" + "[PRODUCT] end-use industries"
        List ALL named segments across sources.

  S1-C: Search "[PRODUCT] leading manufacturers [GEOGRAPHY]"
        + "[PRODUCT] market share [YEAR]" + "[PRODUCT] key suppliers"
        Cross-check with trade association member directories.
        Target: named list of min. 15 competitors.

  S1-D: Search "[PRODUCT] trade association [GEOGRAPHY]"
        + "[PRODUCT] industry body members" + "[PRODUCT] certification standard"
        List: all relevant associations, regulatory bodies, certifications.

OUTPUT FORMAT:
  — Scope matrix table: Product types | Applications | Geographies |
    Time period | Currency | Base year rationale
  — Competitor shortlist table: Company | HQ | Est. revenue | Market presence
  — Study assumptions log: base year, currency basis, triangulation method

-----------------------------------------------------------------------
SECTION 2 — MARKET SIZE ESTIMATION (TAM — VOLUME & VALUE)
-----------------------------------------------------------------------
PURPOSE: Estimate Total Addressable Market using TWO independent methods.
Triangulate. Explain any gap >15% between methods.

--- METHOD A: TOP-DOWN ---

  TD-1: Search "[PRODUCT] total output [GEOGRAPHY] [YEAR]" from government
        statistics (Ministry, Census Bureau, Eurostat, RBI, etc.)
        + "[Adjacent macro indicator]" — e.g. construction output, packaging
        industry size, automotive production volume — as proxy macro anchor.

  TD-2: Search "[PRODUCT] share of [parent industry]"
        + "[PRODUCT] penetration rate [application]"
        Derive SAM by applying penetration/share to macro anchor.
        Show logic chain step by step.

  TD-3: Search "[PRODUCT] import export [GEOGRAPHY] [HS code]"
        Sources: UN Comtrade, DGCI&S (India), USITC, Eurostat trade portal.
        Use trade flow data to validate or adjust domestic market estimate.

  TD-4: Cross-check against any Tier 5 source found. Do NOT cite as primary.
        Flag deviation: if your estimate differs by >30%, explain why.

--- METHOD B: BOTTOM-UP ---

  BU-1: For EACH named competitor (from S1-C):
        Search "[COMPANY] annual report [YEAR] revenue [PRODUCT segment]"
        + "[COMPANY] investor presentation [YEAR]"
        + "[COMPANY] earnings call [YEAR] [PRODUCT]"
        Extract: segment-specific revenue OR volume, with source per row.

  BU-2: Sum confirmed player revenues. Calculate coverage ratio.
        Apply tail-market multiplier: if top 10 = 70%, divide sum by 0.70.
        Document: confirmed total / multiplier / estimated total market.

  BU-3: Volume estimation:
        Search "[PRODUCT] average selling price [GEOGRAPHY] [YEAR]"
        Sources: trade publications, price databases, earnings calls.
        Formula: Volume = Value ÷ ASP. Show calculation explicitly.

--- TRIANGULATION TABLE (MANDATORY OUTPUT) ---

  | Method           | Value (USD M) | Volume     | Key Assumption      | Confidence | Source Tier |
  |------------------|---------------|------------|---------------------|------------|-------------|
  | Top-Down         | [Fill]        | [Fill]     | [State assumption]  | [H/M/L]    | Tier 1–2    |
  | Bottom-Up        | [Fill]        | [Fill]     | [State assumption]  | [H/M/L]    | Tier 2–3    |
  | Final (Blended)  | [Fill]        | [Fill]     | [Weighting logic]   | [H/M/L]    | Blended     |

  State CAGR (historical), CAGR (forecast), and confidence level.
  Include sensitivity range: Low / Base / High scenario at this stage.

-----------------------------------------------------------------------
SECTION 3 — MARKET SEGMENTATION
-----------------------------------------------------------------------
PURPOSE: Break total market across ALL relevant dimensions. Size each segment
individually — value + volume + CAGR. Do not invent segments; only populate
where data exists or can be reliably derived.

SEGMENT DIMENSIONS (cover all that apply):

  SEG-A — By Type / Product Sub-category:
    Search: "[PRODUCT type 1] market size [GEOGRAPHY]"
    Repeat for each type. Find type share from company filings or trade bodies.
    Output: Type segment table — Size | Share | CAGR | Key driver

  SEG-B — By Application (what the product is used for):
    Search: "[PRODUCT] used in [APPLICATION]" + "[APPLICATION] industry growth"
    Repeat per application. Cross-reference with player focus from S1-C.
    Output: Application heatmap — Size × Growth rate matrix

  SEG-C — By End-Use Industry (which sector buys it):
    Search: "[APPLICATION] buyer profile" + "[INDUSTRY] procurement of [PRODUCT]"
    Use trade association data to validate end-user share estimates.
    Output: End-use Pareto — which 3 sectors = 80% of demand

  SEG-D — By Geography:
    Search: "[PRODUCT] market [COUNTRY]" — separate search per major geography.
    Use import/export HS code data to triangulate country-level estimates.
    Output: Country/region table — Size | Share | CAGR | Top local player

  SEG-E — By Distribution / Sales Channel:
    Search: "[PRODUCT] distribution channel [GEOGRAPHY]"
    + "[COMPANY] sales model direct vs distributor" (from annual reports)
    Output: Channel mix table with trend direction (shifting to/from direct?)

  FLAG: Any segment with insufficient data → [ESTIMATE — LOW DATA CONFIDENCE]

-----------------------------------------------------------------------
SECTION 4 — MARKET TRENDS, DRIVERS & BARRIERS (TEI-STYLE)
-----------------------------------------------------------------------
PURPOSE: Analyse the forces shaping the market in THREE structured sub-sections.
Each driver and barrier MUST include a real-world named example — a company,
a regulatory event, or a quantified market signal. Generic analysis without
evidence is not acceptable.

--- SUB-SECTION 4A: MARKET TRENDS ---

Cover ALL of the following trend categories. For each: trend name, one-sentence
description, named company/event example, and directional market impact.

  MACROECONOMIC TRENDS:
    Search: "[PRODUCT/INDUSTRY] macroeconomic impact [GEOGRAPHY] [YEAR]"
    + GDP growth, inflation, capex cycle from World Bank / IMF / Central Bank.
    Named example required: e.g. "Fed rate hold slowing construction capex, US 2024"

  DEMAND-SIDE TRENDS:
    Search: "[PRODUCT] demand growth [APPLICATION] [YEAR]"
    + end-use industry growth rates from trade bodies.
    Named example required: e.g. "E-commerce packaging volume +14% CAGR driving HMA demand"

  SUPPLY-SIDE TRENDS:
    Search: "[PRODUCT] raw material supply [YEAR]" + "[KEY INPUT] price trend"
    + capacity expansion OR production cut announcements from company press releases.
    Named example required: e.g. "BASF MDI force majeure Q3 2024 — supply tightness"

  COMMERCIAL / PRICING TRENDS:
    Search: "[PRODUCT] price trend [YEAR]" + "[PRODUCT] contract vs spot pricing"
    Sources: ICIS, Platts, company earnings calls, trade publications.
    Named example required: e.g. "PU HMA ASP down 8% YoY Q4 2024 — Henkel earnings call"

  REGULATORY TRENDS:
    Search: "[PRODUCT] regulation [GEOGRAPHY] [YEAR]"
    + site:ec.europa.eu OR site:epa.gov OR site:bis.gov.in
    Named example required: e.g. "EU REACH SVHC listing isocyanates — 2023 effective"

  TECHNOLOGY TRENDS (including AI & Automation):
    Search: "[INDUSTRY] AI adoption [YEAR]" + "[PRODUCT] automation [YEAR]"
    + "[COMPANY] AI OR automation OR Industry 4.0 [PRODUCT] [YEAR]"
    Named example required: e.g. "Henkel AI-driven adhesive formulation pilot 2024 — 18% yield gain"

--- SUB-SECTION 4B: GROWTH DRIVERS (TEI TABLE — MINIMUM 6 ROWS) ---

For EACH driver, populate ALL columns. Impact Level must be evidence-based (H/M/L).

  SEARCH: For each driver topic:
    "[DRIVER TOPIC] [PRODUCT] [GEOGRAPHY] [YEAR]" — company filings first.
    "[NAMED COMPANY] response to [DRIVER]" — mandatory named example.

  OUTPUT TABLE:
  | # | Driver | Scenario Type | Est. Market Impact | Impact (H/M/L) |
  |   | Affected Segments | Risk Horizon | Strategic Implication |

  Scenario Types to use: ESG/Regulatory Pressure | Consumer Behaviour Shift |
  Industry Structural Shift | Technology Adoption | Input Cost Change |
  Trade Policy Shock | Demographic Shift | Capital Cycle Shift

--- SUB-SECTION 4C: BARRIERS & RESTRAINTS (TEI TABLE — MINIMUM 5 ROWS) ---

Identical structure to drivers. Add TWO additional columns:
  — Mitigation Signal: evidence the industry is already responding
  — Barrier Type: Cost | Regulatory | Competitive | Structural | Cyclical

  SEARCH: For each barrier:
    "[BARRIER TOPIC] impact on [PRODUCT] [GEOGRAPHY] [YEAR]" — quantify.
    "[COMPANY] response to [BARRIER]" — populates Mitigation Signal column.
    "[PRODUCT] substitute threat [GEOGRAPHY]" — for competitive substitution row.

  CRITICAL: The Mitigation Signal column is mandatory.
  It converts a barrier list into an investable risk assessment.
  Without it, re-run the section.

-----------------------------------------------------------------------
SECTION 5 — REGULATORY OVERVIEW
-----------------------------------------------------------------------
PURPOSE: Map the regulatory landscape affecting demand, supply, market entry,
or product formulation. This is strategic intelligence — not legal compliance.

  REG-1: Search "[PRODUCT] regulation [GEOGRAPHY] [YEAR]"
         + "[PRODUCT] regulatory body [GEOGRAPHY]"
         Identify: primary regulator, secondary regulators, self-regulatory bodies.
         Output: Regulatory body table — Name | Geography | Mandate | Relevance

  REG-2: Search "[PRODUCT] new regulation 2022 2023 2024 2025"
         + "[PRODUCT] compliance deadline [GEOGRAPHY]"
         Focus: regulations issued in past 3 years.
         Output: Regulation tracker — Regulation | Date | Scope | Market Impact (H/M/L)

  REG-3: Search "[PRODUCT] import regulation [GEOGRAPHY]"
         + "[PRODUCT] tariff rate [HS code]"
         + "[PRODUCT] anti-dumping OR BIS OR CE marking OR FDA registration"
         Output: Trade & compliance barrier table by geography

  REG-4: Search "[PRODUCT] upcoming regulation 2025 2026"
         + "[REGULATOR] draft rule [PRODUCT]"
         Output: Pending regulation watch list — Rule | Expected date | Impact

-----------------------------------------------------------------------
SECTION 6 — MAJOR TECHNOLOGY TRENDS (AI & AUTOMATION FOCUS)
-----------------------------------------------------------------------
PURPOSE: Identify top 5–8 technology trends reshaping the industry.
Name leading adopters. Quantify impact. Emphasise AI, automation,
digitisation, and sustainability tech.

  TECH-1: AI Adoption
    Search: "[INDUSTRY] AI adoption [YEAR]" + "[PRODUCT] AI application"
    + "[COMPANY] AI [PRODUCT] [YEAR] case study OR deployment OR pilot"
    Output: AI trend + named adopter + quantified benefit (%, USD, time saved)

  TECH-2: Automation & Industry 4.0
    Search: "[INDUSTRY] automation [YEAR]" + "[PRODUCT] manufacturing automation"
    + robotics, IoT, digital twin deployments from company annual reports.
    Output: Automation trend + company example + investment scale

  TECH-3: Patent & Innovation Signals
    Search: "[PRODUCT] patent [YEAR]" on Espacenet (site:espacenet.com) or
    Google Patents. Use IPC class codes. Report: volume trend, top applicants,
    technology sub-categories.
    Output: Patent trend table — Year | Filing volume | Top 3 applicants | Key tech area

  TECH-4: Sustainability Technology
    Search: "[PRODUCT] bio-based OR recyclable OR circular economy [YEAR]"
    + "[COMPANY] sustainable [PRODUCT] launch OR investment [YEAR]"
    Output: Sustainability tech table + commercialisation timeline

  TECH-5: Digital & Commercial Model Shifts
    Search: "[PRODUCT] digital platform [YEAR]"
    + "[INDUSTRY] e-commerce OR digital procurement [YEAR]"
    Output: Digital shift signal + adoption rate estimate

-----------------------------------------------------------------------
SECTION 7 — KEY PLAYER & COMPETITIVE ANALYSIS
-----------------------------------------------------------------------
PURPOSE: Profile each named competitor in structured format. Every profile
must be analytical — not a Wikipedia summary. Every sentence must serve
a competitive intelligence purpose.

COMPANY PROFILE SEARCH SEQUENCE (run for EACH company):

  COMP-1 — Financials:
    Search: "[COMPANY] annual report [YEAR] [PRODUCT segment] revenue"
    + "[COMPANY] investor presentation [YEAR]"
    + "[COMPANY] earnings call [YEAR] [PRODUCT]"
    Extract: total revenue | segment revenue | gross margin | YoY growth

  COMP-2 — Market Share:
    Search: "[COMPANY] market share [PRODUCT] [GEOGRAPHY] [YEAR]"
    Cross-reference minimum 2 sources. If conflicting, state range.
    Output: Share estimate + confidence level + source tier

  COMP-3 — Recent Strategic Activity:
    Search: "[COMPANY] acquisition OR merger OR JV [YEAR]"
    + "[COMPANY] plant expansion OR CAPEX [PRODUCT] [YEAR]"
    + "[COMPANY] new product launch [PRODUCT] [YEAR]"
    Focus: events with direct market impact in past 3 years.
    Output: Activity log — Date | Event type | Market implication

  COMP-4 — Social & Digital Signal:
    Search: "[COMPANY] LinkedIn [YEAR]" + "[COMPANY] press release [YEAR]"
    Identify: strategic messaging themes, hiring signals, product announcements.
    Output: Social signal — Content theme | Strategic intent | Key announcement

  COMP-5 — Technology / R&D Signal:
    Search: "[COMPANY] patent [PRODUCT] 2022 2023 2024" on Espacenet.
    Count filings, identify tech focus areas.
    Compare patent intensity across all profiled players.
    Output: Patent activity — Filing count | Tech focus | Relative intensity vs peers

COMPETITIVE LANDSCAPE OUTPUTS (mandatory):
  — Market share ranking table: Rank | Company | Est. Share % | Revenue USD M |
    HQ | Primary geography | Confidence level
  — 2×2 Positioning Matrix: Market Presence (x) vs Innovation Score (y)
  — M&A / JV Activity Tracker (past 3 years):
    Date | Acquirer | Target | Deal value | Strategic rationale
  — Company profile card per player (consistent template across all profiles)

-----------------------------------------------------------------------
SECTION 8 — MARKET FORECAST (3 SCENARIOS)
-----------------------------------------------------------------------
PURPOSE: Project the market 5–7 years under three scenarios. Each scenario
states its key assumptions explicitly. Forecasts must be anchored in the
drivers and barriers from Section 4 — not generated independently.

  FCST-1: Search "[PRODUCT] market forecast [GEOGRAPHY]" to surface any
          credible growth projections. Use as sanity check ONLY.
          Compare against your bottom-up CAGR from Section 2.
          Output: External CAGR range + your derived CAGR + variance explanation

  FCST-2 — PESSIMISTIC SCENARIO:
    Apply top 2 barriers from Section 4C at maximum impact.
    Example: "If auto production declines 5% AND MDI prices rise 20%,
    segment CAGR compresses to 1.2%."
    Output: CAGR | Market size at horizon | Probability assessment | Key assumption

  FCST-3 — REALISTIC (BASE) SCENARIO:
    Apply triangulated TAM from Section 2 as base.
    Grow at weighted average net impact of drivers minus barriers.
    This is the primary forecast — must align numerically with Section 2 TAM.
    Output: CAGR | Market size at horizon | Key assumption | Confidence: HIGH

  FCST-4 — OPTIMISTIC SCENARIO:
    Apply top 2 drivers from Section 4B at maximum impact.
    Example: "If EV battery adoption accelerates 2× AND solvent ban expands
    to 3 new markets, CAGR expands to 9.4%."
    Output: CAGR | Market size at horizon | Probability assessment | Key assumption

  MANDATORY FORECAST TABLE:
  | Scenario          | CAGR | Base Yr (USD M) | Forecast Yr (USD M) | Key Assumption | Confidence |
  |-------------------|------|-----------------|---------------------|----------------|------------|
  | Pessimistic       |      |                 |                     |                | Medium     |
  | Realistic (Base)  |      |                 |                     |                | High       |
  | Optimistic        |      |                 |                     |                | Medium     |

  CRITICAL: The three scenarios must have mutually exclusive assumptions.
  Do not average them. The Base CAGR must reconcile with Section 2 TAM.

-----------------------------------------------------------------------
SECTION 9 — EXECUTIVE SUMMARY (GENERATED LAST, PLACED FIRST)
-----------------------------------------------------------------------
PURPOSE: A 1-page analytical brief synthesising the most decision-relevant
insights from ALL sections. A senior executive reading ONLY this page must
leave with a complete strategic picture of the market.
Write this section after Sections 1–8 are complete.

MANDATORY STRUCTURE (do not change the order):

  BLOCK 1 — MARKET SNAPSHOT (3–4 lines):
    Market size (base year, USD M + volume unit) + CAGR (historical + forecast)
    + the single most important structural characteristic of the market.

  BLOCK 2 — TOP 3 GROWTH DRIVERS (bullet format, one sentence each):
    Each driver must include a quantified signal.
    Format: "↑ [Driver]: [Evidence sentence with number or named event]"

  BLOCK 3 — TOP 3 RISKS / BARRIERS (bullet format, one sentence each):
    Each barrier must include estimated impact.
    Format: "↓ [Barrier]: [Evidence sentence with impact estimate]"

  BLOCK 4 — COMPETITIVE LANDSCAPE (3–4 lines):
    Number of players + top 3 by share + key competitive dynamic.
    Is the market consolidating / fragmenting / being disrupted by tech?

  BLOCK 5 — STRATEGIC OUTLOOK (3–4 lines):
    Realistic CAGR + most probable scenario + rationale.
    Single highest-priority strategic recommendation.

  BLOCK 6 — 5 KPI CALLOUT BOXES (visual elements — specify as chart):
    Market Size (USD M) | CAGR % | No. of Key Players | Top Geography | #1 Trend

TONE RULES FOR EXECUTIVE SUMMARY:
  — Write for a CFO or Board member: analytical, direct, no padding
  — Every sentence must contain: a number, a named company, OR a named dynamic
  — "The market is growing rapidly" is NOT acceptable
  — "The market grew at 6.8% CAGR 2020–2024, driven by..." IS acceptable
  — No source citations — all numbers drawn from Sections 1–8
  — Maximum 450 words in the narrative blocks

-----------------------------------------------------------------------
APPENDIX A — SOURCE LOG
-----------------------------------------------------------------------
All sources used must be listed here. This is the ONLY place source names appear.
Format per entry:
  Source Name | URL | Date Accessed | Credibility Tier (1–6) | Section Used In

-----------------------------------------------------------------------
APPENDIX B — METHODOLOGY NOTE
-----------------------------------------------------------------------
  — Data collection approach (primary vs. secondary split)
  — Triangulation logic used for TAM
  — Number of web searches executed
  — Known data gaps and how they were handled
  — Confidence tier distribution across the report

-----------------------------------------------------------------------
SEARCH QUERY LIBRARY (USE THESE EXACT PATTERNS)
-----------------------------------------------------------------------

MARKET SIZE & TRADE:
  "[PRODUCT] market size [GEOGRAPHY] [YEAR]" site:gov OR site:europa.eu
  "[PRODUCT] [HS CODE] import export [GEOGRAPHY] comtrade OR customs"
  "[PRODUCT] production volume [GEOGRAPHY] annual report OR ministry"
  "[COMPANY] [PRODUCT segment] revenue [YEAR] annual report OR earnings"

REGULATORY:
  "[PRODUCT] regulation [GEOGRAPHY] [YEAR]" site:ec.europa.eu OR site:epa.gov
  "[PRODUCT] REACH SVHC OR EPA restriction OR BIS certification [YEAR]"
  "[PRODUCT] import duty anti-dumping tariff [GEOGRAPHY] [YEAR] gazette"
  "[PRODUCT] draft regulation 2025 2026 public consultation"

TECHNOLOGY:
  "[PRODUCT] patent [YEAR]" site:espacenet.com IPC:[CODE]
  "[COMPANY] R&D investment [PRODUCT] [YEAR] annual report"
  "[INDUSTRY] AI automation adoption [YEAR] case study OR deployment"
  "[PRODUCT] bio-based sustainable innovation [YEAR] journal OR patent"

COMPETITIVE:
  "[COMPANY] [PRODUCT] revenue market share [YEAR] investor presentation"
  "[COMPANY] acquisition merger joint venture [PRODUCT] [YEAR] press release"
  "[COMPANY] plant expansion capacity CAPEX [PRODUCT] [YEAR]"
  "[INDUSTRY] market share ranking [GEOGRAPHY] trade body OR association"

PRICING:
  "[PRODUCT] average selling price [GEOGRAPHY] [YEAR] ICIS OR Platts OR earnings"
  "[PRODUCT] price trend quarterly monthly spot contract [YEAR]"
  "[KEY RAW MATERIAL] price [YEAR] impact [PRODUCT] manufacturer margin"

=======================================================================
END OF CONTENT PROMPT
=======================================================================`;

// ── DESIGN PROMPT TEXT ──────────────────────────────────────

const DESIGN_PROMPT = `=======================================================================
DESIGN PROMPT: MARKET INTELLIGENCE REPORT WEB APP — FULL REJIG
Brand Colors: #0c3649 (Navy) | #E63946 (Red) | #3491E8 (Blue) | #000000 (Black)
=======================================================================

ROLE
You are a senior UI/UX engineer rebuilding the visual design and layout of
a market intelligence report web application. The app generates 150–200 page
industry reports. The redesign must feel like a professional financial data
terminal — analytical, authoritative, high information density — not a
generic SaaS dashboard.

-----------------------------------------------------------------------
COLOR SYSTEM — APPLY EXACTLY AS SPECIFIED
-----------------------------------------------------------------------

Primary Palette (use only these four):
  --navy:      #0c3649   → Primary backgrounds, headers, nav, section titles
  --red:       #E63946   → Alerts, barriers, risk indicators, CTA buttons,
                           accent on key data points, warning states
  --blue:      #3491E8   → Interactive elements, links, driver indicators,
                           positive trends, chart primary series, active states
  --black:     #000000   → Deep backgrounds, code blocks, maximum contrast areas

Derived (computed from primary — do not introduce other colors):
  --navy-light:  #0e4a62   → Card backgrounds, panel fills
  --navy-xlight: #163f56   → Subtle surface, hover states on navy elements
  --navy-border: #1a5270   → All borders and dividers
  --red-muted:   #ff6b75   → Red used at reduced opacity / secondary alerts
  --blue-muted:  #6ab8ff   → Blue used at reduced opacity / secondary positives
  --text-primary:#E8F0F5   → All body text on dark backgrounds
  --text-muted:  #7eaabf   → Labels, metadata, secondary text
  --white:       #FFFFFF   → Text on colored backgrounds only

USAGE RULES:
  — Navy is the dominant color (70% of surfaces)
  — Blue signals positive, growth, interactive, selected
  — Red signals risk, barrier, alert, CTA, error
  — Black is used for maximum contrast backgrounds (report output panel,
    code blocks, data-heavy tables)
  — Do NOT introduce purple, green, orange, or teal
  — Gradients: navy → navy-light ONLY (never cross-color gradients)
  — Transparency: use opacity variants of the 4 primary colors only

-----------------------------------------------------------------------
TYPOGRAPHY
-----------------------------------------------------------------------
  Display / Headers:   "Inter" or "DM Sans" — weight 700–900
  Body / Analysis:     "Inter" — weight 400–500 — size 14px line-height 1.7
  Data / Numbers:      "DM Mono" or "Fira Code" — weight 500
  Labels / Metadata:   "Inter" — weight 600 — size 11px — letter-spacing 1.2px
                        UPPERCASE for section labels and KPI captions

  Heading scale:
    H1 (page title):    32px bold, color: #E8F0F5
    H2 (section):       22px bold, color: #3491E8
    H3 (subsection):    17px bold, color: #7eaabf
    Body:               14px regular, color: #E8F0F5
    Label/metadata:     11px semibold uppercase, color: #7eaabf
    Data value:         20–28px bold monospace, color: #E8F0F5

-----------------------------------------------------------------------
LAYOUT ARCHITECTURE
-----------------------------------------------------------------------

GLOBAL SHELL:
  — Full-height two-column layout on desktop:
    Left: 260px fixed sidebar — navy (#0c3649) background
    Right: Remaining width — black (#000000) or navy-light background
  — Top navigation bar: 56px height, navy background, 1px border-bottom
    in navy-border color
  — No white backgrounds anywhere in the app
  — Mobile: sidebar collapses to bottom tab bar (4 icons max)

SIDEBAR:
  — Logo / Brand mark at top (white text on navy)
  — Navigation items: vertical list, 48px height per item
  — Active state: left 3px border in blue (#3491E8) + navy-xlight background
  — Hover state: navy-xlight background, text shifts to white
  — Section group labels: 10px uppercase, text-muted, letter-spacing 2px
  — Bottom of sidebar: user account, settings, help

MAIN CONTENT AREA:
  — Max content width: 1200px, centered
  — Section padding: 32px horizontal, 28px vertical
  — Between-section spacing: 48px
  — Cards: navy-light background, 1px navy-border border, border-radius 10px
  — No drop shadows — use borders and background contrast for depth

-----------------------------------------------------------------------
COMPONENT DESIGN SPECIFICATIONS
-----------------------------------------------------------------------

1. KPI / METRIC CARDS (Executive Summary + Dashboard):
   — Background: navy-light (#0e4a62)
   — Border: 1px navy-border, border-radius 10px
   — Top accent bar: 3px solid, color varies by metric type:
     Market Size → blue | CAGR → blue | Risk → red | Players → navy-xlight
   — Label: 10px uppercase, text-muted, letter-spacing 1.5px
   — Value: 28px bold monospace, text-primary
   — Sub-label: 12px text-muted
   — Layout: 4-column grid on desktop, 2-column on tablet, 1 on mobile

2. DATA TABLES:
   — Container: black background, 1px navy-border border, border-radius 8px
   — Header row: navy (#0c3649) background, text-primary, 12px uppercase bold
   — Alternating rows: black | navy-xlight (#163f56)
   — Cell padding: 12px 16px
   — Positive values: blue (#3491E8)
   — Negative / risk values: red (#E63946)
   — Neutral: text-primary
   — H/M/L Impact badges:
     H → red background + white text
     M → blue background + white text
     L → navy-xlight background + text-muted
   — Confidence tags:
     HIGH → blue border + blue text
     MEDIUM → navy-border + text-muted
     LOW → red border + red-muted text

3. SECTION HEADERS:
   — Full-width bar: navy background, 2px bottom border in blue (#3491E8)
   — Section number: 32px bold, red (#E63946)
   — Section title: 22px bold, white
   — Section tag/badge: blue background, white text, 11px uppercase
   — No card — full bleed across content width

4. PROGRESS / GENERATION STATUS:
   — Background: black (#000000)
   — Active step indicator: blue (#3491E8) left border + blue dot
   — Completed step: checkmark icon in blue, text-muted label
   — Current step: white label, blue animated pulse dot
   — Progress bar: navy-border track, blue fill, animated shimmer

5. DRIVER TABLE (TEI-style):
   — Container: navy-light, border-radius 10px, blue top accent
   — Row color: alternating black | navy-xlight
   — Driver name column: bold white text
   — Impact Level badge: H=red, M=blue, L=navy-xlight
   — Risk Horizon: small blue badge for near-term, grey for long-term
   — Strategic Implication: italic, text-muted, truncated with expand option

6. BARRIER TABLE (TEI-style):
   — Identical to Driver Table but with red top accent (not blue)
   — Barrier Type badge: red background + white text
   — Mitigation Signal column: blue italic text (signals positive response)

7. FORECAST SCENARIO PANEL:
   — Three scenario cards side by side: Pessimistic | Realistic | Optimistic
   — Pessimistic: red left border, red CAGR value
   — Realistic: blue left border, blue CAGR value — slightly larger card
   — Optimistic: blue left border, blue-muted CAGR value
   — Each card: assumption list in text-muted, probability badge
   — Chart below cards: line chart, three series:
     Red dashed line = Pessimistic
     Blue solid line = Realistic (thicker)
     Blue dotted line = Optimistic

8. COMPETITIVE LANDSCAPE:
   — Market share table: standard data table spec above
   — Share % column: horizontal mini bar chart within cell
     Blue fill for top 3, navy-xlight for rest
   — Positioning matrix (2×2): black background, navy-border grid lines,
     blue axis labels, company name labels in white,
     blue dots for players, red dot for the focal company

9. REPORT GENERATION PANEL (right panel or modal):
   — Full-height panel, black background
   — Left border: 2px solid navy-border
   — Streaming text output: monospace font, text-primary, 13px
   — Section complete indicator: blue checkmark + section name
   — Search query log: navy-xlight background pill, text-muted, 11px
   — Error / no-data indicator: red left border + red-muted italic text

10. BUTTONS:
    Primary CTA (Generate Report): red (#E63946) background, white text,
      border-radius 6px, 14px bold, hover: darker red (#c02030)
    Secondary action: navy-light background, blue border, blue text,
      hover: blue background, white text
    Destructive: red border, red text, hover: red background, white text
    Disabled: navy-border background, text-muted, cursor not-allowed

11. INPUT FIELDS:
    Background: black (#000000)
    Border: 1px navy-border, border-radius 6px
    Focus border: 2px blue (#3491E8)
    Text: text-primary
    Placeholder: text-muted
    Label: 11px uppercase, text-muted, letter-spacing 1px
    Error state: red border + red helper text below

12. NAVIGATION TABS (section switcher):
    Inactive: text-muted, no background, border-bottom: 2px transparent
    Active: white text, border-bottom: 2px solid blue (#3491E8)
    Hover: text-primary, border-bottom: 2px solid navy-border
    Tab bar background: navy (#0c3649), 1px bottom border

13. BADGES / TAGS:
    Source Tier 1–2: blue background + white text
    Source Tier 3–4: navy-xlight + text-muted
    Source Tier 5–6: navy-border + text-muted
    ESTIMATE tag: red outline + red text
    Confirmed tag: blue outline + blue text

14. CHARTS (specify for chart library — Recharts or Chart.js):
    Background: black (#000000)
    Grid lines: navy-border (#1a5270), 1px, dashed
    Axis text: text-muted (#7eaabf), 11px
    Primary series: blue (#3491E8)
    Secondary series: blue-muted (#6ab8ff) or red (#E63946) for risk series
    Tooltip background: navy (#0c3649), border: navy-border
    Tooltip text: text-primary + blue value highlight
    No chart background fill — transparent to card background
    Chart types to support:
      — Line (forecast trend, market size history)
      — Bar / Stacked bar (segment breakdown, player comparison)
      — Pie / Donut (market share, segment share)
      — Scatter (positioning matrix)
      — Horizontal bar (driver/barrier impact ranking)

-----------------------------------------------------------------------
PAGE-SPECIFIC LAYOUTS
-----------------------------------------------------------------------

HOME / REPORT CREATION PAGE:
  — Two-panel layout: left = form inputs (40%), right = live preview (60%)
  — Form panel: navy-light background, input fields in black
  — Preview panel: black background, streaming report output
  — Generate button: full-width red CTA at bottom of form panel

REPORT DASHBOARD (after generation):
  — Top: 5 KPI cards across full width
  — Below: tab navigation for each of the 9 report sections
  — Each section tab opens its own structured layout
  — Right floating panel (320px): source log + confidence summary

SECTION DETAIL VIEWS:
  Executive Summary: KPI cards + 3 text blocks + no tables
  Market Size: triangulation table (full width) + method comparison cards
  Segmentation: tab per dimension, heatmap + table per tab
  Dynamics: three sub-tabs (Trends | Drivers | Barriers), TEI tables
  Regulatory: timeline view + table
  Technology: card grid (one card per tech trend) + patent chart
  Competitive: share table + positioning matrix + profile cards
  Forecast: 3 scenario cards + line chart + assumption accordion
  Appendix: searchable source log table

-----------------------------------------------------------------------
INTERACTION & ANIMATION
-----------------------------------------------------------------------
  — No decorative animations — this is a data product, not a marketing site
  — Functional transitions only:
    Tab switch: 150ms ease fade
    Panel expand/collapse: 200ms ease height transition
    Tooltip appear: 100ms ease opacity
    Button press: 80ms scale(0.98) feedback
    Data load: skeleton loading in navy-xlight (#163f56)
  — Hover states: 150ms transition on background and border color
  — No parallax, no scroll animations, no entrance animations

-----------------------------------------------------------------------
RESPONSIVE BREAKPOINTS
-----------------------------------------------------------------------
  Desktop (≥1280px): Full two-column layout, all panels visible
  Laptop (1024–1279px): Sidebar collapses to icon-only (60px width)
  Tablet (768–1023px): Single column, sidebar as top drawer
  Mobile (<768px): Single column, sidebar as bottom tab bar (4 tabs max)

-----------------------------------------------------------------------
WHAT TO AVOID (STRICTLY)
-----------------------------------------------------------------------
  ✗ White or light backgrounds anywhere in the application
  ✗ Purple, green, orange, teal, or any color not in the brand palette
  ✗ Drop shadows (use border contrast for depth instead)
  ✗ Rounded corners > 12px (max border-radius on any element)
  ✗ Decorative gradients or illustrations
  ✗ Generic SaaS dashboard aesthetics (no blue/purple gradient heroes)
  ✗ Inline source citations in report body sections
  ✗ Light mode — this is a dark-mode-only application
  ✗ Any font other than Inter, DM Sans, DM Mono, or Fira Code

=======================================================================
END OF DESIGN PROMPT
=======================================================================`;

// ── HOW TO USE ───────────────────────────────────────────────

const USAGE_STEPS = [
  {
    n: "1", color: C.blue,
    title: "Paste the Content Prompt into Antigravity",
    detail: "Go to your Antigravity agent configuration. Create a new agent task. Paste the entire Content Prompt as the system prompt. Fill in the [USER TO SPECIFY] fields at the top — Product, Geography, Study Period, Key Players — before triggering the run. Do not modify the search instructions or the table formats.",
  },
  {
    n: "2", color: C.red,
    title: "Paste the Design Prompt into your developer / Claude Code session",
    detail: "Open your web-app codebase in Claude Code or share it with your developer. Paste the Design Prompt as the instruction. It specifies every component, color, layout, and interaction rule your developer needs. No design decisions are left open — everything is pre-specified.",
  },
  {
    n: "3", color: C.navy,
    title: "Run a test on a single section first",
    detail: "Before running the full 9-section report, test Section 2 (Market Size) on a real industry you know well. Check: Did it execute both top-down and bottom-up? Did it flag low-confidence estimates? Did it avoid citing Grand View/Mordor as primary? Fix any gaps in the prompt before scaling.",
  },
  {
    n: "4", color: C.blue,
    title: "Validate minimum search depth",
    detail: "After each full run, check Appendix B (Methodology Note). Confirm: minimum 35 web searches were executed. If the search count is below 35, the report is likely underresearched — re-run with deeper iteration on Sections 2, 4, and 7.",
  },
  {
    n: "5", color: C.red,
    title: "Enforce the source rule manually at first",
    detail: "Until Antigravity enforces it automatically, manually scan the report body for phrases like 'according to', 'as reported by', or source names. All citations must be in Appendix A only. If you find citations in the body, feed that section back with the instruction: 'Remove all source attributions from the body. Move to Appendix A.'",
  },
];

// ── MAIN APP ─────────────────────────────────────────────────

export default function App() {
  const [active, setActive] = useState("content");

  return (
    <div style={{
      fontFamily: "'Inter', 'DM Sans', 'Segoe UI', sans-serif",
      background: C.bg, minHeight: "100vh", color: C.text,
    }}>

      {/* Header */}
      <div style={{
        background: C.navy,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6,
            background: `linear-gradient(135deg, ${C.blue}, ${C.red})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 14, color: C.white,
          }}>R</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>RefractOne</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Antigravity Master Prompts — v2.0</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Tag color={C.blue}>Industry Reports</Tag>
          <Tag color={C.red}>March 2026</Tag>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: C.navy, borderBottom: `1px solid ${C.border}`,
        display: "flex", padding: "0 32px", gap: 0,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "14px 22px",
            color: active === t.id ? C.white : C.muted,
            fontWeight: active === t.id ? 700 : 500,
            fontSize: 13,
            borderBottom: `2px solid ${active === t.id ? C.blue : "transparent"}`,
            transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ── CONTENT PROMPT TAB ── */}
        {active === "content" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Antigravity — System Prompt</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>Industry Report Content Prompt</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                Paste this as the system/master prompt in your Antigravity agent configuration. Fill in the <span style={{ color: C.blue, fontFamily: "monospace" }}>[USER TO SPECIFY]</span> fields before triggering a run. Do not modify the search instructions, table formats, or Core Rules.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["9-Section Architecture", "Dual-Method TAM", "TEI Driver/Barrier Tables", "Min. 35 Searches", "3-Scenario Forecast", "Anti-Hallucination Rules"].map(t => (
                  <Tag key={t} color={C.blue}>{t}</Tag>
                ))}
              </div>
            </div>

            <Rule color={C.blue} />

            {/* Quick reference */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Sections", value: "9", sub: "Incl. Executive Summary generated last", c: C.blue },
                { label: "Min. Searches", value: "35", sub: "Per full report — enforced in Appendix B", c: C.red },
                { label: "Banned Sources", value: "5", sub: "Grand View, Mordor, IMARC + 2 more", c: C.navy },
              ].map(m => (
                <div key={m.label} style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderTop: `3px solid ${m.c}`, borderRadius: 10, padding: "16px 20px",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: m.c, fontFamily: "monospace" }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            <SectionLabel n="▶" color={C.blue}>Full Prompt — Copy & Paste into Antigravity</SectionLabel>
            <PromptBlock text={CONTENT_PROMPT} label="Content Prompt" color={C.navy} />
          </div>
        )}

        {/* ── DESIGN PROMPT TAB ── */}
        {active === "design" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Developer / Claude Code — Design System</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>Web App Design Prompt</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                Paste this into Claude Code or share with your developer. Every component, color rule, layout spec, and interaction is pre-specified. No design decisions are left open.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["Dark Mode Only", "4-Color System", "14 Components Specified", "9 Page Layouts", "No White Backgrounds", "Financial Terminal Aesthetic"].map(t => (
                  <Tag key={t} color={C.red}>{t}</Tag>
                ))}
              </div>
            </div>

            <Rule color={C.red} />

            {/* Color swatches */}
            <SectionLabel n="🎨" color={C.red}>Brand Color System</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { name: "Navy", hex: "#0c3649", role: "Primary bg, headers, sidebar, 70% of surfaces", use: "Dominant" },
                { name: "Red", hex: "#E63946", role: "Risk, barriers, alerts, CTA buttons, key data", use: "Accent — Action" },
                { name: "Blue", hex: "#3491E8", role: "Interactive, growth, positive, charts, active", use: "Accent — Data" },
                { name: "Black", hex: "#000000", role: "Deep bg, tables, code blocks, max contrast", use: "Base" },
              ].map(c => (
                <div key={c.name} style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 10, overflow: "hidden",
                }}>
                  <div style={{ height: 60, background: c.hex }} />
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontFamily: "monospace", color: C.blue, fontSize: 12, marginBottom: 4 }}>{c.hex}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{c.use}</div>
                    <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>{c.role}</div>
                  </div>
                </div>
              ))}
            </div>

            <SectionLabel n="▶" color={C.red}>Full Design Prompt — Copy & Paste to Developer / Claude Code</SectionLabel>
            <PromptBlock text={DESIGN_PROMPT} label="Design Prompt" color={`${C.navy}`} />
          </div>
        )}

        {/* ── HOW TO USE TAB ── */}
        {active === "usage" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Implementation Guide</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>How to Use Both Prompts</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
                Two prompts, two destinations. The Content Prompt goes to Antigravity. The Design Prompt goes to your developer or Claude Code. They are independent — run them in parallel, not sequentially.
              </div>
            </div>

            <Rule color={C.blue} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.blue}`, borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ fontWeight: 800, color: C.blue, fontSize: 14, marginBottom: 8 }}>① Content Prompt → Antigravity</div>
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>Controls what the AI researches, how it sizes the market, how it structures the TEI tables, and what gets written in each of the 9 report sections.</div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.red}`, borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ fontWeight: 800, color: C.red, fontSize: 14, marginBottom: 8 }}>② Design Prompt → Developer / Claude Code</div>
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>Controls how the web app looks — every color, component, layout, and interaction. Specifies the exact brand palette and financial terminal aesthetic.</div>
              </div>
            </div>

            {USAGE_STEPS.map(s => (
              <div key={s.n} style={{
                display: "flex", gap: 18, padding: "20px 0",
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: s.color, color: C.white,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: 15, flexShrink: 0,
                }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{s.detail}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 28, background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ fontWeight: 700, color: C.red, fontSize: 13, marginBottom: 8 }}>⚠ Most Common Failure Mode to Watch</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
                v1 produced shallow results because the search queries were too generic. The v2 Content Prompt fixes this with specific query patterns (including <span style={{ fontFamily: "monospace", color: C.blue }}>site:</span> operators, HS codes, and source-type filters). If results are still shallow after the first run, check that Antigravity is actually executing the search instructions — some platforms require explicit tool-use configuration to enable live web search.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

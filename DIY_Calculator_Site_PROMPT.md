# DIY Home-Improvement Calculator Site: Master Build Prompt

## How to use this file
1. **Option A (Emergent, Lovable, Bolt, etc.):** Copy the **MASTER PROMPT** section into the builder first. Then send the **PHASE PROMPTS** one at a time. AI builders do much better in phases than with one giant request, and you waste fewer credits.
2. **Option B (Antigravity):** Just say *"build it from DIY_Calculator_Site_PROMPT.md"* and the agent builds it in this folder and deploys it.
3. Replace everything in `[BRACKETS]` before sending (site name, domain, email).

> ⚠️ Important for SEO: many AI builders (including Emergent's default React + FastAPI + MongoDB stack) produce a **client-rendered single-page app**. Google indexes that poorly. This prompt requires **pre-rendered static HTML** (Astro or Next.js static export). If your builder can't do that, use Option B.

---
---

# MASTER PROMPT (copy everything below this line)

You are a senior full-stack engineer, technical SEO expert and UX designer. Build a **production-ready, fully deployed website** called **[SITE NAME, e.g. "BuildMath"]** at **[DOMAIN, e.g. buildmath.com]**: a fast, trustworthy collection of **free DIY and home-improvement calculators for US homeowners**, plus **"Cost to [job] in [state]"** estimate pages. The business model is **display ads + affiliate links (Amazon Associates, Home Depot via Impact) + later contractor lead-gen**. The site must be ready for real users and Google AdSense review on day one.

## 1. Goals and success criteria
- Users get an accurate material quantity **and** cost estimate in under 10 seconds, on mobile.
- Every page is **pre-rendered static HTML** with complete content in the HTML source (no content that only appears after JavaScript runs).
- Lighthouse (mobile): Performance ≥ 95, SEO = 100, Accessibility ≥ 95, Best Practices ≥ 95.
- Core Web Vitals: LCP < 2.0 s, CLS < 0.05 (**including after ads load**), INP < 200 ms.
- Every page has unique, genuinely useful content. No thin or duplicate pages get indexed.
- The site passes Google AdSense policy review (original content, legal pages, clear navigation, contact page).

## 2. Tech stack (required)
- **Framework:** Astro (preferred, static output) with TypeScript. Next.js App Router with `output: 'export'` is acceptable.
- **Interactive parts:** Calculators are small client-side "islands" (Preact or React, or vanilla TypeScript). All math runs **in the browser**. **No backend and no database** are needed.
- **Styling:** Tailwind CSS. Self-host fonts (Inter, or system font stack). No layout-shifting web fonts.
- **Data:** Typed JSON/TS files in `/src/data/` (calculators, cost jobs, states, products).
- **Forms:** Contact form via Web3Forms or Formspree (no server).
- **Testing:** Vitest unit tests for **every** formula; Playwright smoke test that every calculator page renders and computes.
- **Hosting:** Cloudflare Pages (preferred: free, unlimited bandwidth) or Netlify/Vercel. Deploy from a GitHub repo, with a preview deploy for every push.
- **Analytics:** Cloudflare Web Analytics or Plausible (privacy-friendly). GA4 is optional and must sit behind consent.

## 3. Information architecture and URLs
Use lowercase, hyphenated URLs **with trailing slashes**, consistent everywhere:

```
/                                   Home
/calculators/                       All calculators hub (search + filter by category)
/calculators/[category]/            Category hubs: painting, flooring, concrete-masonry, roofing,
                                    landscaping, fencing-decking, drywall-walls, general-conversions
/calculators/[slug]/                Individual calculator, e.g. /calculators/paint-calculator/
/cost/                              Cost guides hub
/cost/[job]/                        National cost guide, e.g. /cost/roof-replacement/
/cost/[job]/[state]/                State cost page, e.g. /cost/roof-replacement/texas/
/guides/[slug]/                     How-to articles (start with 5)
/about/  /contact/  /methodology/  /privacy-policy/  /terms/  /disclaimer/
/affiliate-disclosure/  /cookie-policy/  404 page
/sitemap-index.xml  /robots.txt  /ads.txt
```

Breadcrumbs on every page (Home › Calculators › Painting › Paint Calculator), with BreadcrumbList schema.

## 4. Calculators to build at launch (30)
Every calculator must support:
- **Imperial by default**, with a metric toggle. Accept feet + inches inputs.
- **Editable defaults** (coverage, waste %, bag size, unit price) with a tooltip explaining each default and its source.
- **Waste-factor control** (slider or select).
- **Results panel:** quantities rounded **up** to purchasable units (gallons, boxes, bags, bundles), plus the exact unrounded value.
- **Cost estimate:** quantity × editable unit price (sensible US default prices stored in `/src/data/prices.json`, each with a `lastReviewed` date). Show a low–high range.
- **Materials list** with "Shop this" affiliate buttons (see section 8).
- **Shareable URL:** inputs encoded in query params, so a pasted link restores the calculation.
- **"Add to my project list"** button. Saves to localStorage. A `/my-project/` page shows the combined shopping list and total, with print and copy options.
- Print-friendly results. Inline input validation with clear errors (no negatives, sane maximums).
- Fully keyboard accessible, labelled inputs, `aria-live` results.

Use these formulas (all defaults editable by the user):

**Painting**
1. **Paint Calculator:** wall area = Σ(wall length × height) − doors × 21 sq ft − windows × 15 sq ft (+ ceiling optional = L × W). Gallons = area × coats ÷ coverage (default 350 sq ft/gal; range 250–400). Add primer option (default coverage 250 sq ft/gal). Round to gallons + quarts.
2. **Exterior Paint Calculator:** house perimeter × wall height + gable triangles (½ × width × gable height) − openings. Default coverage 300 sq ft/gal (rough siding lowers it).
3. **Deck Stain Calculator:** deck area + railings (linear ft × height × 2 sides) + stairs. Default coverage 200 sq ft/gal for the 1st coat, 300 sq ft/gal for the 2nd.
4. **Wallpaper Calculator:** wall area − openings ÷ usable roll coverage (default 25 sq ft per single roll; double roll = 2×), + pattern-repeat waste option.

**Flooring**
5. **Flooring Calculator (laminate / hardwood / LVP):** room area (support multiple rectangles + L-shapes) × (1 + waste: 10% straight, 15% diagonal/herringbone). Boxes = ceil(total ÷ sq ft per box).
6. **Tile Calculator:** tiles = ceil(area_in² ÷ ((tile W + grout) × (tile L + grout)) × (1 + waste)). Boxes, thinset bags (editable coverage per bag), grout.
7. **Grout Calculator:** volume = ((L + W) ÷ (L × W)) × joint width × joint depth × area, converted to lbs using editable density. Show bags.
8. **Carpet Calculator:** area in sq ft and sq yd (÷ 9), 12-ft-roll layout length, padding.
9. **Baseboard / Trim Calculator:** perimeter − door widths, + 10% waste. Number of pieces at 8, 12 or 16 ft lengths.

**Concrete & Masonry**
10. **Concrete Slab Calculator:** cu ft = L × W × (thickness in ÷ 12). Cu yd = cu ft ÷ 27. +10% waste default. Bags: 80 lb ≈ 0.60 cu ft, 60 lb ≈ 0.45 cu ft, 40 lb ≈ 0.30 cu ft. Show both "bags" and "ready-mix truck yards".
11. **Concrete Footing / Column / Sonotube Calculator:** cylinder π r² h; rectangular footing L × W × D; multiple quantity.
12. **Concrete Steps Calculator:** sum of stepped volumes + landing.
13. **Brick Calculator:** wall area − openings × 6.75 bricks per sq ft (modular brick with ⅜" mortar), +5% waste. Mortar bags (editable bricks-per-bag).
14. **Paver Patio Calculator:** pavers = area ÷ paver face area × (1 + 5–10% waste). Base gravel at 4–6" depth and bedding sand at 1", both in cu yd and tons.
15. **Retaining Wall Block Calculator:** blocks per row = length ÷ block length; rows = height ÷ block height (+1 buried row option); cap blocks; drainage gravel.
16. **Rebar Calculator:** grid spacing (default 12" or 18" on center), slab dimensions, minus edge cover → total linear ft and 20-ft bars, + overlap %.

**Roofing**
17. **Roofing Calculator:** roof area = footprint (incl. overhang) × pitch factor, where pitch factor = √(1 + (rise ÷ 12)²) (4/12 = 1.054, 6/12 = 1.118, 8/12 = 1.202, 12/12 = 1.414). Squares = area ÷ 100. Bundles = squares × 3 (editable), +10% waste (15% for complex roofs). Underlayment rolls, drip edge (perimeter ÷ 10-ft pieces), ridge cap, starter strip, nails.
18. **Roof Pitch Calculator:** rise/run ↔ angle (degrees) ↔ pitch factor, with a visual triangle diagram.
19. **Gutter Calculator:** linear ft of eaves, downspouts (1 per 30–40 ft default), hangers every 24" default, end caps, elbows.
20. **Siding Calculator:** wall area − openings → squares, + 10% waste; J-channel and corner posts.

**Landscaping**
21. **Mulch Calculator:** cu yd = area × depth in ÷ 12 ÷ 27. Bags (2 cu ft default; 13.5 bags per cu yd). Support circle and rectangle beds.
22. **Gravel / Crushed Stone Calculator:** cu yd as above; tons = cu yd × density (default 1.4 tons/cu yd, editable by material type).
23. **Topsoil Calculator:** cu yd, bags (editable), tons (editable density).
24. **Sod Calculator:** area +5% waste, pieces (editable piece size), pallets (default 450 sq ft per pallet, editable).
25. **Grass Seed Calculator:** lbs = area ÷ 1,000 × rate (editable per grass type: new lawn vs overseeding table).

**Fencing & Decking**
26. **Fence Calculator:** posts = ceil(length ÷ post spacing) + 1 (+ gate and corner posts). Rails = sections × rails per section. Pickets = ceil(length_in ÷ (picket width + gap)). Concrete bags per post hole (hole volume − post volume).
27. **Deck Calculator:** deck boards = rows (deck width ÷ (board width 5.5" + gap ⅛–3/16")) × boards per row (by length options 12/16/20 ft). Joists at 16" OC (editable 12/16/24). Screws/hidden fasteners per sq ft (editable).

**Drywall & General**
28. **Drywall Calculator:** wall + ceiling area − openings ÷ sheet size (4×8 = 32 sq ft, 4×12 = 48 sq ft), +10% waste. Joint compound, tape and screws using editable rule-of-thumb defaults with a cited manufacturer source.
29. **Stair Calculator:** number of risers = ceil(total rise ÷ 7.75"). Riser height = total rise ÷ risers. Treads = risers − 1. Total run = treads × tread depth (min 10"). Stringer length = √(rise² + run²). Show an IRC compliance check (max riser 7¾", min tread 10"). Draw a stringer diagram.
30. **Square Footage + Cubic Yard + Board Foot Calculator** (3 tools, 3 separate pages under general-conversions). Board feet = T(in) × W(in) × L(in) ÷ 144. Shapes: rectangle, triangle, circle, L-shape, trapezoid.

**Accuracy rule:** every formula lives in `/src/lib/formulas/*.ts` as a pure function with JSDoc and ≥ 3 Vitest test cases using hand-verified values. UI code never contains math.

## 5. Calculator page template (unique content on every page)
Each `/calculators/[slug]/` page must contain, in this order:
1. **H1:** "[Material] Calculator: How Much [Material] Do I Need?" (adjusted naturally per tool).
2. A 1–2 sentence intro (what it does, who it's for).
3. **The calculator, above the fold on mobile.**
4. Results + materials list + affiliate "Shop this" buttons + "Add to project".
5. **"How to calculate [X] by hand":** step-by-step with the formula and a **worked example** using real numbers.
6. **A quick-reference table** unique to the tool (e.g. "Gallons of paint for common room sizes", "Bags of concrete per slab size", "Bundles per roof size"). Generate it from the formula function so it's always correct.
7. **Tips & common mistakes** (5–8 bullets written specifically for this material, not generic).
8. **"What it might cost"** box linking to the matching `/cost/[job]/` page and the user's state page.
9. **FAQ** (5–7 real questions people search, each answered in 40–80 words) + FAQPage schema.
10. **Related calculators** (4–6, same category + logical next steps, e.g. Paint → Primer, Drywall, Baseboard).
11. "Last reviewed: [date] · Reviewed by [AUTHOR NAME]" + a link to /methodology/.

Each page is 800–1,500 words of real, specific content. **No filler, no "In today's world…" phrasing, no keyword stuffing.**

## 6. "Cost to [job] in [state]" pages (programmatic SEO, done responsibly)
**Jobs (25):** roof replacement, interior painting, exterior house painting, concrete driveway, concrete patio, tile floor installation, hardwood floor installation, LVP flooring installation, carpet installation, drywall installation, wood fence installation, vinyl fence installation, deck building, kitchen backsplash installation, cabinet painting, gutter installation, siding replacement, attic insulation (blown-in), paver patio, retaining wall, sod installation, gravel driveway, popcorn ceiling removal, interior door installation, baseboard installation.
**States:** all 50 + DC (25 × 51 = 1,275 pages).

**Data model (`/src/data/costs/`):**
- `jobs.json`: per job: national low / typical / high cost per unit (e.g. per sq ft, per square, per linear ft), typical project size, **labor share %**, materials breakdown, cost factors, related calculator slug, `sources[]`, `verified: boolean`, `lastReviewed`.
- `states.json`: per state: **BEA Regional Price Parity** (all items index), **BLS OEWS** median hourly wage for the relevant trade SOC codes (47-2061 Construction Laborers, 47-2181 Roofers, 47-2141 Painters, 47-2031 Carpenters, 47-2051 Cement Masons, 47-2044 Tile & Stone Setters, 47-2042 Floor Layers, 47-2041 Carpet Installers, 47-2081 Drywall Installers), climate zone, notable climate/code considerations (freeze-thaw, hurricane wind codes, snow load, wildfire zones), and a link to the official state licensing board.
- **State price formula:** state cost = national cost × [labor share × (state trade wage ÷ national trade wage) + (1 − labor share) × (state RPP ÷ 100)]. Show the formula on /methodology/.
- **Do NOT invent cost numbers.** Create the data files with clearly marked placeholder values and `verified: false`. Build a script `npm run data:check` that lists unverified entries. **Pages whose job is `verified: false` must render with `<meta name="robots" content="noindex">` and be excluded from the sitemap** until I verify them.

**State page template (each must be genuinely different):**
1. H1: "How Much Does [Job] Cost in [State]? (2026 Estimate)"
2. **Answer box:** typical range for a typical project size in that state, cost per unit, and the % above or below the national average.
3. **Interactive estimator** pre-filled with the state's multiplier (user enters their size → instant range).
4. Cost breakdown table (materials vs labor, using state wages).
5. **State-specific factors** generated from data: local trade wage vs national, climate considerations, permit and licensing note with the official link.
6. Comparison table: this state vs neighbouring states vs national average (internal links to those state pages).
7. "Ways to save" (DIY portion using our calculators, best season, getting 3 quotes).
8. **Lead-gen placeholder:** "Get free quotes from local pros" component (hidden behind a feature flag until a partner is set up).
9. FAQ (3–5, data-driven) + schema. Breadcrumbs. Last reviewed + methodology link.

**Rollout:** generate all pages, but only index (a) the 25 national pages and (b) state pages for the 10 most populous states at launch. Expanding batches are controlled by a single config list `indexedStates` in `/src/config/seo.ts`.

## 7. Technical SEO (required)
- Unique `<title>` (≤ 60 chars) and meta description (≤ 155 chars) per page, generated from templates + data, all distinct.
- Canonical tags. Open Graph + Twitter cards. Auto-generated OG images per page (build-time, e.g. Satori), using the site brand + page title.
- Schema.org JSON-LD: `WebSite` (with SearchAction) on home, `Organization`, `BreadcrumbList` everywhere, `WebApplication` on calculator pages, `FAQPage` where FAQs exist, `Article` on guides and cost pages.
- XML sitemap index split by type (calculators, cost, guides, pages), with `lastmod`. Excludes noindex pages.
- `robots.txt` pointing to the sitemap. `ads.txt` with placeholder `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`.
- Strong internal linking: category hubs ↔ calculators ↔ cost pages ↔ guides. No orphan pages (add a build-time check that fails if any indexed page has 0 internal links pointing to it).
- Semantic HTML (one H1, logical H2/H3), descriptive alt text, `lang="en-US"`.
- Fast: zero JS on non-interactive parts, images in AVIF/WebP with width/height, lazy-loading below the fold, preload only critical assets.
- Custom 404 page with search + popular calculators.
- IndexNow ping script for Bing on deploy (optional flag).
- An `llms.txt` file summarizing the site for AI search engines.

## 8. Monetization (built in, switchable via config)
`/src/config/monetization.ts` controls everything, with flags: `adsEnabled`, `adNetwork` ('adsense' | 'ezoic' | 'mediavine' | 'raptive'), `affiliateEnabled`, `leadGenEnabled`.

**Ads:**
- `<AdSlot id="..." />` component with **fixed reserved height** (no CLS): positions = below calculator results, mid-content (after "How to calculate"), end of content, and a sticky sidebar on desktop only. Max 3 in-content slots on mobile. **Never above or inside the calculator.**
- AdSense script loads only after consent where legally required, and is lazy-loaded.
- Ads disabled in development and on legal pages.

**Affiliate:**
- `/src/data/products.json`: per material → product name, retailer (amazon | homedepot | lowes), URL with affiliate tag placeholder, image (optional), note.
- Results panel "Shop this" buttons use `rel="sponsored nofollow noopener"` and route through `/go/[product-id]/` redirect pages (static meta-refresh or Cloudflare redirect rules) for easy link management and click tracking.
- Amazon tag placeholder `[AMAZON-TAG]-20`. Home Depot via Impact placeholder.
- Required disclosure line near affiliate links: *"As an Amazon Associate we earn from qualifying purchases. We may earn a commission from links on this page at no cost to you."* Plus a full /affiliate-disclosure/ page (FTC compliant).

**Lead-gen (feature-flagged off at launch):** "Get 3 free quotes" component on cost pages, ready to swap in a partner widget or form later.

## 9. Trust, legal and E-E-A-T pages
- **/about/:** who runs the site, mission ("accurate, free, no-signup calculators"), an author/reviewer bio with photo placeholder.
- **/methodology/:** how every calculator and the state cost model work, data sources (BEA RPP, BLS OEWS, manufacturer coverage specs), update schedule, and how to report errors.
- **/disclaimer/:** estimates only; always confirm with a licensed professional and local building codes; not liable for purchasing decisions. A short version also appears under every calculator.
- **/privacy-policy/, /cookie-policy/, /terms/:** written for a US site that also complies with GDPR/UK GDPR and CCPA/CPRA, mentioning ads, cookies, analytics and affiliate tracking.
- **Consent:** integrate a **Google-certified CMP** (e.g. Google's own Privacy & Messaging, or a certified free tier) for EEA/UK/Switzerland visitors, with a simple banner elsewhere if needed. Google Consent Mode v2.
- **/contact/:** form (Web3Forms) + email [CONTACT EMAIL].
- Footer: all legal links, categories, popular calculators, "© 2026 [SITE NAME]".

## 10. Design and UX
- **Look:** clean, trustworthy "pro tool" feel. Primary color: confident blue (#1D4ED8-ish). Accent: safety orange (#F97316) for primary buttons and results highlights. Neutral slate greys. Generous white space. Rounded-xl cards. Subtle shadows.
- **Mobile-first:** large tap targets (≥ 44 px), numeric keyboards (`inputmode="decimal"`), sticky "Calculate" button on mobile, and results auto-scroll into view.
- **Home page:** hero with a big search box ("What are you building?") that searches all calculators instantly (client-side fuzzy search over a prebuilt JSON index), category tiles with simple icons (Lucide), "Most popular calculators", "Cost guides by state" (interactive US map or state dropdown), and a trust strip ("Free · No signup · Formulas shown · Reviewed [month year]").
- Simple SVG diagrams for calculators where it helps (room walls, roof pitch triangle, stair stringer, fence layout).
- Dark mode via `prefers-color-scheme` (optional toggle).
- WCAG 2.2 AA contrast. Focus states visible. Reduced-motion respected.

## 11. Content rules (applies to all generated text)
- Plain American English, 7th–9th grade reading level, second person ("you").
- Specific and practical: real product sizes (5-gal bucket, 80-lb bag, 4×8 sheet), real techniques, real mistakes.
- No made-up statistics, no fake reviews, no fake "expert quotes". Every cost or coverage number comes from the data files.
- Each page's FAQ and tips must be specific to that page, never copy-pasted across pages.
- Start with 5 guides: "How to Measure a Room for Flooring", "How Much Paint for a Bedroom", "Concrete Bags vs Ready-Mix: Which Is Cheaper?", "How to Read Roof Pitch", "Planning a Paver Patio Step by Step".

## 12. Project structure
```
/src
  /components   (Calculator UI, ResultsPanel, AdSlot, AffiliateButton, Breadcrumbs, FAQ, StateSelect, UnitToggle, ...)
  /layouts      (BaseLayout, CalculatorLayout, CostLayout, ArticleLayout)
  /lib/formulas (one file per calculator, pure functions + tests)
  /lib/seo      (meta, schema builders)
  /data         (calculators.json, categories.json, prices.json, products.json, costs/jobs.json, costs/states.json)
  /config       (site.ts, seo.ts, monetization.ts)
  /pages        (routes as defined in section 3, dynamic routes from data)
/scripts        (data-check.ts, orphan-check.ts, indexnow.ts)
/tests          (vitest + playwright)
/public         (favicons, ads.txt, robots.txt, llms.txt, og defaults)
README.md       (setup, how to add a calculator in 5 steps, how to verify cost data, how to deploy)
```
Adding a new calculator must only require: (1) a formula file + tests, (2) an entry in `calculators.json` with content fields, (3) optional diagram. Pages, sitemap, hubs, search index and related links update automatically.

## 13. Deployment and launch checklist (do all of these)
1. Push to GitHub repo `[REPO NAME]`; connect Cloudflare Pages (build `npm run build`, output `dist`).
2. Connect custom domain **[DOMAIN]**, force HTTPS, redirect `www` → apex (or the reverse) with 301s, and enforce trailing slashes.
3. Security headers: HSTS, X-Content-Type-Options, Referrer-Policy, a sensible CSP that allows the ad and consent scripts.
4. Verify in **Google Search Console** and **Bing Webmaster Tools** (add meta-tag placeholders in config), then submit the sitemap index.
5. Run Lighthouse on home, 3 calculators and 2 cost pages; fix anything below target.
6. Run `npm test`, `npm run data:check` and the orphan check; all must pass (unverified data → noindex is OK).
7. Manually test on a 375 px mobile viewport: each calculator, shareable links, project list, print view.
8. Confirm every legal page is linked in the footer and `ads.txt` resolves.
9. Write `LAUNCH.md` with what I must do manually: buy the domain, apply for AdSense, join Amazon Associates and Impact (Home Depot), verify cost data, replace placeholders.

## 14. Deliverables
- Live URL on [DOMAIN] (or a `*.pages.dev` URL until the domain is connected).
- GitHub repo with clean commits, README.md and LAUNCH.md.
- A final report: list of all pages, Lighthouse scores, test results, list of placeholders still needing my input.

Build it step by step. After each major step, run the build and tests, and fix errors before moving on. Ask me only if something is truly blocking; otherwise make sensible, documented decisions.

# END OF MASTER PROMPT

---
---

# PHASE PROMPTS (send one at a time after the master prompt)

**Phase 1: Foundation**
> Set up the project per sections 2, 3, 10 and 12: Astro + TypeScript + Tailwind, base layouts, header/footer, home page with search, category hubs, the config files and the monetization flags (ads off). Deploy a preview to Cloudflare Pages. Show me the preview URL.

**Phase 2: First 10 calculators**
> Build calculators 1, 5, 6, 10, 14, 17, 21, 22, 26, 28 per sections 4 and 5, including formula files with Vitest tests, full page content, diagrams where listed, shareable URLs and the project list. All tests must pass.

**Phase 3: Remaining 20 calculators**
> Build the remaining calculators from section 4 with the same quality bar. Make sure every page has a unique quick-reference table, tips and FAQ.

**Phase 4: Cost pages**
> Build the cost data model, state formula, national and state templates, the data:check script and the noindex/sitemap logic per section 6. Use placeholder data marked verified:false.

**Phase 5: SEO, legal and monetization**
> Complete sections 7, 8 and 9: schema, sitemaps, OG images, internal-link/orphan check, legal pages, consent (CMP), AdSlot components with reserved heights, affiliate buttons + /go/ redirects + disclosures, the 5 guides and llms.txt.

**Phase 6: QA and launch**
> Run the full checklist in section 13. Fix all issues, connect [DOMAIN], and give me the final report from section 14 plus LAUNCH.md.

---

# AFTER LAUNCH: what YOU do (cannot be automated)
| When | Task |
|---|---|
| Day 1 | Buy domain (~\$10–12/yr, e.g. Cloudflare Registrar or Namecheap). Verify Search Console + Bing. Submit sitemap. |
| Week 1 | Verify cost numbers for the 25 jobs (HomeGuide, Angi, Fixr, HomeAdvisor, manufacturer sites), flip `verified: true`. |
| Week 1–2 | Apply to Amazon Associates (needs 3 qualifying sales within 180 days) and Home Depot on Impact. |
| Week 2–4 | Apply to Google AdSense once you have ~20–30 solid pages and some organic visits. |
| Weekly | Add 3–5 new calculators or guides. Create 5–10 **Pinterest pins** (DIY is huge on Pinterest). Answer real questions on Reddit/Quora (r/DIY, r/HomeImprovement) without spamming links. |
| Monthly | Check Search Console: improve pages ranking in positions 8–20, expand `indexedStates` in batches of 10. |
| ~10k+ sessions/month | Apply to higher-paying ad networks (Ezoic, then Mediavine Journey / Raptive when you meet their thresholds). |
| Later | Add city-level cost pages for large metros, and turn on contractor lead-gen. |

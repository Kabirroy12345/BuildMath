# BuildMath Launch & Monetization Playbook (`LAUNCH.md`)

Repository: [https://github.com/Kabirroy12345/BuildMath](https://github.com/Kabirroy12345/BuildMath)

This guide covers the exact order of operations to launch **BuildMath** for **₹0 ($0)** today, get indexed in Google and Bing, and layer in affiliate links, display ads, and contractor lead generation as traffic grows.

---

## Phase 1: Launch for ₹0 ($0) Today (Do This First)

### Step 1: Push to GitHub
```bash
git remote add origin https://github.com/Kabirroy12345/BuildMath.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Cloudflare Pages (Free Forever, Unlimited Bandwidth)
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) (free account, no credit card required for Pages).
2. Go to **Workers & Pages → Create → Pages → Connect to Git** and select `Kabirroy12345/BuildMath`.
3. Configure the build settings:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**. In ~60 seconds, Cloudflare gives you a free live URL (e.g., `https://buildmath.pages.dev`).
5. Click through a few calculators (`/calculators/paint-calculator/`, `/calculators/concrete-slab-calculator/`) on mobile and desktop to verify everything works.

### Step 3: Activate the Contact Form (Web3Forms — Free)
1. Go to [https://web3forms.com/](https://web3forms.com/), enter your email address, and copy your free **Access Key**.
2. In Cloudflare Pages, go to **Settings → Environment variables → Production** and add:
   - `PUBLIC_WEB3FORMS_KEY` = `your-access-key-here`
   - If you are launching on `.pages.dev` before buying a `.com` domain, also set:
     `PUBLIC_SITE_URL` = `https://buildmath.pages.dev` *(this automatically updates all canonical URLs, Open Graph tags, `robots.txt`, and `sitemap-index.xml`!)*
3. Trigger a redeploy in Cloudflare Pages (**Deployments → Retry deployment**) and send a test message on `/contact/`.

### Step 4: Custom Domain (Optional on Day 1, Recommended Before AdSense)
- **Cost**: ₹0 to launch on `.pages.dev`. When ready to buy a `.com` domain, **Cloudflare Registrar** sells `.com` domains at wholesale cost (~$10.46–$11.17/year, or **~₹900–₹1,000/year**, with zero markup on renewal).
- Check if `buildmath.com` is available; if taken, pick a clean brandable `.com` (e.g., `buildmathpro.com`, `diybuildmath.com`, `yardandslab.com`) and update `PUBLIC_SITE_URL` (or `src/config/site.ts`).

### Step 5: Verify in Google Search Console & Bing Webmaster Tools (Free)
1. Open [Google Search Console](https://search.google.com/search-console) and add your site URL.
2. Submit `/sitemap-index.xml` under **Sitemaps**.
3. Open [Bing Webmaster Tools](https://www.bing.com/webmasters) and click **Import from Google Search Console** (takes 30 seconds).

---

## Phase 2: Affiliate Links — Your Primary Earner

People using a materials calculator have **high purchase intent** ("You need 56 bags of 80-lb concrete" or "You need 2 gallons of paint").
- **Where the buttons sit**: Every calculator now displays:
  1. A prominent **primary yellow CTA button** (`Buy 56 bags at Home Depot ↗`) directly inside the main result box right below the calculated number.
  2. An itemized **Materials & Tools Shopping List** below, where **bulk materials** (concrete, drywall, lumber, shingles, mulch) route to **Home Depot (via Impact)** and **tools/supplies** (roller kits, trowels, tape, levels, fasteners) route to **Amazon Associates**.
  3. All links route through `/go/[id]/` with `rel="sponsored nofollow noopener"`, so updating `src/data/products.json` updates every calculator across the entire site.

### Crucial Timing Rule for Amazon Associates (The 180-Day Rule)
- **Do NOT sign up for Amazon Associates on Day 1** while traffic is zero. Amazon requires **3 qualifying sales within your first 180 days** (personal orders do not count), or they close the application.
- Wait until Google Search Console shows steady organic clicks to your calculators, then apply at [affiliate-program.amazon.com](https://affiliate-program.amazon.com/).
- **India → US Setup Note**: When signing up from India for the US Amazon Associates program (`amazon.com`) and Impact.com (Home Depot), select **Form W-8BEN** (non-US person/entity tax form using your PAN) and connect **Payoneer** (which gives you a free US virtual routing/account number for USD ACH deposits to your Indian bank account).

---

## Phase 3: Display Ads — Your Second Layer

1. **Google AdSense (After 2–4 Weeks of Indexing)**:
   - Once your 57 initial pages + 33 Batch-1 cost pages are indexed and getting steady impressions, apply for AdSense.
   - Add your issued Publisher ID (`google.com, pub-..., DIRECT, f08c47fec0942fa0`) to `public/ads.txt` and `adsensePublisherId` in `src/config/monetization.ts`, then flip `adsEnabled: true` in `src/config/monetization.ts` and enable Google's built-in certified CMP in AdSense Privacy & Messaging for EEA/UK traffic.
   - All ad slots (`<AdSlot />`) reserve fixed minimum heights (`250px` / `90px`) and never sit above the calculator, keeping CLS at `0.00`.
2. **Mediavine Journey (At 1,000 Monthly Sessions)**:
   - Apply for **Journey by Mediavine** once you reach ~1,000 monthly sessions for significantly higher RPMs than AdSense.
3. **Raptive (At 25,000 Monthly Pageviews)**:
   - Upgrade to **Raptive** once you hit 25,000 monthly pageviews (requires 50%+ traffic from US/UK/CA/NZ, which your US-focused calculators and state guides naturally target).
   - *Note*: Skip Ezoic (minimum raised to 250,000 monthly users).

---

## Phase 4: Unlocking State Cost Pages & Lead-Gen

- All 25 jobs in `src/data/costs/jobs.json` start with `"verified": false` (rendering `<meta name="robots" content="noindex, follow">`) so Google never penalizes the site for unreviewed programmatic pages.
- As you verify each job's national cost range, set `"verified": true` in `src/data/costs/jobs.json`. That automatically unlocks the national guide plus the first batch of 10 most populous states (`indexedStates` in `src/config/seo.ts`).
- Once your state cost guides (`"Cost of Roof Replacement in Texas"`) have organic traffic, flip `leadGenEnabled: true` in `src/config/monetization.ts` and connect a contractor lead-gen partner (Networx, Thumbtack, Billy.com, or Angi).

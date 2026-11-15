# BuildMath Post-Launch Checklist (`LAUNCH.md`)

Follow these manual post-launch steps to connect your custom domain, analytics, contact form, affiliate accounts, and Google AdSense.

---

## 1. Custom Domain & Hosting (Cloudflare Pages Recommended)
1. Push this repository to GitHub.
2. In the **Cloudflare Dashboard**, go to **Workers & Pages → Create Application → Pages → Connect to Git**.
3. Select this repository and configure:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Attach your custom domain (e.g., `buildmath.com`) under **Custom Domains**. Cloudflare Pages automatically reads `public/_headers` and `public/_redirects`.
5. Update `src/config/site.ts` if you change the brand name, domain, or contact email.

---

## 2. Contact Form (Web3Forms)
1. Visit [https://web3forms.com/](https://web3forms.com/) and enter your site email (e.g., `hello@buildmath.com`) to receive a free Access Key.
2. Open `src/config/site.ts` and replace `web3FormsAccessKey` (`YOUR_WEB3FORMS_ACCESS_KEY`) with your live key, or set `PUBLIC_WEB3FORMS_KEY` in your Cloudflare Pages environment variables.

---

## 3. Google Search Console & Bing Webmaster Tools
1. Verify domain ownership in **Google Search Console** (`https://search.google.com/search-console`) via DNS TXT record.
2. Submit `https://buildmath.com/sitemap-index.xml` under **Sitemaps**.
3. Import your Google Search Console property into **Bing Webmaster Tools** (`https://www.bing.com/webmasters`).
4. Optional: Generate an IndexNow API key in Bing Webmaster Tools, place it in `src/config/seo.ts` (`indexNowKey`), and set `indexNowEnabled: true`.

---

## 4. Affiliate Programs (Amazon Associates & Home Depot Impact)
1. **Amazon Associates**: Sign up at [https://affiliate-program.amazon.com/](https://affiliate-program.amazon.com/). Once approved, open `src/config/monetization.ts` and replace `amazonAssociateTag: 'buildmath-20'` with your official store tag.
2. **Home Depot / Lowe's (via Impact.com)**: Apply to the Home Depot Affiliate Program on Impact. Replace the direct product URLs in `src/data/products.json` with your Impact tracking links. Because all calculator buttons route through `/go/[id]/`, updating `src/data/products.json` updates every calculator site-wide.

---

## 5. Google AdSense Application & Activation
1. Wait until the site has been live and indexed in Google Search Console with steady organic impressions (typically 2–4 weeks).
2. Apply for **Google AdSense** at [https://www.google.com/adsense/start/](https://www.google.com/adsense/start/).
3. Replace `pub-XXXXXXXXXXXXXXXX` in `public/ads.txt` and `src/config/monetization.ts` with your real AdSense Publisher ID.
4. Once approved, set `adsEnabled: true` in `src/config/monetization.ts`. All `<AdSlot />` components have pre-reserved minimum heights (`250px` / `90px`) so turning ads on will not cause Cumulative Layout Shift (CLS).

---

## 6. Unlocking Cost Guides in Batches
1. Review each job in `src/data/costs/jobs.json` and each state in `src/data/costs/states.json`.
2. Flip `"verified": true` on verified jobs in `src/data/costs/jobs.json`.
3. Expand `indexedStates` in `src/config/seo.ts` from the initial 10 states to all 51 states/DC in batches as Google indexes each wave.

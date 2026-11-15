import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, posix } from 'node:path';

const DIST_DIR = 'dist';

if (!existsSync(DIST_DIR)) {
  console.error('Error: dist/ directory not found. Run "npm run build" before "npm run orphan:check".');
  process.exit(1);
}

function getAllHtmlFiles(dir: string, fileList: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      getAllHtmlFiles(fullPath, fileList);
    } else if (entry.endsWith('.html')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function fileToRoute(filePath: string): string {
  const rel = relative(DIST_DIR, filePath).split('\\').join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) {
    return '/' + rel.slice(0, -'index.html'.length);
  }
  return '/' + rel;
}

const htmlFiles = getAllHtmlFiles(DIST_DIR);
const allRoutes = new Set<string>();
const indexedRoutes = new Set<string>();
const incomingLinks = new Map<string, Set<string>>();
const brokenLinks: { from: string; to: string }[] = [];

for (const file of htmlFiles) {
  const route = fileToRoute(file);
  allRoutes.add(route);
  incomingLinks.set(route, new Set());
}

const hrefRegex = /href=["'](\/[^"'#?]*)["']/g;

for (const file of htmlFiles) {
  const route = fileToRoute(file);
  const html = readFileSync(file, 'utf-8');

  const isNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  if (!isNoindex && route !== '/404.html') {
    indexedRoutes.add(route);
  }

  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html)) !== null) {
    const rawTarget = match[1];
    // Skip static assets (svg, xml, css, js, ico, etc.)
    if (/\.[a-zA-Z0-9]+$/.test(rawTarget) && !rawTarget.endsWith('.html')) {
      continue;
    }
    const target = rawTarget.endsWith('/') || rawTarget.endsWith('.html') ? rawTarget : `${rawTarget}/`;
    if (allRoutes.has(target)) {
      incomingLinks.get(target)!.add(route);
    } else {
      brokenLinks.push({ from: route, to: rawTarget });
    }
  }
}

const orphanPages: string[] = [];
for (const route of indexedRoutes) {
  if (route === '/') continue;
  const inCount = incomingLinks.get(route)?.size || 0;
  if (inCount === 0) {
    orphanPages.push(route);
  }
}

console.log('=== BuildMath Static HTML Link & Orphan Audit ===');
console.log(`Total static HTML pages generated: ${allRoutes.size}`);
console.log(`Total indexed HTML pages: ${indexedRoutes.size}`);
console.log(`Total noindex safeguarded pages: ${allRoutes.size - indexedRoutes.size}`);

if (brokenLinks.length > 0) {
  console.error(`\n[ERROR] Found ${brokenLinks.length} broken internal link(s):`);
  for (const b of brokenLinks.slice(0, 15)) {
    console.error(`  ${b.from} -> ${b.to}`);
  }
  process.exit(1);
}

if (orphanPages.length > 0) {
  console.error(`\n[ERROR] Found ${orphanPages.length} indexed orphan page(s) with 0 incoming links:`);
  for (const o of orphanPages) {
    console.error(`  ${o}`);
  }
  process.exit(1);
}

console.log('\n✓ 0 broken internal links and 0 orphan indexed pages!');

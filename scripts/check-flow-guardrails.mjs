import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const appDir = path.join(root, 'src/app');
const srcDir = path.join(root, 'src');

const failures = [];

function fail(message) {
  failures.push(message);
}

async function walk(dir, predicate = () => true) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath, predicate));
    } else if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function toRoutePath(pageFile) {
  const relative = path.relative(appDir, pageFile);
  const segments = relative.split(path.sep).slice(0, -1);
  const routeSegments = segments.filter((segment) => !segment.startsWith('('));
  return `/${routeSegments.join('/')}`.replace(/\/$/, '') || '/';
}

function routeMatchesPath(route, pathname) {
  if (route === pathname) return true;

  const routeSegments = route.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);

  if (routeSegments.length !== pathSegments.length) return false;

  return routeSegments.every((segment, index) => {
    return segment.startsWith('[') && segment.endsWith(']') ? true : segment === pathSegments[index];
  });
}

function normalizeInternalPath(href) {
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  if (href.includes('$')) return null;
  if (href.startsWith('/api/')) return null;
  return href.split(/[?#]/)[0] || '/';
}

function extractLiteralNavigations(source) {
  const patterns = [
    /href\s*=\s*["']([^"']+)["']/g,
    /href\s*=\s*\{\s*["']([^"']+)["']\s*\}/g,
    /router\.(?:push|replace)\(\s*["']([^"']+)["']\s*\)/g,
    /window\.location\.href\s*=\s*["']([^"']+)["']/g,
    /redirect\(\s*["']([^"']+)["']\s*\)/g,
  ];

  return patterns.flatMap((pattern) => {
    const matches = [];
    let match;
    while ((match = pattern.exec(source)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  });
}

async function assertStaticLinksResolve() {
  const pageFiles = await walk(appDir, (file) => file.endsWith('page.tsx'));
  const routes = pageFiles.map(toRoutePath);
  const sourceFiles = await walk(srcDir, (file) => /\.(ts|tsx)$/.test(file));

  for (const file of sourceFiles) {
    const source = await readFile(file, 'utf8');
    for (const href of extractLiteralNavigations(source)) {
      const pathname = normalizeInternalPath(href);
      if (!pathname) continue;

      const exists = routes.some((route) => routeMatchesPath(route, pathname));
      const authCallback = pathname === '/auth/callback';

      if (!exists && !authCallback) {
        fail(`${path.relative(root, file)} points to missing route "${href}".`);
      }
    }
  }
}

async function assertLandingCtasAreExplicit() {
  const landingFile = path.join(appDir, 'page.tsx');
  const source = await readFile(landingFile, 'utf8');

  if (/href\s*=\s*["']\/signup["']/.test(source) || /href\s*=\s*\{\s*["']\/signup["']\s*\}/.test(source)) {
    fail('src/app/page.tsx contains a bare /signup href. Use withRedirectTo() so the destination is explicit.');
  }

  if (source.includes('Unlock your study map')) {
    fail('src/app/page.tsx still contains stale "Unlock your study map" CTA copy.');
  }

  if (!source.includes('href="#concept-tree"')) {
    fail('src/app/page.tsx must keep the Concept Tree preview on-page with href="#concept-tree".');
  }
}

async function assertMiddlewareProtectsImplementedPrivateRoutes() {
  const middlewareFile = path.join(root, 'src/middleware.ts');
  const routesFile = path.join(root, 'src/lib/routes.ts');
  const source = await readFile(middlewareFile, 'utf8');
  const routesSource = await readFile(routesFile, 'utf8');
  const protectedPrefixes = ['/dashboard', '/onboarding', '/courses', '/pricing', '/settings'];

  if (!source.includes('PROTECTED_ROUTE_PREFIXES')) {
    fail('src/middleware.ts must use PROTECTED_ROUTE_PREFIXES from src/lib/routes.ts.');
  }

  for (const prefix of protectedPrefixes) {
    if (!routesSource.includes(`'${prefix}'`) && !routesSource.includes(`${prefix.slice(1)}:`)) {
      fail(`src/lib/routes.ts does not include protected route prefix ${prefix}.`);
    }
  }

  if (!source.includes("searchParams.set('next'")) {
    fail('src/middleware.ts must preserve the attempted protected route in login?next=...');
  }
}

async function assertDashboardNavHasNoDeadRoutes() {
  const layoutFile = path.join(appDir, '(dashboard)/layout.tsx');
  const source = await readFile(layoutFile, 'utf8');

  for (const deadRoute of ['/courses', '/planner']) {
    if (source.includes(`href="${deadRoute}"`) || source.includes(`href={'${deadRoute}'}`)) {
      fail(`Dashboard layout links to ${deadRoute}, which is not an implemented index route.`);
    }
  }
}

async function assertDocsExist() {
  const docsFiles = [
    'docs/PROJECT_MAP.md',
    'docs/RELEASE_CHECKLIST.md',
  ];

  for (const docsFile of docsFiles) {
    try {
      await stat(path.join(root, docsFile));
    } catch {
      fail(`${docsFile} is missing. Keep flow ownership and release practice documented.`);
    }
  }
}

async function assertVerificationScriptsExist() {
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  if (!packageJson.scripts?.guardrails || !packageJson.scripts?.verify || !packageJson.scripts?.['test:e2e']) {
    fail('package.json must keep guardrails, test:e2e, and verify scripts.');
  }

  try {
    await stat(path.join(root, '.github/workflows/verify.yml'));
  } catch {
    fail('.github/workflows/verify.yml is missing. CI must run npm run verify.');
  }

  try {
    await stat(path.join(root, 'playwright.config.ts'));
  } catch {
    fail('playwright.config.ts is missing. Browser flow tests must stay wired.');
  }
}

await assertStaticLinksResolve();
await assertLandingCtasAreExplicit();
await assertMiddlewareProtectsImplementedPrivateRoutes();
await assertDashboardNavHasNoDeadRoutes();
await assertDocsExist();
await assertVerificationScriptsExist();

if (failures.length > 0) {
  console.error('Flow guardrails failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Flow guardrails passed.');

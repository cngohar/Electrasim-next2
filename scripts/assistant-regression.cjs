const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:4173';
const routes = [
  ['/assistant', 'Electrical calculations with the reasoning left visible.', 'Electrical Engineering Calculators & Assistant'],
  ['/assistant/cable-size', 'Cable Size Calculator', 'Cable Size Calculator'],
  ['/assistant/voltage-drop', 'Voltage Drop Calculator', 'Voltage Drop & Wire Gauge Calculator'],
  ['/assistant/load-calculator', 'Electrical Load Calculator', 'Electrical Load & Breaker Calculator'],
  ['/assistant/ohms-law', "Ohm's Law & AC Power Calculator", "Ohm's Law, Impedance"],
  ['/assistant/circuit-protection', 'MCB, RCBO & RCD Selection Assistant', 'MCB, RCBO & RCD Selection Assistant'],
  ['/assistant/three-phase', 'Three-Phase Power Calculator', 'Three-Phase Star & Delta Power Calculator'],
  ['/assistant/energy-cost', 'Energy Cost Calculator', 'Electricity Energy Cost & Carbon Calculator'],
  ['/assistant/unit-converter', 'Electrical Unit Converter', 'Electrical Power Unit Converter'],
];

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--use-angle=swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('WebGL')) consoleErrors.push(message.text());
  });

  const hubAssets = [];
  const onResponse = response => { if (response.url().includes('/assets/')) hubAssets.push(response.url()); };
  page.on('response', onResponse);
  await page.goto(`${origin}/assistant`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: routes[0][1] }).waitFor();
  assert.equal(await page.locator('a[href^="/assistant/"]').evaluateAll(nodes => new Set(nodes.map(node => node.getAttribute('href'))).size), 8, 'Hub must expose eight canonical tool links');
  assert(!hubAssets.some(url => /useEngineeringViewport/i.test(url)), 'Hub must not download the shared Three.js viewport chunk');
  page.off('response', onResponse);

  // The new three-phase field model is nested-lazy: the fast SVG is the default,
  // and WebGL is fetched only after the user explicitly opens the rotating field.
  const visualContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const visualPage = await visualContext.newPage();
  const visualAssets = [];
  const visualErrors = [];
  visualPage.on('response', response => { if (response.url().includes('/assets/')) visualAssets.push(response.url()); });
  visualPage.on('pageerror', error => visualErrors.push(error.message));
  await visualPage.goto(`${origin}/assistant/three-phase`, { waitUntil: 'networkidle' });
  assert(!visualAssets.some(url => /useEngineeringViewport/i.test(url)), 'Default three-phase phasor must remain WebGL-free');
  await visualPage.getByRole('button', { name: 'Rotating field 3D' }).click();
  await visualPage.locator('canvas[data-engineering-viewport="true"]').waitFor({ timeout: 30000 });
  await visualPage.getByRole('button', { name: 'Star network' }).click();
  await visualPage.getByRole('button', { name: 'Delta', exact: true }).click();
  await visualPage.getByRole('button', { name: 'Delta network' }).waitFor();
  await visualPage.waitForFunction(() => document.querySelector('canvas[data-engineering-viewport="true"]')?.getAttribute('aria-label')?.includes('delta'));
  assert.equal(await visualPage.locator('canvas[data-engineering-viewport="true"]').count(), 1, 'Input changes must preserve one WebGL canvas');
  assert(visualAssets.some(url => /ThreePhase3DVisualizer/i.test(url)), '3D visualizer chunk must load on demand');
  assert(visualAssets.some(url => /useEngineeringViewport/i.test(url)), 'Shared Three.js viewport must load on demand');
  assert.deepEqual(visualErrors, [], `Three-phase 3D page errors: ${visualErrors.join(' | ')}`);
  await visualContext.close();

  for (const [path, heading, title] of routes) {
    await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: heading }).first().waitFor({ timeout: 30000 });
    await page.waitForFunction(expected => document.title.includes(expected), title);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    assert.equal(canonical, `https://electrasim.com${path === '/assistant' ? '/assistant' : path}`, `${path} canonical mismatch`);
    assert((await page.locator('meta[name="description"]').getAttribute('content') || '').length > 80, `${path} needs a useful description`);
    assert.equal(await page.locator('script#electrasim-page-schema').count(), 1, `${path} needs one JSON-LD node`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow <= 1, `${path} desktop overflow: ${overflow}px`);
  }

  // Exercise each always-relevant 3D workspace and its disposable model rebuild.
  for (const [path, mode] of [['/assistant/cable-size', 'Thermal'], ['/assistant/voltage-drop', 'Route flow'], ['/assistant/ohms-law', 'Resistor']]) {
    await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' });
    await page.locator('canvas[data-engineering-viewport="true"]').waitFor({ timeout: 30000 });
    await page.getByRole('button', { name: mode, exact: true }).click();
    assert.equal(await page.locator('canvas[data-engineering-viewport="true"]').count(), 1, `${path} must preserve a single WebGL canvas`);
  }

  // Functional calculation and history checks.
  await page.goto(`${origin}/assistant/load-calculator`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Coffee shop' }).click();
  await page.getByText('19500 W', { exact: true }).waitFor();
  const designCurrent = await page.getByText(/Design current/).locator('..').textContent();
  assert(/\d+\.\d+ A/.test(designCurrent || ''), 'Load calculator must render a finite design current');
  await page.getByRole('button', { name: 'Save Log' }).click();
  await page.getByRole('button', { name: /History/ }).first().click();
  await page.getByText('Electrical Load Calculator').last().waitFor();
  await page.keyboard.press('Escape').catch(() => {});

  await page.goto(`${origin}/assistant/ohms-law`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'AC motor equivalent' }).click();
  await page.getByText('230.00 V', { exact: true }).waitFor();
  assert(await page.getByText('Consistent solution', { exact: true }).count() > 0, 'Ohm calculator must report a valid solution');

  // Compatibility aliases must resolve to canonical routes.
  await page.goto(`${origin}/assistant/wire`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/assistant/voltage-drop');
  await page.getByRole('heading', { name: 'Voltage Drop Calculator' }).waitFor();
  await page.goto(`${origin}/electrical-assistant`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/assistant');

  // Responsive coverage for every independently routed workspace.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, heading] of routes) {
    await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: heading }).first().waitFor({ timeout: 30000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow <= 1, `${path} mobile overflow: ${overflow}px`);
  }

  const robots = await (await context.request.get(`${origin}/robots.txt`)).text();
  const sitemap = await (await context.request.get(`${origin}/sitemap.xml`)).text();
  assert(robots.includes('Sitemap: https://electrasim.com/sitemap.xml'));
  for (const [path] of routes) assert(sitemap.includes(`<loc>https://electrasim.com${path}</loc>`), `Sitemap missing ${path}`);

  assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join(' | ')}`);
  assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join(' | ')}`);
  console.log(JSON.stringify({
    status: 'passed',
    canonicalRoutes: routes.length,
    desktopRoutes: routes.length,
    mobileRoutes: routes.length,
    pageErrors: 0,
    consoleErrors: 0,
    hubViewportChunkLoaded: false,
    threePhaseDefaultViewportChunkLoaded: false,
    threePhase3DChunkLoadedOnDemand: true,
    visualizerInteractions: 4,
  }, null, 2));
  await browser.close();
})().catch(async error => {
  console.error(error.stack || error);
  process.exit(1);
});

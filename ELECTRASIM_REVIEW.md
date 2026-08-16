# ElectraSim Next2 — Root Website and Assistant Review

**Reviewed:** 15 August 2026
**Repository baseline:** `cngohar/Electrasim-next2`, commit `3a30b44`
**Enhanced working copy:** `/home/user/Electrasim-next2`

## Scope guard

This review and implementation cover only the **root ElectraSim website and its engineering assistant**. The separate application at `electrasim.com/app/` is intentionally disconnected, out of scope, and unchanged.

The rest of the root website was used chiefly as the visual and interaction reference for the assistant. The work order was:

1. decompose the assistant;
2. establish dedicated routes, discovery metadata, and lazy loading;
3. validate the new architecture;
4. enhance 3D only where it adds engineering value.

That sequence is complete.

## Executive verdict

The original clone was not integration-ready. Its assistant was a 6,003-line routed component that switched tools in one client-side workspace. That structure prevented useful tool-specific URLs, made isolated delivery and testing difficult, and tied multiple unrelated states together. Its original 3D code also recreated or accumulated rendering resources during ordinary updates.

The enhanced root website is now a **credible staging candidate**:

- `/assistant` is a real hub rather than a monolithic calculator switcher;
- all eight supported tools have canonical, independently lazy-loaded pages;
- metadata, JSON-LD, sitemap and robots discovery cover the canonical routes;
- history restoration, preferences and standards selection survive cross-route navigation;
- Cable Size, Voltage Drop, Ohm’s Law and Three Phase have specialized engineering visualizers;
- the three-phase WebGL implementation is nested-lazy behind its lightweight SVG phasor view;
- a committed Playwright regression checks desktop/mobile routes, SEO, calculations, history, redirects, overflow, lazy loading and visualizer interactions;
- typecheck, production build, whitespace validation and the final browser regression pass.

The implementation should still be treated as an educational engineering aid until a qualified reviewer validates the named IEC/NEC assumptions and calculation vectors. It should not be marketed as code-compliant installation design software without that sign-off.

**Recommendation: AMBER-GREEN — stage the root assistant, complete independent engineering and real-device review, then promote it. Leave `/app/` on its existing ownership and deployment path.**

## Quality assessment

| Area | Original clone | Enhanced working copy | Assessment |
|---|---:|---:|---|
| Assistant information architecture | 3.5/10 | 8.5/10 | Hub plus eight direct tool pages replaces the routed monolith. |
| Search/discovery readiness | 3/10 | 8.5/10 | Canonicals, route metadata, JSON-LD, sitemap and robots are present. |
| Loading architecture | 4/10 | 8/10 | Hub and every tool are route chunks; three-phase 3D is nested-lazy. |
| Assistant usability | 5/10 | 8.5/10 | Shared shell, presets, result states, guidance, history and mobile flow are coherent. |
| 3D runtime reliability | 3/10 | 8.5/10 | Persistent renderer lifecycle and explicit resource disposal address the observed context-growth defect. |
| Engineering-model consistency | 4.5/10 | 7.5/10 | Shared typed calculations and explicit diagnostic states improve consistency; independent domain review remains required. |
| Maintainability | 4/10 | 8/10 | Routed pages, shared modules and tool-local folders replace active reliance on the legacy file. |
| Automated regression protection | 1/10 | 7.5/10 | A portable Playwright script now covers the integrated assistant; calculator unit-vector coverage remains a next step. |
| Production readiness | 4/10 | 7.5/10 | Staging-ready, with standards, cross-browser/device and deployment checks outstanding. |

These scores are engineering judgments, not certification results.

## Architecture delivered

### Active assistant structure

The active assistant implementation is under:

```text
src/pages/assistant/
├── AssistantHub.tsx
├── calculations/electricalCalculations.ts
├── components/AssistantShell.tsx
├── components/ToolUi.tsx
├── toolCatalog.ts
├── useAssistantRuntime.ts
├── usePageSeo.ts
└── tools/
    ├── cable-size/CableSizePage.tsx
    ├── circuit-protection/CircuitProtectionPage.tsx
    ├── energy-cost/EnergyCostPage.tsx
    ├── load-calculator/LoadCalculatorPage.tsx
    ├── ohms-law/OhmsLawPage.tsx
    ├── three-phase/ThreePhasePage.tsx
    ├── unit-converter/UnitConverterPage.tsx
    └── voltage-drop/VoltageDropPage.tsx
```

The previous `src/pages/ElectricalAssistant.tsx` remains only as legacy source reference. `App.tsx` no longer imports or routes it.

### Route contract

| Route | Purpose |
|---|---|
| `/assistant` | Assistant hub and visible collection of all calculators |
| `/assistant/cable-size` | IEC/NEC cable sizing and derating |
| `/assistant/voltage-drop` | Voltage-drop and conductor check |
| `/assistant/load-calculator` | Editable load schedule and breaker estimate |
| `/assistant/ohms-law` | DC/AC equivalent Ohm and power calculations |
| `/assistant/circuit-protection` | MCB, RCBO and RCD selection aid |
| `/assistant/three-phase` | Star/delta phase and power calculations |
| `/assistant/energy-cost` | Energy, tariff, demand and carbon estimate |
| `/assistant/unit-converter` | Electrical unit conversion and power relationships |

Compatibility aliases redirect to canonical pages, including `/electrical-assistant` to `/assistant` and the old wire route to `/assistant/voltage-drop`.

### Shared runtime

`useAssistantRuntime.ts` centralizes:

- IEC/NEC selection;
- light/dark theme preference;
- calculation-history persistence;
- pending-history restoration when a saved item opens its owning route;
- shell state shared across calculator pages.

`AssistantShell.tsx` provides responsive navigation, page identity, settings, history, guidance and footer behavior. `ToolUi.tsx` contains reusable form, result, status and layout primitives.

## SEO and discovery

The assistant now has route-specific browser and crawler signals rather than one generic assistant document:

- route-specific titles and descriptions;
- canonical links;
- Open Graph and Twitter metadata;
- per-page structured data;
- CollectionPage and ItemList JSON-LD on the hub;
- visible anchor links to every tool;
- `public/sitemap.xml` entries for the root website, blog, hub and eight tool routes;
- `public/robots.txt` advertising `https://electrasim.com/sitemap.xml`;
- useful static fallback metadata in `index.html`;
- a zoom-accessible viewport declaration.

Metadata is client-managed because this is a Vite single-page application. Search-critical deployments should still verify that the production host serves SPA fallbacks correctly. Prerendering or SSR would be a future improvement if crawler telemetry shows incomplete JavaScript indexing.

## Loading and performance design

`App.tsx` uses independent `React.lazy` imports for the hub and each tool. Consequently:

- visiting the root site does not download the assistant tools;
- visiting `/assistant` does not download any calculator page or Three.js;
- opening one calculator does not download all other calculator interfaces;
- history restoration navigates to the correct lazy route rather than reactivating a hidden tool inside one component.

The three-phase page adds another boundary:

1. its default **Phasor diagram** is lightweight SVG;
2. `ThreePhase3DVisualizer.tsx` is imported only after the user selects **Rotating field 3D**;
3. the shared Three.js viewport chunk therefore remains absent from the initial three-phase request.

Latest production-build evidence:

| Chunk | Minified size |
|---|---:|
| Assistant hub | 6.34 kB |
| Three-phase page | 9.52 kB |
| Nested three-phase visualizer | 9.92 kB |
| Shared calculation engine | 29.96 kB |
| Main index | 494.56 kB |
| Shared engineering viewport / Three.js | 548.27 kB |

The Three.js chunk remains large, but it is now paid only by users who open a relevant 3D experience. The build still emits the existing tooltip sourcemap warning and a nonfatal large-chunk warning.

## 3D engineering workspaces

### Shared renderer lifecycle

`src/components/three/useEngineeringViewport.ts` provides one persistent renderer per mounted visualizer and handles:

- scene and resource disposal;
- `ResizeObserver` sizing;
- orbit and camera-preset controls;
- reduced-motion preferences;
- document visibility changes;
- WebGL context loss and restoration;
- interaction-aware rendering;
- synchronized live canvas accessibility labels;
- cleanup without retaining old geometries, materials or listeners.

Live engineering prop changes rebuild the relevant model inside the existing scene and canvas rather than recreating the renderer.

### Cable Size

`Cable3DVisualizer.tsx` provides:

- cutaway conductor construction;
- conduit/installation presentation;
- thermal/current cues;
- live conductor, current, voltage-drop and temperature telemetry;
- model and camera controls.

### Voltage Drop

`Wire3DVisualizer.tsx` provides:

- conductor cross-section;
- route-flow visualization;
- thermal voltage-drop view;
- live load, length, loss and drop telemetry.

### Ohm’s Law

`Ohms3DVisualizer.tsx` provides:

- circuit and resistor models;
- voltage/current direction cues;
- electric-field presentation;
- live power, impedance and phase telemetry.

### Three Phase

`ThreePhase3DVisualizer.tsx` provides:

- machine, star/delta network and rotating-field modes;
- 120-degree animated phase vectors and resultant field;
- topology that responds to star/delta changes;
- live voltage, current, real power, phase angle, imbalance and neutral-current values;
- camera presets, orbit/display controls, pause/reset behavior and reduced-motion handling.

The page retains an explicit **Phasor diagram / Rotating field 3D** choice. This avoids imposing WebGL on users who need only the calculator or SVG phase relationships.

Protection, load scheduling, energy cost and unit conversion remain 2D. Adding decorative 3D to those pages would increase payload and cognitive load without clarifying their engineering models.

## Calculation and workflow improvements

`electricalCalculations.ts` supplies typed calculation engines for all eight tools and normalizes the existing IEC/NEC conductor data.

Important behaviors include:

- explicit cable/wire candidate evaluation rather than silent fallback;
- derating and voltage-drop constraints;
- no-table-solution and no-safe-breaker diagnostic states;
- consistent AC-equivalent resistance, impedance, reactance, power factor and power relationships;
- editable load schedules with residential/commercial presets;
- diversity/demand estimates and phase-allocation guidance;
- circuit-protection selection assistance;
- star/delta phase relationships and power-factor correction estimates;
- tariff, demand-charge, energy and carbon estimates;
- categorized electrical conversions and power relationships.

Result actions support specification copying, JSON download and saving to local calculation history. Safety copy identifies the outputs as educational estimates and asks users to verify conductor, protection and installation decisions against the applicable code edition and a qualified designer.

## Validation evidence

### Static and build validation

| Check | Final result |
|---|---|
| All-workspace TypeScript typecheck | **Pass** |
| Vite production build | **Pass** — 2,212 modules transformed |
| `git diff --check` | **Pass** |
| Production dependency audit (`npm audit --omit=dev`) | **Pass — 0 known production vulnerabilities** |

The repository currently reports development-tool vulnerabilities and Node engine warnings in unrelated workspace tooling. These do not appear in the production-only audit, but the supported Node/package-manager contract should still be resolved before CI is declared authoritative.

### Committed browser regression

`scripts/assistant-regression.cjs` is registered as:

```bash
npm run test:assistant
```

It uses the `TEST_ORIGIN` environment variable or defaults to `http://127.0.0.1:4173`, so it can run against a local production preview or a staging deployment.

Final Chromium result:

```json
{
  "status": "passed",
  "canonicalRoutes": 9,
  "desktopRoutes": 9,
  "mobileRoutes": 9,
  "pageErrors": 0,
  "consoleErrors": 0,
  "hubViewportChunkLoaded": false,
  "threePhaseDefaultViewportChunkLoaded": false,
  "threePhase3DChunkLoadedOnDemand": true,
  "visualizerInteractions": 4
}
```

Coverage includes:

- all nine canonical assistant URLs at desktop and mobile widths;
- unique titles, descriptions and canonical URLs;
- hub links and CollectionPage/ItemList structured data;
- absence of horizontal overflow;
- calculation scenarios for Load Calculator and Ohm’s Law;
- calculation-history save and cross-route restoration;
- compatibility redirects;
- sitemap and robots discovery;
- no captured application page errors or console errors;
- no Three.js viewport chunk on the hub;
- no Three.js viewport chunk in the default three-phase phasor state;
- on-demand three-phase visualizer and viewport chunk loading;
- one persistent three-phase canvas through a live star/delta update;
- live canvas ARIA-label update to the delta state;
- Cable, Voltage Drop and Ohm visualizer mode interactions while retaining one canvas.

Expected headless Chromium software-WebGL deprecation and GPU readback warnings are excluded from application-error classification.

### Visual inspection

Representative artifacts include:

- `screenshots/assistant-cable-enhanced.png`
- `screenshots/assistant-mobile-enhanced.png`
- `screenshots/assistant-mobile-canvas.png`
- `screenshots/three-phase-3d-desktop.png`
- `screenshots/three-phase-3d-mobile.png`

The final 390 × 844 mobile three-phase capture has no document-width overflow and shows the calculator, fixed mobile navigation, 3D viewport, result cards, disclaimer and export/history actions in a natural vertical flow.

## Remaining production gates

### P0 — before standards or compliance claims

1. **Independent electrical-engineering review**
   Verify conductor tables, correction factors, installation assumptions, breaker constraints, RCD/RCBO guidance, demand factors, carbon assumptions and every AC-equivalent formula against explicitly named code editions.

2. **Calculator unit vectors**
   Add deterministic unit tests for every solve mode, invalid-input boundary, exact table transition, table exhaustion, standard switch and serialized-history schema. The browser regression verifies integration but is not a substitute for exhaustive numeric vectors.

3. **Production route verification**
   Confirm direct navigation and refresh fallback for every `/assistant/*` URL, canonical origin handling, cache headers, sitemap delivery and redirect behavior on the real host.

### P1 — before broad promotion

- Run keyboard-only and screen-reader testing, including dialog focus, live result announcements and canvas alternatives.
- Test Safari/iOS and mid-range Android hardware; software WebGL is not a proxy for mobile GPU memory or thermal behavior.
- Establish bundle budgets and assess whether the approximately 495 kB main chunk can be split further.
- Resolve the tooltip sourcemap warning.
- Align the repository on Node 22+ and one lockfile/package-manager workflow; npm currently requires `--legacy-peer-deps` because of an API-workspace esbuild peer conflict.
- Document architecture, standards editions, local setup, production preview and deployment behavior.
- Add a repository `LICENSE` file if MIT remains the intended license.
- Optimize large root-site imagery and verify responsive image loading.
- Consider prerendering canonical calculator pages if production indexing data warrants it.

## Suggested release sequence

1. Keep the separate `/app/` application unchanged and independently owned.
2. Deploy this root assistant build to staging with all `/assistant/*` SPA fallbacks enabled.
3. Run `npm run typecheck`, `npm run build`, `npm run test:assistant` and production-only dependency audit in CI.
4. Complete calculator unit vectors and qualified standards review.
5. Run accessibility and real-device WebGL checks.
6. Pilot the assistant, monitor route discovery, calculation abandonment, context loss and 3D opt-in rates.
7. Promote the root assistant with an instant rollback path.

## Bottom line

The requested architecture and delivery order have been completed. The active assistant is no longer a routed monolith: it is a hub plus eight canonical, independently lazy-loaded calculator pages with shared state, calculation, SEO and UI modules. The relevant 3D experiences now use a persistent shared renderer lifecycle, and three-phase 3D is additionally deferred until explicit user intent.

The latest static checks, production build and full desktop/mobile browser regression pass. The root ElectraSim assistant is ready for staging and domain review; the remaining blockers are standards certification, exhaustive numeric unit vectors, deployment verification, accessibility and real-device testing—not further architectural rescue work.
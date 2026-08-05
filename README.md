# Race Intelligence OS — RI-20X

RI-20X is an interactive Formula 1 digital-twin and race-operations environment. It turns the project from a cinematic campaign page into a deterministic command product where vehicle inspection, telemetry replay, strategy analysis, pit execution and distributed engineering operations share one application state.

## Product depth

- Eight connected command chapters with persistent navigation and telemetry
- Dual Three.js digital-twin viewports with 13 selectable engineering systems
- Studio, Technical, Aerodynamic, Thermal and Data visualization lenses
- Seven authored camera presets, component isolation and exploded inspection
- Deterministic 180-frame race replay with synchronized circuit, telemetry, tyre and event state
- Undercut, safety-car and rain-transition models with 1,200 seeded outcomes per scenario
- Twelve-stage 2.18-second pit-stop choreography
- Eight-node operations network with normal and degraded transport states
- Guided briefing, command palette, keyboard operation, session export and shareable state
- Adaptive graphics, lightweight fallback, reduced-motion behavior and dedicated mobile layouts
- Installable application shell with manifest and service-worker caching

## Technology

- Semantic HTML and a responsive command-interface design system
- Vanilla ES modules with a small observable store
- Three.js 0.180.0 through a pinned import map
- Canvas-based telemetry, circuit and probability visualizations
- Deterministic browser/Node simulation logic
- Static Node.js build and GitHub Pages deployment

## Run locally

```bash
npm start
```

Open `http://localhost:4173`.

## Validate and build

```bash
npm test
npm run build
```

Validation checks JavaScript syntax, deterministic replay, all strategy simulations, product-depth datasets, accessibility hooks, responsive behavior and the source budget.

## Source structure

```text
src/ri20x/
├── index.html
├── styles.css
├── core.mjs
├── visuals.js
├── app.js
├── scene.js
├── manifest.webmanifest
└── sw.js
```

The deployable site is generated in `dist/` and published by `.github/workflows/deploy-pages.yml`.

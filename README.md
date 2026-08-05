# Race Intelligence OS — RI-40X

RI-40X is an interactive Formula race-operations environment with a hybrid 3D architecture. The default Studio presentation uses an artist-authored, textured high-detail car, while Technical, Aerodynamic, Thermal, Data, component-focus and exploded modes use the local procedural engineering twin.

## RI-40X vehicle presentation

- Artist-authored 397.9k-triangle Formula car as the default photoreal Studio model
- Original model: **Formula 1 Car** by **Steven Samuel**, published under **CC Attribution**
- Integrated through the public Sketchfab Viewer API with explicit in-product attribution
- Dedicated PHOTOREAL / ENGINEERING renderer switch
- Automatic transition to the engineering renderer for component inspection and analytical lenses
- Graceful local fallback when third-party resources are blocked, unavailable or offline
- One photoreal viewer instance shared between the Command and Digital Twin chapters
- Reduced-motion, mobile and lightweight behavior preserved

Model source and attribution:

- https://sketchfab.com/3d-models/formula-1-car-e89589184eac42c08028db5cba3f6499
- Author: Steven Samuel / spsvision
- License: Creative Commons Attribution

## Local engineering twin

- More than 450 selectable rendered parts across 13 engineering systems
- Multi-element front and rear wings, DRS, beam wing and mounting structures
- Sculpted monocoque, crash structure, cockpit, steering controls and titanium halo
- Sidepod undercuts, cooling louvres, radiators, turbo, battery modules and exhaust routing
- Floor planform, edge wings, fences, venturi tunnels, diffuser channels and strakes
- Detailed tyres, rims, spokes, hubs, brakes, uprights, wishbones, pushrods and springs
- Procedural carbon weave, brushed metal and tyre textures
- Physical paint, carbon, rubber, titanium, glass, ceramic and emissive materials
- Telemetry-driven wheel rotation, steering, brake glow, DRS, cooling motion and airflow speed
- Raycast selection, isolation, focus helpers and exploded inspection

## Race-operations product

- Eight connected command chapters with persistent navigation and telemetry
- Deterministic 180-frame race replay with synchronized circuit, telemetry, tyre and event state
- Undercut, safety-car and rain-transition models with 1,200 seeded outcomes per scenario
- Twelve-stage 2.18-second pit-stop choreography
- Eight-node operations network with normal and degraded transport states
- Guided briefing, command palette, keyboard operation, session export and shareable state
- Installable application shell with manifest and service-worker caching

## Technology

- Semantic HTML and responsive command-interface CSS
- Vanilla ES modules with a small observable store
- Three.js 0.180.0 for the local engineering renderer
- Sketchfab Viewer API 1.12.1 for the artist-authored presentation model
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

Validation checks the hybrid renderer coordinator, engineering-model depth, JavaScript syntax, deterministic replay, strategy simulations, accessibility hooks, responsive behavior, offline fallback and source budget.

## Source structure

```text
src/ri20x/
├── index.html
├── styles.css
├── core.mjs
├── visuals.js
├── app.js
├── scene.js                 # RI-40X renderer coordinator
├── engineering-scene.js     # local RI-30X engineering twin
├── manifest.webmanifest
└── sw.js
```

The deployable site is generated in `dist/` and published by `.github/workflows/deploy-pages.yml`.

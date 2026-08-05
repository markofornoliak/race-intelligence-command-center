# Race Intelligence OS — RI-30X

RI-30X is an interactive Formula 1 race-operations environment built around a substantially upgraded engineering digital twin. Vehicle inspection, deterministic telemetry replay, strategy analysis, pit execution and distributed engineering operations share one application state.

## RI-30X digital twin

- More than 450 selectable rendered parts across 13 engineering systems
- Authored multi-element front and rear wings using generated airfoil geometry
- Sculpted monocoque, tapered crash structure, cockpit opening, seat, steering controls and titanium halo
- Sidepod inlet lips, undercuts, cooling louvres, radiators, turbo, battery modules and exhaust routing
- Floor planform, edge wings, fences, venturi tunnels, diffuser channels and strakes
- Detailed wheels with branded sidewalls, grooves, rim barrels, spokes, hubs, wheel nuts and fasteners
- Drilled carbon brake discs, calipers, uprights, double wishbones, pushrods, track rods and coil springs
- Procedural carbon weave, brushed metal and tyre textures
- Physically based paint, carbon, rubber, titanium, glass, ceramic and emissive materials
- Generated studio environment reflections, contact shadow, adaptive soft shadows and dual cameras
- Telemetry-driven wheel rotation, steering, brake glow, DRS actuation, cooling motion and flow speed
- Studio, Technical, Aerodynamic, Thermal and Data inspection lenses
- Raycast selection, component isolation, camera focus, inspection helpers and exploded view
- High, balanced and lightweight rendering paths with WebGL and reduced-motion fallback behavior

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
- Three.js 0.180.0 through a pinned import map
- Procedural BufferGeometry, ExtrudeGeometry, TubeGeometry and physical materials
- Canvas-generated engineering textures and telemetry visualizations
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

Validation checks JavaScript syntax, deterministic replay, all strategy simulations, product-depth datasets, RI-30X model architecture, accessibility hooks, responsive behavior and the source budget.

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

The digital-twin implementation specification is maintained in `docs/RI30X_DIGITAL_TWIN_SPEC.md`. The deployable site is generated in `dist/` and published by `.github/workflows/deploy-pages.yml`.

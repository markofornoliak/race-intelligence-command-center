# Race Intelligence OS — RI-50X

RI-50X is an immersive Formula race-operations command center built around one synchronized race state. It combines a high-detail presentation car, a local engineering digital twin, deterministic telemetry replay, strategy simulation, pit execution and distributed engineering operations in a single browser experience.

## What changed in RI-50X

RI-50X is a structural experience upgrade rather than a cosmetic theme revision.

- Full-screen cinematic entry sequence with progressive system initialization
- Persistent command dock for Overview, Aero, Thermal, Systems, Exploded and Focus modes
- Live telemetry ribbon connected to the deterministic race frame
- Vehicle HUD showing speed, gear, RPM, brake temperature, tyre temperature and ERS state
- Decision brief panel tied to strategy confidence, recommendation and network condition
- Distraction-free cinematic vehicle focus mode
- Expanded responsive behavior for desktop, tablet and mobile command layouts
- New engineering hangar with animated studio architecture, screens, lighting and atmosphere
- Camera-shot event system connecting UI modes to authored 3D views
- Stronger offline caching and explicit RI-50X production build pipeline

## Hybrid 3D vehicle system

### Photoreal presentation model

- Artist-authored 397.9k-triangle Formula car used in the default Studio presentation
- Original model: **Formula 1 Car** by **Steven Samuel**, published under **Creative Commons Attribution**
- Integrated through the public Sketchfab Viewer API with explicit in-product attribution
- Dedicated PHOTOREAL / ENGINEERING renderer switch
- Automatic transition to the engineering renderer for analytical views and component inspection
- Graceful local fallback when third-party resources are blocked, unavailable or offline

Model source and attribution:

- https://sketchfab.com/3d-models/formula-1-car-e89589184eac42c08028db5cba3f6499
- Author: Steven Samuel / spsvision
- License: Creative Commons Attribution

### Local engineering twin

- More than 450 selectable rendered parts across 13 engineering systems
- Multi-element front and rear wings, DRS, beam wing and mounting structures
- Sculpted monocoque, crash structure, cockpit, steering controls and titanium halo
- Sidepod undercuts, cooling louvres, radiators, turbo, battery modules and exhaust routing
- Floor planform, edge wings, venturi tunnels, diffuser channels and strakes
- Detailed tyres, rims, spokes, hubs, brakes, uprights, wishbones, pushrods and springs
- Procedural carbon weave, brushed metal and tyre textures
- Telemetry-driven wheel rotation, steering, brake glow, DRS, cooling motion and airflow speed
- Raycast selection, component isolation, camera focus and exploded inspection
- RI-40X.1 detail pass with mirrors, T-camera, pitot system, aerials, floor fences, wheel covers, rain light, energy spine and floor sparks

## RI-50X engineering hangar

The local renderer now operates inside an authored race-engineering environment:

- Reflective technical floor with illuminated grid and centerline
- Rotating inspection platform with dual illuminated rings
- Structural rear and side walls with modular bays
- Full overhead truss system and animated light bars
- Four live engineering screens with generated telemetry traces
- Pit-wall workstation with desks, monitors and glass partition
- Volumetric light cones, atmospheric particles and animated floor beacons
- Vehicle scanning plane for Technical and Data views
- Camera choreography driven by `ri:cinematic-shot` events
- Quality-aware behavior for constrained and lightweight devices

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
- Three.js 0.180.0 for the local engineering renderer and hangar
- Sketchfab Viewer API 1.12.1 for the artist-authored presentation model
- Canvas-generated textures, telemetry displays and engineering graphics
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

Validation covers the hybrid renderer, local engineering depth, RI-50X interface system, hangar capabilities, JavaScript syntax, deterministic replay, strategy simulations, accessibility hooks, responsive behavior, offline fallback and source budget.

## Source structure

```text
src/
├── ri20x/                   # core product, simulations and base renderer
│   ├── index.html
│   ├── styles.css
│   ├── core.mjs
│   ├── visuals.js
│   ├── app.js
│   ├── scene.js
│   ├── engineering-scene.js
│   ├── manifest.webmanifest
│   └── sw.js
├── ri30x/                   # readability and vehicle-detail upgrades
│   ├── styles.upgrade.css
│   └── scene.upgrade.js
└── ri50x/                   # immersive command-center generation
    ├── experience.css
    ├── experience.js
    └── hangar-scene.js
```

`scripts/build.mjs` assembles the layers into the deployable `dist/` package. GitHub Pages is published by `.github/workflows/deploy-pages.yml` after validation and production build complete successfully.

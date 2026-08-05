# Race Intelligence OS — RI-51X

RI-51X is an immersive Formula race-operations and vehicle-engineering command center built around one synchronized race state. It combines a high-detail presentation car, a local engineering digital twin, deterministic telemetry replay, strategy simulation, pit execution, distributed operations, live vehicle dynamics and an interactive CFD communication layer in one browser experience.

## What changed in RI-51X

RI-51X extends the RI-50X command-center architecture into the vehicle itself.

- Dedicated Vehicle Dynamics & CFD Lab with four engineering workbench tabs
- New Dynamics and CFD Live modes in the persistent command dock
- Telemetry-derived downforce, drag, platform height and brake-energy estimates
- Live aerodynamic load map with front, floor and rear load vectors
- Configurable ride height, damper response, aero balance, flow density and brake cooling
- Four-corner suspension-travel readout with heave, pitch and roll effects
- Live load-history chart and engineering event log
- Session setup persistence and JSON setup export
- Keyboard shortcut `V` for opening the engineering workbench
- Full responsive behavior for desktop, tablet and mobile layouts

## Telemetry-driven vehicle dynamics

The local Three.js engineering twin now includes an additional RI-51X dynamics layer:

- Four detailed suspension rigs with uprights, hubs, upper and lower wishbones, track rods and pushrods
- Animated dampers, damper rods, coil springs and remote reservoirs
- Telemetry-driven wheel travel, heave, pitch, roll and platform-height movement
- Dynamic tyre contact patches scaled by estimated corner load
- Load-sensitive suspension highlighting and travel indicators
- Configurable visual damping and reference ride height
- Total-load vectors and animated center-of-pressure marker
- Brake ducts and speed-dependent cooling-flow rings

The load model is deterministic and derived from the synchronized replay frame. It is intended as an engineering communication and visualization layer, not as a homologated multibody vehicle solver.

## RI-51X live CFD field

The browser scene now supports a configurable aerodynamic visualization:

- Up to 960 animated CFD particles on capable devices
- Reduced 360-particle path for constrained devices
- Particle colors mapped from low-pressure blue through neutral cyan to high-pressure red
- Nineteen generated streamlines around the front wing, body, floor and rear wake
- Animated vortex structures around wheels, floor edges, diffuser and rear wing
- Rear-wake ribbon responsive to estimated drag
- Seven pressure volumes covering the nose, front wing, floor, sidepods, diffuser and rear wing
- User controls for field density, pressure volumes and wake visibility
- Quality-aware disabling in lightweight rendering mode

The CFD layer is a visually meaningful flow-field approximation driven by vehicle speed and configuration. It is not presented as a validated Navier–Stokes solution.

## RI-50X command-center foundation

The previous immersive product layer remains fully available:

- Full-screen cinematic system initialization
- Persistent command dock and live telemetry ribbon
- Vehicle HUD showing speed, gear, RPM, brake temperature, tyre temperature and ERS state
- Decision brief tied to strategy confidence and network condition
- Distraction-free cinematic vehicle focus mode
- Authored engineering hangar with inspection platform, pit wall, live screens, structural lighting and atmosphere
- Camera choreography driven by `ri:cinematic-shot` events

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
- Additional detail pass with mirrors, T-camera, pitot system, aerials, floor fences, wheel covers, rain light, energy spine and floor sparks

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
- Three.js 0.180.0 for the local engineering renderer, hangar and dynamics layer
- Sketchfab Viewer API 1.12.1 for the artist-authored presentation model
- Canvas-generated textures, telemetry displays, charts and engineering graphics
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

Validation covers the hybrid renderer, assembled engineering scene, RI-50X experience layer, RI-51X workbench, suspension rigs, CFD field, JavaScript syntax, deterministic replay, strategy simulations, accessibility hooks, responsive behavior, offline fallback and source budget.

## Source structure

```text
src/
├── ri20x/                   # core product, simulations and base renderer
├── ri30x/                   # readability and vehicle-detail upgrades
├── ri50x/                   # immersive command-center and hangar
│   ├── experience.css
│   ├── experience.js
│   └── hangar-scene.js
└── ri51x/                   # vehicle dynamics and CFD workbench
    ├── vehicle-lab.css
    ├── vehicle-lab.js
    └── dynamics-scene.js
```

`scripts/build.mjs` assembles all layers into the deployable `dist/` package. GitHub Pages is published by `.github/workflows/deploy-pages.yml` only after validation and production build complete successfully.

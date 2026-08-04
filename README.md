# Race Intelligence OS — RI-10X

RI-10X is a stateful Formula 1 digital-twin and race-decision command environment. It replaces the previous cinematic microsite architecture with one deterministic application state shared across the command deck, digital twin, race replay, strategy scenarios, operations network and secure experience layer.

## What changed

- Eight connected application chapters with persistent command navigation
- Interactive Three.js Formula 1 digital twin with component selection, six camera presets, five engineering views and authored exploded offsets
- Deterministic 72-frame race-state replay with synchronized telemetry, circuit position, tyre state and event stream
- Three explainable strategy scenarios: undercut, safety car and rain transition
- Data-driven operations network and normal/degraded transport states
- Session persistence, URL-shareable strategy state, keyboard navigation, mobile compositions and reduced-motion support
- Clean `src/ri10x/` source architecture; legacy `.part` files are no longer used by the build
- Determinism, syntax, accessibility-token, source-budget and production-build validation

## Technology

- Semantic HTML and modern CSS
- Vanilla ES modules with a small observable state store
- Three.js 0.180.0 through a pinned import map
- Deterministic simulation and strategy logic shared between browser and Node tests
- Static Node.js build for GitHub Pages

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

The deployable site is generated in `dist/` and GitHub Pages deploys it through `.github/workflows/deploy-pages.yml`.

## Source structure

```text
src/ri10x/
├── index.html
├── styles.css
├── core.mjs
├── app.js
└── scene.js
```

The old ordered `.part` source remains in repository history for reference but is not part of the RI-10X build path.

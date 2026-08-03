# Race Intelligence Command Center

A cinematic Formula 1 data-performance microsite presented as a confidential race-morning engineering briefing rather than a conventional technology landing page.

## Experience

- interactive dimensional Formula 1 engineering model
- systems, aerodynamic and data-flow visualization modes
- projected engineering annotations and telemetry
- live decision matrix and race-operations narrative
- Citrix HDX campaign chapter
- accessible dialog, keyboard controls and mobile navigation
- reduced-motion support and responsive layouts
- dependency-free production build

## Technology

- semantic HTML
- modern CSS
- vanilla JavaScript
- Three.js 0.180.0 loaded as a pinned ES module
- Node.js validation and static build scripts
- GitHub Pages deployment workflow

## Source structure

The production files are assembled from ordered, reviewable source parts:

- `src/index/` — semantic page structure
- `src/styles/` — visual system and responsive layouts
- `src/scene/` — maintainable Three.js engineering scene
- `src/ui/` — navigation, reveal, modal and telemetry behavior

Running the build writes the assembled files to the repository root for local preview and to `dist/` for deployment.

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

The production output is generated in `dist/`.

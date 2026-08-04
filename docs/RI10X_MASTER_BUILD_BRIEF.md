# RACE INTELLIGENCE OS — RI-10X MASTER BUILD BRIEF

**Repository:** `markofornoliak/race-intelligence-command-center`  
**Target release:** RI-10X  
**Document status:** Implementation authority  
**Audience:** product designer, creative director, Three.js engineer, front-end engineer, technical artist, QA engineer  
**Primary deployment:** GitHub Pages  
**Last updated:** 2026-08-04

---

## 1. Executive direction

RI-10X must not be another visual upgrade to the current microsite. It must replace the current presentation-page mental model with a coherent, product-grade interactive operating environment.

The target is:

> **RACE INTELLIGENCE OS — a cinematic digital-twin and race-decision environment that demonstrates how a distributed Formula 1 engineering organization converts live signal into coordinated action.**

The final experience must feel simultaneously like:

- a premium automotive digital-twin product;
- a real race-operations command center;
- an executive-grade product narrative;
- a technically credible secure remote-engineering platform;
- an interactive case study that rewards exploration.

The page must stop behaving as a sequence of decorative sections. It must behave as one continuous system with persistent state, purposeful interactions, deterministic scenarios, and a clearly authored visual narrative.

---

## 2. Current baseline and required reset

The current project already provides:

- a procedural Three.js Formula 1 concept model;
- systems, aero, data-flow, camera and exploded-view interactions;
- a cinematic dark visual language;
- four narrative sections: Briefing, Signal, Operations and HDX;
- a static Node build and GitHub Pages deployment;
- basic accessibility, responsive layout and integrity checks.

The current limitations are structural:

1. Source is assembled by concatenating ordered `.part` files into global HTML, CSS and JavaScript outputs.
2. The entire UI behavior is controlled by one global script.
3. Scene state, page state, telemetry state and narrative state are not modeled as explicit application data.
4. Telemetry values are mostly decorative and partially random.
5. The operations board is static rather than scenario-driven.
6. The 3D model is still principally procedural geometry rather than a production digital-twin asset pipeline.
7. Tests mostly assert the presence of source tokens instead of user-visible behavior.
8. The architecture makes further iteration progressively more fragile.

RI-10X must therefore include an architectural migration. Do not build RI-10X by adding more numbered `.part` files.

---

## 3. Product definition

### 3.1 Core product promise

**One race state. Every specialist. Before the next corner.**

The experience must prove four ideas:

1. The car is a live decision surface, not merely a vehicle.
2. Performance depends on reducing the distance between signal and action.
3. Distributed teams require one governed, synchronized race state.
4. High-fidelity secure access is an operating layer, not an afterthought.

### 3.2 Primary audiences

- senior technology and infrastructure decision-makers;
- motorsport engineering and operations audiences;
- product and design leaders evaluating high-end interactive work;
- recruiters, clients and partners assessing technical execution;
- general visitors who must understand the concept without prior domain knowledge.

### 3.3 Experience modes

The application must support three explicit modes:

- **Guided Briefing:** authored cinematic progression through all chapters;
- **Explore Mode:** free digital-twin inspection and system navigation;
- **Strategy Lab:** deterministic interactive race scenarios and decisions.

The selected mode must be represented in application state and persisted during the session.

---

## 4. Non-negotiable success criteria

RI-10X is complete only when all of the following are true:

- The first viewport reads as a real command interface, not a landing-page hero.
- The digital twin can be inspected by component, system, visualization layer and camera preset.
- At least three deterministic strategy scenarios visibly modify telemetry, recommendations and race-state outcomes.
- The site uses one typed state model rather than unrelated DOM mutations.
- The 3D model uses a production GLB/GLTF asset pipeline with LODs and compressed textures; procedural geometry is retained only for overlays, fallback and effects.
- Every major visual number is sourced from a data object or simulation state.
- Desktop, tablet and mobile compositions are intentionally different, not merely scaled.
- The experience remains understandable with WebGL unavailable.
- Keyboard-only navigation can operate all primary controls.
- Reduced-motion mode removes non-essential camera, parallax, scan and auto-play behavior.
- CI runs type checking, linting, unit tests, browser tests, build verification and performance checks.
- No major interaction is accepted solely because a token exists in source.

---

# PART I — EXPERIENCE ARCHITECTURE

## 5. Global experience structure

The final information architecture contains eight chapters:

1. **Command Deck** — live overview and product promise.
2. **Digital Twin** — inspect the car and its engineering systems.
3. **Race State** — telemetry, event stream and synchronized decision state.
4. **Strategy Lab** — interactive scenarios and recommendation engine.
5. **Operations Network** — pit wall, garage, factory and specialists.
6. **Secure Experience Layer** — governed applications, graphics and transport.
7. **Performance Evidence** — outcomes, benchmarks and operating principles.
8. **Final Brief** — synthesized message and replay/reset actions.

The global navigation must expose these chapters without forcing the visitor to follow them sequentially.

---

## 6. Section-by-section build specification

## 6.1 Entry sequence / system boot

### Purpose

Establish the experience as a live engineering system while completing essential asset loading.

### Required composition

- compact RI-10X identity mark;
- model-loader status;
- telemetry-state status;
- graphics capability detection;
- audio state shown but muted by default;
- concise progress indicator based on real load progress.

### Required behavior

- Never block the page longer than necessary.
- Display immediately using inline critical CSS.
- Begin with low-resolution model or poster fallback.
- Transition into Command Deck when the minimum viable asset set is ready.
- Continue loading high-detail assets after entry.
- Offer a visible “Enter lightweight mode” path when device capability is low.

### Acceptance criteria

- No artificial fixed-duration boot delay.
- Entry is available within 1.5 seconds on a normal desktop connection when cached.
- Screen reader announcement communicates loading state without repeated noise.
- Reduced-motion mode uses a simple opacity transition.

---

## 6.2 Global shell and navigation

### Purpose

Provide persistent orientation and system-level controls.

### Desktop layout

- top identity and session status bar;
- left vertical chapter rail;
- right contextual utility rail;
- bottom global telemetry strip;
- center content/viewport region.

### Mobile layout

- compact top bar;
- bottom-sheet navigation;
- one persistent context chip;
- telemetry strip becomes swipeable cards;
- utility controls move into a full-screen inspector sheet.

### Global controls

- Guided / Explore / Strategy mode;
- sound toggle;
- motion mode toggle;
- help / controls overlay;
- reset session;
- current chapter and progress;
- graphics quality: Auto / High / Balanced / Lightweight.

### Acceptance criteria

- Navigation state is synchronized with URL hash.
- Browser back/forward restores chapter state.
- No control overlaps the 3D viewport at 320 px width.
- Focus order matches visual order.

---

## 6.3 Chapter 1 — Command Deck

### Purpose

Communicate the product proposition and demonstrate that the experience is an operating environment.

### Desktop composition

- **Left command rail:** product statement, session state and guided briefing trigger.
- **Center digital-twin viewport:** car, annotations and system visualization.
- **Right systems inspector:** selected component, health, active data channels and actions.
- **Bottom telemetry rail:** tyre, energy, brake, aero, latency and race-state indicators.

### Required headline

**ONE RACE STATE. EVERY SPECIALIST. BEFORE THE NEXT CORNER.**

### Supporting copy

The supporting text must explain that the car, simulation stack, specialists and secure application environment are represented as one synchronized decision system.

### Required interactions

- select component by clicking the model or inspector list;
- switch visualization mode: Studio / Technical / Aero / Thermal / Data;
- switch camera: Hero / Front / Cockpit / Side / Top / Rear / Floor;
- enter exploded view;
- start Guided Briefing;
- enter Strategy Lab;
- pause auto-rotation permanently after first user interaction.

### Acceptance criteria

- Within five seconds, a first-time visitor can identify what the product does.
- All numerical readouts come from current application state.
- Selected model component and inspector state always match.
- WebGL fallback preserves the proposition, key telemetry and primary navigation.

---

## 6.4 Chapter 2 — Digital Twin

### Purpose

Turn the car into an explorable engineering system.

### Component taxonomy

- front wing;
- front suspension;
- front brake assemblies;
- nose and crash structure;
- monocoque;
- cockpit and halo;
- sidepods and cooling inlets;
- floor edges;
- venturi tunnels;
- power-unit cover;
- rear suspension;
- diffuser;
- beam wing;
- rear wing and DRS;
- telemetry and data network.

### Visualization modes

#### Studio

High-quality carbon, paint, metal, rubber and glass materials with restrained reflections.

#### Technical

Surface transparency, edge overlay, measurement anchors and component identifiers.

#### Aero

Pressure zones, streamline particles, front-wing flow, tyre wake, floor tunnels and diffuser extraction.

#### Thermal

Brake temperatures, tyre surface zones, cooling inlet state, power-unit heat and rear-body heat rejection.

#### Data

Sensor nodes, network paths, packet movement, subsystem grouping and selected-signal tracing.

### Inspection behavior

- raycast selection on pointer and keyboard component list;
- isolate selected component;
- hide/show system groups;
- exploded-view slider from 0 to 100%;
- component facts panel;
- optional measurement overlay;
- reset to authored view.

### Acceptance criteria

- All component IDs are stable and data-driven.
- Exploded view uses authored offsets, not arbitrary radial displacement.
- Camera reframes selected components without clipping.
- LOD change is not visually disruptive.
- Mobile uses tap-to-select and avoids precision hover requirements.

---

## 6.5 Chapter 3 — Race State

### Purpose

Show how raw telemetry becomes a synchronized operational state.

### Required modules

- circuit map with live position and event markers;
- event stream ordered by simulation time;
- tyre-state matrix;
- energy deployment;
- brake and thermal state;
- aero balance;
- fuel delta;
- latency and session health;
- recommendation queue;
- synchronization status by location.

### Required behavior

- Use deterministic replay data, not random values.
- Timeline scrubber changes every visible module.
- Selecting an event highlights corresponding car components and telemetry channels.
- “Compare” mode overlays previous lap or baseline setup.
- Every card can explain its meaning through a concise details state.

### Acceptance criteria

- Scrubbing the timeline produces identical output across reloads.
- Data values, charts and model highlights are synchronized to the same timestamp.
- No chart uses decorative motion that obscures values.
- The section works without 3D by using charts and component diagrams.

---

## 6.6 Chapter 4 — Strategy Lab

### Purpose

Demonstrate decision intelligence rather than only describing it.

### Required scenarios

#### Scenario A — Undercut window

Inputs:
- tyre degradation;
- pit-loss estimate;
- traffic probability;
- warm-up delta.

Decision:
- pit now;
- extend;
- cover competitor.

#### Scenario B — Safety car

Inputs:
- sector position;
- pit-entry timing;
- tyre age;
- restart compound;
- track-position cost.

Decision:
- pit under safety car;
- remain out;
- split strategy.

#### Scenario C — Rain transition

Inputs:
- rainfall intensity;
- track temperature;
- crossover forecast;
- radar confidence;
- tyre availability.

Decision:
- remain slick;
- intermediate;
- full wet.

### Interaction model

- scenario selector;
- editable constrained inputs;
- live recommendation with confidence;
- expected outcome comparison;
- transparent rationale tree;
- “Commit decision” action;
- replay of outcome over the next simulated laps.

### Required output

- recommendation;
- confidence interval;
- estimated time impact;
- risk level;
- affected teams;
- required action sequence;
- post-decision outcome.

### Acceptance criteria

- The same inputs always return the same recommendation.
- Recommendation logic is readable in source and covered by unit tests.
- Input constraints prevent impossible states.
- The experience clearly labels all values as illustrative.
- Scenario state is serializable into the URL for sharing.

---

## 6.7 Chapter 5 — Operations Network

### Purpose

Show the distributed organizational system behind the decision.

### Nodes

- car;
- garage;
- pit wall;
- trackside engineering;
- factory simulation;
- strategy group;
- specialist workstation;
- governed application environment.

### Required interactions

- select node to see responsibilities, applications and active signals;
- trace one decision from sensor to action;
- latency and session-quality overlay;
- compare normal and degraded network conditions;
- highlight which workloads remain centralized.

### Narrative sequence

1. Signal originates at the car.
2. Telemetry enters the governed race state.
3. Simulation and specialist applications interpret it.
4. Recommendation reaches pit wall and garage.
5. Decision is enacted before the opportunity closes.

### Acceptance criteria

- Node and edge definitions are data-driven.
- The full signal path can be followed using keyboard controls.
- Degraded-network mode changes transport indicators and interface messaging without fabricating technical claims.

---

## 6.8 Chapter 6 — Secure Experience Layer

### Purpose

Explain remote application delivery and controlled data access as the enabling layer.

### Required content pillars

- high-fidelity engineering applications;
- adaptive session transport;
- centralized governance;
- application and data locality;
- resilient access under changing network conditions;
- consistent experience across garage, factory and specialist locations.

### Required visual

A layered architecture diagram:

1. user and endpoint;
2. experience protocol;
3. application session;
4. engineering application;
5. governed datasets and compute.

### Required interaction

Selecting a layer reveals:

- responsibility;
- performance concern;
- security concern;
- what moves;
- what remains governed;
- failure/degradation behavior.

### Acceptance criteria

- Technical language remains precise and avoids unsupported performance guarantees.
- The independent-concept disclaimer remains visible.
- The section explains value before implementation detail.

---

## 6.9 Chapter 7 — Performance Evidence

### Purpose

Convert the narrative into measurable operating outcomes.

### Required metrics categories

- decision latency;
- synchronized specialist coverage;
- application availability;
- data-copy reduction;
- scenario response time;
- graphics responsiveness;
- session continuity;
- model confidence.

### Rules

- Clearly separate illustrative values from measured values.
- Do not present invented numbers as case-study evidence.
- Use “illustrative operating model” labels where appropriate.
- Include a methodology panel for every metric family.

### Acceptance criteria

- No metric appears without source type: measured, simulated or illustrative.
- Charts are readable at 200% zoom.
- Color is never the only indicator of status.

---

## 6.10 Chapter 8 — Final Brief

### Purpose

Synthesize the product and return control to the user.

### Required final statement

**THE ADVANTAGE IS NOT MORE DATA. IT IS A SHORTER DISTANCE TO DECISION.**

### Actions

- replay guided briefing;
- return to Command Deck;
- open Strategy Lab;
- inspect architecture;
- copy shareable state URL;
- view project methodology.

### Acceptance criteria

- Final section is not a decorative dead end.
- Reset action clears state predictably.
- Share action excludes personal or device data.

---

# PART II — TECHNICAL ARCHITECTURE

## 7. Architecture decision

### 7.1 Required migration

Replace concatenated `.part` assembly with:

- Vite;
- TypeScript in strict mode;
- Three.js from npm;
- native ES modules;
- CSS cascade layers and modular section files;
- Vitest for unit tests;
- Playwright for browser tests;
- ESLint and Prettier;
- optional Lighthouse CI for performance budgets.

Do not introduce React solely for DOM rendering. The experience is a single-page, scene-led product and can remain framework-light. Use typed view controllers and a small observable store. If React is later justified, that decision must be documented separately.

### 7.2 Target repository tree

```text
/
├─ .github/
│  └─ workflows/
│     ├─ validate-pr.yml
│     ├─ deploy-pages.yml
│     └─ lighthouse.yml
├─ docs/
│  ├─ RI10X_MASTER_BUILD_BRIEF.md
│  ├─ ARCHITECTURE.md
│  ├─ CONTENT_MODEL.md
│  ├─ DIGITAL_TWIN_PIPELINE.md
│  ├─ PERFORMANCE_BUDGET.md
│  └─ QA_PLAN.md
├─ public/
│  └─ assets/
│     ├─ models/
│     │  ├─ ri10x-car-lod0.glb
│     │  ├─ ri10x-car-lod1.glb
│     │  ├─ ri10x-car-lod2.glb
│     │  └─ ri10x-car-poster.webp
│     ├─ textures/
│     │  ├─ carbon-basecolor.ktx2
│     │  ├─ carbon-normal.ktx2
│     │  ├─ carbon-roughness.ktx2
│     │  └─ environment-studio.hdr
│     ├─ audio/
│     │  ├─ ui-confirm.ogg
│     │  ├─ ui-transition.ogg
│     │  └─ ambience-loop.ogg
│     └─ icons/
├─ src/
│  ├─ main.ts
│  ├─ app/
│  │  ├─ App.ts
│  │  ├─ AppState.ts
│  │  ├─ AppEvents.ts
│  │  ├─ Router.ts
│  │  ├─ CapabilityDetector.ts
│  │  └─ QualityManager.ts
│  ├─ config/
│  │  ├─ experience.ts
│  │  ├─ performance.ts
│  │  └─ accessibility.ts
│  ├─ data/
│  │  ├─ components.ts
│  │  ├─ telemetry.ts
│  │  ├─ raceReplay.ts
│  │  ├─ scenarios.ts
│  │  ├─ network.ts
│  │  ├─ metrics.ts
│  │  └─ copy.ts
│  ├─ components/
│  │  ├─ CommandNav.ts
│  │  ├─ ModeSwitcher.ts
│  │  ├─ TelemetryStrip.ts
│  │  ├─ SystemsInspector.ts
│  │  ├─ Timeline.ts
│  │  ├─ Chart.ts
│  │  ├─ StatusBadge.ts
│  │  ├─ BottomSheet.ts
│  │  ├─ HelpOverlay.ts
│  │  └─ ErrorBoundary.ts
│  ├─ sections/
│  │  ├─ CommandDeck.ts
│  │  ├─ DigitalTwinSection.ts
│  │  ├─ RaceStateSection.ts
│  │  ├─ StrategyLabSection.ts
│  │  ├─ OperationsNetworkSection.ts
│  │  ├─ SecureExperienceSection.ts
│  │  ├─ PerformanceEvidenceSection.ts
│  │  └─ FinalBriefSection.ts
│  ├─ scene/
│  │  ├─ SceneRuntime.ts
│  │  ├─ SceneState.ts
│  │  ├─ loaders/
│  │  │  ├─ CarModelLoader.ts
│  │  │  ├─ TextureLoader.ts
│  │  │  └─ AssetManifest.ts
│  │  ├─ controllers/
│  │  │  ├─ DigitalTwinController.ts
│  │  │  ├─ CameraDirector.ts
│  │  │  ├─ ComponentSelectionController.ts
│  │  │  ├─ ExplodeController.ts
│  │  │  ├─ AeroController.ts
│  │  │  ├─ ThermalController.ts
│  │  │  ├─ DataFlowController.ts
│  │  │  └─ AnnotationController.ts
│  │  ├─ materials/
│  │  │  ├─ carbon.ts
│  │  │  ├─ paint.ts
│  │  │  ├─ rubber.ts
│  │  │  ├─ glass.ts
│  │  │  └─ technicalOverlay.ts
│  │  ├─ effects/
│  │  │  ├─ PostProcessing.ts
│  │  │  ├─ FlowParticles.ts
│  │  │  ├─ ThermalField.ts
│  │  │  └─ DataPackets.ts
│  │  └─ fallback/
│  │     └─ StaticTwinFallback.ts
│  ├─ simulation/
│  │  ├─ RaceStateEngine.ts
│  │  ├─ ReplayController.ts
│  │  ├─ StrategyEngine.ts
│  │  ├─ ScenarioRunner.ts
│  │  ├─ RecommendationEngine.ts
│  │  └─ constraints.ts
│  ├─ styles/
│  │  ├─ tokens.css
│  │  ├─ reset.css
│  │  ├─ base.css
│  │  ├─ shell.css
│  │  ├─ typography.css
│  │  ├─ motion.css
│  │  ├─ accessibility.css
│  │  ├─ components/
│  │  └─ sections/
│  ├─ utils/
│  │  ├─ math.ts
│  │  ├─ dom.ts
│  │  ├─ format.ts
│  │  ├─ performance.ts
│  │  └─ invariant.ts
│  └─ types/
│     ├─ experience.ts
│     ├─ telemetry.ts
│     ├─ digitalTwin.ts
│     └─ strategy.ts
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  ├─ e2e/
│  └─ visual/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ eslint.config.js
├─ playwright.config.ts
└─ vitest.config.ts
```

---

## 8. File-by-file responsibilities

## Root configuration

### `package.json`

Must define:

- `dev`;
- `build`;
- `preview`;
- `typecheck`;
- `lint`;
- `test`;
- `test:unit`;
- `test:e2e`;
- `test:visual`;
- `check` as the complete local gate.

Dependencies must be minimal and justified. Required production dependency: `three`. Required development tools: Vite, TypeScript, Vitest, Playwright, ESLint and Prettier.

### `vite.config.ts`

Responsibilities:

- GitHub Pages base path;
- asset naming;
- model and texture handling;
- source maps in preview, not public production unless explicitly required;
- chunk strategy separating Three.js runtime from application logic;
- build warning thresholds.

### `index.html`

Must contain only:

- semantic application root;
- critical metadata;
- preload hints for poster and first model LOD;
- no inline application logic;
- minimal no-JavaScript fallback.

## Application core

### `src/main.ts`

- capability detection;
- create application state;
- initialize shell;
- initialize scene asynchronously;
- connect simulation and UI;
- register fatal error fallback;
- expose no globals.

### `src/app/AppState.ts`

Single source of truth for:

- experience mode;
- chapter;
- selected component;
- visualization mode;
- camera preset;
- quality level;
- explode amount;
- replay time;
- selected strategy scenario;
- scenario inputs;
- recommendation;
- audio and motion preferences.

State changes must be observable and typed. Direct cross-module DOM mutation is prohibited.

### `src/app/AppEvents.ts`

Defines typed event names and payloads. Examples:

- `chapter:change`;
- `twin:component-selected`;
- `twin:mode-changed`;
- `replay:time-changed`;
- `scenario:committed`;
- `quality:changed`.

### `src/app/Router.ts`

Maps URL hash/query state to:

- chapter;
- experience mode;
- scenario;
- optional replay time;
- selected digital-twin component.

Must support back/forward navigation and shareable scenario URLs.

### `src/app/QualityManager.ts`

Controls:

- device-pixel ratio;
- model LOD;
- post-processing;
- particle count;
- shadow quality;
- texture resolution;
- animation frequency.

Auto mode must use measured frame time, not only user-agent detection.

## Data and simulation

### `src/data/components.ts`

Defines stable component metadata:

```ts
interface TwinComponent {
  id: string;
  label: string;
  group: TwinSystemGroup;
  meshNames: string[];
  description: string;
  signals: string[];
  explodeVector: [number, number, number];
  cameraPreset: CameraPose;
}
```

### `src/data/telemetry.ts`

Contains telemetry channel definitions, units, display precision, valid range, warning thresholds and component relationships.

### `src/data/raceReplay.ts`

Contains deterministic timestamped replay frames. Do not generate values with `Math.random()`.

### `src/data/scenarios.ts`

Contains scenario defaults, input constraints, available decisions and explanatory copy.

### `src/simulation/StrategyEngine.ts`

Pure deterministic decision functions. No DOM and no Three.js dependencies.

### `src/simulation/RecommendationEngine.ts`

Transforms scenario output into:

- recommendation;
- confidence;
- rationale;
- risk;
- time impact;
- required actions.

All rules require unit tests.

## Digital twin runtime

### `src/scene/SceneRuntime.ts`

Owns:

- renderer;
- scene;
- camera;
- clock;
- resize handling;
- render loop;
- visibility pausing;
- quality adaptation;
- disposal.

It must not contain model construction details.

### `src/scene/loaders/CarModelLoader.ts`

- load poster first;
- load LOD2, then LOD1, then LOD0 when appropriate;
- support Meshopt or Draco compression;
- map named meshes to component IDs;
- report progress;
- return a typed model handle;
- fail gracefully to static fallback.

### `src/scene/controllers/DigitalTwinController.ts`

Coordinates component visibility, visualization mode and model state. It does not own camera input.

### `src/scene/controllers/CameraDirector.ts`

- authored poses;
- selected-component framing;
- smooth cancellable transitions;
- collision/clipping avoidance;
- mobile-specific framing;
- reduced-motion immediate transitions.

### `src/scene/controllers/ExplodeController.ts`

- authored per-component offsets;
- slider-controlled progress;
- reversible easing;
- no cumulative floating-point drift;
- component labels reposition with meshes.

### `src/scene/controllers/AeroController.ts`

- streamline activation;
- pressure-zone material uniforms;
- DRS state;
- floor and diffuser visualization;
- particle budgets by quality level.

### `src/scene/controllers/ThermalController.ts`

Maps telemetry values to material/shader state for brakes, tyres, cooling and rear-body heat.

### `src/scene/controllers/DataFlowController.ts`

Visualizes deterministic signal routes between sensors, control units and external nodes.

## UI components

### `src/components/SystemsInspector.ts`

Displays the selected component, linked telemetry, state, description and isolation controls. Must support focus management and mobile bottom-sheet presentation.

### `src/components/TelemetryStrip.ts`

Renders data from the selected replay frame. Must not own simulation timing.

### `src/components/Timeline.ts`

- keyboard-accessible scrubber;
- events;
- play/pause;
- playback speed;
- compare-lap control.

### `src/components/Chart.ts`

One reusable lightweight SVG chart implementation with accessible labels. Do not add a large charting library unless a documented requirement cannot be satisfied.

### `src/components/ErrorBoundary.ts`

Catches initialization failures and presents a functional non-WebGL experience.

## Section controllers

Each file in `src/sections/` owns only:

- section DOM creation or binding;
- section-specific events;
- subscription to application state;
- cleanup.

A section must never directly modify another section.

## Styles

### `src/styles/tokens.css`

Define all:

- colors;
- typography scales;
- spacing;
- borders;
- radii;
- shadows;
- z-index levels;
- motion durations;
- easing curves;
- breakpoints.

No repeated raw color values are allowed outside specialized shader or data-visualization code.

### `src/styles/motion.css`

Contains authored motion primitives and reduced-motion overrides. Continuous decorative animation must stop when off-screen.

### `src/styles/accessibility.css`

Contains focus, high-contrast, forced-colors, reduced-motion and screen-reader utility rules.

---

# PART III — DIGITAL-TWIN ART PIPELINE

## 9. Model requirements

RI-10X must use a purpose-built web model rather than relying exclusively on generated Three.js primitives.

### Geometry targets

- LOD0: maximum 250,000 visible triangles;
- LOD1: maximum 90,000 visible triangles;
- LOD2: maximum 25,000 visible triangles;
- fallback poster for no-WebGL and initial load.

### Required named mesh groups

Every major component must have stable names matching `components.ts`. Examples:

- `front_wing_main`;
- `front_wing_flap_01`;
- `front_suspension_left`;
- `monocoque`;
- `halo`;
- `sidepod_left`;
- `floor_main`;
- `venturi_left`;
- `diffuser`;
- `rear_wing_main`;
- `rear_wing_drs`;
- `wheel_front_left`;
- `brake_disc_front_left`.

### Material requirements

- compressed 2K maximum textures for desktop;
- compressed 1K variants or LOD textures for mobile;
- carbon weave must remain subtle and physically plausible;
- paint and carbon use separate roughness behavior;
- tyres must not use full-black albedo;
- glass must avoid expensive transmission on low quality;
- emissive materials are reserved for data overlays and operational lights.

### Technical-art deliverables

- GLB files;
- mesh naming manifest;
- component pivot verification;
- authored explode vectors;
- material map;
- LOD screenshots;
- triangle and texture report;
- license/source record for every external asset.

---

# PART IV — VISUAL AND MOTION SYSTEM

## 10. Art direction

The visual target is **elite motorsport engineering**, not generic cyberpunk.

### Required characteristics

- near-black graphite rather than pure black;
- cold technical white;
- restrained cyan for information;
- red only for operational urgency or active race state;
- green only for verified health/ready status;
- strong editorial typography;
- meaningful empty space;
- fewer glass cards, better hierarchy;
- physical surfaces and lighting in the 3D viewport;
- diagrams that prioritize explanation over decoration.

### Prohibited patterns

- glow around every object;
- random flicker;
- unreadably small uppercase text;
- decorative telemetry with no state source;
- excessive grid backgrounds;
- continuous auto-rotation after user interaction;
- scroll-jacking;
- hidden essential information behind hover only;
- identical desktop and mobile layouts.

## 11. Motion direction

Motion must communicate system change.

Use motion for:

- changing mode;
- changing selected component;
- moving through simulation time;
- opening DRS;
- exploding/reassembling the car;
- transferring a decision between teams;
- showing degraded and recovered network conditions.

Do not use motion merely to keep the screen visually busy.

---

# PART V — DATA CONTRACTS

## 12. Core state contracts

```ts
type ExperienceMode = 'guided' | 'explore' | 'strategy';
type TwinViewMode = 'studio' | 'technical' | 'aero' | 'thermal' | 'data';
type QualityLevel = 'auto' | 'high' | 'balanced' | 'lightweight';

interface ExperienceState {
  chapter: ChapterId;
  experienceMode: ExperienceMode;
  twinViewMode: TwinViewMode;
  qualityLevel: QualityLevel;
  selectedComponentId: string | null;
  cameraPresetId: string;
  explodeProgress: number;
  replayTimeMs: number;
  replayPlaying: boolean;
  scenarioId: string | null;
  scenarioInputs: Record<string, number | string | boolean>;
  recommendation: StrategyRecommendation | null;
  reducedMotion: boolean;
  audioEnabled: boolean;
}

interface TelemetryFrame {
  timeMs: number;
  lap: number;
  sector: number;
  channels: Record<string, number>;
  events: RaceEvent[];
}

interface StrategyRecommendation {
  action: string;
  confidence: number;
  estimatedDeltaSeconds: number;
  risk: 'low' | 'medium' | 'high';
  rationale: string[];
  requiredActions: string[];
}
```

All state consumed by UI and scene must conform to typed contracts.

---

# PART VI — RESPONSIVE, ACCESSIBILITY AND PERFORMANCE

## 13. Responsive requirements

### Desktop, 1280 px and above

Full command deck with left rail, center viewport, right inspector and bottom telemetry.

### Tablet, 768–1279 px

Viewport remains dominant. Inspector becomes collapsible. Chapter navigation becomes horizontal or compact vertical. Telemetry reduces to four primary channels.

### Mobile, below 768 px

- model occupies a dedicated viewport block;
- copy becomes concise;
- inspector is a bottom sheet;
- camera presets are a horizontal control row;
- charts become single-column;
- operations network uses a step-through view;
- no essential hover states;
- LOD2 loads by default.

## 14. Accessibility requirements

- WCAG 2.2 AA target;
- semantic landmarks and headings;
- visible focus;
- keyboard access to all controls;
- component list alternative to 3D raycasting;
- descriptive labels for charts;
- high-contrast and forced-color support;
- reduced-motion implementation, not only a media-query token;
- no audio until explicit opt-in;
- dialog focus trap and focus return;
- status announcements throttled to avoid screen-reader noise.

## 15. Performance budgets

### Initial load

- critical HTML + CSS: under 80 KB compressed;
- application JavaScript excluding Three.js vendor chunk: under 160 KB compressed;
- total initial JavaScript including vendor: under 350 KB compressed;
- initial poster and essential imagery: under 300 KB;
- first model LOD: under 2.5 MB compressed;
- full high-quality model and textures loaded after interaction or idle: under 10 MB.

### Runtime

- target 60 FPS on modern desktop;
- minimum stable 30 FPS on supported mid-tier mobile;
- desktop draw calls below 160;
- mobile draw calls below 90;
- cap device pixel ratio by quality level;
- pause render loop when document and scene are not visible;
- dispose unused geometries, textures, materials and event listeners;
- no uncontrolled object allocation inside the frame loop.

### Web vitals

- LCP under 2.5 seconds on representative mobile profile;
- CLS below 0.1;
- INP below 200 ms for primary controls;
- no long task above 200 ms during normal interaction after load.

---

# PART VII — TESTING AND CI

## 16. Test strategy

## Unit tests

Required for:

- strategy calculations;
- telemetry interpolation;
- replay time mapping;
- URL state serialization;
- quality-level decisions;
- component metadata integrity;
- explode-vector normalization;
- formatting and constraints.

## Integration tests

Required for:

- state-to-UI synchronization;
- state-to-scene synchronization;
- timeline and telemetry updates;
- scenario recommendation rendering;
- component selection and inspector updates;
- reduced-motion behavior.

## Browser tests

Playwright must verify:

- application loads;
- Command Deck is usable;
- chapter navigation works;
- visualization mode changes;
- camera preset changes;
- component can be selected through non-canvas UI;
- exploded view toggles;
- timeline scrub updates telemetry;
- all three strategy scenarios can be completed;
- mobile navigation works;
- WebGL fallback works;
- keyboard flow works;
- no console errors.

## Visual regression

Capture at minimum:

- desktop Command Deck;
- desktop Digital Twin technical mode;
- desktop Strategy Lab;
- tablet Command Deck;
- mobile Command Deck;
- high-contrast/reduced-motion representative state.

## CI workflows

### `validate-pr.yml`

Run:

1. install with lockfile;
2. typecheck;
3. lint;
4. unit tests;
5. build;
6. Playwright smoke tests;
7. artifact upload for preview screenshots.

### `lighthouse.yml`

Run on pull requests that alter production code. Enforce agreed performance thresholds with a small tolerance.

### `deploy-pages.yml`

Deploy only after successful build and tests on `main`.

---

# PART VIII — IMPLEMENTATION SEQUENCE

## 17. Phase plan and exit criteria

## Phase 0 — Baseline and freeze

Deliverables:

- capture screenshots of current production state;
- record Lighthouse and runtime performance;
- inventory all current interactions;
- tag current release as `ri06-baseline`;
- freeze new visual additions to old `.part` architecture.

Exit criteria:

- baseline report committed;
- rollback point exists.

## Phase 1 — Foundation migration

Deliverables:

- Vite and TypeScript;
- new file structure;
- current experience running through modules;
- no functional redesign yet;
- new CI gates.

Exit criteria:

- current RI-06 behavior works under new architecture;
- `.part` build is removed;
- all checks pass.

## Phase 2 — State and data model

Deliverables:

- typed application state;
- deterministic telemetry replay;
- component taxonomy;
- routing and shareable state;
- no random telemetry values.

Exit criteria:

- UI and scene read from the same state;
- replay is deterministic and tested.

## Phase 3 — Digital-twin asset pipeline

Deliverables:

- authored GLB model;
- LODs;
- compressed textures;
- loader and fallback;
- component mapping;
- initial material system.

Exit criteria:

- named component selection works;
- model meets geometry and asset budgets;
- mobile LOD works.

## Phase 4 — Command Deck

Deliverables:

- new shell;
- command rails;
- systems inspector;
- telemetry strip;
- visualization and camera controls;
- responsive compositions.

Exit criteria:

- first viewport communicates the product in five seconds;
- all controls are accessible and state-driven.

## Phase 5 — Digital Twin chapter

Deliverables:

- all five visualization modes;
- component isolation;
- authored exploded view;
- annotations;
- component camera framing.

Exit criteria:

- every taxonomy component is inspectable;
- mode transitions remain within performance budget.

## Phase 6 — Race State and Strategy Lab

Deliverables:

- replay timeline;
- synchronized charts;
- event stream;
- three strategy scenarios;
- deterministic recommendation engine;
- outcome replay.

Exit criteria:

- all scenarios pass unit and browser tests;
- no displayed value is disconnected from state.

## Phase 7 — Operations Network and Secure Experience

Deliverables:

- interactive node topology;
- signal tracing;
- degraded-network mode;
- layered secure-experience diagram;
- precise supporting copy.

Exit criteria:

- full sensor-to-decision story is explorable without 3D;
- technical claims reviewed for accuracy.

## Phase 8 — Evidence, final brief and content polish

Deliverables:

- metrics methodology;
- final chapter;
- disclaimers;
- complete copy review;
- share/reset flows.

Exit criteria:

- all illustrative values labeled;
- no placeholder copy remains.

## Phase 9 — Performance, QA and launch

Deliverables:

- frame-time optimization;
- asset compression;
- accessibility audit;
- browser matrix;
- visual regression approval;
- final GitHub Pages deployment.

Exit criteria:

- all CI gates green;
- performance budgets met or exception explicitly documented;
- no critical accessibility defects;
- no console errors in supported browsers.

---

# PART IX — IMPLEMENTATION EPIC BREAKDOWN

## 18. Recommended GitHub issues

Create the following implementation issues in this order:

1. **RI-10X: establish baseline and tag RI-06**
2. **RI-10X: migrate build to Vite and strict TypeScript**
3. **RI-10X: create application state and event contracts**
4. **RI-10X: replace random telemetry with deterministic replay**
5. **RI-10X: define digital-twin component taxonomy**
6. **RI-10X: produce optimized GLB model and LOD pipeline**
7. **RI-10X: implement SceneRuntime and quality governor**
8. **RI-10X: build Command Deck shell**
9. **RI-10X: build systems inspector and telemetry strip**
10. **RI-10X: implement component selection and camera director**
11. **RI-10X: implement authored exploded view**
12. **RI-10X: implement studio and technical twin modes**
13. **RI-10X: implement aero mode and DRS behavior**
14. **RI-10X: implement thermal mode**
15. **RI-10X: implement data-flow mode**
16. **RI-10X: build Race State timeline and synchronized charts**
17. **RI-10X: implement undercut scenario**
18. **RI-10X: implement safety-car scenario**
19. **RI-10X: implement rain-transition scenario**
20. **RI-10X: build operations-network topology**
21. **RI-10X: build secure-experience architecture chapter**
22. **RI-10X: build performance-evidence chapter**
23. **RI-10X: complete mobile-specific compositions**
24. **RI-10X: complete accessibility implementation**
25. **RI-10X: add Playwright and visual-regression suite**
26. **RI-10X: enforce performance budgets and launch**

Each issue must include:

- scope;
- non-goals;
- affected files;
- acceptance criteria;
- test requirements;
- screenshots or reference state when visual;
- dependencies;
- rollback considerations.

---

# PART X — RULES THAT PREVENT WASTED ITERATION

## 19. Development rules

1. Do not add features to the legacy `.part` architecture after Phase 1 begins.
2. Do not accept visual work without an identified user purpose.
3. Do not introduce a number that is not sourced from state or explicitly labeled illustrative.
4. Do not implement a 3D-only interaction without an accessible non-canvas equivalent.
5. Do not merge a new visualization mode without mobile and lightweight behavior.
6. Do not add a dependency without documenting bundle and maintenance impact.
7. Do not use random values in production demonstrations.
8. Do not let section code mutate another section directly.
9. Do not approve a model asset without mesh naming, pivots, LODs and size report.
10. Do not merge visual changes without before/after screenshots.
11. Do not merge interaction changes without Playwright coverage.
12. Do not allow continuous animation when the experience is off-screen.
13. Do not treat the desktop composition as the source for a scaled mobile layout.
14. Do not use “cyber” effects as a substitute for hierarchy.
15. Do not expand scope inside an implementation PR; create a new issue.

---

# PART XI — DEFINITION OF DONE

## 20. RI-10X release checklist

RI-10X can be released only when:

- [ ] The old `.part` assembly is removed.
- [ ] Vite and strict TypeScript are active.
- [ ] All application state is typed and centralized.
- [ ] Telemetry replay is deterministic.
- [ ] Three strategy scenarios are functional.
- [ ] GLB digital twin and all LODs are delivered.
- [ ] Studio, Technical, Aero, Thermal and Data modes are complete.
- [ ] Component selection, isolation and exploded view are complete.
- [ ] Camera presets and selected-component framing are complete.
- [ ] Command Deck is complete on desktop, tablet and mobile.
- [ ] Race State, Operations Network and Secure Experience chapters are complete.
- [ ] WebGL fallback is usable.
- [ ] Reduced-motion mode is verified.
- [ ] Keyboard-only path is verified.
- [ ] Unit, integration, browser and visual tests pass.
- [ ] Lighthouse and runtime budgets pass.
- [ ] All values are sourced or labeled.
- [ ] All external assets have documented provenance.
- [ ] GitHub Pages deploy succeeds from `main`.
- [ ] Final production review confirms no placeholder content, broken state or console error.

---

## 21. First implementation action

The first code PR after this document must be limited to **Phase 0 and Phase 1**:

1. tag the existing release;
2. capture baseline metrics;
3. install Vite, TypeScript, linting and test tooling;
4. migrate current behavior into modules without redesigning it;
5. remove the `.part` concatenation build;
6. prove feature parity with browser tests.

Do not begin the new RI-10X visual design or GLB integration before this foundation PR is merged. This separation prevents architecture and design debugging from being mixed in one unreviewable change.

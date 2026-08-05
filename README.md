# Race Intelligence Command Center — RI-60X

RI-60X is a unified, browser-based Formula vehicle engineering workspace. It replaces the previous layered RI-20X/30X/50X/51X build chain with one explicit runtime and an immutable authored vehicle hierarchy.

## What is included

- Detailed procedural Formula car with a redesigned nose, multi-element wings, DRS, high-undercut sidepods, venturi floor, multi-channel diffuser, cockpit, steering wheel, Halo, mirrors, brake ducts, wheel hubs, calipers and chassis-connected pushrod suspension.
- Physically differentiated carbon, painted composite, titanium, aluminium, magnesium, rubber and glass materials with subtle micro-surface variation.
- Studio, Technical, CFD, Thermal and Dynamics modes. Analytic layers are independent from the source vehicle and cannot move its wheel or chassis transforms.
- Front, Rear, Side, Top, Cockpit, Suspension and Floor cameras, constrained orbit controls, smooth transitions, component double-click focus, auto orbit and a cinematic path.
- Neutral Studio, Technical, Night Garage and Inspection light presets with ACES tone mapping, environment reflections, rim lighting and contact shadows.
- Streamline-based CFD visualization split into front-wing, tyre, floor and diffuser zones, pressure surface overlays, flow-speed control and aero-balance display.
- Braking, cornering and kerb-strike dynamics, wheel travel in millimetres, compression/rebound states, load vectors, contact patches, pitch, roll, heave and event recording/replay.
- Deterministic telemetry with mathematically linked speed, gear, RPM, throttle, braking, brake temperature, tyre temperature, ERS, DRS, wheel loads and sector delta. CSV and JSON export are built in.
- Adaptive quality manager, LOD-oriented geometry settings, automatic FPS downgrade, visibility pause, centralized disposal and a lightweight fallback.
- Dedicated iPhone workspace with a bottom command dock, safe-area support, larger touch targets and reduced mobile effects.

## Architecture

`src/ri60x` is the only production source root.

- `SceneRuntime` — renderer, environment, lighting, tone mapping, shadows and post-processing.
- `VehicleController` — authored vehicle model and transform protection.
- `CameraController` — constrained navigation, presets, focus and cinematic path.
- `OverlayManager` — CFD, technical, thermal and dynamics layers.
- `TelemetryEngine` — deterministic vehicle and thermal state.
- `QualityManager` — device classification and adaptive rendering quality.
- `AssetManager` — lifecycle, assets and service-worker registration.
- `UIController` — command workspace, diagnostics, telemetry and mobile interactions.

## Commands

```bash
npm test
npm run build
npm start
```

Browser QA is executed in GitHub Actions with Playwright across Chromium, Firefox, WebKit, tablet Chromium and mobile WebKit.

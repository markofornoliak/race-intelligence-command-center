# RI-60X Unified Runtime

## Engineering invariants

1. The authored vehicle root is built once and its local position, quaternion and scale are recorded.
2. CFD, thermal, technical and dynamics visualization live under `RI60X_ANALYTIC_OVERLAYS` and never receive references that permit direct vehicle-transform mutation.
3. `VehicleController.assertAuthoredTransforms()` restores any accidental transform drift during reset and reports how many objects were corrected.
4. Camera state is independent from scene state. Switching modes changes overlay visibility and materials, then moves to a safe camera preset only when explicitly requested.
5. Exactly one animation loop owns telemetry, camera interpolation, overlay updates, adaptive quality and rendering. It is stopped when the page becomes hidden.
6. Every module has a disposal path for geometries, materials, textures, observers and controls.

## Rendering strategy

The renderer uses ACES Filmic tone mapping, an environment generated from `RoomEnvironment`, PCF soft shadows, a neutral studio key/fill/rim rig and a low-opacity contact-shadow texture. Transparent analytic surfaces use `depthWrite: false` and polygon offsets to prevent z-fighting. CFD uses thin line geometry and a limited number of moving markers instead of particle clouds.

## Quality tiers

- High: 1.8 pixel ratio cap, 2048 shadow maps, 36 CFD lines and cinematic depth of field.
- Balanced: 1.35 pixel ratio cap, 1536 shadow maps and 24 CFD lines.
- Mobile: 1.0 pixel ratio cap, 768 shadow maps, 12 CFD lines and no depth of field.

When Auto is selected, the runtime lowers the tier after a sustained low-frame-rate percentile. It does not continuously oscillate between tiers.

## QA gates

The Node validation checks architecture tokens, responsive rules, telemetry determinism, physical bounds, export formats, source budget and forbidden overlay mutation patterns. Playwright covers mode transitions, camera reset, telemetry relationships, horizontal overflow, browser console errors, screenshot stability, performance budget and the published Pages smoke test.

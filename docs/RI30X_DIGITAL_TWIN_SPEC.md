# RI-30X Digital Twin Build Specification

RI-30X is a dedicated product-grade rebuild of the Formula car digital twin. The objective is not a higher polygon count alone; it is a coherent engineering object with believable construction, materials, lighting, inspection behavior and performance scaling.

## Required assemblies

- multi-element front wing with endplates, slot gaps and mounting pylons
- tapered nose and crash structure
- sculpted monocoque, cockpit opening, seat, steering wheel and halo
- sidepods with inlet lips, undercut and cooling exits
- floor planform, edge wings, fences, venturi tunnels and diffuser channels
- power-unit, gearbox, radiators, battery, turbo and exhaust system
- front and rear double-wishbone suspension with pushrods, dampers and uprights
- four detailed wheel assemblies with tyre sidewalls, rims, spokes, drilled brake discs, calipers and wheel nuts
- beam wing, rear wing, DRS flap, swan-neck supports and endplates
- sensor network, aerodynamic streamline and thermal visualization layers

## Rendering requirements

- procedurally generated carbon weave, tyre markings and brushed metal detail
- physically based paint, carbon, rubber, titanium, glass, ceramic and emissive materials
- generated studio environment map and soft contact shadow
- adaptive antialiasing, shadows and pixel ratio by quality mode
- technical edge overlays and selected-component inspection helpers
- wheel rotation, steering, DRS actuation and thermal response driven by application state

## Interaction requirements

- preserve all RI-20X state events and component identifiers
- raycast selection across visible subassemblies
- authored exploded offsets per engineering group
- camera focus calculated from selected assembly bounds
- high, balanced and lightweight rendering paths
- dual synchronized viewports without duplicating application state

## Acceptance gates

- at least 250 pickable rendered parts
- all 13 product component groups represented
- primary aerodynamic surfaces use authored airfoil or loft geometry rather than placeholder boxes
- deterministic animation from race-state values
- WebGL fallback remains available
- reduced-motion and lightweight modes disable non-essential animation and expensive rendering features

  /* RI-51X telemetry-driven overlays. Non-invasive: the authored car transform is never mutated. */
  try {
    const ri51Root = new THREE.Group();
    ri51Root.name = 'RI51X_VEHICLE_DYNAMICS';
    world.add(ri51Root);

    const ri51SuspensionGroup = new THREE.Group();
    ri51SuspensionGroup.name = 'RI51X_ACTIVE_SUSPENSION';
    const ri51CfdGroup = new THREE.Group();
    ri51CfdGroup.name = 'RI51X_LIVE_CFD_FIELD';
    const ri51PressureGroup = new THREE.Group();
    ri51PressureGroup.name = 'RI51X_PRESSURE_FIELD';
    const ri51VectorGroup = new THREE.Group();
    ri51VectorGroup.name = 'RI51X_LOAD_VECTORS';
    const ri51BrakeCoolingGroup = new THREE.Group();
    ri51BrakeCoolingGroup.name = 'RI51X_BRAKE_COOLING';
    ri51Root.add(ri51SuspensionGroup, ri51CfdGroup, ri51PressureGroup, ri51VectorGroup, ri51BrakeCoolingGroup);

    const ri51Config3d = {
      rideHeight: 36,
      damping: 6.4,
      aeroBalance: 46.5,
      flowDensity: 58,
      cooling: 68,
      showVectors: true,
      showPressure: true,
      showWake: true,
      showSuspension: true,
      freeze: false
    };

    let ri51Mode = 'overview';
    let ri51FrozenFrame = null;
    let ri51Time = 0;
    const ri51ReducedMotion = reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ri51Materials = {
      carbon: new THREE.MeshPhysicalMaterial({ color: 0x0a0d10, roughness: .5, metalness: .42, clearcoat: .5 }),
      metal: new THREE.MeshStandardMaterial({ color: 0xaab2b8, roughness: .24, metalness: .92 }),
      white: new THREE.MeshBasicMaterial({ color: 0xf4f6f7, toneMapped: false }),
      red: new THREE.MeshBasicMaterial({ color: 0xe10600, toneMapped: false }),
      amber: new THREE.MeshBasicMaterial({ color: 0xffa51f, toneMapped: false }),
      cyan: new THREE.MeshBasicMaterial({ color: 0x8bdcff, toneMapped: false }),
      glowWhite: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      glowRed: new THREE.MeshBasicMaterial({ color: 0xe10600, transparent: true, opacity: .1, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      glowCyan: new THREE.MeshBasicMaterial({ color: 0x5ccfff, transparent: true, opacity: .1, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
    };

    const ri51Add = (geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], name = 'PART', parent = ri51Root) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `RI51X_${name}`;
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      parent.add(mesh);
      return mesh;
    };

    const ri51SetLink = (mesh, a, b) => {
      const delta = b.clone().sub(a);
      const length = Math.max(.001, delta.length());
      mesh.position.copy(a).add(b).multiplyScalar(.5);
      mesh.scale.set(1, length, 1);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    };

    const ri51LinkGeometry = new THREE.CylinderGeometry(.022, .022, 1, 10);
    const ri51ThickLinkGeometry = new THREE.CylinderGeometry(.032, .032, 1, 12);
    const ri51WheelRigs = [];
    const ri51CornerNames = ['FL', 'FR', 'RL', 'RR'];

    wheelAssemblies.forEach((wheel, index) => {
      const base = wheel.root.position.clone();
      const front = Boolean(wheel.front);
      const side = Math.sign(base.z) || (index % 2 ? 1 : -1);
      const rig = new THREE.Group();
      rig.name = `RI51X_SUSPENSION_RIG_${ri51CornerNames[index] || index}`;
      rig.position.copy(base);
      ri51SuspensionGroup.add(rig);

      const movingHub = new THREE.Group();
      movingHub.name = `RI51X_HUB_MOTION_${index}`;
      rig.add(movingHub);

      ri51Add(new THREE.CylinderGeometry(.14, .14, .22, 18), ri51Materials.metal, [0, 0, 0], [Math.PI / 2, 0, 0], `HUB_CARRIER_${index}`, movingHub);
      ri51Add(new THREE.TorusGeometry(.26, .014, 8, 42), index < 2 ? ri51Materials.glowCyan.clone() : ri51Materials.glowWhite.clone(), [0, 0, 0], [Math.PI / 2, 0, 0], `TRAVEL_RING_${index}`, movingHub);

      const contactPatch = ri51Add(
        new THREE.CircleGeometry(.28, 36),
        index < 2 ? ri51Materials.glowCyan.clone() : ri51Materials.glowWhite.clone(),
        [0, -wheel.radius + .018, 0],
        [-Math.PI / 2, 0, 0],
        `CONTACT_PATCH_${index}`,
        movingHub
      );
      contactPatch.scale.set(1.25, .52, 1);

      const chassisNear = new THREE.Vector3(front ? .82 : -.82, .28, -side * .78);
      const chassisFar = new THREE.Vector3(front ? .38 : -.38, .68, -side * .68);
      const chassisPush = new THREE.Vector3(front ? .48 : -.48, .92, -side * .46);
      const links = [
        { mesh: ri51Add(ri51LinkGeometry.clone(), ri51Materials.carbon, [0, 0, 0], [0, 0, 0], `UPPER_WISHBONE_A_${index}`, rig), anchor: chassisFar, hub: new THREE.Vector3(0, .18, 0) },
        { mesh: ri51Add(ri51LinkGeometry.clone(), ri51Materials.carbon, [0, 0, 0], [0, 0, 0], `UPPER_WISHBONE_B_${index}`, rig), anchor: chassisNear, hub: new THREE.Vector3(0, .18, 0) },
        { mesh: ri51Add(ri51ThickLinkGeometry.clone(), ri51Materials.carbon, [0, 0, 0], [0, 0, 0], `LOWER_WISHBONE_A_${index}`, rig), anchor: new THREE.Vector3(chassisNear.x, -.05, chassisNear.z), hub: new THREE.Vector3(0, -.2, 0) },
        { mesh: ri51Add(ri51ThickLinkGeometry.clone(), ri51Materials.carbon, [0, 0, 0], [0, 0, 0], `LOWER_WISHBONE_B_${index}`, rig), anchor: new THREE.Vector3(chassisFar.x, .02, chassisFar.z), hub: new THREE.Vector3(0, -.2, 0) },
        { mesh: ri51Add(ri51LinkGeometry.clone(), ri51Materials.metal, [0, 0, 0], [0, 0, 0], `TRACK_ROD_${index}`, rig), anchor: new THREE.Vector3(front ? .32 : -.32, .22, -side * .86), hub: new THREE.Vector3(0, .02, 0) },
        { mesh: ri51Add(ri51ThickLinkGeometry.clone(), ri51Materials.metal, [0, 0, 0], [0, 0, 0], `PUSHROD_${index}`, rig), anchor: chassisPush, hub: new THREE.Vector3(0, .2, 0) }
      ];

      const damper = new THREE.Group();
      damper.name = `RI51X_DAMPER_${index}`;
      damper.position.copy(chassisPush).add(new THREE.Vector3(0, .02, 0));
      rig.add(damper);
      ri51Add(new THREE.CylinderGeometry(.07, .08, .38, 16), ri51Materials.carbon, [0, 0, 0], [0, 0, 0], `DAMPER_BODY_${index}`, damper);
      const damperRod = ri51Add(new THREE.CylinderGeometry(.024, .024, .26, 10), ri51Materials.metal, [0, -.29, 0], [0, 0, 0], `DAMPER_ROD_${index}`, damper);
      const spring = ri51Add(new THREE.TorusKnotGeometry(.105, .011, 72, 8, 2, 9), index < 2 ? ri51Materials.cyan : ri51Materials.white, [0, 0, 0], [0, 0, 0], `SPRING_${index}`, damper);
      spring.scale.set(.72, .72, .72);

      ri51WheelRigs.push({
        wheel, index, base, rig, movingHub, links, damper, damperRod, spring, contactPatch,
        travel: 0, targetTravel: 0
      });
    });

    const ri51LoadArrows = [
      { position: [-3.7, 2.6, 0], key: 'front', color: 0xf5f7f8 },
      { position: [.15, 2.45, 0], key: 'floor', color: 0xe10600 },
      { position: [3.75, 2.6, 0], key: 'rear', color: 0xf5f7f8 }
    ].map((spec, index) => {
      const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(...spec.position), 1.4, spec.color, .18, .1);
      arrow.name = `RI51X_LOAD_VECTOR_${index}`;
      ri51VectorGroup.add(arrow);
      return { ...spec, arrow };
    });

    const ri51CopMarker = new THREE.Group();
    ri51CopMarker.name = 'RI51X_CENTRE_OF_PRESSURE';
    ri51VectorGroup.add(ri51CopMarker);
    ri51Add(new THREE.TorusGeometry(.22, .014, 8, 42), ri51Materials.red, [0, 0, 0], [Math.PI / 2, 0, 0], 'CENTRE_OF_PRESSURE_RING', ri51CopMarker);
    ri51Add(new THREE.CylinderGeometry(.006, .006, 1.5, 6), ri51Materials.glowRed.clone(), [0, .75, 0], [0, 0, 0], 'CENTRE_OF_PRESSURE_BEAM', ri51CopMarker);

    const ri51PressureSpecs = [
      [-4.55, .02, 0, 1.25, .28, 1.55, ri51Materials.glowRed, 'NOSE_HIGH_PRESSURE'],
      [-4.25, -.42, 0, 1.55, .18, 2.1, ri51Materials.glowCyan, 'FRONT_WING_LOW_PRESSURE'],
      [.25, -.58, 0, 4.1, .16, 1.15, ri51Materials.glowCyan, 'FLOOR_LOW_PRESSURE'],
      [3.55, -.16, 0, 1.45, .42, 1.05, ri51Materials.glowRed, 'DIFFUSER_RECOVERY'],
      [4.15, 1.06, 0, .75, .35, 1.95, ri51Materials.glowRed, 'REAR_WING_PRESSURE']
    ];
    const ri51PressureNodes = ri51PressureSpecs.map(([x, y, z, sx, sy, sz, source, name], index) => {
      const material = source.clone();
      const mesh = ri51Add(new THREE.SphereGeometry(1, 22, 14), material, [x, y, z], [0, 0, 0], name, ri51PressureGroup);
      mesh.scale.set(sx, sy, sz);
      mesh.userData.baseScale = mesh.scale.clone();
      mesh.userData.phase = index * .7;
      return mesh;
    });

    const ri51ParticleMax = constrainedDevice ? 260 : 720;
    const ri51Positions = new Float32Array(ri51ParticleMax * 3);
    const ri51Colors = new Float32Array(ri51ParticleMax * 3);
    const ri51Seeds = Array.from({ length: ri51ParticleMax }, (_, index) => ({
      lane: (index % 30) - 14.5,
      layer: Math.floor(index / 30) % 5,
      phase: (index * .61803398875) % 1
    }));

    const ri51FlowGeometry = new THREE.BufferGeometry();
    ri51FlowGeometry.setAttribute('position', new THREE.BufferAttribute(ri51Positions, 3));
    ri51FlowGeometry.setAttribute('color', new THREE.BufferAttribute(ri51Colors, 3));
    const ri51FlowMaterial = new THREE.PointsMaterial({
      size: constrainedDevice ? .03 : .038,
      vertexColors: true,
      transparent: true,
      opacity: .66,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const ri51FlowPoints = new THREE.Points(ri51FlowGeometry, ri51FlowMaterial);
    ri51FlowPoints.name = 'RI51X_CFD_PARTICLE_FIELD';
    ri51CfdGroup.add(ri51FlowPoints);

    const ri51Streamlines = [];
    for (let lane = -8; lane <= 8; lane += 1) {
      const side = lane / 8;
      const points = [];
      for (let sample = 0; sample <= 64; sample += 1) {
        const t = sample / 64;
        const x = -7.8 + t * 15.8;
        const body = Math.exp(-Math.pow(x * .34, 2));
        points.push(new THREE.Vector3(
          x,
          .14 + Math.abs(side) * .18 + body * .42 - Math.exp(-Math.pow((x - .4) * .45, 2)) * .3,
          side * (2.55 - body * .78)
        ));
      }
      const material = new THREE.LineBasicMaterial({
        color: lane === 0 ? 0xe10600 : 0xdde4e8,
        transparent: true,
        opacity: lane === 0 ? .15 : .055,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
      line.name = `RI51X_STREAMLINE_${lane}`;
      ri51CfdGroup.add(line);
      ri51Streamlines.push(line);
    }

    const ri51WakeShape = new THREE.Shape();
    ri51WakeShape.moveTo(0, -.62);
    ri51WakeShape.quadraticCurveTo(2.7, -1.1, 7.4, -2.1);
    ri51WakeShape.lineTo(7.4, 2.1);
    ri51WakeShape.quadraticCurveTo(2.7, 1.1, 0, .62);
    ri51WakeShape.closePath();
    const ri51WakeRibbon = ri51Add(
      new THREE.ShapeGeometry(ri51WakeShape, 24),
      ri51Materials.glowRed.clone(),
      [4.35, .66, 0],
      [Math.PI / 2, 0, 0],
      'REAR_WAKE_RIBBON',
      ri51CfdGroup
    );

    const ri51CoolingRings = [];
    ri51WheelRigs.forEach((rig, index) => {
      const cooling = new THREE.Group();
      cooling.name = `RI51X_BRAKE_DUCT_${index}`;
      cooling.position.copy(rig.base);
      ri51BrakeCoolingGroup.add(cooling);
      ri51Add(new THREE.TorusGeometry(.31, .07, 12, 36, Math.PI * 1.55), ri51Materials.carbon, [0, 0, 0], [Math.PI / 2, 0, rig.index % 2 ? -.25 : .25], `BRAKE_DUCT_${index}`, cooling);
      for (let ring = 0; ring < 3; ring += 1) {
        const flowRing = ri51Add(new THREE.TorusGeometry(.24 + ring * .07, .009, 6, 36), ri51Materials.glowCyan.clone(), [0, 0, 0], [Math.PI / 2, 0, 0], `BRAKE_COOLING_RING_${index}_${ring}`, cooling);
        flowRing.userData.phase = index * .3 + ring * .38;
        ri51CoolingRings.push(flowRing);
      }
    });

    const ri51Clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const ri51LoadState = (frame) => {
      const speedMs = (frame?.speed || 0) / 3.6;
      const dynamicPressure = .5 * 1.225 * speedMs * speedMs;
      const downforce = dynamicPressure * 3.55;
      const drag = dynamicPressure * .91;
      const braking = ri51Clamp(((frame?.brake || 430) - 420) / 430, 0, 1);
      const phase = (frame?.progress || 0) * Math.PI * 12;
      const pitch = Math.sin(phase + 1.1) * 2.2 - braking * 4.8;
      const roll = Math.sin(phase * .63) * 3.4;
      const heave = Math.sin(phase * 1.8) * 1.3 + downforce / 6200 * 3.1;
      return { speedMs, dynamicPressure, downforce, drag, braking, phase, pitch, roll, heave };
    };

    const ri51UpdateSuspension = (load, delta) => {
      const response = ri51ReducedMotion ? 1 : 1 - Math.exp(-delta * (3 + ri51Config3d.damping * .55));
      const travels = [
        load.heave - load.pitch * .42 - load.roll * .36,
        load.heave - load.pitch * .42 + load.roll * .36,
        load.heave + load.pitch * .32 - load.roll * .3,
        load.heave + load.pitch * .32 + load.roll * .3
      ];

      ri51WheelRigs.forEach((rig, index) => {
        rig.targetTravel = ri51Clamp((travels[index] || 0) * .008, -.055, .055);
        rig.travel = THREE.MathUtils.lerp(rig.travel, rig.targetTravel, response);
        rig.movingHub.position.y = -rig.travel;

        const hubOffset = new THREE.Vector3(0, -rig.travel, 0);
        rig.links.forEach((link) => ri51SetLink(link.mesh, link.anchor, link.hub.clone().add(hubOffset)));
        rig.damperRod.position.y = -.29 - rig.travel * .65;
        rig.damperRod.scale.y = 1 + Math.abs(rig.travel) * 2.2;
        rig.spring.scale.y = .72 - rig.travel * .9;
        rig.contactPatch.scale.x = 1.15 + load.downforce / 16000;
        rig.contactPatch.material.opacity = .045 + Math.abs(rig.travel) * 1.4;
      });
    };

    const ri51UpdateVectors = (load) => {
      const frontShare = ri51Config3d.aeroBalance / 100;
      const shares = { front: frontShare * .54, floor: .46, rear: (1 - frontShare) * .54 };
      ri51LoadArrows.forEach((item) => {
        const length = .55 + load.downforce * shares[item.key] / 1250;
        item.arrow.setLength(length, .18, .1);
        item.arrow.position.y = 1.75 + length;
      });
      const copX = THREE.MathUtils.mapLinear(frontShare, .42, .51, 1.15, -.75);
      ri51CopMarker.position.set(copX, -.96, 0);
      ri51VectorGroup.visible = ri51Config3d.showVectors && (ri51Mode === 'dynamics' || ri51Mode === 'cfd' || state.view === 'technical' || state.view === 'aero');
    };

    const ri51UpdatePressure = (load, time) => {
      const intensity = ri51Clamp(load.dynamicPressure / 5900, .12, 1);
      ri51PressureNodes.forEach((node, index) => {
        const pulse = ri51ReducedMotion ? 1 : 1 + Math.sin(time * 1.2 + node.userData.phase) * .025;
        node.scale.copy(node.userData.baseScale).multiplyScalar(pulse);
        node.material.opacity = (.035 + intensity * .075) * (index === 2 ? 1.15 : 1);
      });
      ri51PressureGroup.visible = ri51Config3d.showPressure && (ri51Mode === 'cfd' || state.view === 'aero');
    };

    const ri51UpdateFlow = (load, time) => {
      const activeCount = Math.round(ri51ParticleMax * ri51Config3d.flowDensity / 100);
      ri51FlowGeometry.setDrawRange(0, activeCount);
      const positions = ri51FlowGeometry.attributes.position.array;
      const colors = ri51FlowGeometry.attributes.color.array;
      const advance = .028 + load.speedMs * .00062;

      for (let index = 0; index < activeCount; index += 1) {
        const seed = ri51Seeds[index];
        const progress = (seed.phase + time * advance) % 1;
        const x = -8.2 + progress * 17;
        const side = seed.lane / 14.5;
        const body = Math.exp(-Math.pow(x * .34, 2));
        const floor = Math.exp(-Math.pow((x - .15) * .28, 2));
        const wake = ri51Clamp((x - 3.15) / 4.8, 0, 1);
        let y = -.32 + seed.layer * .23 + body * (.42 + Math.abs(side) * .16);
        let z = side * (2.7 - body * .82);
        if (seed.layer < 2) y -= floor * .42;
        if (x > 3.15) {
          y += wake * .28;
          z *= 1 + wake * .6;
        }
        positions[index * 3] = x;
        positions[index * 3 + 1] = y;
        positions[index * 3 + 2] = z;

        const hot = ri51Clamp(.2 + wake * .8 - floor * .42, 0, 1);
        colors[index * 3] = .58 + hot * .32;
        colors[index * 3 + 1] = .74 - hot * .58;
        colors[index * 3 + 2] = .82 - hot * .62;
      }

      ri51FlowGeometry.attributes.position.needsUpdate = true;
      ri51FlowGeometry.attributes.color.needsUpdate = true;
      ri51FlowMaterial.opacity = .34 + ri51Clamp(load.speedMs / 110, 0, 1) * .28;
      ri51WakeRibbon.material.opacity = ri51Config3d.showWake ? .025 + load.drag / 18000 : 0;
      ri51CfdGroup.visible = ri51Config3d.showWake && (ri51Mode === 'cfd' || state.view === 'aero');
    };

    const ri51UpdateCooling = (load, time) => {
      const factor = ri51Config3d.cooling / 100;
      ri51CoolingRings.forEach((ring) => {
        const progress = (time * .45 + ring.userData.phase) % 1;
        ring.scale.setScalar(1 + progress * .65);
        ring.material.opacity = Math.max(0, .09 - progress * .08) * factor * (.45 + load.speedMs / 120);
      });
      ri51BrakeCoolingGroup.visible = factor > .3 && (state.view === 'thermal' || ri51Mode === 'dynamics');
    };

    addEventListener('ri:vehicle-lab-config', (event) => {
      Object.assign(ri51Config3d, event.detail || {});
      if (ri51Config3d.freeze && !ri51FrozenFrame) ri51FrozenFrame = state.frame ? { ...state.frame } : null;
      if (!ri51Config3d.freeze) ri51FrozenFrame = null;
    });
    addEventListener('ri:vehicle-lab-mode', (event) => { ri51Mode = event.detail?.mode || 'overview'; });

    let ri51Previous = performance.now();
    const ri51Animate = (now) => {
      const delta = Math.min(.05, (now - ri51Previous) / 1000);
      ri51Previous = now;
      if (!ri51Config3d.freeze) ri51Time += delta;
      const frame = ri51Config3d.freeze ? (ri51FrozenFrame || state.frame) : state.frame;
      const load = ri51LoadState(frame);

      ri51UpdateSuspension(load, delta);
      ri51UpdateVectors(load);
      ri51UpdatePressure(load, ri51Time);
      ri51UpdateFlow(load, ri51Time);
      ri51UpdateCooling(load, ri51Time);

      ri51SuspensionGroup.visible = ri51Config3d.showSuspension && (
        ri51Mode === 'dynamics' ||
        state.view === 'technical' ||
        state.selectedComponent === 'front-suspension' ||
        state.selectedComponent === 'rear-suspension'
      );
      ri51Root.visible = state.quality !== 'lightweight';
      requestAnimationFrame(ri51Animate);
    };
    requestAnimationFrame(ri51Animate);

    document.documentElement.dataset.vehicleDynamics = 'ri51x-stable';
    dispatchEvent(new CustomEvent('ri:dynamics-ready', {
      detail: {
        particles: ri51ParticleMax,
        suspensionRigs: ri51WheelRigs.length,
        pressureNodes: ri51PressureNodes.length,
        nonInvasive: true
      }
    }));
  } catch (error) {
    console.warn('RI-51X vehicle dynamics extension was skipped:', error);
  }

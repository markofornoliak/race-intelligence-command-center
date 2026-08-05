  /* RI-40X.1 authored detail pass. Injected inside the WebGL capability block. */
  try {
    const ri40xDetails = new THREE.Group();
    ri40xDetails.name = 'RI40X_AUTHORED_DETAIL_PASS';
    world.add(ri40xDetails);

    const detailMaterials = {
      carbon: new THREE.MeshPhysicalMaterial({
        color: 0x05080a,
        roughness: 0.42,
        metalness: 0.26,
        clearcoat: 0.72,
        clearcoatRoughness: 0.28
      }),
      carbonMatte: new THREE.MeshStandardMaterial({ color: 0x080c0f, roughness: 0.78, metalness: 0.16 }),
      cyan: new THREE.MeshPhysicalMaterial({
        color: 0x43dfff,
        emissive: 0x0a7f9e,
        emissiveIntensity: 0.55,
        roughness: 0.24,
        metalness: 0.52,
        clearcoat: 1,
        clearcoatRoughness: 0.16
      }),
      red: new THREE.MeshPhysicalMaterial({
        color: 0xff3853,
        emissive: 0x5f0613,
        emissiveIntensity: 0.5,
        roughness: 0.28,
        metalness: 0.44,
        clearcoat: 1
      }),
      titanium: new THREE.MeshStandardMaterial({ color: 0xa9bbc5, roughness: 0.24, metalness: 0.92 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x0b2533,
        roughness: 0.08,
        metalness: 0.12,
        transmission: constrainedDevice ? 0 : 0.42,
        transparent: true,
        opacity: constrainedDevice ? 0.72 : 0.56,
        thickness: 0.12,
        clearcoat: 1
      }),
      tyreMark: new THREE.MeshBasicMaterial({ color: 0xffd452, toneMapped: false }),
      rainLight: new THREE.MeshBasicMaterial({ color: 0xff173d, toneMapped: false })
    };

    let enhancedPartCount = 0;
    const addDetail = ({ geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], name, parent = ri40xDetails, castShadow = true }) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `RI40X_${name || 'DETAIL'}`;
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.scale.set(...scale);
      mesh.castShadow = castShadow && !constrainedDevice;
      mesh.receiveShadow = !constrainedDevice;
      mesh.userData.ri40xDetail = true;
      parent.add(mesh);
      enhancedPartCount += 1;
      return mesh;
    };

    const roundedPanel = (w, h, d, radius = 0.04) => {
      const shape = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      shape.moveTo(x + radius, y);
      shape.lineTo(x + w - radius, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + radius);
      shape.lineTo(x + w, y + h - radius);
      shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      shape.lineTo(x + radius, y + h);
      shape.quadraticCurveTo(x, y + h, x, y + h - radius);
      shape.lineTo(x, y + radius);
      shape.quadraticCurveTo(x, y, x + radius, y);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: d,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: Math.min(radius * 0.42, d * 0.45),
        bevelThickness: d * 0.32
      });
      geometry.center();
      return geometry;
    };

    const addCylinderBetween = (a, b, radius, material, name, parent = ri40xDetails) => {
      const start = new THREE.Vector3(...a);
      const end = new THREE.Vector3(...b);
      const delta = end.clone().sub(start);
      const mesh = addDetail({
        geometry: new THREE.CylinderGeometry(radius, radius, delta.length(), 12),
        material,
        position: start.clone().add(end).multiplyScalar(0.5).toArray(),
        name,
        parent
      });
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
      return mesh;
    };

    addDetail({ geometry: roundedPanel(2.35, 0.055, 0.016, 0.018), material: detailMaterials.cyan, position: [-3.34, 0.79, 0], rotation: [Math.PI / 2, 0.02, 0], name: 'NOSE_CYAN_SIGNATURE' });
    addDetail({ geometry: roundedPanel(1.08, 0.042, 0.014, 0.014), material: detailMaterials.red, position: [-4.34, 0.72, 0], rotation: [Math.PI / 2, -0.04, 0], name: 'NOSE_RED_SIGNATURE' });
    addDetail({ geometry: roundedPanel(2.1, 0.17, 0.018, 0.028), material: detailMaterials.cyan, position: [0.62, 0.96, 1.165], rotation: [0.03, 0.09, -0.04], name: 'SIDEPOD_CYAN_R' });
    addDetail({ geometry: roundedPanel(2.1, 0.17, 0.018, 0.028), material: detailMaterials.cyan, position: [0.62, 0.96, -1.165], rotation: [-0.03, -0.09, -0.04], name: 'SIDEPOD_CYAN_L' });
    addDetail({ geometry: roundedPanel(1.34, 0.075, 0.014, 0.02), material: detailMaterials.red, position: [1.55, 1.23, 0.55], rotation: [0.16, 0.1, -0.08], name: 'ENGINE_RED_R' });
    addDetail({ geometry: roundedPanel(1.34, 0.075, 0.014, 0.02), material: detailMaterials.red, position: [1.55, 1.23, -0.55], rotation: [-0.16, -0.1, -0.08], name: 'ENGINE_RED_L' });

    [-1, 1].forEach((side) => {
      const mirror = new THREE.Group();
      mirror.name = `RI40X_MIRROR_${side > 0 ? 'R' : 'L'}`;
      ri40xDetails.add(mirror);
      addCylinderBetween([-0.64, 1.18, side * 0.7], [-0.42, 1.36, side * 1.04], 0.025, detailMaterials.titanium, `MIRROR_STALK_${side}`, mirror);
      addDetail({ geometry: roundedPanel(0.33, 0.16, 0.11, 0.055), material: detailMaterials.carbon, position: [-0.36, 1.39, side * 1.105], rotation: [0, side * 0.18, side * -0.05], name: `MIRROR_SHELL_${side}`, parent: mirror });
      addDetail({ geometry: roundedPanel(0.255, 0.112, 0.012, 0.04), material: detailMaterials.glass, position: [-0.395, 1.405, side * 1.165], rotation: [0, side * 0.18, side * -0.05], name: `MIRROR_GLASS_${side}`, parent: mirror, castShadow: false });
      addDetail({ geometry: new THREE.BoxGeometry(0.44, 0.028, 0.12), material: detailMaterials.carbonMatte, position: [-0.23, 1.26, side * 1.02], rotation: [0, side * 0.15, side * 0.13], name: `MIRROR_AERO_VANE_${side}`, parent: mirror });
    });

    addDetail({ geometry: roundedPanel(0.34, 0.11, 0.08, 0.035), material: detailMaterials.cyan, position: [0.28, 1.72, 0], rotation: [0, 0, -0.04], name: 'T_CAMERA_HEAD' });
    addDetail({ geometry: new THREE.CylinderGeometry(0.035, 0.047, 0.42, 14), material: detailMaterials.carbon, position: [0.28, 1.52, 0], name: 'T_CAMERA_MAST' });
    addDetail({ geometry: new THREE.SphereGeometry(0.035, 16, 10), material: detailMaterials.glass, position: [0.115, 1.72, 0], name: 'T_CAMERA_LENS', castShadow: false });
    addCylinderBetween([-4.08, 0.84, 0], [-4.62, 0.91, 0], 0.012, detailMaterials.titanium, 'PITOT_MAIN');
    addCylinderBetween([-4.46, 0.9, 0], [-4.39, 1.02, 0.07], 0.007, detailMaterials.titanium, 'PITOT_YAW_R');
    addCylinderBetween([-4.46, 0.9, 0], [-4.39, 1.02, -0.07], 0.007, detailMaterials.titanium, 'PITOT_YAW_L');
    [1.02, 1.38, 1.74, 2.12].forEach((x, index) => {
      const height = 0.25 - index * 0.025;
      addCylinderBetween([x, 1.42 - index * 0.01, 0], [x + 0.015, 1.42 + height, 0], 0.009 - index * 0.001, index === 0 ? detailMaterials.cyan : detailMaterials.titanium, `RADIO_AERIAL_${index}`);
    });

    [-1, 1].forEach((side) => {
      addDetail({ geometry: new THREE.BoxGeometry(4.75, 0.045, 0.08), material: detailMaterials.cyan, position: [0.36, 0.09, side * 1.54], rotation: [0, 0, -0.012], name: `FLOOR_EDGE_${side}` });
      for (let fence = 0; fence < 7; fence += 1) {
        addDetail({
          geometry: new THREE.BoxGeometry(0.56 + fence * 0.035, 0.11, 0.025),
          material: detailMaterials.carbonMatte,
          position: [-1.18 + fence * 0.62, 0.16, side * (1.22 + fence * 0.038)],
          rotation: [0, side * (0.16 + fence * 0.012), -0.045],
          name: `FLOOR_FENCE_${side}_${fence}`
        });
      }
      for (let strake = 0; strake < 5; strake += 1) {
        addDetail({
          geometry: new THREE.BoxGeometry(1.18, 0.18, 0.022),
          material: detailMaterials.carbonMatte,
          position: [1.05 + strake * 0.42, -0.02, side * (0.44 + strake * 0.17)],
          rotation: [0, side * 0.08, -0.025],
          name: `DIFFUSER_STRAKE_${side}_${strake}`
        });
      }
    });

    const wheelPositions = [
      { x: -3.18, z: -1.69, front: true }, { x: -3.18, z: 1.69, front: true },
      { x: 3.04, z: -1.63, front: false }, { x: 3.04, z: 1.63, front: false }
    ];
    wheelPositions.forEach((wheel, index) => {
      const side = Math.sign(wheel.z);
      addDetail({ geometry: new THREE.TorusGeometry(wheel.front ? 0.49 : 0.53, 0.018, 8, 64), material: detailMaterials.tyreMark, position: [wheel.x, 0.55, wheel.z + side * 0.395], name: `TYRE_ID_RING_${index}`, castShadow: false });
      addDetail({ geometry: new THREE.CylinderGeometry(wheel.front ? 0.23 : 0.25, wheel.front ? 0.23 : 0.25, 0.035, 28), material: detailMaterials.carbon, position: [wheel.x, 0.55, wheel.z + side * 0.42], rotation: [Math.PI / 2, 0, 0], name: `WHEEL_COVER_${index}` });
      addDetail({ geometry: new THREE.CylinderGeometry(0.055, 0.055, 0.055, 16), material: index % 2 ? detailMaterials.red : detailMaterials.cyan, position: [wheel.x, 0.55, wheel.z + side * 0.445], rotation: [Math.PI / 2, 0, 0], name: `WHEEL_NUT_${index}` });
      addDetail({ geometry: roundedPanel(0.58, 0.1, 0.035, 0.025), material: detailMaterials.carbonMatte, position: [wheel.x - (wheel.front ? 0.15 : -0.1), 1.06, wheel.z], rotation: [0, side * 0.18, side * -0.08], name: `WHEEL_BROW_${index}` });
    });

    const rainLight = addDetail({ geometry: roundedPanel(0.2, 0.12, 0.055, 0.035), material: detailMaterials.rainLight, position: [4.72, 0.43, 0], rotation: [0, Math.PI / 2, 0], name: 'RAIN_LIGHT', castShadow: false });
    const rainHalo = addDetail({ geometry: new THREE.RingGeometry(0.095, 0.14, 28), material: new THREE.MeshBasicMaterial({ color: 0xff2948, transparent: true, opacity: 0.24, side: THREE.DoubleSide, toneMapped: false }), position: [4.755, 0.43, 0], rotation: [0, Math.PI / 2, 0], name: 'RAIN_LIGHT_HALO', castShadow: false });
    [-1, 1].forEach((side) => {
      addDetail({ geometry: roundedPanel(0.36, 0.075, 0.03, 0.018), material: detailMaterials.red, position: [4.28, 0.62, side * 0.74], rotation: [0, side * 0.08, 0], name: `REAR_POSITION_LIGHT_${side}`, castShadow: false });
    });

    const energyCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.55, 0.5, 0),
      new THREE.Vector3(-1.3, 0.42, 0),
      new THREE.Vector3(0.25, 0.34, 0),
      new THREE.Vector3(1.65, 0.44, 0),
      new THREE.Vector3(3.35, 0.54, 0)
    ]);
    const energySpine = addDetail({ geometry: new THREE.TubeGeometry(energyCurve, 96, 0.018, 8, false), material: new THREE.MeshBasicMaterial({ color: 0x66e4ff, transparent: true, opacity: 0.5, toneMapped: false }), name: 'ERS_ENERGY_SPINE', castShadow: false });
    const energyPulse = addDetail({ geometry: new THREE.SphereGeometry(0.055, 14, 10), material: new THREE.MeshBasicMaterial({ color: 0xd8fbff, toneMapped: false }), name: 'ERS_ENERGY_PULSE', castShadow: false });

    const sparkCount = constrainedDevice ? 18 : 44;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocity = Array.from({ length: sparkCount }, (_, index) => ({
      speed: 2.8 + (index % 9) * 0.19,
      lift: 0.12 + (index % 5) * 0.035,
      phase: index / sparkCount
    }));
    for (let index = 0; index < sparkCount; index += 1) {
      sparkPositions[index * 3] = 1.1 + (index % 7) * 0.12;
      sparkPositions[index * 3 + 1] = -0.16;
      sparkPositions[index * 3 + 2] = ((index % 11) - 5) * 0.055;
    }
    const sparkGeometry = new THREE.BufferGeometry();
    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparks = new THREE.Points(sparkGeometry, new THREE.PointsMaterial({ color: 0xffc25f, size: constrainedDevice ? 0.035 : 0.05, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    sparks.name = 'RI40X_FLOOR_SPARKS';
    sparks.visible = !reducedMotion;
    ri40xDetails.add(sparks);

    const silhouette = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(9.7, 1.12, 3.65)),
      new THREE.LineBasicMaterial({ color: 0x66e4ff, transparent: true, opacity: 0.045, toneMapped: false })
    );
    silhouette.name = 'RI40X_TECHNICAL_ENVELOPE';
    silhouette.position.set(0, 0.78, 0);
    ri40xDetails.add(silhouette);

    const detailClock = new THREE.Clock();
    const animateRi40xDetails = () => {
      const t = detailClock.getElapsedTime();
      const speedValue = typeof state.frame === 'object' ? Number(state.frame?.speed || 220) : 220;
      const intensity = THREE.MathUtils.clamp((speedValue - 120) / 230, 0.12, 1);

      rainLight.material.color.setHex(Math.sin(t * 9) > -0.22 ? 0xff173d : 0x4a0713);
      rainHalo.material.opacity = 0.1 + (Math.sin(t * 9) * 0.5 + 0.5) * 0.28;
      rainHalo.scale.setScalar(1 + (Math.sin(t * 9) * 0.5 + 0.5) * 0.22);

      const pulseProgress = (t * (0.2 + intensity * 0.55)) % 1;
      energyPulse.position.copy(energyCurve.getPointAt(pulseProgress));
      energySpine.material.opacity = state.view === 'data' || state.view === 'technical' ? 0.82 : 0.28;
      energyPulse.visible = state.view === 'data' || state.view === 'technical';
      silhouette.material.opacity = state.view === 'technical' ? 0.16 : 0.035;

      if (!reducedMotion) {
        const attribute = sparkGeometry.getAttribute('position');
        for (let index = 0; index < sparkCount; index += 1) {
          const base = index * 3;
          const velocity = sparkVelocity[index];
          const progress = (t * velocity.speed * 0.18 + velocity.phase) % 1;
          attribute.array[base] = 1.25 + progress * 3.7;
          attribute.array[base + 1] = -0.16 + Math.sin(progress * Math.PI) * velocity.lift - progress * 0.08;
          attribute.array[base + 2] = ((index % 11) - 5) * 0.055 + Math.sin(t * 2.4 + index) * 0.025;
        }
        attribute.needsUpdate = true;
        sparks.material.opacity = intensity > 0.55 ? 0.22 + intensity * 0.62 : 0;
      }

      const lightweight = state.quality === 'lightweight';
      ri40xDetails.visible = !lightweight;
      requestAnimationFrame(animateRi40xDetails);
    };
    requestAnimationFrame(animateRi40xDetails);

    if (partsNode) partsNode.textContent = `${pickables.length + enhancedPartCount} PARTS`;
    document.documentElement.dataset.modelRevision = 'ri40x-1';
    dispatchEvent(new CustomEvent('ri:model-upgraded', { detail: { revision: 'RI-40X.1', addedParts: enhancedPartCount } }));
  } catch (error) {
    console.warn('RI-40X.1 detail pass was skipped:', error);
  }

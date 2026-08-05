import * as THREE from 'three';
import { COMPONENTS } from './core.mjs';

const mainCanvas = document.querySelector('#carScene');
const twinCanvas = document.querySelector('#twinScene');
const fallback = document.querySelector('[data-scene-fallback]');
const twinFallback = document.querySelector('[data-twin-fallback]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!mainCanvas) throw new Error('Primary digital-twin canvas is missing.');

const capabilityProbe = document.createElement('canvas');
const supportsWebGL = Boolean(
  capabilityProbe.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
  capabilityProbe.getContext('webgl')
);
const constrainedDevice = Boolean(
  navigator.connection?.saveData ||
  (navigator.deviceMemory || 4) <= 2 ||
  (navigator.hardwareConcurrency || 4) <= 2
);

if (!supportsWebGL) {
  mainCanvas.hidden = true;
  if (twinCanvas) twinCanvas.hidden = true;
  fallback?.removeAttribute('hidden');
  twinFallback?.classList.add('is-visible');
  dispatchEvent(new CustomEvent('ri:scene-ready', { detail: { mode: 'lightweight' } }));
} else {
  const palette = {
    carbon: 0x030507,
    carbonLift: 0x11171c,
    paint: 0x071c2a,
    paintLift: 0x0b3850,
    titanium: 0x8f9da6,
    aluminium: 0xb5c4ce,
    magnesium: 0x697984,
    ceramic: 0x2b3136,
    rubber: 0x050607,
    cyan: 0x5de6ff,
    ice: 0xe3fbff,
    red: 0xff3649,
    amber: 0xffb74d,
    green: 0x45e0a6,
    dark: 0x020407
  };

  const makeRenderer = (canvas) => {
    if (!canvas) return null;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !constrainedDevice,
      powerPreference: 'high-performance',
      precision: 'highp'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = !constrainedDevice;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
  };

  const mainRenderer = makeRenderer(mainCanvas);
  const twinRenderer = makeRenderer(twinCanvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03070c, 0.027);

  const mainCamera = new THREE.PerspectiveCamera(30, 1, 0.08, 160);
  const twinCamera = new THREE.PerspectiveCamera(32, 1, 0.08, 160);
  const world = new THREE.Group();
  world.name = 'RI30X_DIGITAL_TWIN';
  world.rotation.set(-0.07, -0.52, 0.012);
  world.position.set(0.25, -0.18, 0);
  scene.add(world);

  const studioRoot = new THREE.Group();
  studioRoot.name = 'STUDIO_ENVIRONMENT';
  scene.add(studioRoot);

  const hemi = new THREE.HemisphereLight(0xdaf6ff, 0x02050a, 1.35);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xf1fbff, 4.6);
  keyLight.position.set(-7, 11, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -11;
  keyLight.shadow.camera.right = 11;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 40;
  keyLight.shadow.bias = -0.00025;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x43c8ff, 3.2);
  rimLight.position.set(9, 4, -9);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0x7697ff, 1.8);
  fillLight.position.set(2, 2, 10);
  scene.add(fillLight);

  const redKicker = new THREE.PointLight(0xff3148, 8.5, 20, 2);
  redKicker.position.set(-6.2, -0.1, 4.8);
  scene.add(redKicker);

  const cyanKicker = new THREE.PointLight(0x4de1ff, 6.4, 18, 2);
  cyanKicker.position.set(5.2, 1.7, -4.6);
  scene.add(cyanKicker);

  const createCanvasTexture = (width, height, draw, { repeatX = 1, repeatY = 1, colorSpace = THREE.SRGBColorSpace } = {}) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    draw(context, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.colorSpace = colorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  };

  const carbonTexture = createCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#040607';
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 7;
    for (let i = -h; i < w + h; i += 16) {
      ctx.strokeStyle = i % 32 === 0 ? '#172128' : '#0b1115';
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - h, h);
      ctx.stroke();
      ctx.strokeStyle = '#020304';
      ctx.beginPath();
      ctx.moveTo(i + 8, 0);
      ctx.lineTo(i - h + 8, h);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.35;
    for (let i = -h; i < w + h; i += 16) {
      ctx.strokeStyle = '#263640';
      ctx.beginPath();
      ctx.moveTo(i, h);
      ctx.lineTo(i - h, 0);
      ctx.stroke();
    }
  }, { repeatX: 10, repeatY: 10 });

  const carbonBump = carbonTexture.clone();
  carbonBump.colorSpace = THREE.NoColorSpace;
  carbonBump.needsUpdate = true;

  const brushedTexture = createCanvasTexture(256, 32, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#6f7b82');
    gradient.addColorStop(0.3, '#bec8cd');
    gradient.addColorStop(0.55, '#7c8b93');
    gradient.addColorStop(0.82, '#d7dfe2');
    gradient.addColorStop(1, '#78868e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) {
      ctx.fillStyle = `rgba(255,255,255,${0.02 + (x % 11) * 0.002})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }, { repeatX: 3, repeatY: 1 });

  const tyreSidewallTexture = createCanvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#08090a';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = '#191c1e';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.arc(0, 0, 365, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f3f5f2';
    ctx.font = '900 82px Arial Narrow, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textOnArc = (text, radius, start, direction = 1) => {
      const chars = [...text];
      const step = 0.105 * direction;
      chars.forEach((character, index) => {
        const angle = start + (index - (chars.length - 1) / 2) * step;
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(0, -radius);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(character, 0, 0);
        ctx.restore();
      });
    };
    textOnArc('RACE INTELLIGENCE', 365, 0);
    textOnArc('RI 30X', 365, Math.PI, -1);
    ctx.fillStyle = '#ff384c';
    ctx.beginPath();
    ctx.arc(0, 0, 286, 0, Math.PI * 2);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#ff384c';
    ctx.stroke();
    ctx.restore();
  });

  const contactShadowTexture = createCanvasTexture(512, 256, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 12, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0.82)');
    gradient.addColorStop(0.45, 'rgba(0,0,0,0.42)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });

  const createStudioEnvironment = (renderer) => {
    if (!renderer) return null;
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x071018);
    const panels = [
      { color: 0xe8f9ff, intensity: 2.4, position: [-5, 5, 5], scale: [5, 1, 1], rotation: [0, 0.5, -0.35] },
      { color: 0x45cfff, intensity: 1.6, position: [5, 2, -4], scale: [4, 1, 1], rotation: [0, -0.7, 0.25] },
      { color: 0xff3148, intensity: 1.2, position: [-5, 0, -4], scale: [3, 1, 1], rotation: [0, 0.8, 0.1] },
      { color: 0x5a78ff, intensity: 0.8, position: [0, 6, 0], scale: [4, 4, 1], rotation: [Math.PI / 2, 0, 0] }
    ];
    panels.forEach((panel) => {
      const material = new THREE.MeshBasicMaterial({ color: panel.color });
      material.color.multiplyScalar(panel.intensity);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), material);
      mesh.position.set(...panel.position);
      mesh.rotation.set(...panel.rotation);
      mesh.scale.set(...panel.scale);
      envScene.add(mesh);
    });
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const target = pmrem.fromScene(envScene, 0.04, 0.1, 50);
    pmrem.dispose();
    return target.texture;
  };

  const environmentMap = createStudioEnvironment(mainRenderer);
  scene.environment = environmentMap;

  const materialLibrary = {
    carbon: new THREE.MeshPhysicalMaterial({
      color: palette.carbon,
      map: carbonTexture,
      bumpMap: carbonBump,
      bumpScale: 0.028,
      metalness: 0.38,
      roughness: 0.32,
      clearcoat: 0.92,
      clearcoatRoughness: 0.17,
      envMapIntensity: 1.2
    }),
    carbonMatte: new THREE.MeshStandardMaterial({
      color: 0x070a0c,
      map: carbonTexture,
      bumpMap: carbonBump,
      bumpScale: 0.018,
      metalness: 0.18,
      roughness: 0.52,
      envMapIntensity: 0.7
    }),
    paint: new THREE.MeshPhysicalMaterial({
      color: palette.paint,
      metalness: 0.68,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      iridescence: 0.14,
      iridescenceIOR: 1.35,
      envMapIntensity: 1.55,
      emissive: 0x010b12,
      emissiveIntensity: 0.18
    }),
    paintLift: new THREE.MeshPhysicalMaterial({
      color: palette.paintLift,
      metalness: 0.61,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.09,
      envMapIntensity: 1.45,
      emissive: 0x02131d,
      emissiveIntensity: 0.2
    }),
    titanium: new THREE.MeshStandardMaterial({
      color: palette.titanium,
      map: brushedTexture,
      metalness: 0.91,
      roughness: 0.23,
      envMapIntensity: 1.35
    }),
    aluminium: new THREE.MeshStandardMaterial({
      color: palette.aluminium,
      map: brushedTexture,
      metalness: 0.86,
      roughness: 0.26,
      envMapIntensity: 1.2
    }),
    magnesium: new THREE.MeshStandardMaterial({
      color: palette.magnesium,
      metalness: 0.74,
      roughness: 0.31,
      envMapIntensity: 0.9
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: palette.rubber,
      roughness: 0.82,
      metalness: 0.02,
      bumpMap: carbonBump,
      bumpScale: 0.012
    }),
    sidewall: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tyreSidewallTexture,
      roughness: 0.72,
      metalness: 0.01
    }),
    brakeDisc: new THREE.MeshStandardMaterial({
      color: palette.ceramic,
      metalness: 0.18,
      roughness: 0.62,
      emissive: 0x000000,
      emissiveIntensity: 0
    }),
    caliper: new THREE.MeshPhysicalMaterial({
      color: palette.red,
      metalness: 0.56,
      roughness: 0.22,
      clearcoat: 0.78,
      envMapIntensity: 1.1,
      emissive: 0x4a050b,
      emissiveIntensity: 0.28
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x78dcf5,
      transparent: true,
      opacity: 0.22,
      transmission: 0.82,
      thickness: 0.16,
      roughness: 0.08,
      metalness: 0,
      ior: 1.46,
      envMapIntensity: 1.6,
      depthWrite: false
    }),
    darkGlass: new THREE.MeshPhysicalMaterial({
      color: 0x07131b,
      transparent: true,
      opacity: 0.72,
      transmission: 0.18,
      roughness: 0.2,
      metalness: 0.08,
      depthWrite: false
    }),
    accent: new THREE.MeshPhysicalMaterial({
      color: palette.red,
      metalness: 0.45,
      roughness: 0.22,
      clearcoat: 0.9,
      emissive: 0x640710,
      emissiveIntensity: 0.45,
      envMapIntensity: 1.2
    }),
    emissiveCyan: new THREE.MeshBasicMaterial({
      color: palette.cyan,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }),
    emissiveIce: new THREE.MeshBasicMaterial({
      color: palette.ice,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }),
    emissiveAmber: new THREE.MeshBasicMaterial({
      color: palette.amber,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  };

  const groups = new Map();
  const explodeVectors = new Map();
  const pickables = [];
  const managedMaterials = [];
  const technicalEdges = [];
  const highDetailObjects = [];
  const wheelAssemblies = [];
  const brakeDiscs = [];
  const coolingFans = [];
  const animatedActuators = [];

  const componentIds = new Set(COMPONENTS.map((component) => component.id));

  const ensureGroup = (id, explode = [0, 0, 0]) => {
    if (!componentIds.has(id)) throw new Error(`Unknown digital-twin component: ${id}`);
    if (!groups.has(id)) {
      const group = new THREE.Group();
      group.name = id;
      group.userData.componentId = id;
      world.add(group);
      groups.set(id, group);
      explodeVectors.set(id, new THREE.Vector3(...explode));
    }
    return groups.get(id);
  };

  const rememberMaterial = (material) => {
    if (!material) return;
    if (!material.userData.ri30Base) {
      material.userData.ri30Base = {
        transparent: material.transparent,
        opacity: material.opacity,
        color: material.color?.clone(),
        emissive: material.emissive?.clone(),
        emissiveIntensity: material.emissiveIntensity,
        wireframe: material.wireframe,
        depthWrite: material.depthWrite,
        roughness: material.roughness,
        metalness: material.metalness
      };
    }
    if (!managedMaterials.includes(material)) managedMaterials.push(material);
  };

  const addPart = ({
    geometry,
    material,
    id,
    parent = null,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    explode = null,
    pickable = true,
    castShadow = true,
    receiveShadow = true,
    edge = false,
    highDetail = false,
    name = ''
  }) => {
    const group = parent || ensureGroup(id, explode || [0, 0, 0]);
    const materialInstance = Array.isArray(material)
      ? material.map((entry) => entry.clone())
      : material.clone();
    const mesh = new THREE.Mesh(geometry, materialInstance);
    mesh.name = name || `${id}-part-${pickables.length + 1}`;
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    mesh.userData.componentId = id;
    group.add(mesh);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach(rememberMaterial);
    if (pickable) pickables.push(mesh);
    if (highDetail) highDetailObjects.push(mesh);
    if (edge) {
      const lineMaterial = new THREE.LineBasicMaterial({
        color: palette.cyan,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 27), lineMaterial);
      lines.position.copy(mesh.position);
      lines.rotation.copy(mesh.rotation);
      lines.scale.copy(mesh.scale);
      lines.renderOrder = 8;
      lines.userData.componentId = id;
      group.add(lines);
      technicalEdges.push(lines);
    }
    return mesh;
  };

  const addCylinderBetween = ({
    a,
    b,
    radius,
    material = materialLibrary.titanium,
    id,
    parent = null,
    radialSegments = 10,
    highDetail = false,
    name = ''
  }) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const mesh = addPart({
      geometry: new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments, 1, false),
      material,
      id,
      parent,
      position: midpoint.toArray(),
      highDetail,
      name
    });
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return mesh;
  };

  const addTube = ({ points, radius, material, id, parent = null, tubularSegments = 64, radialSegments = 10, highDetail = false, name = '' }) => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const mesh = addPart({
      geometry: new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false),
      material,
      id,
      parent,
      highDetail,
      name
    });
    mesh.userData.curve = curve;
    return mesh;
  };

  const loftGeometry = (sections, radialSegments = 28, cap = true) => {
    const positions = [];
    const indices = [];
    const ringSize = radialSegments;
    sections.forEach((section) => {
      const {
        x,
        y = 0,
        z = 0,
        radiusY,
        radiusZ,
        pinch = 1.08,
        twist = 0,
        flattenTop = 0,
        flattenBottom = 0
      } = section;
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const angle = (segment / radialSegments) * Math.PI * 2 + twist;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        let vertical = Math.sign(cosine) * Math.pow(Math.abs(cosine), pinch) * radiusY;
        if (vertical > 0 && flattenTop) vertical *= 1 - flattenTop * Math.pow(vertical / radiusY, 4);
        if (vertical < 0 && flattenBottom) vertical *= 1 - flattenBottom * Math.pow(Math.abs(vertical) / radiusY, 4);
        positions.push(x, y + vertical, z + Math.sign(sine) * Math.pow(Math.abs(sine), pinch) * radiusZ);
      }
    });
    for (let ring = 0; ring < sections.length - 1; ring += 1) {
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const next = (segment + 1) % radialSegments;
        const a = ring * ringSize + segment;
        const b = ring * ringSize + next;
        const c = (ring + 1) * ringSize + segment;
        const d = (ring + 1) * ringSize + next;
        indices.push(a, c, b, b, c, d);
      }
    }
    if (cap) {
      const startCenter = positions.length / 3;
      positions.push(sections[0].x, sections[0].y || 0, sections[0].z || 0);
      const endCenter = positions.length / 3;
      const last = sections.at(-1);
      positions.push(last.x, last.y || 0, last.z || 0);
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const next = (segment + 1) % radialSegments;
        indices.push(startCenter, next, segment);
        const offset = (sections.length - 1) * ringSize;
        indices.push(endCenter, offset + segment, offset + next);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  };

  const airfoilGeometry = ({ span = 1, chord = 1, thickness = 0.12, camber = 0.03, sweep = 0, taper = 1, segments = 18 } = {}) => {
    const profile = [];
    for (let i = 0; i <= segments; i += 1) {
      const x = i / segments;
      const yt = 5 * thickness * (
        0.2969 * Math.sqrt(Math.max(x, 0.0001)) -
        0.1260 * x -
        0.3516 * x * x +
        0.2843 * x ** 3 -
        0.1015 * x ** 4
      );
      const yc = camber * Math.sin(Math.PI * x);
      profile.push([x - 0.5, yc + yt]);
    }
    for (let i = segments; i >= 0; i -= 1) {
      const x = i / segments;
      const yt = 5 * thickness * (
        0.2969 * Math.sqrt(Math.max(x, 0.0001)) -
        0.1260 * x -
        0.3516 * x * x +
        0.2843 * x ** 3 -
        0.1015 * x ** 4
      );
      const yc = camber * Math.sin(Math.PI * x);
      profile.push([x - 0.5, yc - yt]);
    }
    const positions = [];
    const indices = [];
    [-0.5, 0.5].forEach((side, sideIndex) => {
      const localChord = chord * (sideIndex === 0 ? 1 : taper);
      const xOffset = side * sweep;
      profile.forEach(([x, y]) => positions.push(x * localChord + xOffset, y * chord, side * span));
    });
    const count = profile.length;
    for (let i = 0; i < count; i += 1) {
      const next = (i + 1) % count;
      indices.push(i, count + i, next, next, count + i, count + next);
    }
    const face = THREE.ShapeUtils.triangulateShape(profile.map(([x, y]) => new THREE.Vector2(x, y)), []);
    face.forEach(([a, b, c]) => {
      indices.push(c, b, a);
      indices.push(count + a, count + b, count + c);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  };

  const planformPrism = (points, height = 0.08) => {
    const shape = points.map(([x, z]) => new THREE.Vector2(x, z));
    const triangles = THREE.ShapeUtils.triangulateShape(shape, []);
    const positions = [];
    const indices = [];
    const half = height / 2;
    shape.forEach((point) => positions.push(point.x, half, point.y));
    shape.forEach((point) => positions.push(point.x, -half, point.y));
    triangles.forEach(([a, b, c]) => {
      indices.push(a, b, c);
      const offset = shape.length;
      indices.push(offset + c, offset + b, offset + a);
    });
    for (let index = 0; index < shape.length; index += 1) {
      const next = (index + 1) % shape.length;
      const offset = shape.length;
      indices.push(index, offset + index, next, next, offset + index, offset + next);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  };

  const roundedBoxGeometry = (width, height, depth, radius = 0.08, smoothness = 4) => {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: smoothness,
      steps: 1,
      bevelSize: radius * 0.35,
      bevelThickness: radius * 0.35,
      curveSegments: smoothness * 2
    });
    geometry.center();
    return geometry;
  };

  class HelixCurve extends THREE.Curve {
    constructor(radius, height, turns) {
      super();
      this.radius = radius;
      this.height = height;
      this.turns = turns;
    }
    getPoint(t, target = new THREE.Vector3()) {
      const angle = t * Math.PI * 2 * this.turns;
      return target.set(Math.cos(angle) * this.radius, (t - 0.5) * this.height, Math.sin(angle) * this.radius);
    }
  }

  const addSpringBetween = ({ a, b, radius = 0.09, wire = 0.012, turns = 10, id, parent }) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const curve = new HelixCurve(radius, direction.length(), turns);
    const mesh = addPart({
      geometry: new THREE.TubeGeometry(curve, turns * 16, wire, 7, false),
      material: materialLibrary.titanium,
      id,
      parent,
      position: midpoint.toArray(),
      highDetail: true,
      name: `${id}-spring`
    });
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return mesh;
  };

  const floorGroup = ensureGroup('floor', [0, -1.85, 0]);
  const floorOutline = [
    [-4.05, -0.55], [-3.35, -1.48], [-1.15, -1.66], [0.35, -1.72], [2.25, -1.54], [3.92, -1.12],
    [4.2, -0.72], [4.2, 0.72], [3.92, 1.12], [2.25, 1.54], [0.35, 1.72], [-1.15, 1.66], [-3.35, 1.48], [-4.05, 0.55]
  ];
  addPart({
    geometry: planformPrism(floorOutline, 0.105),
    material: materialLibrary.carbon,
    id: 'floor',
    parent: floorGroup,
    position: [0.2, -0.82, 0],
    edge: true,
    name: 'floor-main-plane'
  });

  [-1, 1].forEach((side) => {
    const sidePoints = [
      [-3.15, side * 1.42], [-2.3, side * 1.74], [-0.3, side * 1.86], [1.55, side * 1.73], [2.62, side * 1.48],
      [2.35, side * 1.28], [0.4, side * 1.44], [-1.45, side * 1.39], [-2.85, side * 1.2]
    ];
    addPart({
      geometry: planformPrism(sidePoints, 0.052),
      material: materialLibrary.carbon,
      id: 'floor',
      parent: floorGroup,
      position: [0.2, -0.72, 0],
      edge: true,
      name: `floor-edge-wing-${side > 0 ? 'right' : 'left'}`
    });
    for (let fence = 0; fence < 4; fence += 1) {
      const x = -2.55 + fence * 0.46;
      addPart({
        geometry: airfoilGeometry({ span: 0.28, chord: 0.42, thickness: 0.08, camber: 0.035, sweep: 0.04 }),
        material: materialLibrary.carbonMatte,
        id: 'floor',
        parent: floorGroup,
        position: [x, -0.57 + fence * 0.012, side * (1.04 + fence * 0.12)],
        rotation: [0, side * (0.18 + fence * 0.035), side * 0.12],
        highDetail: true,
        name: `floor-fence-${side}-${fence}`
      });
    }
    addTube({
      points: [[-2.1, -0.72, side * 0.72], [-0.4, -0.64, side * 0.83], [1.55, -0.58, side * 0.75], [3.65, -0.38, side * 0.48]],
      radius: 0.38,
      material: materialLibrary.carbonMatte,
      id: 'floor',
      parent: floorGroup,
      tubularSegments: 82,
      radialSegments: 18,
      name: `venturi-tunnel-${side}`
    }).scale.set(1, 0.34, 1);
  });

  const monocoqueGroup = ensureGroup('monocoque', [0, 0.8, 0]);
  addPart({
    geometry: loftGeometry([
      { x: -4.18, y: -0.08, radiusY: 0.14, radiusZ: 0.2, pinch: 1.45 },
      { x: -3.55, y: -0.02, radiusY: 0.24, radiusZ: 0.32, pinch: 1.35 },
      { x: -2.65, y: 0.08, radiusY: 0.39, radiusZ: 0.5, pinch: 1.24 },
      { x: -1.55, y: 0.24, radiusY: 0.56, radiusZ: 0.66, pinch: 1.16, flattenTop: 0.18 },
      { x: -0.45, y: 0.37, radiusY: 0.67, radiusZ: 0.76, pinch: 1.12, flattenTop: 0.27 },
      { x: 0.55, y: 0.36, radiusY: 0.69, radiusZ: 0.78, pinch: 1.1, flattenTop: 0.32 },
      { x: 1.45, y: 0.29, radiusY: 0.59, radiusZ: 0.71, pinch: 1.14, flattenTop: 0.18 },
      { x: 2.35, y: 0.16, radiusY: 0.43, radiusZ: 0.58, pinch: 1.2 },
      { x: 3.15, y: 0.13, radiusY: 0.3, radiusZ: 0.42, pinch: 1.28 }
    ], 34),
    material: materialLibrary.paint,
    id: 'monocoque',
    parent: monocoqueGroup,
    edge: true,
    name: 'monocoque-primary-shell'
  });
  addPart({
    geometry: loftGeometry([
      { x: -1.2, y: 0.34, radiusY: 0.18, radiusZ: 0.56, pinch: 1.3 },
      { x: -0.35, y: 0.48, radiusY: 0.22, radiusZ: 0.62, pinch: 1.24 },
      { x: 0.75, y: 0.5, radiusY: 0.2, radiusZ: 0.64, pinch: 1.24 },
      { x: 1.42, y: 0.39, radiusY: 0.15, radiusZ: 0.53, pinch: 1.3 }
    ], 28),
    material: materialLibrary.carbon,
    id: 'monocoque',
    parent: monocoqueGroup,
    edge: true,
    name: 'monocoque-shoulder'
  });
  [-1, 1].forEach((side) => {
    addPart({
      geometry: airfoilGeometry({ span: 0.34, chord: 1.9, thickness: 0.08, camber: 0.025, sweep: 0.08, taper: 0.84 }),
      material: materialLibrary.carbon,
      id: 'monocoque',
      parent: monocoqueGroup,
      position: [-1.95, -0.28, side * 0.69],
      rotation: [Math.PI / 2, side * 0.08, 0],
      highDetail: true,
      name: `chassis-keel-${side}`
    });
  });

  const noseGroup = ensureGroup('nose', [-2.35, 0.28, 0]);
  addPart({
    geometry: loftGeometry([
      { x: -5.48, y: -0.27, radiusY: 0.075, radiusZ: 0.12, pinch: 1.45 },
      { x: -5.0, y: -0.22, radiusY: 0.12, radiusZ: 0.18, pinch: 1.38 },
      { x: -4.45, y: -0.12, radiusY: 0.2, radiusZ: 0.27, pinch: 1.32 },
      { x: -3.75, y: -0.02, radiusY: 0.29, radiusZ: 0.37, pinch: 1.24 },
      { x: -3.05, y: 0.06, radiusY: 0.34, radiusZ: 0.44, pinch: 1.2 }
    ], 28),
    material: materialLibrary.paintLift,
    id: 'nose',
    parent: noseGroup,
    edge: true,
    name: 'nose-crash-structure'
  });
  addPart({
    geometry: roundedBoxGeometry(0.52, 0.09, 0.28, 0.05, 4),
    material: materialLibrary.accent,
    id: 'nose',
    parent: noseGroup,
    position: [-5.48, -0.26, 0],
    name: 'nose-camera-housing'
  });
  [-1, 1].forEach((side) => {
    addCylinderBetween({ a: [-4.35, -0.1, side * 0.18], b: [-4.78, -0.42, side * 0.42], radius: 0.032, material: materialLibrary.carbon, id: 'nose', parent: noseGroup, name: `front-wing-pylon-${side}` });
    addPart({
      geometry: new THREE.SphereGeometry(0.065, 14, 10),
      material: materialLibrary.darkGlass,
      id: 'nose',
      parent: noseGroup,
      position: [-4.62, -0.1, side * 0.19],
      highDetail: true,
      name: `nose-camera-${side}`
    });
  });

  const cockpitGroup = ensureGroup('cockpit', [0, 1.85, 0]);
  addPart({
    geometry: loftGeometry([
      { x: -1.22, y: 0.56, radiusY: 0.08, radiusZ: 0.48, pinch: 1.35 },
      { x: -0.55, y: 0.61, radiusY: 0.19, radiusZ: 0.58, pinch: 1.28 },
      { x: 0.2, y: 0.64, radiusY: 0.17, radiusZ: 0.54, pinch: 1.3 },
      { x: 0.78, y: 0.55, radiusY: 0.08, radiusZ: 0.42, pinch: 1.4 }
    ], 30),
    material: materialLibrary.darkGlass,
    id: 'cockpit',
    parent: cockpitGroup,
    edge: true,
    name: 'cockpit-opening'
  });
  addPart({
    geometry: roundedBoxGeometry(0.78, 0.18, 0.48, 0.12, 5),
    material: materialLibrary.carbonMatte,
    id: 'cockpit',
    parent: cockpitGroup,
    position: [0.1, 0.48, 0],
    rotation: [0, 0, -0.14],
    name: 'driver-seat'
  });
  addPart({
    geometry: new THREE.TorusGeometry(0.22, 0.045, 12, 32, Math.PI * 1.7),
    material: materialLibrary.carbon,
    id: 'cockpit',
    parent: cockpitGroup,
    position: [-0.66, 0.82, 0],
    rotation: [Math.PI / 2, 0, 0.15],
    name: 'steering-wheel-rim'
  });
  addPart({
    geometry: roundedBoxGeometry(0.38, 0.18, 0.08, 0.055, 4),
    material: materialLibrary.carbon,
    id: 'cockpit',
    parent: cockpitGroup,
    position: [-0.66, 0.82, 0],
    rotation: [0, 0.15, 0.15],
    highDetail: true,
    name: 'steering-wheel-body'
  });
  addPart({
    geometry: roundedBoxGeometry(0.22, 0.08, 0.012, 0.025, 3),
    material: materialLibrary.emissiveCyan,
    id: 'cockpit',
    parent: cockpitGroup,
    position: [-0.695, 0.83, 0.055],
    rotation: [0, 0.15, 0.15],
    highDetail: true,
    name: 'steering-display'
  });
  for (let button = 0; button < 10; button += 1) {
    const angle = (button / 10) * Math.PI * 2;
    addPart({
      geometry: new THREE.CylinderGeometry(0.014, 0.014, 0.012, 8),
      material: button % 3 === 0 ? materialLibrary.accent : materialLibrary.emissiveAmber,
      id: 'cockpit',
      parent: cockpitGroup,
      position: [-0.69, 0.83 + Math.sin(angle) * 0.085, 0.062 + Math.cos(angle) * 0.12],
      rotation: [Math.PI / 2, 0, 0],
      highDetail: true,
      name: `steering-button-${button}`
    });
  }
  const haloCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.95, 0.63, -0.55),
    new THREE.Vector3(-0.55, 1.28, -0.69),
    new THREE.Vector3(0.12, 1.46, -0.46),
    new THREE.Vector3(0.3, 1.52, 0),
    new THREE.Vector3(0.12, 1.46, 0.46),
    new THREE.Vector3(-0.55, 1.28, 0.69),
    new THREE.Vector3(-0.95, 0.63, 0.55)
  ]);
  addPart({
    geometry: new THREE.TubeGeometry(haloCurve, 96, 0.052, 12, false),
    material: materialLibrary.titanium,
    id: 'cockpit',
    parent: cockpitGroup,
    edge: true,
    name: 'halo-main-loop'
  });
  addCylinderBetween({ a: [0.3, 1.52, 0], b: [0.48, 0.62, 0], radius: 0.047, material: materialLibrary.titanium, id: 'cockpit', parent: cockpitGroup, name: 'halo-center-pillar' });
  [-1, 1].forEach((side) => {
    addPart({
      geometry: roundedBoxGeometry(0.46, 0.34, 0.12, 0.07, 4),
      material: materialLibrary.carbonMatte,
      id: 'cockpit',
      parent: cockpitGroup,
      position: [0.56, 0.8, side * 0.43],
      rotation: [0, side * 0.08, 0],
      highDetail: true,
      name: `headrest-${side}`
    });
  });

  const sidepodGroup = ensureGroup('sidepods', [0.15, 0.55, 1.72]);
  [-1, 1].forEach((side) => {
    addPart({
      geometry: loftGeometry([
        { x: -0.95, y: 0.05, z: side * 0.82, radiusY: 0.18, radiusZ: 0.2, pinch: 1.35 },
        { x: -0.3, y: 0.14, z: side * 1.08, radiusY: 0.4, radiusZ: 0.34, pinch: 1.22 },
        { x: 0.55, y: 0.18, z: side * 1.18, radiusY: 0.54, radiusZ: 0.4, pinch: 1.16, flattenBottom: 0.28 },
        { x: 1.55, y: 0.15, z: side * 1.13, radiusY: 0.48, radiusZ: 0.36, pinch: 1.18, flattenBottom: 0.4 },
        { x: 2.55, y: 0.03, z: side * 0.88, radiusY: 0.29, radiusZ: 0.23, pinch: 1.25 },
        { x: 3.25, y: 0.06, z: side * 0.6, radiusY: 0.16, radiusZ: 0.12, pinch: 1.34 }
      ], 28),
      material: materialLibrary.paintLift,
      id: 'sidepods',
      parent: sidepodGroup,
      edge: true,
      name: `sidepod-shell-${side}`
    });
    addPart({
      geometry: roundedBoxGeometry(0.12, 0.52, 0.66, 0.07, 5),
      material: materialLibrary.darkGlass,
      id: 'sidepods',
      parent: sidepodGroup,
      position: [-0.38, 0.25, side * 1.28],
      rotation: [0, side * -0.09, side * 0.03],
      name: `cooling-inlet-${side}`
    });
    for (let vane = 0; vane < 5; vane += 1) {
      addPart({
        geometry: airfoilGeometry({ span: 0.13, chord: 0.48, thickness: 0.06, camber: 0.018 }),
        material: materialLibrary.carbon,
        id: 'sidepods',
        parent: sidepodGroup,
        position: [-0.95 + vane * 0.12, 0.08 + vane * 0.02, side * (1.14 + vane * 0.045)],
        rotation: [Math.PI / 2, side * 0.22, side * 0.12],
        highDetail: true,
        name: `sidepod-vane-${side}-${vane}`
      });
    }
    for (let louvre = 0; louvre < 8; louvre += 1) {
      addPart({
        geometry: roundedBoxGeometry(0.34, 0.018, 0.055, 0.012, 2),
        material: materialLibrary.carbonMatte,
        id: 'sidepods',
        parent: sidepodGroup,
        position: [1.1 + louvre * 0.16, 0.62 - louvre * 0.025, side * (0.9 - louvre * 0.018)],
        rotation: [0, side * 0.08, side * 0.02],
        highDetail: true,
        name: `cooling-louvre-${side}-${louvre}`
      });
    }
  });

  const powerUnitGroup = ensureGroup('power-unit', [1.15, 1.42, 0]);
  addPart({
    geometry: roundedBoxGeometry(1.82, 0.7, 0.94, 0.16, 6),
    material: materialLibrary.magnesium,
    id: 'power-unit',
    parent: powerUnitGroup,
    position: [1.95, 0.02, 0],
    edge: true,
    name: 'engine-block'
  });
  addPart({
    geometry: loftGeometry([
      { x: 0.72, y: 0.5, radiusY: 0.24, radiusZ: 0.46, pinch: 1.25 },
      { x: 1.55, y: 0.68, radiusY: 0.39, radiusZ: 0.51, pinch: 1.2 },
      { x: 2.55, y: 0.61, radiusY: 0.35, radiusZ: 0.47, pinch: 1.22 },
      { x: 3.48, y: 0.4, radiusY: 0.19, radiusZ: 0.31, pinch: 1.31 }
    ], 28),
    material: materialLibrary.paint,
    id: 'power-unit',
    parent: powerUnitGroup,
    edge: true,
    name: 'engine-cover'
  });
  addPart({
    geometry: new THREE.TorusGeometry(0.28, 0.1, 14, 36),
    material: materialLibrary.titanium,
    id: 'power-unit',
    parent: powerUnitGroup,
    position: [1.05, 0.18, 0],
    rotation: [0, Math.PI / 2, 0],
    name: 'turbo-compressor'
  });
  const compressorFan = addPart({
    geometry: new THREE.CylinderGeometry(0.23, 0.23, 0.055, 28),
    material: materialLibrary.aluminium,
    id: 'power-unit',
    parent: powerUnitGroup,
    position: [1.02, 0.18, 0],
    rotation: [0, 0, Math.PI / 2],
    highDetail: true,
    name: 'turbo-compressor-wheel'
  });
  coolingFans.push(compressorFan);
  for (let blade = 0; blade < 12; blade += 1) {
    const angle = (blade / 12) * Math.PI * 2;
    addPart({
      geometry: airfoilGeometry({ span: 0.08, chord: 0.17, thickness: 0.08, camber: 0.025 }),
      material: materialLibrary.aluminium,
      id: 'power-unit',
      parent: compressorFan,
      position: [0, Math.sin(angle) * 0.15, Math.cos(angle) * 0.15],
      rotation: [angle, 0.25, 0],
      highDetail: true,
      name: `compressor-blade-${blade}`
    });
  }
  [-1, 1].forEach((side) => {
    addPart({
      geometry: roundedBoxGeometry(1.15, 0.52, 0.1, 0.06, 4),
      material: materialLibrary.aluminium,
      id: 'power-unit',
      parent: powerUnitGroup,
      position: [0.52, 0.02, side * 0.72],
      rotation: [0, side * 0.18, side * 0.08],
      name: `radiator-${side}`
    });
    for (let fin = 0; fin < 15; fin += 1) {
      addPart({
        geometry: new THREE.BoxGeometry(0.012, 0.42, 0.115),
        material: materialLibrary.aluminium,
        id: 'power-unit',
        parent: powerUnitGroup,
        position: [-0.02 + fin * 0.076, 0.02, side * 0.72],
        rotation: [0, side * 0.18, side * 0.08],
        highDetail: true,
        name: `radiator-fin-${side}-${fin}`
      });
    }
    addTube({
      points: [[0.25, 0.08, side * 0.55], [0.65, 0.26, side * 0.46], [1.18, 0.25, side * 0.25]],
      radius: 0.045,
      material: materialLibrary.titanium,
      id: 'power-unit',
      parent: powerUnitGroup,
      highDetail: true,
      name: `coolant-line-${side}`
    });
    addTube({
      points: [[2.15, 0.0, side * 0.3], [2.65, 0.08, side * 0.42], [3.25, 0.18, side * 0.24], [3.85, 0.12, side * 0.16]],
      radius: 0.07,
      material: materialLibrary.titanium,
      id: 'power-unit',
      parent: powerUnitGroup,
      tubularSegments: 48,
      radialSegments: 10,
      name: `exhaust-primary-${side}`
    });
  });
  for (let cell = 0; cell < 12; cell += 1) {
    addPart({
      geometry: roundedBoxGeometry(0.22, 0.16, 0.16, 0.035, 3),
      material: materialLibrary.magnesium,
      id: 'power-unit',
      parent: powerUnitGroup,
      position: [1.15 + (cell % 4) * 0.25, -0.43, -0.26 + Math.floor(cell / 4) * 0.26],
      highDetail: true,
      name: `battery-cell-${cell}`
    });
  }

  const frontWingGroup = ensureGroup('front-wing', [-2.85, 0.35, 0]);
  [-1, 1].forEach((side) => {
    const zCenter = side * 1.04;
    [
      { x: -5.2, y: -0.47, chord: 0.98, span: 1.62, thickness: 0.095, camber: 0.045, angle: -0.025 },
      { x: -5.02, y: -0.26, chord: 0.78, span: 1.47, thickness: 0.085, camber: 0.052, angle: -0.12 },
      { x: -4.78, y: -0.08, chord: 0.58, span: 1.28, thickness: 0.075, camber: 0.06, angle: -0.2 },
      { x: -4.57, y: 0.06, chord: 0.42, span: 1.08, thickness: 0.065, camber: 0.06, angle: -0.25 }
    ].forEach((element, index) => {
      addPart({
        geometry: airfoilGeometry({ span: element.span, chord: element.chord, thickness: element.thickness, camber: element.camber, sweep: 0.06, taper: 0.82 }),
        material: index === 0 ? materialLibrary.paintLift : materialLibrary.carbon,
        id: 'front-wing',
        parent: frontWingGroup,
        position: [element.x, element.y, zCenter],
        rotation: [0, side * 0.025, element.angle],
        edge: index < 2,
        name: `front-wing-${side}-${index}`
      });
    });
    addPart({
      geometry: roundedBoxGeometry(0.76, 0.7, 0.052, 0.04, 4),
      material: materialLibrary.carbon,
      id: 'front-wing',
      parent: frontWingGroup,
      position: [-4.98, -0.17, side * 1.92],
      rotation: [side * 0.03, side * 0.02, -0.08],
      edge: true,
      name: `front-wing-endplate-${side}`
    });
    for (let vane = 0; vane < 4; vane += 1) {
      addPart({
        geometry: airfoilGeometry({ span: 0.18, chord: 0.45 - vane * 0.05, thickness: 0.065, camber: 0.05 }),
        material: materialLibrary.carbonMatte,
        id: 'front-wing',
        parent: frontWingGroup,
        position: [-5.15 + vane * 0.1, -0.02 + vane * 0.1, side * (1.62 - vane * 0.08)],
        rotation: [Math.PI / 2, side * 0.22, side * 0.08],
        highDetail: true,
        name: `front-wing-cascade-${side}-${vane}`
      });
    }
  });
  addPart({
    geometry: airfoilGeometry({ span: 0.72, chord: 0.64, thickness: 0.08, camber: 0.04 }),
    material: materialLibrary.carbon,
    id: 'front-wing',
    parent: frontWingGroup,
    position: [-5.08, -0.38, 0],
    edge: true,
    name: 'front-wing-center-section'
  });

  const rearWingGroup = ensureGroup('rear-wing', [2.35, 1.25, 0]);
  addPart({
    geometry: airfoilGeometry({ span: 2.9, chord: 0.86, thickness: 0.12, camber: 0.07, sweep: 0.04, taper: 0.94 }),
    material: materialLibrary.paintLift,
    id: 'rear-wing',
    parent: rearWingGroup,
    position: [4.55, 1.04, 0],
    rotation: [0, 0, 0.04],
    edge: true,
    name: 'rear-wing-main-plane'
  });
  const drsFlap = addPart({
    geometry: airfoilGeometry({ span: 2.72, chord: 0.56, thickness: 0.095, camber: 0.055, sweep: 0.03, taper: 0.95 }),
    material: materialLibrary.carbon,
    id: 'rear-wing',
    parent: rearWingGroup,
    position: [4.43, 1.39, 0],
    rotation: [0, 0, -0.08],
    edge: true,
    name: 'rear-wing-drs-flap'
  });
  animatedActuators.push({ mesh: drsFlap, closed: -0.08, open: 0.24 });
  [-1, 1].forEach((side) => {
    addPart({
      geometry: roundedBoxGeometry(1.02, 1.28, 0.075, 0.05, 5),
      material: materialLibrary.carbon,
      id: 'rear-wing',
      parent: rearWingGroup,
      position: [4.5, 1.05, side * 1.52],
      rotation: [side * 0.025, 0, -0.03],
      edge: true,
      name: `rear-wing-endplate-${side}`
    });
    addCylinderBetween({ a: [3.82, 0.25, side * 0.37], b: [4.4, 1.04, side * 0.37], radius: 0.042, material: materialLibrary.titanium, id: 'rear-wing', parent: rearWingGroup, name: `swan-neck-${side}` });
    for (let slot = 0; slot < 5; slot += 1) {
      addPart({
        geometry: roundedBoxGeometry(0.34, 0.022, 0.085, 0.015, 2),
        material: materialLibrary.darkGlass,
        id: 'rear-wing',
        parent: rearWingGroup,
        position: [4.35 + slot * 0.08, 0.72 + slot * 0.09, side * 1.555],
        highDetail: true,
        name: `rear-wing-slot-${side}-${slot}`
      });
    }
  });
  addPart({
    geometry: airfoilGeometry({ span: 2.2, chord: 0.48, thickness: 0.1, camber: 0.06, taper: 0.9 }),
    material: materialLibrary.carbon,
    id: 'rear-wing',
    parent: rearWingGroup,
    position: [4.0, 0.4, 0],
    rotation: [0, 0, -0.1],
    edge: true,
    name: 'beam-wing'
  });

  const diffuserGroup = ensureGroup('diffuser', [1.95, -1.15, 0]);
  [-1.1, -0.55, 0, 0.55, 1.1].forEach((lane, index) => {
    addPart({
      geometry: airfoilGeometry({ span: 0.38, chord: 2.3, thickness: 0.07, camber: 0.055, sweep: 0.15, taper: 0.72 }),
      material: materialLibrary.carbonMatte,
      id: 'diffuser',
      parent: diffuserGroup,
      position: [3.45, -0.58 + Math.abs(lane) * 0.05, lane],
      rotation: [Math.PI / 2, lane * 0.06, lane * 0.07],
      edge: index === 0 || index === 4,
      name: `diffuser-channel-${index}`
    });
  });
  for (let strake = -3; strake <= 3; strake += 1) {
    addPart({
      geometry: roundedBoxGeometry(1.55, 0.34, 0.035, 0.02, 3),
      material: materialLibrary.carbon,
      id: 'diffuser',
      parent: diffuserGroup,
      position: [3.55, -0.48, strake * 0.31],
      rotation: [0, strake * 0.02, strake * 0.04],
      highDetail: true,
      name: `diffuser-strake-${strake}`
    });
  }

  const createWheelAssembly = ({ x, z, front }) => {
    const suspensionId = front ? 'front-suspension' : 'rear-suspension';
    const brakeId = front ? 'front-brakes' : 'rear-suspension';
    const suspensionGroup = ensureGroup(suspensionId, [front ? -1.5 : 1.5, 0, z > 0 ? 1.78 : -1.78]);
    const wheelRoot = new THREE.Group();
    wheelRoot.name = `${front ? 'front' : 'rear'}-wheel-${z > 0 ? 'right' : 'left'}`;
    wheelRoot.position.set(x, -0.55, z);
    wheelRoot.userData.componentId = suspensionId;
    suspensionGroup.add(wheelRoot);
    const radius = front ? 0.79 : 0.86;
    const width = front ? 0.58 : 0.66;
    const tyreGeometry = new THREE.CylinderGeometry(radius, radius, width, 64, 3, false);
    const tyre = addPart({
      geometry: tyreGeometry,
      material: [materialLibrary.rubber, materialLibrary.sidewall, materialLibrary.sidewall],
      id: suspensionId,
      parent: wheelRoot,
      rotation: [Math.PI / 2, 0, 0],
      name: `${wheelRoot.name}-tyre`
    });
    for (let groove = -3; groove <= 3; groove += 1) {
      addPart({
        geometry: new THREE.TorusGeometry(radius * (0.93 - Math.abs(groove) * 0.004), 0.012, 8, 72),
        material: materialLibrary.carbonMatte,
        id: suspensionId,
        parent: wheelRoot,
        position: [0, 0, groove * width * 0.11],
        highDetail: true,
        name: `${wheelRoot.name}-groove-${groove}`
      });
    }
    addPart({
      geometry: new THREE.CylinderGeometry(radius * 0.57, radius * 0.57, width * 0.88, 48, 1, false),
      material: materialLibrary.magnesium,
      id: suspensionId,
      parent: wheelRoot,
      rotation: [Math.PI / 2, 0, 0],
      name: `${wheelRoot.name}-rim-barrel`
    });
    const hub = addPart({
      geometry: new THREE.CylinderGeometry(radius * 0.17, radius * 0.17, width * 1.04, 24),
      material: materialLibrary.titanium,
      id: suspensionId,
      parent: wheelRoot,
      rotation: [Math.PI / 2, 0, 0],
      name: `${wheelRoot.name}-hub`
    });
    for (let spoke = 0; spoke < 14; spoke += 1) {
      const angle = (spoke / 14) * Math.PI * 2;
      const inner = [Math.cos(angle) * radius * 0.18, Math.sin(angle) * radius * 0.18, 0];
      const outer = [Math.cos(angle + 0.08) * radius * 0.5, Math.sin(angle + 0.08) * radius * 0.5, 0];
      addCylinderBetween({
        a: inner,
        b: outer,
        radius: 0.019,
        material: materialLibrary.magnesium,
        id: suspensionId,
        parent: wheelRoot,
        radialSegments: 7,
        highDetail: true,
        name: `${wheelRoot.name}-spoke-${spoke}`
      });
    }
    const disc = addPart({
      geometry: new THREE.CylinderGeometry(radius * 0.38, radius * 0.38, 0.075, 56),
      material: materialLibrary.brakeDisc,
      id: brakeId,
      parent: wheelRoot,
      rotation: [Math.PI / 2, 0, 0],
      name: `${wheelRoot.name}-brake-disc`
    });
    brakeDiscs.push(disc);
    for (let hole = 0; hole < 24; hole += 1) {
      const angle = (hole / 24) * Math.PI * 2;
      addPart({
        geometry: new THREE.CylinderGeometry(0.022, 0.022, 0.09, 7),
        material: materialLibrary.carbonMatte,
        id: brakeId,
        parent: wheelRoot,
        position: [Math.cos(angle) * radius * 0.29, Math.sin(angle) * radius * 0.29, 0],
        rotation: [Math.PI / 2, 0, 0],
        highDetail: true,
        name: `${wheelRoot.name}-disc-hole-${hole}`
      });
    }
    addPart({
      geometry: roundedBoxGeometry(0.17, 0.37, 0.13, 0.055, 4),
      material: materialLibrary.caliper,
      id: brakeId,
      parent: wheelRoot,
      position: [-radius * 0.28, 0, z > 0 ? -0.08 : 0.08],
      rotation: [0.1, 0, 0.1],
      name: `${wheelRoot.name}-caliper`
    });
    addPart({
      geometry: new THREE.CylinderGeometry(0.095, 0.11, width * 1.14, 12),
      material: materialLibrary.accent,
      id: suspensionId,
      parent: wheelRoot,
      rotation: [Math.PI / 2, 0, 0],
      name: `${wheelRoot.name}-wheel-nut`
    });
    for (let bolt = 0; bolt < 8; bolt += 1) {
      const angle = (bolt / 8) * Math.PI * 2;
      addPart({
        geometry: new THREE.CylinderGeometry(0.012, 0.012, 0.035, 6),
        material: materialLibrary.titanium,
        id: suspensionId,
        parent: wheelRoot,
        position: [Math.cos(angle) * radius * 0.135, Math.sin(angle) * radius * 0.135, z > 0 ? width * 0.52 : -width * 0.52],
        rotation: [Math.PI / 2, 0, 0],
        highDetail: true,
        name: `${wheelRoot.name}-hub-bolt-${bolt}`
      });
    }
    wheelAssemblies.push({ root: wheelRoot, tyre, hub, front, side: Math.sign(z), radius });
    return wheelRoot;
  };

  const frontLeft = createWheelAssembly({ x: -3.05, z: -1.79, front: true });
  const frontRight = createWheelAssembly({ x: -3.05, z: 1.79, front: true });
  const rearLeft = createWheelAssembly({ x: 3.12, z: -1.86, front: false });
  const rearRight = createWheelAssembly({ x: 3.12, z: 1.86, front: false });

  const buildSuspensionCorner = ({ front, side, wheelRoot }) => {
    const id = front ? 'front-suspension' : 'rear-suspension';
    const group = ensureGroup(id);
    const wheelX = front ? -3.05 : 3.12;
    const wheelZ = side * (front ? 1.79 : 1.86);
    const chassisX = front ? -2.08 : 2.36;
    const lowerY = -0.36;
    const upperY = front ? 0.15 : 0.2;
    const chassisZ = side * (front ? 0.68 : 0.62);
    const outboardUpper = [wheelX, -0.3, wheelZ];
    const outboardLower = [wheelX, -0.66, wheelZ];
    [
      [[chassisX - 0.28, upperY, chassisZ], outboardUpper, 0.031],
      [[chassisX + 0.34, upperY - 0.04, chassisZ], outboardUpper, 0.029],
      [[chassisX - 0.38, lowerY, chassisZ], outboardLower, 0.034],
      [[chassisX + 0.45, lowerY + 0.02, chassisZ], outboardLower, 0.032]
    ].forEach(([a, b, radius], index) => addCylinderBetween({ a, b, radius, material: materialLibrary.carbon, id, parent: group, name: `${id}-wishbone-${side}-${index}` }));
    addCylinderBetween({
      a: [chassisX - 0.08, front ? 0.55 : 0.52, side * 0.36],
      b: [wheelX, -0.36, wheelZ],
      radius: 0.028,
      material: materialLibrary.titanium,
      id,
      parent: group,
      name: `${id}-pushrod-${side}`
    });
    addCylinderBetween({
      a: [chassisX - 0.18, -0.02, side * 0.58],
      b: [wheelX, -0.5, wheelZ],
      radius: 0.023,
      material: materialLibrary.titanium,
      id,
      parent: group,
      name: `${id}-trackrod-${side}`
    });
    addSpringBetween({
      a: [chassisX - 0.1, 0.42, side * 0.28],
      b: [chassisX + 0.28, 0.05, side * 0.25],
      radius: 0.055,
      wire: 0.011,
      turns: 9,
      id,
      parent: group
    });
    addPart({
      geometry: roundedBoxGeometry(0.18, 0.38, 0.22, 0.07, 4),
      material: materialLibrary.magnesium,
      id,
      parent: group,
      position: [wheelX, -0.5, wheelZ],
      rotation: [0, side * 0.08, 0],
      name: `${id}-upright-${side}`
    });
    wheelRoot.userData.steerable = front;
  };

  buildSuspensionCorner({ front: true, side: -1, wheelRoot: frontLeft });
  buildSuspensionCorner({ front: true, side: 1, wheelRoot: frontRight });
  buildSuspensionCorner({ front: false, side: -1, wheelRoot: rearLeft });
  buildSuspensionCorner({ front: false, side: 1, wheelRoot: rearRight });

  const dataNetwork = ensureGroup('data-network', [0, 1.2, 0]);
  const sensorPositions = [
    [-5.25, -0.28, 0], [-4.5, -0.04, -0.2], [-4.5, -0.04, 0.2],
    [-3.05, -0.55, -1.79], [-3.05, -0.55, 1.79], [-0.42, 0.88, 0],
    [0.15, 0.2, -1.08], [0.15, 0.2, 1.08], [1.45, 0.12, -1.1], [1.45, 0.12, 1.1],
    [2.2, 0.25, 0], [3.12, -0.55, -1.86], [3.12, -0.55, 1.86], [4.48, 1.12, 0]
  ];
  sensorPositions.forEach((position, index) => {
    addPart({
      geometry: new THREE.SphereGeometry(index === 5 ? 0.075 : 0.052, 12, 8),
      material: index === 5 ? materialLibrary.emissiveIce : materialLibrary.emissiveCyan,
      id: 'data-network',
      parent: dataNetwork,
      position,
      highDetail: true,
      name: `sensor-node-${index}`
    });
    const ring = addPart({
      geometry: new THREE.TorusGeometry(index === 5 ? 0.14 : 0.095, 0.008, 7, 24),
      material: materialLibrary.emissiveCyan,
      id: 'data-network',
      parent: dataNetwork,
      position,
      rotation: [Math.PI / 2, 0, 0],
      pickable: false,
      castShadow: false,
      receiveShadow: false,
      highDetail: true,
      name: `sensor-ring-${index}`
    });
    ring.userData.pulseOffset = index * 0.27;
  });

  const dataPaths = [
    [0, 1, 5, 10, 13], [2, 5, 10], [3, 5, 12], [4, 5, 11], [6, 5, 9], [7, 5, 8]
  ];
  const dataParticles = [];
  dataPaths.forEach((path, pathIndex) => {
    const curve = new THREE.CatmullRomCurve3(path.map((index) => new THREE.Vector3(...sensorPositions[index])));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)),
      new THREE.LineBasicMaterial({ color: palette.cyan, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    line.userData.componentId = 'data-network';
    dataNetwork.add(line);
    rememberMaterial(line.material);
    for (let particle = 0; particle < 4; particle += 1) {
      const dot = addPart({
        geometry: new THREE.SphereGeometry(0.03, 8, 6),
        material: particle % 2 ? materialLibrary.emissiveIce : materialLibrary.emissiveCyan,
        id: 'data-network',
        parent: dataNetwork,
        pickable: false,
        castShadow: false,
        receiveShadow: false,
        name: `data-particle-${pathIndex}-${particle}`
      });
      dot.userData.curve = curve;
      dot.userData.offset = (particle / 4 + pathIndex * 0.11) % 1;
      dataParticles.push(dot);
    }
  });

  const aeroGroup = new THREE.Group();
  aeroGroup.name = 'AERODYNAMIC_FLOW_FIELD';
  world.add(aeroGroup);
  const aeroParticles = [];
  const addFlowField = (points, lane, color, opacity = 0.15, count = 3) => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(150)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    aeroGroup.add(line);
    rememberMaterial(line.material);
    for (let index = 0; index < count; index += 1) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.024 + (lane % 3) * 0.003, 7, 5),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      particle.userData.curve = curve;
      particle.userData.offset = (index / count + Math.abs(lane) * 0.037) % 1;
      aeroGroup.add(particle);
      rememberMaterial(particle.material);
      aeroParticles.push(particle);
    }
  };
  for (let lane = -8; lane <= 8; lane += 1) {
    const z = lane * 0.28;
    addFlowField([
      [-7.4, 0.15 + Math.abs(lane) * 0.025, z * 1.2],
      [-5.4, 0.1, z],
      [-4.15, 0.22 + Math.abs(lane) * 0.03, z * 0.82],
      [-2.25, 0.52 + Math.abs(lane) * 0.02, z * 0.74],
      [0.2, 0.62, z * 0.62],
      [2.45, 0.36 + Math.abs(lane) * 0.018, z * 0.76],
      [4.5, 0.72 + Math.abs(lane) * 0.045, z * 1.05],
      [6.7, 1.05 + Math.abs(lane) * 0.08, z * 1.35]
    ], lane, lane % 2 ? palette.cyan : palette.ice, 0.1 + (8 - Math.abs(lane)) * 0.006, 2);
  }
  [-1, 1].forEach((side) => {
    for (let lane = 0; lane < 4; lane += 1) {
      addFlowField([
        [-2.7, -0.45, side * (0.35 + lane * 0.15)],
        [-1.25, -0.62, side * (0.45 + lane * 0.14)],
        [0.55, -0.55, side * (0.48 + lane * 0.12)],
        [2.25, -0.38, side * (0.38 + lane * 0.1)],
        [4.5, 0.25 + lane * 0.08, side * (0.3 + lane * 0.12)]
      ], lane, palette.cyan, 0.18, 3);
    }
  });

  const thermalGroup = new THREE.Group();
  thermalGroup.name = 'THERMAL_FIELD';
  world.add(thermalGroup);
  const thermalSources = [];
  const addThermalSource = (position, radius, color, componentId) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    mesh.position.set(...position);
    mesh.userData.componentId = componentId;
    thermalGroup.add(mesh);
    rememberMaterial(mesh.material);
    thermalSources.push(mesh);
    return mesh;
  };
  addThermalSource([-3.05, -0.55, -1.79], 0.48, 0xff9a35, 'front-brakes');
  addThermalSource([-3.05, -0.55, 1.79], 0.48, 0xff9a35, 'front-brakes');
  addThermalSource([3.12, -0.55, -1.86], 0.5, 0xff7a2f, 'rear-suspension');
  addThermalSource([3.12, -0.55, 1.86], 0.5, 0xff7a2f, 'rear-suspension');
  addThermalSource([1.9, 0.1, 0], 0.9, 0xff4638, 'power-unit');
  addThermalSource([0.3, -0.55, 0], 0.75, 0xffb24a, 'floor');

  const grid = new THREE.GridHelper(46, 46, 0x204457, 0x0b1d28);
  grid.position.y = -1.34;
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  scene.add(grid);

  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 6.4),
    new THREE.MeshBasicMaterial({ map: contactShadowTexture, transparent: true, opacity: 0.72, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0.3, -1.325, 0);
  scene.add(contactShadow);

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(6.9, 6.9, 0.08, 128),
    new THREE.MeshPhysicalMaterial({ color: 0x050a0f, metalness: 0.45, roughness: 0.34, clearcoat: 0.52, transparent: true, opacity: 0.72 })
  );
  platform.position.y = -1.39;
  platform.receiveShadow = true;
  scene.add(platform);

  const platformRing = new THREE.Mesh(
    new THREE.TorusGeometry(6.35, 0.018, 8, 160),
    new THREE.MeshBasicMaterial({ color: palette.cyan, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending })
  );
  platformRing.rotation.x = Math.PI / 2;
  platformRing.position.y = -1.33;
  scene.add(platformRing);

  const selectionBox = new THREE.Box3Helper(new THREE.Box3(), palette.cyan);
  selectionBox.material.transparent = true;
  selectionBox.material.opacity = 0.58;
  selectionBox.visible = false;
  selectionBox.renderOrder = 12;
  scene.add(selectionBox);

  const selectionMarker = new THREE.Group();
  const markerRingA = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.012, 8, 48), materialLibrary.emissiveCyan.clone());
  const markerRingB = markerRingA.clone();
  markerRingB.rotation.y = Math.PI / 2;
  selectionMarker.add(markerRingA, markerRingB);
  selectionMarker.visible = false;
  scene.add(selectionMarker);

  const cameraPresets = {
    hero: { position: [11.8, 4.45, 15.4], target: [0.15, 0.02, 0], twinOffset: [-1.5, 0.4, -2.2] },
    front: { position: [-13.8, 2.15, 0], target: [-2.1, -0.06, 0], twinOffset: [0.4, 1.1, 3.2] },
    cockpit: { position: [1.6, 2.75, 5.2], target: [-0.2, 0.64, 0], twinOffset: [-1.3, 0.1, 0.9] },
    side: { position: [0.6, 2.35, 16.6], target: [0.2, 0.03, 0], twinOffset: [2.3, 0.2, -1.6] },
    top: { position: [0.25, 15.8, 0.2], target: [0.25, -0.02, 0], twinOffset: [2.5, -1.4, 2.5] },
    rear: { position: [13.6, 2.35, 0], target: [2.45, 0.12, 0], twinOffset: [-0.5, 0.9, -3.1] },
    floor: { position: [1.35, -5.8, 10.8], target: [0.35, -0.68, 0], twinOffset: [1.9, 1.2, -1.5] }
  };

  let state = {
    view: 'studio',
    camera: 'hero',
    explode: 0,
    selectedComponent: 'monocoque',
    isolated: false,
    quality: 'auto',
    frame: null
  };
  let cameraName = 'hero';
  let zoom = 1;
  let userRotated = false;
  let pointerDown = false;
  let pointerMoved = false;
  let pointerX = 0;
  let pointerY = 0;
  let elapsed = 0;

  const mainTargetPosition = new THREE.Vector3(...cameraPresets.hero.position);
  const mainTargetLook = new THREE.Vector3(...cameraPresets.hero.target);
  const twinTargetPosition = new THREE.Vector3(...cameraPresets.hero.position).add(new THREE.Vector3(...cameraPresets.hero.twinOffset));
  const twinTargetLook = new THREE.Vector3(...cameraPresets.hero.target);
  mainCamera.position.copy(mainTargetPosition);
  twinCamera.position.copy(twinTargetPosition);
  mainCamera.lookAt(mainTargetLook);
  twinCamera.lookAt(twinTargetLook);

  const restoreMaterial = (material) => {
    const base = material.userData.ri30Base;
    if (!base) return;
    material.transparent = base.transparent;
    material.opacity = base.opacity;
    material.wireframe = base.wireframe || false;
    material.depthWrite = base.depthWrite;
    if (base.color && material.color) material.color.copy(base.color);
    if (base.emissive && material.emissive) material.emissive.copy(base.emissive);
    if ('emissiveIntensity' in material && base.emissiveIntensity !== undefined) material.emissiveIntensity = base.emissiveIntensity;
    if ('roughness' in material && base.roughness !== undefined) material.roughness = base.roughness;
    if ('metalness' in material && base.metalness !== undefined) material.metalness = base.metalness;
  };

  const updateSelectionHelpers = () => {
    const selected = groups.get(state.selectedComponent);
    if (!selected || !selected.visible) {
      selectionBox.visible = false;
      selectionMarker.visible = false;
      return;
    }
    const box = new THREE.Box3().setFromObject(selected);
    if (box.isEmpty()) return;
    selectionBox.box.copy(box);
    selectionBox.visible = state.view !== 'studio';
    const center = box.getCenter(new THREE.Vector3());
    const size = Math.max(0.45, Math.min(1.3, box.getSize(new THREE.Vector3()).length() * 0.12));
    selectionMarker.position.copy(center);
    selectionMarker.scale.setScalar(size);
    selectionMarker.visible = state.view === 'data' || state.view === 'technical';
  };

  const applyView = () => {
    managedMaterials.forEach(restoreMaterial);
    const technical = state.view === 'technical';
    aeroGroup.visible = state.view === 'aero';
    thermalGroup.visible = state.view === 'thermal';
    dataNetwork.visible = state.view === 'data' || state.selectedComponent === 'data-network';
    grid.visible = state.view !== 'studio';
    platformRing.material.opacity = state.view === 'studio' ? 0.2 : 0.42;
    technicalEdges.forEach((lines) => {
      const selected = lines.userData.componentId === state.selectedComponent;
      lines.material.opacity = technical ? (selected ? 0.95 : 0.34) : 0;
      lines.material.color.setHex(selected ? palette.ice : palette.cyan);
      lines.visible = technical;
    });
    groups.forEach((group, id) => {
      const selected = id === state.selectedComponent;
      group.visible = !state.isolated || selected;
      group.traverse((child) => {
        if (!child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (state.view === 'technical') {
            material.transparent = true;
            material.opacity = selected ? 0.72 : 0.18;
            material.depthWrite = false;
            if (material.color) material.color.setHex(selected ? palette.ice : 0x153748);
            if ('roughness' in material) material.roughness = 0.72;
          } else if (state.view === 'aero') {
            material.transparent = true;
            material.opacity = selected ? 0.78 : 0.32;
            material.depthWrite = false;
            if (material.color) material.color.setHex(selected ? palette.ice : 0x0b2b3c);
          } else if (state.view === 'thermal') {
            material.transparent = true;
            material.opacity = selected ? 0.82 : 0.2;
            material.depthWrite = false;
            if (material.color) material.color.setHex(selected ? 0xffc15a : 0x15191d);
          } else if (state.view === 'data') {
            material.transparent = true;
            material.opacity = selected ? 0.76 : 0.14;
            material.depthWrite = false;
            if (material.color) material.color.setHex(selected ? palette.ice : 0x0b2330);
          }
          if (selected && material.emissive) {
            material.emissive.setHex(state.view === 'thermal' ? 0x7d2108 : 0x063a4d);
            material.emissiveIntensity = state.view === 'studio' ? 0.55 : 1.25;
          }
        });
      });
    });
    updateSelectionHelpers();
  };

  const applyExplode = () => {
    groups.forEach((group, id) => {
      const vector = explodeVectors.get(id) || new THREE.Vector3();
      group.position.lerpVectors(new THREE.Vector3(), vector, state.explode / 100);
    });
    updateSelectionHelpers();
  };

  const setCamera = (name, instant = false) => {
    const preset = cameraPresets[name];
    if (!preset) return;
    cameraName = name;
    mainTargetPosition.set(...preset.position).multiplyScalar(zoom);
    mainTargetLook.set(...preset.target);
    twinTargetPosition.set(...preset.position).add(new THREE.Vector3(...preset.twinOffset)).multiplyScalar(zoom * 0.92);
    twinTargetLook.set(...preset.target);
    if (instant || reducedMotion) {
      mainCamera.position.copy(mainTargetPosition);
      mainCamera.lookAt(mainTargetLook);
      twinCamera.position.copy(twinTargetPosition);
      twinCamera.lookAt(twinTargetLook);
    }
  };

  const focusComponent = (id) => {
    const group = groups.get(id);
    if (!group) return;
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = Math.max(0.75, box.getSize(new THREE.Vector3()).length());
    const mainDirection = mainCamera.position.clone().sub(mainTargetLook).normalize();
    const twinDirection = twinCamera.position.clone().sub(twinTargetLook).normalize();
    mainTargetLook.copy(center);
    twinTargetLook.copy(center);
    mainTargetPosition.copy(center).add(mainDirection.multiplyScalar(Math.min(15, Math.max(3.6, size * 1.95))));
    twinTargetPosition.copy(center).add(twinDirection.multiplyScalar(Math.min(13, Math.max(3.1, size * 1.65))));
    updateSelectionHelpers();
  };

  const applyQuality = () => {
    const effective = state.quality === 'auto' ? (constrainedDevice ? 'balanced' : 'high') : state.quality;
    const lightweight = effective === 'lightweight';
    fallback?.toggleAttribute('hidden', !lightweight);
    twinFallback?.classList.toggle('is-visible', lightweight);
    highDetailObjects.forEach((object) => { object.visible = effective === 'high' || (effective === 'balanced' && !object.name.includes('disc-hole')); });
    keyLight.castShadow = effective === 'high';
    if (mainRenderer) mainRenderer.shadowMap.enabled = effective === 'high';
    if (twinRenderer) twinRenderer.shadowMap.enabled = effective === 'high';
    return effective;
  };

  const updateState = (next) => {
    const cameraChanged = next.camera && next.camera !== state.camera;
    state = { ...state, ...next };
    applyQuality();
    if (cameraChanged) setCamera(state.camera);
    applyView();
    applyExplode();
  };

  addEventListener('ri:state', (event) => updateState(event.detail));
  addEventListener('ri:focus-component', (event) => focusComponent(event.detail.id));

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const resizeRenderer = (renderer, canvas, camera) => {
    if (!renderer || !canvas) return false;
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width < 2 || bounds.height < 2) return false;
    const effective = state.quality === 'auto' ? (constrainedDevice ? 'balanced' : 'high') : state.quality;
    const pixelRatio = effective === 'high'
      ? Math.min(devicePixelRatio || 1, 2)
      : effective === 'balanced'
        ? Math.min(devicePixelRatio || 1, 1.35)
        : 1;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    return true;
  };

  const pick = (event, canvas, camera) => {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    const id = hit?.object?.userData.componentId;
    if (id) dispatchEvent(new CustomEvent('ri:component-selected', { detail: { id } }));
  };

  const bindCanvas = (canvas, camera) => {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', (event) => {
      pointerDown = true;
      pointerMoved = false;
      pointerX = event.clientX;
      pointerY = event.clientY;
      userRotated = true;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!pointerDown) return;
      const deltaX = event.clientX - pointerX;
      const deltaY = event.clientY - pointerY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 3) pointerMoved = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      world.rotation.y += deltaX * 0.0048;
      world.rotation.x = THREE.MathUtils.clamp(world.rotation.x + deltaY * 0.0032, -0.52, 0.32);
    });
    canvas.addEventListener('pointerup', (event) => {
      pointerDown = false;
      canvas.releasePointerCapture?.(event.pointerId);
      if (!pointerMoved) pick(event, canvas, camera);
    });
    canvas.addEventListener('pointercancel', () => { pointerDown = false; });
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      zoom = THREE.MathUtils.clamp(zoom + Math.sign(event.deltaY) * 0.065, 0.58, 1.62);
      setCamera(cameraName);
    }, { passive: false });
    canvas.addEventListener('dblclick', () => focusComponent(state.selectedComponent));
  };

  bindCanvas(mainCanvas, mainCamera);
  bindCanvas(twinCanvas, twinCamera);

  let previousTime = performance.now();
  let frameCounter = 0;
  let fpsSampleTime = previousTime;

  const animate = (now) => {
    const delta = Math.min(0.05, (now - previousTime) / 1000);
    previousTime = now;
    elapsed += delta;
    frameCounter += 1;

    if (now - fpsSampleTime > 1000) {
      dispatchEvent(new CustomEvent('ri:fps', { detail: { fps: frameCounter * 1000 / (now - fpsSampleTime) } }));
      frameCounter = 0;
      fpsSampleTime = now;
    }

    const effective = applyQuality();
    if (!userRotated && !reducedMotion && effective !== 'lightweight') world.rotation.y += delta * 0.038;

    const speed = state.frame?.speed || 210;
    const brakeTemperature = state.frame?.brake || 480;
    const steeringAngle = Math.sin((state.frame?.progress || elapsed * 0.03) * Math.PI * 10) * 0.11;
    const wheelSpin = delta * speed * 0.12;
    wheelAssemblies.forEach((wheel) => {
      wheel.root.rotation.z -= wheelSpin / wheel.radius;
      if (wheel.front) wheel.root.rotation.y = steeringAngle;
    });

    const heat = THREE.MathUtils.clamp((brakeTemperature - 420) / 430, 0, 1);
    brakeDiscs.forEach((disc) => {
      disc.material.emissive.setRGB(heat * 0.9, heat * heat * 0.22, 0.01);
      disc.material.emissiveIntensity = heat * 2.4;
    });
    thermalSources.forEach((source, index) => {
      const localHeat = index === 4 ? THREE.MathUtils.clamp((state.frame?.tyre || 90) / 120, 0.35, 1) : heat;
      source.material.opacity = 0.04 + localHeat * (index === 4 ? 0.12 : 0.2);
      const pulse = 1 + Math.sin(elapsed * 2.2 + index) * 0.06 + localHeat * 0.38;
      source.scale.setScalar(pulse);
    });

    coolingFans.forEach((fan, index) => { fan.rotation.x += delta * (9 + index * 2); });
    const drsOpen = speed > 285 && state.view !== 'technical';
    animatedActuators.forEach((actuator) => {
      const target = drsOpen ? actuator.open : actuator.closed;
      actuator.mesh.rotation.z = THREE.MathUtils.lerp(actuator.mesh.rotation.z, target, 1 - Math.exp(-delta * 6));
    });

    const flowTime = elapsed * (0.12 + speed / 1300);
    aeroParticles.forEach((particle) => particle.position.copy(particle.userData.curve.getPointAt((flowTime + particle.userData.offset) % 1)));
    dataParticles.forEach((particle) => particle.position.copy(particle.userData.curve.getPointAt((elapsed * 0.42 + particle.userData.offset) % 1)));
    dataNetwork.children.forEach((child) => {
      if (child.userData.pulseOffset !== undefined) {
        const pulse = 1 + Math.sin(elapsed * 3.2 + child.userData.pulseOffset) * 0.22;
        child.scale.setScalar(pulse);
      }
    });
    selectionMarker.rotation.y += delta * 0.8;
    selectionMarker.rotation.x -= delta * 0.35;
    platformRing.rotation.z += delta * 0.025;

    const cameraLerp = reducedMotion ? 1 : 1 - Math.exp(-delta * 5.1);
    mainCamera.position.lerp(mainTargetPosition, cameraLerp);
    twinCamera.position.lerp(twinTargetPosition, cameraLerp);
    mainCamera.lookAt(mainTargetLook);
    twinCamera.lookAt(twinTargetLook);

    if (effective !== 'lightweight') {
      if (resizeRenderer(mainRenderer, mainCanvas, mainCamera)) mainRenderer.render(scene, mainCamera);
      if (resizeRenderer(twinRenderer, twinCanvas, twinCamera)) twinRenderer.render(scene, twinCamera);
    }
    requestAnimationFrame(animate);
  };

  COMPONENTS.forEach((component) => ensureGroup(component.id));
  applyQuality();
  applyView();
  applyExplode();
  setCamera('hero', true);
  updateSelectionHelpers();
  requestAnimationFrame(animate);

  const partsNode = document.querySelector('[data-scene-geometry]');
  if (partsNode) partsNode.textContent = `${pickables.length} PARTS`;
  setTimeout(() => dispatchEvent(new CustomEvent('ri:scene-ready', { detail: { mode: constrainedDevice ? 'balanced' : 'high', parts: pickables.length } })), 120);
}

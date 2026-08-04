import * as THREE from 'three';
import { COMPONENTS } from './core.mjs';

const canvas = document.querySelector('#carScene');
const shell = document.querySelector('[data-scene-shell]');
const fallback = document.querySelector('[data-scene-fallback]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!canvas || !shell) {
  window.dispatchEvent(new CustomEvent('ri10x:scene-fallback'));
} else {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05080d, 0.035);
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(11.5, 4.6, 13.5);

    scene.add(new THREE.HemisphereLight(0xa6ddff, 0x071019, 1.25));
    const key = new THREE.DirectionalLight(0xd6f2ff, 3.1); key.position.set(-5, 8, 7); scene.add(key);
    const rim = new THREE.DirectionalLight(0x408fff, 2.3); rim.position.set(7, 3, -9); scene.add(rim);
    const red = new THREE.PointLight(0xff3442, 5.5, 16, 2); red.position.set(-5, 0.5, 4); scene.add(red);

    const world = new THREE.Group();
    world.position.set(0.55, -0.3, 0);
    world.rotation.set(-0.06, -0.53, 0.01);
    scene.add(world);

    const car = new THREE.Group();
    world.add(car);

    const componentGroups = new Map();
    const selectableMeshes = [];
    const explodeParts = [];
    let selectedId = 'floor';
    let currentView = 'studio';
    let explodeAmount = 0;
    let autoRotate = !reducedMotion;
    let pointerDown = false;
    let pointerStart = { x: 0, y: 0 };
    let rotationStart = { x: world.rotation.x, y: world.rotation.y };
    let targetCamera = camera.position.clone();
    let targetLook = new THREE.Vector3(0, 0.1, 0);

    const palette = {
      carbon: 0x080b0f,
      carbon2: 0x121820,
      paint: 0x142938,
      paint2: 0x1d4559,
      metal: 0x879aa6,
      rubber: 0x030405,
      cyan: 0x64d9ff,
      red: 0xff3644,
      amber: 0xffbd62
    };

    const studioMaterial = (color = palette.paint, options = {}) => new THREE.MeshPhysicalMaterial({
      color,
      metalness: options.metalness ?? .56,
      roughness: options.roughness ?? .27,
      clearcoat: options.clearcoat ?? .78,
      clearcoatRoughness: .18,
      transparent: options.opacity !== undefined && options.opacity < 1,
      opacity: options.opacity ?? 1,
      side: THREE.DoubleSide,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0
    });
    const carbon = studioMaterial(palette.carbon, { metalness: .35, roughness: .38, clearcoat: .48 });
    const carbonSoft = studioMaterial(palette.carbon2, { metalness: .42, roughness: .32, clearcoat: .62 });
    const paint = studioMaterial(palette.paint, { metalness: .65, roughness: .2, clearcoat: .96 });
    const paintLight = studioMaterial(palette.paint2, { metalness: .62, roughness: .22, clearcoat: .92 });
    const metal = studioMaterial(palette.metal, { metalness: .9, roughness: .2, clearcoat: .2 });
    const rubber = studioMaterial(palette.rubber, { metalness: .04, roughness: .86, clearcoat: .05 });
    const glass = studioMaterial(0x85dfff, { metalness: .05, roughness: .1, clearcoat: 1, opacity: .28, emissive: 0x0b3b54, emissiveIntensity: .35 });
    const accent = studioMaterial(palette.red, { metalness: .35, roughness: .25, clearcoat: .9, emissive: 0x3d0509, emissiveIntensity: .35 });

    const loftGeometry = (sections, radialSegments = 20) => {
      const positions = [];
      const indices = [];
      sections.forEach((section) => {
        for (let segment = 0; segment < radialSegments; segment += 1) {
          const angle = segment / radialSegments * Math.PI * 2 + (section.twist || 0);
          const c = Math.cos(angle); const s = Math.sin(angle); const pinch = section.pinch || 1.1;
          positions.push(
            section.x,
            (section.y || 0) + Math.sign(c) * Math.pow(Math.abs(c), pinch) * section.ry,
            (section.z || 0) + Math.sign(s) * Math.pow(Math.abs(s), pinch) * section.rz
          );
        }
      });
      for (let ring = 0; ring < sections.length - 1; ring += 1) {
        for (let segment = 0; segment < radialSegments; segment += 1) {
          const next = (segment + 1) % radialSegments;
          const a = ring * radialSegments + segment;
          const b = ring * radialSegments + next;
          const c = (ring + 1) * radialSegments + segment;
          const d = (ring + 1) * radialSegments + next;
          indices.push(a, c, b, b, c, d);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices); geometry.computeVertexNormals();
      return geometry;
    };

    const wedgeGeometry = (length, height, frontWidth, rearWidth) => {
      const l = length / 2; const h = height / 2; const fw = frontWidth / 2; const rw = rearWidth / 2;
      const vertices = new Float32Array([-l,-h,-fw,-l,-h,fw,-l,h,-fw,-l,h,fw,l,-h,-rw,l,-h,rw,l,h,-rw,l,h,rw]);
      const indices = [0,1,2,2,1,3,4,6,5,6,7,5,0,4,1,1,4,5,2,3,6,6,3,7,0,2,4,4,2,6,1,5,3,3,5,7];
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
    };

    function ensureComponent(id) {
      if (!componentGroups.has(id)) {
        const group = new THREE.Group();
        group.userData.componentId = id;
        componentGroups.set(id, group);
        car.add(group);
      }
      return componentGroups.get(id);
    }

    function addPart(id, geometry, material, options = {}) {
      const parent = options.parent || ensureComponent(id);
      const group = new THREE.Group();
      group.position.set(...(options.position || [0,0,0]));
      group.rotation.set(...(options.rotation || [0,0,0]));
      group.scale.set(...(options.scale || [1,1,1]));
      group.userData.basePosition = group.position.clone();
      group.userData.explode = new THREE.Vector3(...(options.explode || [0,0,0]));
      group.userData.componentId = id;
      parent.add(group);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.componentId = id;
      mesh.castShadow = false; mesh.receiveShadow = false;
      group.add(mesh);
      selectableMeshes.push(mesh);
      if (options.edges !== false) {
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 28), new THREE.LineBasicMaterial({ color: palette.cyan, transparent: true, opacity: .16 }));
        edges.userData.edge = true; edges.userData.baseOpacity = .16; edges.userData.componentId = id; group.add(edges);
      }
      explodeParts.push(group);
      return group;
    }

    function addTube(id, points, radius, material, options = {}) {
      const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
      return addPart(id, new THREE.TubeGeometry(curve, options.segments || 48, radius, 8, false), material, options);
    }

    addPart('monocoque', loftGeometry([
      { x:-2.45,y:.02,ry:.22,rz:.32,pinch:1.25 }, { x:-1.6,y:.1,ry:.42,rz:.54 }, { x:-.65,y:.34,ry:.55,rz:.66 },
      { x:.2,y:.42,ry:.62,rz:.72 }, { x:1.25,y:.29,ry:.5,rz:.6 }, { x:2.25,y:.12,ry:.34,rz:.45 }, { x:3.35,y:.1,ry:.22,rz:.28 }
    ], 22), paint, { explode:[0,.22,0] });
    addPart('floor', new THREE.BoxGeometry(7.7,.09,3.25,18,1,8), carbon, { position:[.4,-.74,0], explode:[0,-.75,0] });
    addPart('floor', wedgeGeometry(6.2,.18,2.5,3.05), carbonSoft, { position:[.7,-.63,0], explode:[0,-.52,0] });
    [-1,1].forEach((side) => {
      addPart('floor', wedgeGeometry(5.2,.18,.35,.7), paintLight, { position:[.7,-.55,side*1.42], rotation:[0,side*.035,side*.035], explode:[0,-.35,side*.75] });
      addTube('floor', [[-1.8,-.56,side*.55],[-.3,-.44,side*.7],[1.7,-.4,side*.82],[3.3,-.35,side*.6]], .04, metal, { explode:[0,-.4,side*.5], edges:false });
    });

    addPart('front-wing', wedgeGeometry(3.9,.42,.18,.72), paint, { position:[-4.15,-.08,0], explode:[-1.2,.05,0] });
    [0,1,2].forEach((tier) => addPart('front-wing', new THREE.BoxGeometry(1.4,.06,3.55-tier*.28,8,1,8), tier === 0 ? carbon : paintLight, { position:[-5.45,-.44+tier*.18,0], rotation:[0,0,-.035-tier*.03], explode:[-1.7, tier*.18, 0] }));
    [-1,1].forEach((side) => addPart('front-wing', new THREE.BoxGeometry(.68,.72,.045), accent, { position:[-5.5,-.13,side*1.79], rotation:[0,0,-.05], explode:[-1.6,0,side*.5], edges:false }));

    addPart('cockpit', new THREE.CapsuleGeometry(.66,1.15,6,18), glass, { position:[-.25,.78,0], rotation:[0,0,Math.PI/2], scale:[1,.72,.85], explode:[0,1.0,0] });
    const haloPoints = [[-.78,.63,-.5],[-.35,1.25,-.6],[.18,1.46,0],[-.35,1.25,.6],[-.78,.63,.5]];
    addTube('cockpit', haloPoints, .055, metal, { explode:[0,1.25,0], edges:false });
    addTube('cockpit', [[.18,1.46,0],[.4,.67,0]], .05, metal, { explode:[0,1.25,0], edges:false });

    [-1,1].forEach((side) => {
      addPart('sidepods', loftGeometry([
        { x:-.55,y:.04,z:side*.83,ry:.34,rz:.22 }, { x:.35,y:.08,z:side*1.07,ry:.5,rz:.38 },
        { x:1.45,y:.04,z:side*1.06,ry:.45,rz:.36 }, { x:2.55,y:-.04,z:side*.82,ry:.29,rz:.2 }
      ], 16), paintLight, { explode:[0,.35,side*1.1] });
      addPart('sidepods', new THREE.TorusGeometry(.27,.065,10,28,Math.PI*1.45), carbon, { position:[-.35,.3,side*1.12], rotation:[Math.PI/2,0,side>0?Math.PI*.75:-Math.PI*.75], explode:[0,.45,side*1.35] });
    });

    addPart('power-unit', loftGeometry([
      { x:.45,y:.47,ry:.48,rz:.49 }, { x:1.45,y:.58,ry:.55,rz:.54 }, { x:2.55,y:.47,ry:.45,rz:.42 }, { x:3.65,y:.27,ry:.28,rz:.25 }, { x:4.15,y:.17,ry:.18,rz:.16 }
    ], 18), paint, { explode:[.55,.85,0] });
    addPart('power-unit', new THREE.BoxGeometry(1.65,.05,.13), accent, { position:[1.45,.93,0], rotation:[0,0,-.04], explode:[.5,1.0,0], edges:false });

    ensureComponent('brakes');
    const wheelPositions = [{x:-2.92,z:-1.78,front:true},{x:-2.92,z:1.78,front:true},{x:3.05,z:-1.86,front:false},{x:3.05,z:1.86,front:false}];
    wheelPositions.forEach(({x,z,front}) => {
      const id = front ? 'front-suspension' : 'rear-suspension';
      const side = Math.sign(z);
      const radius = front ? .76 : .84;
      const width = front ? .54 : .62;
      const wheel = new THREE.Group(); wheel.position.set(x,-.55,z); wheel.userData.componentId = id; ensureComponent(id).add(wheel);
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,width,44,1,true), rubber); tire.rotation.x = Math.PI/2; tire.userData.componentId = id; wheel.add(tire); selectableMeshes.push(tire);
      const rimMesh = new THREE.Mesh(new THREE.CylinderGeometry(radius*.53,radius*.53,width*1.04,28,1,true), metal); rimMesh.rotation.x = Math.PI/2; rimMesh.userData.componentId = id; wheel.add(rimMesh); selectableMeshes.push(rimMesh);
      const brake = new THREE.Mesh(new THREE.CylinderGeometry(radius*.34,radius*.34,width*.35,32), studioMaterial(0x6b7378,{metalness:.8,roughness:.35})); brake.rotation.x = Math.PI/2; brake.userData.componentId = 'brakes'; wheel.add(brake); selectableMeshes.push(brake);
      const caliper = new THREE.Mesh(new THREE.BoxGeometry(.18,.42,.12), accent); caliper.position.set(.12,.02,side*-.18); caliper.userData.componentId = 'brakes'; wheel.add(caliper); selectableMeshes.push(caliper);
      wheel.userData.basePosition = wheel.position.clone(); wheel.userData.explode = new THREE.Vector3(front?-1.1:1.1,.1,side*1.35); explodeParts.push(wheel);
      const chassisX = front ? -2.0 : 2.35;
      const points = [[chassisX,.12,side*.72],[x,-.55,z],[chassisX,-.42,side*.73]];
      addTube(id,[points[0],points[1]],.028,metal,{explode:[front?-.55:.55,0,side*.62],edges:false});
      addTube(id,[points[2],points[1]],.026,metal,{explode:[front?-.55:.55,0,side*.62],edges:false});
    });

    [0,1].forEach((tier) => addPart('rear-wing', new THREE.BoxGeometry(1.15,.075,3.05-tier*.22,8,1,8), tier ? paintLight : carbon, { position:[4.7,1.05+tier*.23,0], rotation:[0,0,tier?-.07:.025], explode:[1.6,.5+tier*.2,0] }));
    [-1,1].forEach((side) => addPart('rear-wing', new THREE.BoxGeometry(.18,.96,.055), accent, { position:[4.85,.88,side*1.5], explode:[1.6,.5,side*.45], edges:false }));
    addPart('rear-wing', wedgeGeometry(1.55,.48,2.5,1.55), carbonSoft, { position:[4.0,-.48,0], rotation:[0,0,.05], explode:[1.1,-.3,0] });

    const dataGroup = ensureComponent('telemetry');
    const dataPoints = [[-5.1,-.1,0],[-2.9,-.55,-1.78],[-2.9,-.55,1.78],[-.2,.72,0],[1.5,.55,0],[3.05,-.55,-1.86],[3.05,-.55,1.86],[4.75,1.1,0]];
    dataPoints.forEach((point,index) => {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(.07,12,8), studioMaterial(palette.cyan,{metalness:.2,roughness:.2,emissive:palette.cyan,emissiveIntensity:1.8}));
      sphere.position.set(...point); sphere.userData.componentId = 'telemetry'; dataGroup.add(sphere); selectableMeshes.push(sphere);
      if (index > 0) addTube('telemetry',[dataPoints[0],point],.012,studioMaterial(palette.cyan,{opacity:.6,emissive:palette.cyan,emissiveIntensity:1.5}),{parent:dataGroup,edges:false});
    });

    const aeroGroup = new THREE.Group(); world.add(aeroGroup);
    const flowLines = [];
    for (let lane = -5; lane <= 5; lane += 1) {
      const z = lane * .42;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-7,.2+Math.abs(lane)*.035,z*1.45), new THREE.Vector3(-5,.1,z*1.2), new THREE.Vector3(-2.7,.48,z*.9),
        new THREE.Vector3(.2,.55,z*.7), new THREE.Vector3(2.8,.3,z*.92), new THREE.Vector3(6,.85+Math.abs(lane)*.05,z*1.55)
      ]);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)), new THREE.LineBasicMaterial({color:palette.cyan,transparent:true,opacity:.0,blending:THREE.AdditiveBlending}));
      aeroGroup.add(line); flowLines.push({line,curve,offset:(lane+5)/11});
    }
    const particles = flowLines.map((flow) => {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(.035,8,6), new THREE.MeshBasicMaterial({color:0xc9f4ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending}));
      aeroGroup.add(particle); return {...flow,particle};
    });

    const componentCenters = {
      'front-wing': new THREE.Vector3(-4.9,-.12,0), 'front-suspension': new THREE.Vector3(-2.9,-.45,0), brakes: new THREE.Vector3(-2.9,-.55,1.65),
      monocoque: new THREE.Vector3(.1,.2,0), cockpit: new THREE.Vector3(-.15,.9,0), sidepods: new THREE.Vector3(.8,.05,0), floor: new THREE.Vector3(.5,-.58,0),
      'power-unit': new THREE.Vector3(2,.5,0), 'rear-suspension': new THREE.Vector3(3.05,-.48,0), 'rear-wing': new THREE.Vector3(4.65,.9,0), telemetry: new THREE.Vector3(.2,.6,0)
    };

    const ground = new THREE.GridHelper(30, 30, 0x163346, 0x0c1c27); ground.position.y = -1.42; ground.material.transparent = true; ground.material.opacity = .22; scene.add(ground);
    const ring = new THREE.Mesh(new THREE.RingGeometry(5.4,5.43,96), new THREE.MeshBasicMaterial({color:0x296b8a,transparent:true,opacity:.16,side:THREE.DoubleSide})); ring.rotation.x = -Math.PI/2; ring.position.y=-1.38; scene.add(ring);

    function setExplode(value) {
      explodeAmount = value / 100;
      explodeParts.forEach((part) => {
        if (!part.userData.basePosition || !part.userData.explode) return;
        part.position.copy(part.userData.basePosition).addScaledVector(part.userData.explode, explodeAmount);
      });
    }

    function setView(view) {
      currentView = view;
      componentGroups.forEach((group, id) => {
        group.traverse((object) => {
          if (!object.isMesh && !object.isLineSegments) return;
          const objectId = object.userData.componentId || id;
          if (object.userData.edge) {
            object.material.opacity = view === 'technical' ? .72 : view === 'data' ? .28 : .14;
            object.material.color.setHex(view === 'thermal' ? palette.amber : palette.cyan);
            return;
          }
          if (!object.isMesh) return;
          const material = object.material;
          if (!material.userData.original) {
            material.userData.original = { color: material.color?.getHex(), opacity: material.opacity, transparent: material.transparent, emissive: material.emissive?.getHex(), emissiveIntensity: material.emissiveIntensity };
          }
          const original = material.userData.original;
          material.color?.setHex(original.color);
          material.emissive?.setHex(original.emissive || 0x000000);
          material.emissiveIntensity = original.emissiveIntensity || 0;
          material.opacity = original.opacity;
          material.transparent = original.transparent;
          if (view === 'technical') { material.transparent = true; material.opacity = objectId === selectedId ? .72 : .22; material.color?.setHex(objectId === selectedId ? 0x7fe6ff : 0x19364a); }
          if (view === 'thermal') {
            const thermal = objectId === 'brakes' ? 0xff3b21 : objectId === 'power-unit' ? 0xff8a2c : objectId.includes('suspension') ? 0xffc258 : 0x183747;
            material.color?.setHex(thermal); material.emissive?.setHex(thermal); material.emissiveIntensity = objectId === 'brakes' ? 1.4 : objectId === 'power-unit' ? .8 : .18;
          }
          if (view === 'data') { material.transparent = true; material.opacity = objectId === 'telemetry' ? .95 : .12; material.color?.setHex(objectId === 'telemetry' ? palette.cyan : 0x123044); }
          if (view === 'aero') { material.transparent = true; material.opacity = objectId === 'floor' || objectId === 'front-wing' || objectId === 'rear-wing' ? .48 : .16; material.color?.setHex(objectId === 'floor' ? 0x25a9dc : 0x173447); }
        });
      });
      flowLines.forEach(({line}) => line.material.opacity = view === 'aero' ? .28 : 0);
      particles.forEach(({particle}) => particle.material.opacity = view === 'aero' ? .9 : 0);
    }

    function selectComponent(componentId, announce = true) {
      if (!componentGroups.has(componentId)) return;
      selectedId = componentId;
      componentGroups.forEach((group,id) => {
        group.traverse((object) => {
          const objectComponent = object.userData.componentId || id;
          if (object.userData.edge) object.material.opacity = objectComponent === componentId ? .8 : currentView === 'technical' ? .34 : .12;
          if (object.isMesh) object.scale.setScalar(objectComponent === componentId ? 1.015 : 1);
        });
      });
      selectableMeshes.forEach((mesh) => {
        mesh.scale.setScalar(mesh.userData.componentId === componentId ? 1.015 : 1);
      });
      const center = componentCenters[componentId] || new THREE.Vector3();
      targetLook.copy(center).multiplyScalar(.55);
      if (announce) window.dispatchEvent(new CustomEvent('ri10x:component-selected', { detail: { componentId } }));
    }

    const cameras = {
      hero: { position:[11.5,4.6,13.5], look:[0,.1,0] }, front:{position:[-13,2.2,0],look:[-2.2,-.1,0]}, cockpit:{position:[2.7,2.6,5.8],look:[-.2,.55,0]},
      side:{position:[.4,2.2,15],look:[.4,0,0]}, top:{position:[.5,17,.2],look:[.5,0,0]}, rear:{position:[13,2.7,0],look:[2.7,.1,0]}
    };
    function setCameraPreset(name) {
      const preset = cameras[name] || cameras.hero;
      targetCamera.set(...preset.position); targetLook.set(...preset.look); autoRotate = false;
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function updatePointer(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    canvas.addEventListener('pointerdown', (event) => {
      pointerDown = true; pointerStart = {x:event.clientX,y:event.clientY}; rotationStart = {x:world.rotation.x,y:world.rotation.y}; autoRotate = false; canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!pointerDown) return;
      world.rotation.y = rotationStart.y + (event.clientX - pointerStart.x) * .006;
      world.rotation.x = THREE.MathUtils.clamp(rotationStart.x + (event.clientY - pointerStart.y) * .004, -.45, .35);
    });
    canvas.addEventListener('pointerup', (event) => {
      const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      pointerDown = false;
      if (moved < 7) {
        updatePointer(event); raycaster.setFromCamera(pointer,camera);
        const hit = raycaster.intersectObjects(selectableMeshes,false)[0];
        if (hit?.object?.userData?.componentId) selectComponent(hit.object.userData.componentId);
      }
    });
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault(); autoRotate = false;
      const direction = targetCamera.clone().sub(targetLook).normalize();
      targetCamera.addScaledVector(direction, event.deltaY * .008);
      const distance = targetCamera.distanceTo(targetLook);
      if (distance < 7) targetCamera.copy(targetLook).addScaledVector(direction,7);
      if (distance > 24) targetCamera.copy(targetLook).addScaledVector(direction,24);
    }, { passive:false });
    canvas.addEventListener('keydown', (event) => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault(); autoRotate = false;
      if (event.key === 'ArrowLeft') world.rotation.y -= .08;
      if (event.key === 'ArrowRight') world.rotation.y += .08;
      if (event.key === 'ArrowUp') world.rotation.x = THREE.MathUtils.clamp(world.rotation.x - .06,-.45,.35);
      if (event.key === 'ArrowDown') world.rotation.x = THREE.MathUtils.clamp(world.rotation.x + .06,-.45,.35);
    });

    window.addEventListener('ri10x:set-view', (event) => setView(event.detail.view));
    window.addEventListener('ri10x:set-camera', (event) => setCameraPreset(event.detail.camera));
    window.addEventListener('ri10x:set-explode', (event) => setExplode(event.detail.explode));
    window.addEventListener('ri10x:select-component', (event) => selectComponent(event.detail.componentId, false));
    window.addEventListener('ri10x:set-quality', (event) => {
      const ratios = { high:2, balanced:1.35, lightweight:1, auto:Math.min(devicePixelRatio||1,1.7) };
      renderer.setPixelRatio(ratios[event.detail.quality] || ratios.auto);
      resize();
    });
    window.addEventListener('ri10x:telemetry', (event) => {
      const value = event.detail?.brakeTemp || 650;
      red.intensity = THREE.MathUtils.mapLinear(value,620,780,3.2,7.4);
    });

    function resize() {
      const rect = shell.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width)); const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width,height,false); camera.aspect = width/height; camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(shell); resize();

    const clock = new THREE.Clock();
    function animate() {
      const delta = Math.min(clock.getDelta(),.05); const elapsed = clock.elapsedTime;
      if (autoRotate && !pointerDown) world.rotation.y += delta * .08;
      camera.position.lerp(targetCamera, reducedMotion ? 1 : .055);
      camera.lookAt(targetLook);
      if (currentView === 'aero') particles.forEach(({particle,curve,offset},index) => particle.position.copy(curve.getPoint((elapsed*.12+offset+index*.025)%1)));
      ring.rotation.z += delta * .025;
      componentGroups.get('telemetry')?.children.forEach((child,index) => { if (child.isMesh) child.scale.setScalar(1 + Math.sin(elapsed*3+index)*.16); });
      renderer.render(scene,camera);
      requestAnimationFrame(animate);
    }
    selectComponent(selectedId,false); setView('studio'); animate();
    fallback.hidden = true;
    window.dispatchEvent(new CustomEvent('ri10x:scene-ready'));
  } catch (error) {
    console.error('RI-10X WebGL fallback:', error);
    fallback.hidden = false;
    canvas.hidden = true;
    window.dispatchEvent(new CustomEvent('ri10x:scene-fallback'));
  }
}

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

export class SceneRuntime extends EventTarget {
  constructor(canvas, qualityManager) {
    super();
    this.canvas = canvas;
    RectAreaLightUniformsLib.init();
    this.qualityManager = qualityManager;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090c10);
    this.scene.fog = new THREE.FogExp2(0x090c10, .032);
    this.camera = new THREE.PerspectiveCamera(36, 1, .08, 120);
    this.renderer = qualityManager.createRenderer(canvas);
    this.renderer.shadowMap.autoUpdate = true;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const environment = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(environment, .04).texture;
    pmrem.dispose();
    environment.dispose();
    this.lights = {};
    this.floor = null;
    this.contactShadow = null;
    this.post = null;
    this.buildHangar();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
  }

  buildHangar() {
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x11161c, roughness: .58, metalness: .18, envMapIntensity: .5 });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = .6;
    this.floor.receiveShadow = true;
    this.floor.name = 'HANGAR_FLOOR';
    this.scene.add(this.floor);

    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x181e25, roughness: .48, metalness: .45, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(4.55, 4.7, .08, 96), platformMaterial);
    platform.position.y = .57;
    platform.scale.z = .62;
    platform.receiveShadow = true;
    this.scene.add(platform);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4.25, 4.3, 128),
      new THREE.MeshBasicMaterial({ color: 0x47525f, transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = .616;
    ring.scale.y = .62;
    this.scene.add(ring);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 512;
    const ctx = shadowCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(256, 256, 32, 256, 256, 250);
    gradient.addColorStop(0, 'rgba(0,0,0,.78)');
    gradient.addColorStop(.48, 'rgba(0,0,0,.42)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(8.5, 4.25),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: .56, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.set(-.05, .624, 0);
    this.scene.add(this.contactShadow);

    const hemisphere = new THREE.HemisphereLight(0xf7f9ff, 0x111418, .85);
    this.scene.add(hemisphere);
    this.lights.hemisphere = hemisphere;

    const key = new THREE.DirectionalLight(0xfffaf2, 4.6);
    key.position.set(-4.5, 8.5, 5.8);
    key.castShadow = true;
    key.shadow.camera.near = .5;
    key.shadow.camera.far = 24;
    key.shadow.camera.left = -7;
    key.shadow.camera.right = 7;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -4;
    key.shadow.bias = -.00018;
    key.shadow.normalBias = .024;
    this.scene.add(key);
    this.lights.key = key;
    this.qualityManager.registerShadowLight(key);

    const fill = new THREE.DirectionalLight(0xdfe8f0, 1.55);
    fill.position.set(4, 4, 5);
    this.scene.add(fill);
    this.lights.fill = fill;

    const rimLeft = new THREE.SpotLight(0xf4f8ff, 3.9, 18, Math.PI * .24, .55, 1.5);
    rimLeft.position.set(1, 4.8, -6.6);
    rimLeft.target.position.set(.2, .8, 0);
    this.scene.add(rimLeft, rimLeft.target);
    this.lights.rimLeft = rimLeft;

    const rimRight = new THREE.SpotLight(0xff725d, 2.25, 15, Math.PI * .22, .6, 1.7);
    rimRight.position.set(-2.5, 3.6, 6.2);
    rimRight.target.position.set(-.3, .75, 0);
    this.scene.add(rimRight, rimRight.target);
    this.lights.rimRight = rimRight;

    const overhead = new THREE.RectAreaLight(0xffffff, 10, 7.5, 2.2);
    overhead.position.set(-.4, 5.7, .2);
    overhead.rotation.x = -Math.PI / 2;
    this.scene.add(overhead);
    this.lights.overhead = overhead;

    this.setLightPreset('studio');
  }

  setLightPreset(name) {
    const presets = {
      studio: { bg: 0x090c10, fog: .032, exposure: 1.02, hemi: .85, key: 4.6, fill: 1.55, rimL: 3.9, rimR: 2.25, over: 10, shadow: .56 },
      technical: { bg: 0x0d1116, fog: .024, exposure: .96, hemi: 1.15, key: 3.8, fill: 2.25, rimL: 2.8, rimR: .9, over: 12, shadow: .42 },
      night: { bg: 0x030507, fog: .046, exposure: .88, hemi: .24, key: 1.65, fill: .35, rimL: 5.8, rimR: 3.8, over: 2.2, shadow: .72 },
      inspection: { bg: 0x151719, fog: .018, exposure: 1.08, hemi: 1.45, key: 6.2, fill: 3.2, rimL: 2.3, rimR: 1.6, over: 15, shadow: .38 }
    };
    const p = presets[name] || presets.studio;
    this.scene.background.setHex(p.bg);
    this.scene.fog.color.setHex(p.bg);
    this.scene.fog.density = p.fog;
    this.renderer.toneMappingExposure = p.exposure;
    this.lights.hemisphere.intensity = p.hemi;
    this.lights.key.intensity = p.key;
    this.lights.fill.intensity = p.fill;
    this.lights.rimLeft.intensity = p.rimL;
    this.lights.rimRight.intensity = p.rimR;
    this.lights.overhead.intensity = p.over;
    this.contactShadow.material.opacity = p.shadow;
    this.dispatchEvent(new CustomEvent('light', { detail: { name } }));
  }

  async setCinematicDOF(enabled) {
    if (!enabled || !this.qualityManager.config.dof) {
      if (this.post?.bokeh) this.post.bokeh.enabled = false;
      return;
    }
    if (!this.post) {
      try {
        const [{ EffectComposer }, { RenderPass }, { BokehPass }] = await Promise.all([
          import('three/addons/postprocessing/EffectComposer.js'),
          import('three/addons/postprocessing/RenderPass.js'),
          import('three/addons/postprocessing/BokehPass.js')
        ]);
        const composer = new EffectComposer(this.renderer);
        composer.addPass(new RenderPass(this.scene, this.camera));
        const bokeh = new BokehPass(this.scene, this.camera, { focus: 6.2, aperture: .00012, maxblur: .004, width: this.canvas.clientWidth, height: this.canvas.clientHeight });
        composer.addPass(bokeh);
        this.post = { composer, bokeh };
      } catch {
        return;
      }
    }
    this.post.bokeh.enabled = true;
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.post?.composer?.setSize(width, height);
  }

  render() {
    if (this.post?.bokeh?.enabled) this.post.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.resizeObserver.disconnect();
    this.post?.composer?.dispose?.();
    this.floor.geometry.dispose();
    this.floor.material.dispose();
    this.contactShadow.geometry.dispose();
    this.contactShadow.material.map?.dispose();
    this.contactShadow.material.dispose();
    this.scene.environment?.dispose?.();
    this.renderer.dispose();
  }
}

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
    this.scene.background = new THREE.Color(0x080a0d);
    this.scene.fog = new THREE.FogExp2(0x080a0d, .028);
    this.camera = new THREE.PerspectiveCamera(36, 1, .06, 120);
    this.renderer = qualityManager.createRenderer(canvas);
    this.renderer.shadowMap.autoUpdate = true;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const environment = new RoomEnvironment();
    this.environmentTexture = pmrem.fromScene(environment, .035).texture;
    this.scene.environment = this.environmentTexture;
    pmrem.dispose();
    environment.dispose();
    this.lights = {};
    this.floor = null;
    this.platform = null;
    this.platformRing = null;
    this.contactShadow = null;
    this.post = null;
    this.buildHangar();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
  }

  buildHangar() {
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1318, roughness: .72, metalness: .08, envMapIntensity: .34 });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = .6;
    this.floor.receiveShadow = true;
    this.floor.name = 'HANGAR_FLOOR';
    this.scene.add(this.floor);

    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x171b20,
      roughness: .56,
      metalness: .28,
      envMapIntensity: .48,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    this.platform = new THREE.Mesh(new THREE.CylinderGeometry(4.55, 4.7, .08, 96), platformMaterial);
    this.platform.position.y = .57;
    this.platform.scale.z = .62;
    this.platform.receiveShadow = true;
    this.platform.name = 'INSPECTION_PLATFORM';
    this.scene.add(this.platform);

    this.platformRing = new THREE.Mesh(
      new THREE.RingGeometry(4.25, 4.3, 128),
      new THREE.MeshBasicMaterial({ color: 0x6b7782, transparent: true, opacity: .11, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    );
    this.platformRing.rotation.x = -Math.PI / 2;
    this.platformRing.position.y = .616;
    this.platformRing.scale.y = .62;
    this.scene.add(this.platformRing);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 512;
    const context = shadowCanvas.getContext('2d');
    const gradient = context.createRadialGradient(256, 256, 24, 256, 256, 252);
    gradient.addColorStop(0, 'rgba(0,0,0,.86)');
    gradient.addColorStop(.34, 'rgba(0,0,0,.58)');
    gradient.addColorStop(.68, 'rgba(0,0,0,.20)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    shadowTexture.colorSpace = THREE.NoColorSpace;
    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(8.5, 4.25),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: .62,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3
      })
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.set(-.05, .624, 0);
    this.scene.add(this.contactShadow);

    const hemisphere = new THREE.HemisphereLight(0xf4f4f1, 0x101216, .55);
    this.scene.add(hemisphere);
    this.lights.hemisphere = hemisphere;

    const key = new THREE.DirectionalLight(0xfff7eb, 3.4);
    key.position.set(-4.8, 8.2, 5.4);
    key.castShadow = true;
    key.shadow.camera.near = .5;
    key.shadow.camera.far = 24;
    key.shadow.camera.left = -7;
    key.shadow.camera.right = 7;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -4;
    key.shadow.bias = -.00016;
    key.shadow.normalBias = .026;
    this.scene.add(key);
    this.lights.key = key;
    this.qualityManager.registerShadowLight(key);

    const fill = new THREE.RectAreaLight(0xf1f3f4, 4.2, 4.2, 2.2);
    fill.position.set(1.8, 3.4, 4.9);
    fill.lookAt(-.2, .85, 0);
    this.scene.add(fill);
    this.lights.fill = fill;

    const rimLeft = new THREE.RectAreaLight(0xf7f9fb, 5.2, 7.2, .72);
    rimLeft.position.set(1.0, 2.55, -4.8);
    rimLeft.lookAt(.1, .9, 0);
    this.scene.add(rimLeft);
    this.lights.rimLeft = rimLeft;

    const rimRight = new THREE.RectAreaLight(0xffe3d4, 1.5, 2.8, 1.0);
    rimRight.position.set(-3.2, 2.25, 4.0);
    rimRight.lookAt(-.6, .85, 0);
    this.scene.add(rimRight);
    this.lights.rimRight = rimRight;

    const overhead = new THREE.RectAreaLight(0xffffff, 5.8, 7.8, 2.5);
    overhead.position.set(-.35, 5.8, .15);
    overhead.rotation.x = -Math.PI / 2;
    this.scene.add(overhead);
    this.lights.overhead = overhead;

    this.setLightPreset('studio');
  }

  setLightPreset(name) {
    const presets = {
      studio: {
        bg: 0x080a0d, fog: .028, exposure: .94, hemi: .55, key: 3.4, fill: 4.2, rimL: 5.2, rimR: 1.5, over: 5.8, shadow: .62,
        sky: 0xf4f4f1, ground: 0x101216, keyColor: 0xfff7eb, fillColor: 0xf1f3f4, rimLColor: 0xf7f9fb, rimRColor: 0xffe3d4
      },
      technical: {
        bg: 0x0b0e12, fog: .021, exposure: .91, hemi: .78, key: 3.0, fill: 5.0, rimL: 3.6, rimR: .55, over: 7.2, shadow: .5,
        sky: 0xf4f7f8, ground: 0x11151a, keyColor: 0xfbfdfd, fillColor: 0xeaf1f3, rimLColor: 0xdde9ed, rimRColor: 0xf5eee9
      },
      night: {
        bg: 0x020304, fog: .043, exposure: .82, hemi: .16, key: 1.15, fill: .5, rimL: 6.1, rimR: 2.65, over: 1.15, shadow: .74,
        sky: 0x8f9ba6, ground: 0x050607, keyColor: 0xdbe5ee, fillColor: 0x8997a3, rimLColor: 0xbfd8e8, rimRColor: 0xffb39c
      },
      inspection: {
        bg: 0x111315, fog: .015, exposure: .99, hemi: .96, key: 4.65, fill: 6.7, rimL: 4.0, rimR: .9, over: 8.6, shadow: .44,
        sky: 0xffffff, ground: 0x22262a, keyColor: 0xffffff, fillColor: 0xf9faf9, rimLColor: 0xf3f7f8, rimRColor: 0xffeee5
      }
    };
    const preset = presets[name] || presets.studio;
    this.scene.background.setHex(preset.bg);
    this.scene.fog.color.setHex(preset.bg);
    this.scene.fog.density = preset.fog;
    this.renderer.toneMappingExposure = preset.exposure;
    this.lights.hemisphere.intensity = preset.hemi;
    this.lights.hemisphere.color.setHex(preset.sky);
    this.lights.hemisphere.groundColor.setHex(preset.ground);
    this.lights.key.intensity = preset.key;
    this.lights.key.color.setHex(preset.keyColor);
    this.lights.fill.intensity = preset.fill;
    this.lights.fill.color.setHex(preset.fillColor);
    this.lights.rimLeft.intensity = preset.rimL;
    this.lights.rimLeft.color.setHex(preset.rimLColor);
    this.lights.rimRight.intensity = preset.rimR;
    this.lights.rimRight.color.setHex(preset.rimRColor);
    this.lights.overhead.intensity = preset.over;
    this.contactShadow.material.opacity = preset.shadow;
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
        const bokeh = new BokehPass(this.scene, this.camera, {
          focus: 5.8,
          aperture: .000085,
          maxblur: .003,
          width: this.canvas.clientWidth,
          height: this.canvas.clientHeight
        });
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
    for (const object of [this.floor, this.platform, this.platformRing, this.contactShadow]) {
      object?.geometry?.dispose?.();
      object?.material?.map?.dispose?.();
      object?.material?.dispose?.();
    }
    this.environmentTexture?.dispose?.();
    this.renderer.dispose();
  }
}

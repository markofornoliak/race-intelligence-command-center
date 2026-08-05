import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { damp } from './utils.js';

const PRESETS = Object.freeze({
  hero: { position: new THREE.Vector3(-5.9, 2.65, 5.55), target: new THREE.Vector3(-.15, .72, 0), min: 4.8, max: 10 },
  front: { position: new THREE.Vector3(-7.0, 1.35, 0), target: new THREE.Vector3(-1.2, .6, 0), min: 4, max: 9 },
  rear: { position: new THREE.Vector3(6.7, 1.55, 0), target: new THREE.Vector3(1.15, .72, 0), min: 4, max: 9 },
  side: { position: new THREE.Vector3(-.2, 1.65, 7.0), target: new THREE.Vector3(-.05, .58, 0), min: 4.5, max: 10 },
  top: { position: new THREE.Vector3(-.15, 8.4, .01), target: new THREE.Vector3(-.1, .25, 0), min: 5, max: 11 },
  cockpit: { position: new THREE.Vector3(-1.05, 1.35, 1.65), target: new THREE.Vector3(-.1, .88, 0), min: 1.25, max: 4.2 },
  suspension: { position: new THREE.Vector3(-4.35, 1.35, 2.45), target: new THREE.Vector3(-2.7, .65, 1.0), min: 1.6, max: 5 },
  floor: { position: new THREE.Vector3(-.4, -.65, 4.4), target: new THREE.Vector3(.15, .08, 0), min: 2.8, max: 7 }
});

export class CameraController extends EventTarget {
  constructor(camera, renderer, vehicle) {
    super();
    this.camera = camera;
    this.renderer = renderer;
    this.vehicle = vehicle;
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .075;
    this.controls.enablePan = false;
    this.controls.screenSpacePanning = false;
    this.controls.minPolarAngle = .05;
    this.controls.maxPolarAngle = Math.PI * .91;
    this.controls.minAzimuthAngle = -Infinity;
    this.controls.maxAzimuthAngle = Infinity;
    this.controls.zoomToCursor = true;
    this.controls.autoRotateSpeed = .5;
    this.targetPosition = camera.position.clone();
    this.targetLookAt = this.controls.target.clone();
    this.transitioning = false;
    this.currentPreset = localStorage.getItem('ri60x-camera') || 'hero';
    this.cinematic = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.focusObject = null;
    this.applyPreset(this.currentPreset, false);
    this.bindPicking();
  }

  applyPreset(name, animate = true) {
    const preset = PRESETS[name] || PRESETS.hero;
    this.currentPreset = name in PRESETS ? name : 'hero';
    localStorage.setItem('ri60x-camera', this.currentPreset);
    this.controls.minDistance = preset.min;
    this.controls.maxDistance = preset.max;
    this.targetPosition.copy(preset.position);
    this.targetLookAt.copy(preset.target);
    this.transitioning = animate;
    this.controls.autoRotate = false;
    if (!animate) {
      this.camera.position.copy(preset.position);
      this.controls.target.copy(preset.target);
      this.controls.update();
    }
    this.dispatchEvent(new CustomEvent('preset', { detail: { name: this.currentPreset } }));
  }

  focus(point, object) {
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3()).length();
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    const distance = THREE.MathUtils.clamp(size * 2.4 + 1.1, 1.45, 4.8);
    this.targetLookAt.copy(point);
    this.targetPosition.copy(point).add(direction.multiplyScalar(distance)).add(new THREE.Vector3(0, Math.min(.45, size * .2), 0));
    this.controls.minDistance = Math.max(.9, distance * .55);
    this.controls.maxDistance = Math.max(4.2, distance * 2.2);
    this.transitioning = true;
    this.focusObject = object;
    this.dispatchEvent(new CustomEvent('focus', { detail: { point, object } }));
  }

  bindPicking() {
    this.renderer.domElement.addEventListener('dblclick', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.vehicle.pick(this.raycaster);
      if (hit) this.focus(hit.point, hit.object);
    });
  }

  pointerPick(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.vehicle.pick(this.raycaster);
  }

  setAutoOrbit(enabled) {
    this.controls.autoRotate = enabled;
    if (enabled) this.cinematic = null;
  }

  startCinematic() {
    const points = [
      new THREE.Vector3(-5.9, 2.65, 5.55),
      new THREE.Vector3(-6.9, 1.15, .4),
      new THREE.Vector3(-2.1, 1.2, -5.2),
      new THREE.Vector3(3.9, 1.8, -4.4),
      new THREE.Vector3(5.7, 1.35, .35),
      new THREE.Vector3(2.2, 2.5, 5.2),
      new THREE.Vector3(-5.9, 2.65, 5.55)
    ];
    this.cinematic = {
      curve: new THREE.CatmullRomCurve3(points, true, 'catmullrom', .22),
      progress: 0,
      duration: 13.5
    };
    this.controls.enabled = false;
    this.controls.autoRotate = false;
    this.dispatchEvent(new CustomEvent('cinematic', { detail: { active: true } }));
  }

  stopCinematic() {
    if (!this.cinematic) return;
    this.cinematic = null;
    this.controls.enabled = true;
    this.dispatchEvent(new CustomEvent('cinematic', { detail: { active: false } }));
  }

  reset() {
    this.stopCinematic();
    this.applyPreset('hero');
  }

  update(delta, elapsed) {
    if (this.cinematic) {
      this.cinematic.progress += delta / this.cinematic.duration;
      const t = this.cinematic.progress % 1;
      const point = this.cinematic.curve.getPointAt(t);
      const look = new THREE.Vector3(-.1 + Math.sin(elapsed * .28) * .2, .66, 0);
      this.camera.position.copy(point);
      this.controls.target.copy(look);
      this.camera.lookAt(look);
      if (this.cinematic.progress >= 1) {
        this.stopCinematic();
        this.applyPreset('hero');
      }
      return;
    }

    if (this.transitioning) {
      this.camera.position.x = damp(this.camera.position.x, this.targetPosition.x, 6.5, delta);
      this.camera.position.y = damp(this.camera.position.y, this.targetPosition.y, 6.5, delta);
      this.camera.position.z = damp(this.camera.position.z, this.targetPosition.z, 6.5, delta);
      this.controls.target.x = damp(this.controls.target.x, this.targetLookAt.x, 7.5, delta);
      this.controls.target.y = damp(this.controls.target.y, this.targetLookAt.y, 7.5, delta);
      this.controls.target.z = damp(this.controls.target.z, this.targetLookAt.z, 7.5, delta);
      if (this.camera.position.distanceToSquared(this.targetPosition) < .0005 && this.controls.target.distanceToSquared(this.targetLookAt) < .0005) {
        this.camera.position.copy(this.targetPosition);
        this.controls.target.copy(this.targetLookAt);
        this.transitioning = false;
      }
    }
    this.controls.update();
  }

  dispose() {
    this.controls.dispose();
  }
}

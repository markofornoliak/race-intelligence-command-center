import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { damp } from './utils.js';

const PRESETS = Object.freeze({
  hero: { position: new THREE.Vector3(-5.9, 2.65, 5.55), target: new THREE.Vector3(-.15, .72, 0), min: 4.8, max: 10, minPolar: .12, maxPolar: Math.PI * .82 },
  front: { position: new THREE.Vector3(-7.0, 1.35, 0), target: new THREE.Vector3(-1.2, .68, 0), min: 4.2, max: 9, minPolar: .18, maxPolar: Math.PI * .76 },
  rear: { position: new THREE.Vector3(6.7, 1.55, 0), target: new THREE.Vector3(1.15, .74, 0), min: 4.2, max: 9, minPolar: .18, maxPolar: Math.PI * .76 },
  side: { position: new THREE.Vector3(-.2, 1.65, 7.0), target: new THREE.Vector3(-.05, .68, 0), min: 4.6, max: 10, minPolar: .14, maxPolar: Math.PI * .78 },
  top: { position: new THREE.Vector3(-.15, 8.4, .01), target: new THREE.Vector3(-.1, .4, 0), min: 5.4, max: 11, minPolar: .01, maxPolar: Math.PI * .48 },
  cockpit: { position: new THREE.Vector3(-1.25, 1.58, 1.82), target: new THREE.Vector3(-.12, 1.02, 0), min: 1.65, max: 4.4, minPolar: .18, maxPolar: Math.PI * .72 },
  suspension: { position: new THREE.Vector3(-4.48, 1.52, 2.72), target: new THREE.Vector3(-2.76, .82, 1.04), min: 1.9, max: 5.4, minPolar: .12, maxPolar: Math.PI * .78 },
  floor: { position: new THREE.Vector3(-.55, .82, 4.85), target: new THREE.Vector3(.35, .68, 0), min: 3.1, max: 7.4, minPolar: Math.PI * .42, maxPolar: Math.PI * .57 }
});

const MODE_DEFAULTS = Object.freeze({
  studio: 'hero',
  technical: 'suspension',
  cfd: 'side',
  thermal: 'front',
  dynamics: 'suspension'
});

function readModePresets() {
  try {
    const value = JSON.parse(localStorage.getItem('ri60x-camera-modes') || '{}');
    return typeof value === 'object' && value ? value : {};
  } catch {
    return {};
  }
}

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
    this.controls.zoomToCursor = true;
    this.controls.autoRotateSpeed = .5;
    this.controls.touches.ONE = THREE.TOUCH.ROTATE;
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    this.targetPosition = camera.position.clone();
    this.targetLookAt = this.controls.target.clone();
    this.transitioning = false;
    this.currentMode = 'studio';
    this.modePresets = { ...MODE_DEFAULTS, ...readModePresets() };
    this.currentPreset = this.modePresets.studio in PRESETS ? this.modePresets.studio : 'hero';
    this.cinematic = null;
    this.raycaster = new THREE.Raycaster();
    this.collisionRay = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.focusObject = null;
    this.collisionTargets = [];
    this.vehicle.root.traverse((object) => {
      if (object.isMesh && object.visible) this.collisionTargets.push(object);
    });
    this.doubleClickHandler = (event) => this.handleDoubleClick(event);
    this.renderer.domElement.addEventListener('dblclick', this.doubleClickHandler);
    this.applyPreset(this.currentPreset, false, false);
  }

  saveModePresets() {
    localStorage.setItem('ri60x-camera-modes', JSON.stringify(this.modePresets));
  }

  applyPreset(name, animate = true, remember = true) {
    const preset = PRESETS[name] || PRESETS.hero;
    this.currentPreset = name in PRESETS ? name : 'hero';
    if (remember) {
      this.modePresets[this.currentMode] = this.currentPreset;
      this.saveModePresets();
    }
    localStorage.setItem('ri60x-camera', this.currentPreset);
    this.controls.minDistance = preset.min;
    this.controls.maxDistance = preset.max;
    this.controls.minPolarAngle = preset.minPolar;
    this.controls.maxPolarAngle = preset.maxPolar;
    this.targetPosition.copy(preset.position);
    this.targetLookAt.copy(preset.target);
    this.transitioning = animate;
    this.controls.autoRotate = false;
    this.focusObject = null;
    if (!animate) {
      this.camera.position.copy(preset.position);
      this.controls.target.copy(preset.target);
      this.enforceSafeCamera();
      this.controls.update();
    }
    this.dispatchEvent(new CustomEvent('preset', { detail: { name: this.currentPreset, mode: this.currentMode } }));
  }

  setMode(mode) {
    if (!(mode in MODE_DEFAULTS) || mode === this.currentMode) return;
    this.modePresets[this.currentMode] = this.currentPreset;
    this.currentMode = mode;
    this.saveModePresets();
    const nextPreset = this.modePresets[mode] in PRESETS ? this.modePresets[mode] : MODE_DEFAULTS[mode];
    this.applyPreset(nextPreset, true, false);
  }

  focus(point, object) {
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3()).length();
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    const distance = THREE.MathUtils.clamp(size * 2.5 + 1.25, 1.65, 5.1);
    this.targetLookAt.copy(point);
    this.targetPosition.copy(point).add(direction.multiplyScalar(distance)).add(new THREE.Vector3(0, Math.min(.48, size * .22), 0));
    this.controls.minDistance = Math.max(1.05, distance * .58);
    this.controls.maxDistance = Math.max(4.4, distance * 2.15);
    this.controls.minPolarAngle = .08;
    this.controls.maxPolarAngle = Math.PI * .82;
    this.transitioning = true;
    this.focusObject = object;
    this.dispatchEvent(new CustomEvent('focus', { detail: { point, object } }));
  }

  handleDoubleClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.vehicle.pick(this.raycaster);
    if (hit) this.focus(hit.point, hit.object);
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
      new THREE.Vector3(-7.1, 1.42, .45),
      new THREE.Vector3(-2.3, 1.45, -5.4),
      new THREE.Vector3(3.9, 1.95, -4.65),
      new THREE.Vector3(5.9, 1.55, .4),
      new THREE.Vector3(2.35, 2.7, 5.35),
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
    this.currentMode = 'studio';
    this.modePresets.studio = 'hero';
    this.saveModePresets();
    this.applyPreset('hero', true, false);
  }

  enforceSafeCamera() {
    const direction = this.camera.position.clone().sub(this.controls.target);
    let distance = direction.length();
    if (distance < .001) {
      direction.set(1, .2, 1).normalize();
      distance = 2;
    } else {
      direction.normalize();
    }

    this.collisionRay.set(this.controls.target, direction);
    this.collisionRay.near = .03;
    this.collisionRay.far = distance;
    const intersections = this.collisionRay.intersectObjects(this.collisionTargets, false);
    if (intersections.length) {
      const exitDistance = intersections[intersections.length - 1].distance;
      const safeDistance = Math.min(this.controls.maxDistance, Math.max(this.controls.minDistance, exitDistance + .32));
      if (distance < safeDistance) {
        this.camera.position.copy(this.controls.target).addScaledVector(direction, safeDistance);
        distance = safeDistance;
      }
    }

    const near = THREE.MathUtils.clamp(distance / 220, .025, .095);
    if (Math.abs(this.camera.near - near) > .002) {
      this.camera.near = near;
      this.camera.updateProjectionMatrix();
    }
  }

  update(delta, elapsed) {
    if (this.cinematic) {
      this.cinematic.progress += delta / this.cinematic.duration;
      const t = this.cinematic.progress % 1;
      const point = this.cinematic.curve.getPointAt(t);
      const look = new THREE.Vector3(-.1 + Math.sin(elapsed * .28) * .2, .76, 0);
      this.camera.position.copy(point);
      this.controls.target.copy(look);
      this.enforceSafeCamera();
      this.camera.lookAt(look);
      if (this.cinematic.progress >= 1) {
        this.stopCinematic();
        this.applyPreset(this.modePresets[this.currentMode] || MODE_DEFAULTS[this.currentMode]);
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
    this.enforceSafeCamera();
  }

  dispose() {
    this.renderer.domElement.removeEventListener('dblclick', this.doubleClickHandler);
    this.controls.dispose();
    this.collisionTargets.length = 0;
  }
}

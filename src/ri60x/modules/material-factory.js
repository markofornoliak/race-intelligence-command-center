import * as THREE from 'three';

function seededRandom(seed = 0x6012026) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeTexture(size, paint, { color = false, repeat = [1, 1] } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d', { alpha: false });
  paint(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export class MaterialFactory {
  constructor(renderer) {
    this.renderer = renderer;
    this.textures = [];
    this.materials = [];
    const random = seededRandom();

    this.carbonMap = this.track(makeTexture(256, (ctx, size) => {
      ctx.fillStyle = '#111417';
      ctx.fillRect(0, 0, size, size);
      const cell = 8;
      for (let y = 0; y < size; y += cell) {
        for (let x = 0; x < size; x += cell) {
          const even = ((x / cell) + (y / cell)) % 2 === 0;
          const gradient = ctx.createLinearGradient(x, y, x + cell, y + cell);
          gradient.addColorStop(0, even ? '#262c31' : '#090c0e');
          gradient.addColorStop(.46, even ? '#0b0f12' : '#292f34');
          gradient.addColorStop(1, even ? '#191e22' : '#080a0c');
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, cell, cell);
        }
      }
      for (let i = 0; i < 420; i += 1) {
        const alpha = .008 + random() * .035;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(random() * size, random() * size, 1, 1);
      }
    }, { color: true, repeat: [3.5, 3.5] }));

    this.carbonNormal = this.track(makeTexture(128, (ctx, size) => {
      const image = ctx.createImageData(size, size);
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const offset = (y * size + x) * 4;
          const weaveA = Math.sin((x + y) * Math.PI / 4);
          const weaveB = Math.sin((x - y) * Math.PI / 4);
          image.data[offset] = 128 + Math.round(weaveA * 17);
          image.data[offset + 1] = 128 + Math.round(weaveB * 17);
          image.data[offset + 2] = 236;
          image.data[offset + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
    }, { repeat: [7, 7] }));

    this.microMap = this.track(makeTexture(128, (ctx, size) => {
      const image = ctx.createImageData(size, size);
      for (let i = 0; i < image.data.length; i += 4) {
        const wave = Math.sin(i * .017) * 5;
        const value = 118 + Math.floor(random() * 23 + wave);
        image.data[i] = value;
        image.data[i + 1] = value;
        image.data[i + 2] = value;
        image.data[i + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
    }, { repeat: [8, 8] }));

    this.metalMap = this.track(makeTexture(128, (ctx, size) => {
      const image = ctx.createImageData(size, size);
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const offset = (y * size + x) * 4;
          const brushing = 138 + Math.round(Math.sin(y * .72) * 7 + random() * 16);
          image.data[offset] = brushing;
          image.data[offset + 1] = brushing;
          image.data[offset + 2] = brushing;
          image.data[offset + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
    }, { repeat: [3, 12] }));

    this.tyreMap = this.track(makeTexture(512, (ctx, size) => {
      ctx.fillStyle = '#0a0b0c';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#26292c';
      ctx.lineWidth = 2;
      for (let x = -size; x < size * 2; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 64, size);
        ctx.stroke();
      }
      ctx.font = '700 30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#d9d9d7';
      ctx.fillText('RACE INTELLIGENCE', size / 2, 55);
      ctx.fillText('P ZERO', size / 2, size - 55);
      ctx.fillStyle = '#ff5038';
      ctx.fillRect(86, 76, size - 172, 5);
      ctx.fillRect(86, size - 81, size - 172, 5);
    }, { color: true, repeat: [1, 1] }));

    this.materialsByName = {
      carbon: this.make('carbon', new THREE.MeshPhysicalMaterial({
        color: 0x202328,
        map: this.carbonMap,
        normalMap: this.carbonNormal,
        normalScale: new THREE.Vector2(.28, .28),
        roughnessMap: this.microMap,
        roughness: .31,
        metalness: .08,
        clearcoat: .68,
        clearcoatRoughness: .18,
        anisotropy: .24,
        envMapIntensity: 1.18
      })),
      carbonMatte: this.make('carbonMatte', new THREE.MeshStandardMaterial({
        color: 0x15191d,
        map: this.carbonMap,
        normalMap: this.carbonNormal,
        normalScale: new THREE.Vector2(.18, .18),
        roughnessMap: this.microMap,
        roughness: .57,
        metalness: .04,
        envMapIntensity: .68
      })),
      paint: this.make('paint', new THREE.MeshPhysicalMaterial({
        color: 0x991b14,
        roughnessMap: this.microMap,
        roughness: .2,
        metalness: .13,
        clearcoat: 1,
        clearcoatRoughness: .105,
        envMapIntensity: 1.48
      })),
      accent: this.make('accent', new THREE.MeshPhysicalMaterial({
        color: 0xff5038,
        roughnessMap: this.microMap,
        roughness: .24,
        metalness: .16,
        clearcoat: .75,
        clearcoatRoughness: .15,
        envMapIntensity: 1.22
      })),
      titanium: this.make('titanium', new THREE.MeshStandardMaterial({
        color: 0x777b82,
        roughnessMap: this.metalMap,
        roughness: .29,
        metalness: .94,
        envMapIntensity: 1.28
      })),
      aluminium: this.make('aluminium', new THREE.MeshStandardMaterial({
        color: 0xaeb6c1,
        roughnessMap: this.metalMap,
        roughness: .31,
        metalness: .88,
        envMapIntensity: 1.34
      })),
      magnesium: this.make('magnesium', new THREE.MeshStandardMaterial({
        color: 0x30343a,
        roughnessMap: this.metalMap,
        roughness: .42,
        metalness: .72,
        envMapIntensity: .92
      })),
      rubber: this.make('rubber', new THREE.MeshStandardMaterial({
        color: 0x090a0b,
        map: this.tyreMap,
        bumpMap: this.microMap,
        bumpScale: .008,
        roughness: .84,
        metalness: 0,
        envMapIntensity: .22
      })),
      glass: this.make('glass', new THREE.MeshPhysicalMaterial({
        color: 0x92a9bd,
        roughness: .07,
        metalness: 0,
        transmission: .74,
        transparent: true,
        opacity: .54,
        thickness: .035,
        envMapIntensity: 1.12
      })),
      brake: this.make('brake', new THREE.MeshStandardMaterial({
        color: 0x24272b,
        roughnessMap: this.microMap,
        roughness: .64,
        metalness: .68,
        envMapIntensity: .55
      })),
      caliper: this.make('caliper', new THREE.MeshPhysicalMaterial({
        color: 0xb51f18,
        roughnessMap: this.microMap,
        roughness: .29,
        metalness: .43,
        clearcoat: .42,
        clearcoatRoughness: .18
      })),
      dark: this.make('dark', new THREE.MeshStandardMaterial({ color: 0x080a0c, roughness: .68, metalness: .3, envMapIntensity: .4 })),
      emissiveRed: this.make('emissiveRed', new THREE.MeshStandardMaterial({ color: 0x4b0804, emissive: 0xff3018, emissiveIntensity: 1.45, roughness: .4 })),
      technical: this.make('technical', new THREE.MeshStandardMaterial({ color: 0x9aadb9, roughness: .7, metalness: .15, wireframe: false }))
    };
  }

  track(texture) {
    this.textures.push(texture);
    return texture;
  }

  make(name, material) {
    material.name = name;
    this.materials.push(material);
    return material;
  }

  clone(name, suffix = 'instance') {
    const material = this.get(name).clone();
    material.name = `${name}-${suffix}`;
    this.materials.push(material);
    return material;
  }

  get(name) {
    return this.materialsByName[name];
  }

  setMode(mode) {
    const technical = mode === 'technical';
    const studio = mode === 'studio';
    this.materialsByName.carbon.envMapIntensity = studio ? 1.18 : .72;
    this.materialsByName.paint.envMapIntensity = studio ? 1.48 : .86;
    this.materialsByName.paint.emissive.setHex(technical ? 0x160302 : 0x000000);
    this.materialsByName.paint.emissiveIntensity = technical ? .28 : 0;
  }

  dispose() {
    for (const material of this.materials) material.dispose();
    for (const texture of this.textures) texture.dispose();
  }
}

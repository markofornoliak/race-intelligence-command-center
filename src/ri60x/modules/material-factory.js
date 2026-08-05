import * as THREE from 'three';

function makeTexture(size, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  paint(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

export class MaterialFactory {
  constructor(renderer) {
    this.renderer = renderer;
    this.textures = [];
    this.materials = [];
    this.carbonMap = this.track(makeTexture(256, (ctx, size) => {
      ctx.fillStyle = '#111417';
      ctx.fillRect(0, 0, size, size);
      const cell = 8;
      for (let y = 0; y < size; y += cell) {
        for (let x = 0; x < size; x += cell) {
          const even = ((x / cell) + (y / cell)) % 2 === 0;
          const gradient = ctx.createLinearGradient(x, y, x + cell, y + cell);
          gradient.addColorStop(0, even ? '#20262b' : '#0b0e11');
          gradient.addColorStop(.5, even ? '#0d1114' : '#252a2f');
          gradient.addColorStop(1, even ? '#171b1f' : '#090b0d');
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, cell, cell);
        }
      }
      for (let i = 0; i < 520; i += 1) {
        const a = Math.random() * .05;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
      }
    }));
    this.carbonMap.repeat.set(3.5, 3.5);

    this.microMap = this.track(makeTexture(128, (ctx, size) => {
      const image = ctx.createImageData(size, size);
      for (let i = 0; i < image.data.length; i += 4) {
        const v = 118 + Math.floor(Math.random() * 22);
        image.data[i] = v;
        image.data[i + 1] = v;
        image.data[i + 2] = v;
        image.data[i + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
    }));
    this.microMap.repeat.set(6, 6);

    this.tyreMap = this.track(makeTexture(512, (ctx, size) => {
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#d8d8d8';
      ctx.lineWidth = 5;
      ctx.font = '700 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e7e7e7';
      ctx.fillText('RACE INTELLIGENCE', size / 2, 58);
      ctx.fillText('P ZERO', size / 2, size - 58);
      for (let x = 0; x < size; x += 18) {
        ctx.globalAlpha = .08;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 42, size);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }));

    this.materialsByName = {
      carbon: this.make('carbon', new THREE.MeshPhysicalMaterial({
        color: 0x202328,
        map: this.carbonMap,
        roughnessMap: this.microMap,
        roughness: .33,
        metalness: .1,
        clearcoat: .72,
        clearcoatRoughness: .2,
        envMapIntensity: 1.25
      })),
      carbonMatte: this.make('carbonMatte', new THREE.MeshStandardMaterial({
        color: 0x15191d,
        map: this.carbonMap,
        roughness: .55,
        metalness: .06,
        envMapIntensity: .75
      })),
      paint: this.make('paint', new THREE.MeshPhysicalMaterial({
        color: 0x991b14,
        roughness: .22,
        metalness: .15,
        clearcoat: 1,
        clearcoatRoughness: .12,
        envMapIntensity: 1.55
      })),
      accent: this.make('accent', new THREE.MeshPhysicalMaterial({
        color: 0xff5038,
        roughness: .25,
        metalness: .18,
        clearcoat: .8,
        clearcoatRoughness: .16
      })),
      titanium: this.make('titanium', new THREE.MeshStandardMaterial({
        color: 0x777b82,
        roughness: .28,
        metalness: .94,
        envMapIntensity: 1.35
      })),
      aluminium: this.make('aluminium', new THREE.MeshStandardMaterial({
        color: 0xaeb6c1,
        roughness: .32,
        metalness: .88,
        envMapIntensity: 1.4
      })),
      magnesium: this.make('magnesium', new THREE.MeshStandardMaterial({
        color: 0x30343a,
        roughness: .4,
        metalness: .72
      })),
      rubber: this.make('rubber', new THREE.MeshStandardMaterial({
        color: 0x090a0b,
        map: this.tyreMap,
        roughness: .82,
        metalness: 0,
        envMapIntensity: .25
      })),
      glass: this.make('glass', new THREE.MeshPhysicalMaterial({
        color: 0x92a9bd,
        roughness: .08,
        metalness: 0,
        transmission: .72,
        transparent: true,
        opacity: .55,
        thickness: .04,
        envMapIntensity: 1.2
      })),
      brake: this.make('brake', new THREE.MeshStandardMaterial({
        color: 0x24272b,
        roughness: .62,
        metalness: .7
      })),
      caliper: this.make('caliper', new THREE.MeshPhysicalMaterial({
        color: 0xb51f18,
        roughness: .3,
        metalness: .45,
        clearcoat: .45
      })),
      dark: this.make('dark', new THREE.MeshStandardMaterial({ color: 0x080a0c, roughness: .65, metalness: .35 })),
      emissiveRed: this.make('emissiveRed', new THREE.MeshStandardMaterial({ color: 0x4b0804, emissive: 0xff3018, emissiveIntensity: 2.2, roughness: .4 })),
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

  get(name) {
    return this.materialsByName[name];
  }

  setMode(mode) {
    const technical = mode === 'technical';
    const studio = mode === 'studio';
    this.materialsByName.carbon.envMapIntensity = studio ? 1.25 : .75;
    this.materialsByName.paint.envMapIntensity = studio ? 1.55 : .9;
    this.materialsByName.paint.emissive.setHex(technical ? 0x160302 : 0x000000);
    this.materialsByName.paint.emissiveIntensity = technical ? .35 : 0;
  }

  dispose() {
    for (const material of this.materials) material.dispose();
    for (const texture of this.textures) texture.dispose();
  }
}

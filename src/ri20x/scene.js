import * as THREE from 'three';
import { COMPONENTS } from './core.mjs';

const mainCanvas=document.querySelector('#carScene');
const twinCanvas=document.querySelector('#twinScene');
const fallback=document.querySelector('[data-scene-fallback]');
const twinFallback=document.querySelector('[data-twin-fallback]');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!mainCanvas)throw new Error('Primary digital-twin canvas is missing.');

const probe=document.createElement('canvas');
const webgl=Boolean(probe.getContext('webgl2')||probe.getContext('webgl'));
const low=Boolean(navigator.connection?.saveData||(navigator.deviceMemory||4)<=2||(navigator.hardwareConcurrency||4)<=2);
if(!webgl){
  mainCanvas.hidden=true;if(twinCanvas)twinCanvas.hidden=true;fallback?.removeAttribute('hidden');twinFallback?.classList.add('is-visible');
  dispatchEvent(new CustomEvent('ri:scene-ready',{detail:{mode:'lightweight'}}));
}else{
  const rendererFor=(canvas)=>{if(!canvas)return null;const r=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!low,powerPreference:'high-performance'});r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.18;r.setClearColor(0,0);return r;};
  const mainRenderer=rendererFor(mainCanvas),twinRenderer=rendererFor(twinCanvas);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x04070b,.034);
  const camera=new THREE.PerspectiveCamera(31,1,.1,120);
  const world=new THREE.Group();world.rotation.set(-.08,-.52,.015);world.position.y=-.22;scene.add(world);
  scene.add(new THREE.HemisphereLight(0xbdeaff,0x07111a,1.05));
  const key=new THREE.DirectionalLight(0xeaf9ff,3.1);key.position.set(-5,9,8);scene.add(key);
  const rim=new THREE.DirectionalLight(0x38bfff,2.3);rim.position.set(8,3,-7);scene.add(rim);
  const red=new THREE.PointLight(0xff4050,4,18,2);red.position.set(-6,0,4);scene.add(red);
  const grid=new THREE.GridHelper(42,42,0x173142,0x0b1a25);grid.position.y=-1.36;grid.material.transparent=true;grid.material.opacity=.32;scene.add(grid);

  const groups=new Map(),targets=new Map(),pickables=[],materials=[];
  const palette={carbon:0x030609,body:0x071925,body2:0x0a2b3f,cyan:0x66e5ff,ice:0xdff8ff,red:0xff3d4d,amber:0xffc85b,metal:0x778b99};
  const presets={
    carbon:new THREE.MeshPhysicalMaterial({color:palette.carbon,metalness:.48,roughness:.38,clearcoat:.72}),
    body:new THREE.MeshPhysicalMaterial({color:palette.body,metalness:.72,roughness:.18,clearcoat:1,emissive:0x02101a,emissiveIntensity:.28}),
    body2:new THREE.MeshPhysicalMaterial({color:palette.body2,metalness:.68,roughness:.2,clearcoat:1,emissive:0x02131f,emissiveIntensity:.34}),
    metal:new THREE.MeshStandardMaterial({color:palette.metal,metalness:.82,roughness:.24}),
    rubber:new THREE.MeshStandardMaterial({color:0x050608,roughness:.82}),
    glass:new THREE.MeshPhysicalMaterial({color:0x65dcff,transparent:true,opacity:.22,transmission:.5,roughness:.12,depthWrite:false}),
    accent:new THREE.MeshStandardMaterial({color:palette.red,emissive:0x6a0710,emissiveIntensity:.7,metalness:.45,roughness:.25})
  };
  Object.values(presets).forEach(m=>materials.push(m));
  const ensure=(id)=>{if(!groups.has(id)){const g=new THREE.Group();g.name=id;g.userData.componentId=id;world.add(g);groups.set(id,g);targets.set(id,new THREE.Vector3());}return groups.get(id);};
  const remember=(material)=>{if(!material.userData.base)material.userData.base={transparent:material.transparent,opacity:material.opacity,color:material.color?.clone(),emissive:material.emissive?.clone(),emissiveIntensity:material.emissiveIntensity,wireframe:material.wireframe};if(!materials.includes(material))materials.push(material);};
  const add=(geometry,material,id,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1],explode=[0,0,0],pick=true)=>{const o=new THREE.Mesh(geometry,material.clone());o.position.set(...pos);o.rotation.set(...rot);o.scale.set(...scale);o.userData.componentId=id;ensure(id).add(o);targets.get(id).add(new THREE.Vector3(...explode));remember(o.material);if(pick)pickables.push(o);return o;};
  const strut=(a,b,r,id,explode=[0,0,0])=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),m=A.clone().add(B).multiplyScalar(.5);const o=add(new THREE.CylinderGeometry(r,r,d.length(),8),presets.metal,id,m.toArray(),[0,0,0],[1,1,1],explode);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
  const loft=(sections,segments=22)=>{const p=[],idx=[];sections.forEach(s=>{for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,c=Math.cos(a),z=Math.sin(a);p.push(s.x,s.y+Math.sign(c)*Math.pow(Math.abs(c),s.pinch||1.05)*s.ry,s.z+Math.sign(z)*Math.pow(Math.abs(z),s.pinch||1.05)*s.rz);}});for(let r=0;r<sections.length-1;r++)for(let i=0;i<segments;i++){const n=(i+1)%segments,a=r*segments+i,b=r*segments+n,c=(r+1)*segments+i,d=(r+1)*segments+n;idx.push(a,c,b,b,c,d);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;};

  add(new THREE.BoxGeometry(8.4,.11,3.12,20,1,8),presets.carbon,'floor',[.2,-.83,0],[0,0,0],[1,1,1],[0,-1.8,0]);
  add(loft([{x:-4.55,y:-.2,z:0,ry:.16,rz:.2,pinch:1.4},{x:-3.8,y:-.12,z:0,ry:.24,rz:.31},{x:-2.6,y:.02,z:0,ry:.4,rz:.5},{x:-1.3,y:.22,z:0,ry:.62,rz:.72},{x:.1,y:.35,z:0,ry:.7,rz:.78},{x:1.4,y:.28,z:0,ry:.62,rz:.74},{x:2.7,y:.12,z:0,ry:.42,rz:.55},{x:3.8,y:.12,z:0,ry:.25,rz:.34}]),presets.body,'monocoque',[0,0,0],[0,0,0],[1,1,1],[0,.8,0]);
  add(new THREE.ConeGeometry(.42,2.1,18),presets.body2,'nose',[-4.35,-.08,0],[0,0,-Math.PI/2],[1,.78,1],[-2.2,.2,0]);
  add(new THREE.CapsuleGeometry(.54,1.2,8,18),presets.glass,'cockpit',[-.25,.66,0],[0,0,Math.PI/2],[1,.72,.82],[0,1.7,0]);
  const halo=new THREE.CatmullRomCurve3([new THREE.Vector3(-.8,.62,-.56),new THREE.Vector3(-.4,1.32,-.68),new THREE.Vector3(.18,1.48,0),new THREE.Vector3(-.4,1.32,.68),new THREE.Vector3(-.8,.62,.56)]);
  add(new THREE.TubeGeometry(halo,56,.055,8,false),presets.metal,'cockpit',[0,0,0],[0,0,0],[1,1,1],[0,1.7,0]);strut([.18,1.48,0],[.38,.64,0],.05,'cockpit',[0,1.7,0]);
  [-1,1].forEach(side=>{add(loft([{x:-.75,y:.06,z:side*.88,ry:.25,rz:.18},{x:.05,y:.16,z:side*1.08,ry:.48,rz:.32},{x:1.25,y:.14,z:side*1.14,ry:.52,rz:.38},{x:2.5,y:.02,z:side*.85,ry:.3,rz:.2},{x:3.25,y:.02,z:side*.58,ry:.15,rz:.1}],18),presets.body2,'sidepods',[0,0,0],[0,0,0],[1,1,1],[0,.5,side*1.65]);});
  add(new THREE.BoxGeometry(2.9,.68,1.12,8,4,5),presets.metal,'power-unit',[2.15,.05,0],[0,0,0],[1,1,1],[1.1,1.3,0]);
  add(loft([{x:.7,y:.52,z:0,ry:.28,rz:.5},{x:1.7,y:.68,z:0,ry:.42,rz:.52},{x:2.8,y:.54,z:0,ry:.34,rz:.43},{x:3.7,y:.35,z:0,ry:.18,rz:.26}],20),presets.body,'power-unit',[0,0,0],[0,0,0],[1,1,1],[1.1,1.3,0]);
  [[-5.25,-.48,1.25,.075,3.65,-.02],[-5.02,-.22,.95,.06,3.2,-.1],[-4.72,.02,.62,.05,2.65,-.17]].forEach(p=>add(new THREE.BoxGeometry(1,1,1),presets.body2,'front-wing',[p[0],p[1],0],[0,0,p[5]],[p[2],p[3],p[4]],[-2.7,.25,0]));
  [[4.65,1.16,.92,.09,2.85,.04],[4.48,.92,.68,.065,2.55,-.06],[4.2,.68,.45,.045,2.22,-.12]].forEach(p=>add(new THREE.BoxGeometry(1,1,1),presets.body2,'rear-wing',[p[0],p[1],0],[0,0,p[5]],[p[2],p[3],p[4]],[2.2,1.1,0]));
  [-1,0,1].forEach(lane=>add(new THREE.BoxGeometry(2.3,.08,.52),presets.carbon,'diffuser',[3.62,-.66,lane*.82],[0,lane*.04,lane*.08],[1,1,1],[1.8,-1.1,lane*.5]));
  const wheel=(x,z,front)=>{const sid=front?'front-suspension':'rear-suspension',bid=front?'front-brakes':'rear-suspension',radius=front?.78:.86,width=front?.56:.64,exp=[front?-1.35:1.35,0,z>0?1.7:-1.7];add(new THREE.CylinderGeometry(radius,radius,width,40,1,true),presets.rubber,sid,[x,-.56,z],[Math.PI/2,0,0],[1,1,1],exp);add(new THREE.CylinderGeometry(radius*.52,radius*.52,width*1.02,24),presets.metal,sid,[x,-.56,z],[Math.PI/2,0,0],[1,1,1],exp);add(new THREE.CylinderGeometry(radius*.36,radius*.36,width*1.08,28),presets.accent,bid,[x,-.56,z],[Math.PI/2,0,0],[1,1,1],exp);};
  wheel(-3,-1.78,true);wheel(-3,1.78,true);wheel(3.1,-1.84,false);wheel(3.1,1.84,false);
  [-1,1].forEach(side=>{strut([-2.05,.12,side*.72],[-3,-.56,side*1.78],.035,'front-suspension',[-1.35,0,side*1.7]);strut([-2.22,-.36,side*.72],[-3,-.56,side*1.78],.03,'front-suspension',[-1.35,0,side*1.7]);strut([2.42,.14,side*.68],[3.1,-.56,side*1.84],.038,'rear-suspension',[1.35,0,side*1.7]);});

  const dataNetwork=ensure('data-network'),sensorPositions=[[-4.8,-.1,0],[-3,-.55,-1.78],[-3,-.55,1.78],[-.2,.9,0],[1.4,.15,-1.1],[1.4,.15,1.1],[3.1,-.55,-1.84],[3.1,-.55,1.84],[4.55,1.05,0]];
  sensorPositions.forEach(pos=>{const n=new THREE.Mesh(new THREE.SphereGeometry(.055,9,7),new THREE.MeshBasicMaterial({color:palette.cyan}));n.position.set(...pos);n.userData.componentId='data-network';dataNetwork.add(n);pickables.push(n);remember(n.material);});
  [[0,3,8],[1,3,7],[2,3,6],[4,3,5]].forEach((path,index)=>{const curve=new THREE.CatmullRomCurve3(path.map(i=>new THREE.Vector3(...sensorPositions[i])));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)),new THREE.LineBasicMaterial({color:palette.cyan,transparent:true,opacity:.24,blending:THREE.AdditiveBlending}));dataNetwork.add(line);remember(line.material);for(let p=0;p<3;p++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.035,7,5),new THREE.MeshBasicMaterial({color:palette.ice}));dot.userData={curve,offset:(p/3+index*.17)%1};dataNetwork.add(dot);remember(dot.material);}});
  const aeroGroup=new THREE.Group();world.add(aeroGroup);for(let lane=-5;lane<=5;lane++){const z=lane*.42,curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-7,.1+Math.abs(lane)*.035,z*1.15),new THREE.Vector3(-4.7,.12,z),new THREE.Vector3(-2.6,.42,z*.82),new THREE.Vector3(0,.58,z*.68),new THREE.Vector3(2.7,.3,z*.8),new THREE.Vector3(5.8,.85,z*1.22)]);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),new THREE.LineBasicMaterial({color:lane%2?palette.cyan:palette.ice,transparent:true,opacity:.12,blending:THREE.AdditiveBlending}));aeroGroup.add(line);remember(line.material);for(let p=0;p<2;p++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.025,7,5),new THREE.MeshBasicMaterial({color:palette.cyan,transparent:true,opacity:.8}));dot.userData={curve,offset:(p/2+lane*.06+1)%1};aeroGroup.add(dot);remember(dot.material);}}
  const thermalGroup=new THREE.Group();world.add(thermalGroup);[[-3,-.56,-1.78],[-3,-.56,1.78],[3.1,-.56,-1.84],[3.1,-.56,1.84],[2,.1,0]].forEach((pos,i)=>{const glow=new THREE.Mesh(new THREE.SphereGeometry(i===4?.8:.5,16,10),new THREE.MeshBasicMaterial({color:i===4?0xff5d3f:0xffa53d,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.set(...pos);thermalGroup.add(glow);remember(glow.material);});

  const cameras={hero:{p:[11.4,4.2,14.7],t:[.2,0,0]},front:{p:[-13,2.2,0],t:[-1.8,-.05,0]},cockpit:{p:[1.8,2.6,5.4],t:[-.1,.6,0]},side:{p:[.8,2.2,15.8],t:[.3,0,0]},top:{p:[.3,15,.1],t:[.3,0,0]},rear:{p:[12.8,2.2,0],t:[2.4,.1,0]},floor:{p:[1.2,-5.8,10.6],t:[.4,-.65,0]}};
  let state={view:'studio',camera:'hero',explode:0,selectedComponent:'monocoque',isolated:false,quality:'auto',frame:null},cameraName='hero',zoom=1,manual=false,pointerDown=false,lastX=0,lastY=0;
  const targetP=new THREE.Vector3(...cameras.hero.p),targetT=new THREE.Vector3(...cameras.hero.t);camera.position.copy(targetP);camera.lookAt(targetT);
  const resetMaterial=m=>{const b=m.userData.base;if(!b)return;m.transparent=b.transparent;m.opacity=b.opacity;m.wireframe=b.wireframe||false;if(b.color&&m.color)m.color.copy(b.color);if(b.emissive&&m.emissive)m.emissive.copy(b.emissive);if('emissiveIntensity'in m&&b.emissiveIntensity!==undefined)m.emissiveIntensity=b.emissiveIntensity;m.depthWrite=m.opacity>.45;};
  const applyView=()=>{materials.forEach(resetMaterial);aeroGroup.visible=state.view==='aero';thermalGroup.visible=state.view==='thermal';dataNetwork.visible=state.view==='data'||state.selectedComponent==='data-network';grid.visible=state.view!=='studio';groups.forEach((group,id)=>{const selected=id===state.selectedComponent;group.visible=!state.isolated||selected;group.traverse(child=>{if(!child.material)return;(Array.isArray(child.material)?child.material:[child.material]).forEach(m=>{if(state.view!=='studio'){m.transparent=true;m.opacity=selected?.82:state.view==='technical'?.25:.14;m.depthWrite=false;if(m.color)m.color.setHex(selected?palette.ice:state.view==='thermal'?0x151a1d:0x123246);if(state.view==='technical')m.wireframe=true;}if(selected&&m.emissive){m.emissive.setHex(state.view==='thermal'?0x7a2108:0x07364a);m.emissiveIntensity=1.2;}});});});};
  const applyExplode=()=>groups.forEach((g,id)=>g.position.lerpVectors(new THREE.Vector3(),targets.get(id)||new THREE.Vector3(),state.explode/100));
  const setCamera=(name,instant=false)=>{if(!cameras[name])return;cameraName=name;targetP.set(...cameras[name].p).multiplyScalar(zoom);targetT.set(...cameras[name].t);if(instant||reduced){camera.position.copy(targetP);camera.lookAt(targetT);}};
  const focus=id=>{const g=groups.get(id);if(!g)return;const box=new THREE.Box3().setFromObject(g),center=box.getCenter(new THREE.Vector3()),size=Math.max(.8,box.getSize(new THREE.Vector3()).length()),dir=camera.position.clone().sub(targetT).normalize();targetT.copy(center);targetP.copy(center).add(dir.multiplyScalar(Math.min(14,Math.max(4.2,size*2.4))));};
  const update=next=>{const cameraChanged=next.camera&&next.camera!==state.camera;state={...state,...next};const lightweight=state.quality==='lightweight';if(lightweight){fallback?.removeAttribute('hidden');twinFallback?.classList.add('is-visible');}else{fallback?.setAttribute('hidden','');twinFallback?.classList.remove('is-visible');}if(cameraChanged)setCamera(state.camera);applyView();applyExplode();if(state.frame){const heat=Math.min(1,Math.max(0,(state.frame.brake-420)/420));thermalGroup.children.forEach((child,i)=>{if(child.material){child.material.opacity=.05+heat*(i===4?.09:.18);child.scale.setScalar(1+heat*.5);}});}};
  addEventListener('ri:state',e=>update(e.detail));addEventListener('ri:focus-component',e=>focus(e.detail.id));
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const resize=(renderer,canvas)=>{if(!renderer||!canvas)return false;const r=canvas.getBoundingClientRect();if(r.width<2||r.height<2)return false;const q=state.quality==='high'?2:state.quality==='balanced'?1.35:state.quality==='lightweight'?1:low?1:Math.min(devicePixelRatio||1,1.65);renderer.setPixelRatio(q);renderer.setSize(r.width,r.height,false);return true;};
  const pick=(event,canvas)=>{const r=canvas.getBoundingClientRect();pointer.x=(event.clientX-r.left)/r.width*2-1;pointer.y=-(event.clientY-r.top)/r.height*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickables,false)[0];if(hit?.object?.userData.componentId)dispatchEvent(new CustomEvent('ri:component-selected',{detail:{id:hit.object.userData.componentId}}));};
  const bind=canvas=>{if(!canvas)return;canvas.addEventListener('pointerdown',e=>{pointerDown=true;lastX=e.clientX;lastY=e.clientY;manual=true;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!pointerDown)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;world.rotation.y+=dx*.0055;world.rotation.x=Math.max(-.52,Math.min(.3,world.rotation.x+dy*.0035));});canvas.addEventListener('pointerup',e=>{pointerDown=false;canvas.releasePointerCapture?.(e.pointerId);pick(e,canvas);});canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.62,Math.min(1.6,zoom+Math.sign(e.deltaY)*.07));setCamera(cameraName);},{passive:false});};bind(mainCanvas);bind(twinCanvas);
  let last=performance.now(),frames=0,fpsLast=last;
  const animate=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;frames++;if(now-fpsLast>1000){dispatchEvent(new CustomEvent('ri:fps',{detail:{fps:frames*1000/(now-fpsLast)}}));frames=0;fpsLast=now;}if(!manual&&!reduced&&state.quality!=='lightweight')world.rotation.y+=dt*.055;camera.position.lerp(targetP,reduced?1:Math.min(1,dt*4.6));camera.lookAt(targetT);const time=now*.00012;aeroGroup.children.forEach(child=>{if(child.userData.curve)child.position.copy(child.userData.curve.getPointAt((time+child.userData.offset)%1));});dataNetwork.children.forEach(child=>{if(child.userData.curve)child.position.copy(child.userData.curve.getPointAt((time*1.55+child.userData.offset)%1));});const a=resize(mainRenderer,mainCanvas);if(a&&state.quality!=='lightweight'){camera.aspect=mainCanvas.clientWidth/mainCanvas.clientHeight;camera.updateProjectionMatrix();mainRenderer.render(scene,camera);}const b=resize(twinRenderer,twinCanvas);if(b&&state.quality!=='lightweight'){camera.aspect=twinCanvas.clientWidth/twinCanvas.clientHeight;camera.updateProjectionMatrix();twinRenderer.render(scene,camera);}requestAnimationFrame(animate);};
  applyView();applyExplode();setCamera('hero',true);requestAnimationFrame(animate);
  document.querySelector('[data-scene-geometry]')?.replaceChildren(document.createTextNode(`${pickables.length} PARTS`));
  setTimeout(()=>dispatchEvent(new CustomEvent('ri:scene-ready',{detail:{mode:low?'balanced':'high'}})),120);
}

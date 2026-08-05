  /* RI-50X immersive engineering hangar. Injected inside the Three.js capability block. */
  try {
    const ri50Hangar=new THREE.Group();
    ri50Hangar.name='RI50X_IMMERSIVE_HANGAR';
    studioRoot.add(ri50Hangar);

    const ri50Static=new THREE.Group();
    const ri50Dynamic=new THREE.Group();
    const ri50Screens=new THREE.Group();
    ri50Hangar.add(ri50Static,ri50Dynamic,ri50Screens);

    const ri50Mat={
      floor:new THREE.MeshPhysicalMaterial({color:0x060b10,roughness:.31,metalness:.62,clearcoat:.42,clearcoatRoughness:.32}),
      floorDark:new THREE.MeshStandardMaterial({color:0x020507,roughness:.72,metalness:.38}),
      structure:new THREE.MeshStandardMaterial({color:0x111a21,roughness:.42,metalness:.86}),
      structureDark:new THREE.MeshStandardMaterial({color:0x060a0e,roughness:.62,metalness:.72}),
      glass:new THREE.MeshPhysicalMaterial({color:0x0a2230,roughness:.08,metalness:.1,transmission:constrainedDevice?0:.48,transparent:true,opacity:constrainedDevice?.44:.28,thickness:.18,clearcoat:1,side:THREE.DoubleSide}),
      cyan:new THREE.MeshBasicMaterial({color:0x5de6ff,toneMapped:false}),
      cyanSoft:new THREE.MeshBasicMaterial({color:0x5de6ff,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),
      red:new THREE.MeshBasicMaterial({color:0xff3650,toneMapped:false}),
      amber:new THREE.MeshBasicMaterial({color:0xffc85c,toneMapped:false}),
      white:new THREE.MeshBasicMaterial({color:0xe8f8ff,toneMapped:false}),
      screen:new THREE.MeshBasicMaterial({color:0x08131d,toneMapped:false})
    };

    const ri50Add=(geometry,material,position=[0,0,0],rotation=[0,0,0],name='HANGAR_PART',parent=ri50Static)=>{
      const mesh=new THREE.Mesh(geometry,material);
      mesh.name=`RI50X_${name}`;
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.castShadow=!constrainedDevice;
      mesh.receiveShadow=!constrainedDevice;
      parent.add(mesh);
      return mesh;
    };

    const ri50LineMaterial=new THREE.LineBasicMaterial({color:0x5de6ff,transparent:true,opacity:.11,toneMapped:false});
    const ri50GridCanvas=document.createElement('canvas');
    ri50GridCanvas.width=1024;ri50GridCanvas.height=1024;
    const ri50GridContext=ri50GridCanvas.getContext('2d');
    ri50GridContext.fillStyle='#03070a';ri50GridContext.fillRect(0,0,1024,1024);
    for(let i=0;i<=1024;i+=64){
      ri50GridContext.strokeStyle=i%256===0?'rgba(93,230,255,.22)':'rgba(93,230,255,.075)';
      ri50GridContext.lineWidth=i%256===0?2:1;
      ri50GridContext.beginPath();ri50GridContext.moveTo(i,0);ri50GridContext.lineTo(i,1024);ri50GridContext.stroke();
      ri50GridContext.beginPath();ri50GridContext.moveTo(0,i);ri50GridContext.lineTo(1024,i);ri50GridContext.stroke();
    }
    ri50GridContext.strokeStyle='rgba(255,54,80,.22)';ri50GridContext.lineWidth=3;
    ri50GridContext.beginPath();ri50GridContext.moveTo(512,0);ri50GridContext.lineTo(512,1024);ri50GridContext.stroke();
    const ri50GridTexture=new THREE.CanvasTexture(ri50GridCanvas);
    ri50GridTexture.wrapS=THREE.RepeatWrapping;ri50GridTexture.wrapT=THREE.RepeatWrapping;ri50GridTexture.repeat.set(2.2,1.6);ri50GridTexture.colorSpace=THREE.SRGBColorSpace;
    const ri50FloorMaterial=ri50Mat.floor.clone();
    ri50FloorMaterial.map=ri50GridTexture;ri50FloorMaterial.emissive=new THREE.Color(0x041018);ri50FloorMaterial.emissiveIntensity=.42;

    ri50Add(new THREE.PlaneGeometry(34,22),ri50FloorMaterial,[0,-.66,0],[-Math.PI/2,0,0],'GRID_FLOOR');
    ri50Add(new THREE.BoxGeometry(34,.16,22),ri50Mat.floorDark,[0,-.79,0],[0,0,0],'FLOOR_BASE');

    const ri50Platform=new THREE.Group();
    ri50Platform.name='RI50X_TURNTABLE';
    ri50Platform.position.set(0,-.55,0);
    ri50Static.add(ri50Platform);
    ri50Add(new THREE.CylinderGeometry(6.9,7.15,.28,96),ri50Mat.floor,[0,0,0],[0,0,0],'PLATFORM_BASE',ri50Platform);
    ri50Add(new THREE.CylinderGeometry(6.62,6.62,.3,96,1,true),ri50Mat.cyanSoft,[0,.05,0],[0,0,0],'PLATFORM_CYAN_RING',ri50Platform);
    ri50Add(new THREE.TorusGeometry(5.82,.025,8,128),ri50Mat.cyan,[0,.18,0],[Math.PI/2,0,0],'PLATFORM_RING_A',ri50Platform);
    ri50Add(new THREE.TorusGeometry(6.2,.018,8,128),ri50Mat.red,[0,.19,0],[Math.PI/2,0,0],'PLATFORM_RING_B',ri50Platform);
    for(let marker=0;marker<36;marker+=1){
      const angle=(marker/36)*Math.PI*2;
      const material=marker%9===0?ri50Mat.red:ri50Mat.cyan;
      const markerMesh=ri50Add(new THREE.BoxGeometry(marker%9===0?.34:.16,.018,.045),material,[Math.cos(angle)*6.48,.2,Math.sin(angle)*6.48],[0,-angle,0],`PLATFORM_MARKER_${marker}`,ri50Platform);
      markerMesh.material=material;
    }

    for(let lane=-7;lane<=7;lane+=1){
      if(lane===0)continue;
      const laneGeometry=new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-15,-.565,lane*1.25),
        new THREE.Vector3(15,-.565,lane*1.25)
      ]);
      const line=new THREE.Line(laneGeometry,ri50LineMaterial);
      line.name=`RI50X_FLOOR_LANE_${lane}`;
      ri50Static.add(line);
    }

    const ri50BackWall=new THREE.Group();
    ri50BackWall.position.set(0,3.5,-9.6);
    ri50Static.add(ri50BackWall);
    ri50Add(new THREE.BoxGeometry(32,8,.32),ri50Mat.structureDark,[0,0,0],[0,0,0],'BACK_WALL',ri50BackWall);
    for(let bay=-7;bay<=7;bay+=1){
      ri50Add(new THREE.BoxGeometry(.13,7.2,.38),ri50Mat.structure,[bay*2.05,0,.12],[0,0,0],`WALL_COLUMN_${bay}`,ri50BackWall);
      if(bay<7){
        const accent=bay===-1||bay===0?ri50Mat.red:ri50Mat.cyanSoft;
        ri50Add(new THREE.BoxGeometry(1.72,.025,.04),accent,[bay*2.05+1.02,3.05,.23],[0,0,0],`WALL_LIGHT_${bay}`,ri50BackWall);
      }
    }
    ri50Add(new THREE.BoxGeometry(31.5,.22,.42),ri50Mat.structure,[0,3.65,.14],[0,0,0],'WALL_TOP_BEAM',ri50BackWall);
    ri50Add(new THREE.BoxGeometry(31.5,.18,.38),ri50Mat.structure,[0,-3.58,.14],[0,0,0],'WALL_BOTTOM_BEAM',ri50BackWall);

    const ri50SideWall=(side)=>{
      const wall=new THREE.Group();
      wall.position.set(side*15.7,3.3,0);
      wall.rotation.y=side<0?-Math.PI/2:Math.PI/2;
      ri50Static.add(wall);
      ri50Add(new THREE.BoxGeometry(20,7.5,.26),ri50Mat.structureDark,[0,0,0],[0,0,0],`SIDE_WALL_${side}`,wall);
      for(let section=-4;section<=4;section+=1){
        ri50Add(new THREE.BoxGeometry(.12,6.8,.31),ri50Mat.structure,[section*2.1,0,.12],[0,0,0],`SIDE_RIB_${side}_${section}`,wall);
      }
      return wall;
    };
    ri50SideWall(-1);ri50SideWall(1);

    const ri50Truss=new THREE.Group();
    ri50Truss.position.set(0,7.2,0);
    ri50Static.add(ri50Truss);
    [-11,-5.5,0,5.5,11].forEach((x,index)=>{
      ri50Add(new THREE.BoxGeometry(.18,.18,18),ri50Mat.structure,[x,0,0],[0,0,0],`TRUSS_LONG_${index}`,ri50Truss);
      for(let brace=-4;brace<=4;brace+=1){
        ri50Add(new THREE.BoxGeometry(.09,.09,2.8),ri50Mat.structure,[x,.12,brace*2.05],[0,index%2?.18:-.18,0],`TRUSS_BRACE_${index}_${brace}`,ri50Truss);
      }
    });
    [-8,-4,0,4,8].forEach((z,index)=>ri50Add(new THREE.BoxGeometry(28,.18,.18),ri50Mat.structure,[0,0,z],[0,0,0],`TRUSS_CROSS_${index}`,ri50Truss));

    const ri50LightBars=[];
    [-8.5,-4.2,0,4.2,8.5].forEach((x,index)=>{
      const bar=ri50Add(new THREE.BoxGeometry(3.2,.055,.14),index===2?ri50Mat.red:ri50Mat.white,[x,-.18,-1.1],[0,0,0],`KEY_LIGHT_BAR_${index}`,ri50Truss);
      ri50LightBars.push(bar);
      const light=new THREE.RectAreaLight(index===2?0xff3650:0xd8f5ff,index===2?8:6.5,3.1,.8);
      light.position.set(x,-.32,-1.1);light.rotation.x=Math.PI/2;ri50Truss.add(light);
    });
    [-7,7].forEach((x,index)=>{
      const light=new THREE.SpotLight(index?0x5de6ff:0xff3650,8,28,.5,.65,1.5);
      light.position.set(x,6,6);light.target.position.set(0,0,0);scene.add(light,light.target);
    });

    const ri50BeamMaterial=(color)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
    const ri50Beams=[];
    [[-7,5.8,4,0x5de6ff],[7,5.8,3,0xff3650],[-2,6.5,-5,0xffffff],[3,6.2,-4,0x5de6ff]].forEach(([x,y,z,color],index)=>{
      const beam=ri50Add(new THREE.ConeGeometry(2.6,11,32,1,true),ri50BeamMaterial(color),[x,y,z],[0,0,index%2?.18:-.18],`VOLUMETRIC_BEAM_${index}`,ri50Dynamic);
      beam.rotation.x=Math.PI;
      ri50Beams.push(beam);
    });

    const ri50CreateScreenTexture=(label,index)=>{
      const canvas=document.createElement('canvas');canvas.width=768;canvas.height=432;
      const context=canvas.getContext('2d');
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      return {canvas,context,texture,label,index,last:-1};
    };
    const ri50ScreenData=[];
    const ri50DrawScreen=(screen,time,force=false)=>{
      const tick=Math.floor(time*2);
      if(!force&&screen.last===tick)return;
      screen.last=tick;
      const {context:ctx,canvas,label,index}=screen;
      const w=canvas.width,h=canvas.height;
      ctx.fillStyle='#03090e';ctx.fillRect(0,0,w,h);
      const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'rgba(93,230,255,.12)');gradient.addColorStop(1,'rgba(255,54,80,.035)');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='rgba(93,230,255,.09)';ctx.lineWidth=1;
      for(let x=0;x<w;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
      for(let y=0;y<h;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      ctx.fillStyle='#91a7b6';ctx.font='700 18px monospace';ctx.fillText(`RI-50X / ${label}`,28,38);
      ctx.fillStyle='#5de6ff';ctx.font='700 46px monospace';
      const metric=index===0?`${Math.round(285+Math.sin(time*.8)*24)} KM/H`:index===1?`${(96+Math.sin(time*.55)*3).toFixed(1)} °C`:index===2?`${(84+Math.sin(time*.42)*4).toFixed(1)}%`:`${Math.round(10+Math.abs(Math.sin(time*.7))*8)} MS`;
      ctx.fillText(metric,28,100);
      ctx.strokeStyle=index===2?'#ff3650':'#5de6ff';ctx.lineWidth=4;ctx.beginPath();
      for(let x=0;x<=w-56;x+=8){
        const y=260+Math.sin(x*.017+time*(1+index*.15))*36+Math.sin(x*.041-time*.7)*14;
        if(x===0)ctx.moveTo(x+28,y);else ctx.lineTo(x+28,y);
      }
      ctx.stroke();
      ctx.fillStyle='#6e8290';ctx.font='600 14px monospace';ctx.fillText('LIVE ENGINEERING CHANNEL',28,h-34);
      screen.texture.needsUpdate=true;
    };

    const screenLayout=[
      [-7.6,3.7,-9.38,0,'VEHICLE STATE'],[-2.55,3.7,-9.38,1,'THERMAL MAP'],[2.55,3.7,-9.38,2,'STRATEGY'],[7.6,3.7,-9.38,3,'NETWORK']
    ];
    screenLayout.forEach(([x,y,z,index,label])=>{
      const data=ri50CreateScreenTexture(label,index);ri50ScreenData.push(data);ri50DrawScreen(data,0,true);
      const material=new THREE.MeshBasicMaterial({map:data.texture,toneMapped:false});
      ri50Add(new THREE.BoxGeometry(4.45,2.55,.12),ri50Mat.structure,[x,y,z],[0,0,0],`SCREEN_FRAME_${index}`,ri50Screens);
      ri50Add(new THREE.PlaneGeometry(4.22,2.34),material,[x,y,z+.075],[0,0,0],`SCREEN_${index}`,ri50Screens);
      ri50Add(new THREE.BoxGeometry(4.5,.035,.08),index===2?ri50Mat.red:ri50Mat.cyan,[x,y-1.31,z+.11],[0,0,0],`SCREEN_ACCENT_${index}`,ri50Screens);
    });

    const ri50PitWall=new THREE.Group();
    ri50PitWall.position.set(-10.5,.15,4.9);
    ri50PitWall.rotation.y=.18;
    ri50Static.add(ri50PitWall);
    ri50Add(new THREE.BoxGeometry(7.2,.24,2.8),ri50Mat.structureDark,[0,0,0],[0,0,0],'PIT_WALL_BASE',ri50PitWall);
    ri50Add(new THREE.BoxGeometry(7.2,.08,2.85),ri50Mat.cyanSoft,[0,.16,0],[0,0,0],'PIT_WALL_EDGE',ri50PitWall);
    for(let desk=-2;desk<=2;desk+=1){
      ri50Add(new THREE.BoxGeometry(1.15,.08,.74),ri50Mat.structure,[desk*1.28,.58,-.38],[-.25,0,0],`PIT_DESK_${desk}`,ri50PitWall);
      ri50Add(new THREE.BoxGeometry(.9,.54,.05),ri50Mat.screen,[desk*1.28,.97,-.48],[-.17,0,0],`PIT_MONITOR_${desk}`,ri50PitWall);
      ri50Add(new THREE.BoxGeometry(.92,.018,.03),desk===0?ri50Mat.red:ri50Mat.cyan,[desk*1.28,.7,-.12],[0,0,0],`PIT_KEYLIGHT_${desk}`,ri50PitWall);
    }
    ri50Add(new THREE.BoxGeometry(7.5,1.35,.035),ri50Mat.glass,[0,1.54,-.7],[0,0,0],'PIT_GLASS',ri50PitWall);

    const ri50ScanMaterial=new THREE.MeshBasicMaterial({color:0x5de6ff,transparent:true,opacity:.075,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
    const ri50ScanPlane=ri50Add(new THREE.PlaneGeometry(5.6,4.4),ri50ScanMaterial,[-4.8,1.2,0],[0,Math.PI/2,0],'VEHICLE_SCAN',ri50Dynamic);
    const ri50ScanEdge=ri50Add(new THREE.BoxGeometry(.035,4.5,5.8),ri50Mat.cyanSoft,[-4.8,1.2,0],[0,0,0],'VEHICLE_SCAN_EDGE',ri50Dynamic);

    const ri50Beacons=[];
    for(let beacon=0;beacon<14;beacon+=1){
      const angle=beacon/14*Math.PI*2;
      const radius=7.7+(beacon%2)*.5;
      const material=beacon%5===0?ri50Mat.red:ri50Mat.cyan;
      const mesh=ri50Add(new THREE.CylinderGeometry(.035,.035,.38,10),material,[Math.cos(angle)*radius,-.38,Math.sin(angle)*radius],[0,0,0],`FLOOR_BEACON_${beacon}`,ri50Dynamic);
      ri50Beacons.push(mesh);
    }

    const ri50DustCount=constrainedDevice?220:620;
    const ri50DustGeometry=new THREE.BufferGeometry();
    const ri50DustPositions=new Float32Array(ri50DustCount*3);
    for(let i=0;i<ri50DustCount;i+=1){
      ri50DustPositions[i*3]=(Math.random()-.5)*28;
      ri50DustPositions[i*3+1]=Math.random()*8;
      ri50DustPositions[i*3+2]=(Math.random()-.5)*18;
    }
    ri50DustGeometry.setAttribute('position',new THREE.BufferAttribute(ri50DustPositions,3));
    const ri50Dust=new THREE.Points(ri50DustGeometry,new THREE.PointsMaterial({color:0x90ddff,size:constrainedDevice?.012:.018,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
    ri50Dust.name='RI50X_ATMOSPHERIC_PARTICLES';ri50Dynamic.add(ri50Dust);

    const ri50Clock=new THREE.Clock();
    let ri50Shot=null;
    const ri50Ease=(t)=>1-Math.pow(1-t,4);
    const ri50ApplyShot=(detail={})=>{
      const target=detail.rotation||[-.075,-.54,.012];
      ri50Shot={
        start:performance.now(),
        duration:Math.max(240,Number(detail.duration||1200)),
        from:[world.rotation.x,world.rotation.y,world.rotation.z],
        to:target
      };
      try{userRotated=true;}catch{}
      if(detail.preset)try{setCamera(detail.preset);}catch{}
    };
    addEventListener('ri:cinematic-shot',(event)=>ri50ApplyShot(event.detail));

    const ri50Animate=()=>{
      const t=ri50Clock.getElapsedTime();
      ri50Platform.rotation.y+=reducedMotion?0:.00024;
      ri50LightBars.forEach((bar,index)=>{bar.material.opacity=.8+Math.sin(t*1.4+index)*.2;});
      ri50Beams.forEach((beam,index)=>{beam.material.opacity=.018+(Math.sin(t*.7+index)*.5+.5)*.034;beam.rotation.z=Math.sin(t*.18+index)*.16;});
      ri50Beacons.forEach((beacon,index)=>{const pulse=.65+(Math.sin(t*3.2+index)*.5+.5)*.9;beacon.scale.y=pulse;});
      ri50ScanPlane.position.x=-4.8+((t*.72)%1)*9.6;
      ri50ScanEdge.position.x=ri50ScanPlane.position.x;
      ri50ScanMaterial.opacity=.035+(Math.sin(t*3.5)*.5+.5)*.075;
      ri50Dust.rotation.y+=reducedMotion?0:.00016;
      ri50ScreenData.forEach((screen)=>ri50DrawScreen(screen,t));

      if(ri50Shot){
        const progress=Math.min(1,(performance.now()-ri50Shot.start)/ri50Shot.duration);
        const eased=ri50Ease(progress);
        world.rotation.set(
          THREE.MathUtils.lerp(ri50Shot.from[0],ri50Shot.to[0],eased),
          THREE.MathUtils.lerp(ri50Shot.from[1],ri50Shot.to[1],eased),
          THREE.MathUtils.lerp(ri50Shot.from[2],ri50Shot.to[2],eased)
        );
        if(progress>=1)ri50Shot=null;
      }

      const analytical=state.view&&state.view!=='studio';
      ri50Screens.visible=!analytical||state.view==='data';
      ri50ScanPlane.visible=state.view==='technical'||state.view==='data';
      ri50ScanEdge.visible=ri50ScanPlane.visible;
      ri50Dust.visible=state.quality!=='lightweight';
      ri50Beams.forEach((beam)=>beam.visible=state.quality==='high'||state.quality==='auto');
      requestAnimationFrame(ri50Animate);
    };
    requestAnimationFrame(ri50Animate);

    keyLight.intensity=5.2;
    rimLight.intensity=3.8;
    fillLight.intensity=2.1;
    redKicker.intensity=10.5;
    cyanKicker.intensity=8.2;
    scene.fog.density=.018;
    document.documentElement.dataset.ri50Hangar='ready';
    dispatchEvent(new CustomEvent('ri:hangar-ready',{detail:{screens:ri50ScreenData.length,particles:ri50DustCount,revision:'RI-50X'}}));
  }catch(error){
    console.warn('RI-50X immersive hangar unavailable:',error);
  }

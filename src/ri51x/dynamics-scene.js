  /* RI-51X telemetry-driven suspension, load and CFD field. Injected inside the Three.js capability block. */
  try {
    const ri51Root=new THREE.Group();
    ri51Root.name='RI51X_VEHICLE_DYNAMICS';
    world.add(ri51Root);

    const ri51SuspensionGroup=new THREE.Group();
    ri51SuspensionGroup.name='RI51X_ACTIVE_SUSPENSION';
    const ri51CfdGroup=new THREE.Group();
    ri51CfdGroup.name='RI51X_LIVE_CFD_FIELD';
    const ri51PressureGroup=new THREE.Group();
    ri51PressureGroup.name='RI51X_PRESSURE_FIELD';
    const ri51VectorGroup=new THREE.Group();
    ri51VectorGroup.name='RI51X_LOAD_VECTORS';
    const ri51BrakeCoolingGroup=new THREE.Group();
    ri51BrakeCoolingGroup.name='RI51X_BRAKE_COOLING';
    ri51Root.add(ri51SuspensionGroup,ri51CfdGroup,ri51PressureGroup,ri51VectorGroup,ri51BrakeCoolingGroup);

    const ri51Config3d={
      rideHeight:36,
      damping:6.4,
      aeroBalance:46.5,
      flowDensity:72,
      cooling:68,
      showVectors:true,
      showPressure:true,
      showWake:true,
      showSuspension:true,
      freeze:false
    };
    let ri51Mode='overview';
    let ri51FrozenFrame=null;
    const ri51BaseWorldY=world.position.y;

    const ri51Materials={
      carbon:new THREE.MeshPhysicalMaterial({color:0x05090c,roughness:.46,metalness:.34,clearcoat:.72,clearcoatRoughness:.26}),
      titanium:new THREE.MeshStandardMaterial({color:0x9fb1bc,roughness:.2,metalness:.94}),
      violet:new THREE.MeshBasicMaterial({color:0x9f7cff,toneMapped:false}),
      cyan:new THREE.MeshBasicMaterial({color:0x70efff,toneMapped:false}),
      red:new THREE.MeshBasicMaterial({color:0xff4962,toneMapped:false}),
      orange:new THREE.MeshBasicMaterial({color:0xff9f43,toneMapped:false}),
      green:new THREE.MeshBasicMaterial({color:0x67e6ad,toneMapped:false}),
      glowViolet:new THREE.MeshBasicMaterial({color:0x9f7cff,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),
      glowCyan:new THREE.MeshBasicMaterial({color:0x70efff,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),
      glowRed:new THREE.MeshBasicMaterial({color:0xff4962,transparent:true,opacity:.13,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false})
    };

    const ri51Add=(geometry,material,position=[0,0,0],rotation=[0,0,0],name='PART',parent=ri51Root)=>{
      const mesh=new THREE.Mesh(geometry,material);
      mesh.name=`RI51X_${name}`;
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.castShadow=!constrainedDevice;
      mesh.receiveShadow=!constrainedDevice;
      parent.add(mesh);
      return mesh;
    };

    const ri51CylinderBetween=(a,b,radius,material,name,parent=ri51SuspensionGroup,segments=12)=>{
      const start=new THREE.Vector3(...a);const end=new THREE.Vector3(...b);const delta=end.clone().sub(start);
      const mesh=ri51Add(new THREE.CylinderGeometry(radius,radius,delta.length(),segments),material,start.clone().add(end).multiplyScalar(.5).toArray(),[0,0,0],name,parent);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
      return mesh;
    };

    const ri51SpringGeometry=(radius=.1,length=.52,turns=8)=>{
      const points=[];const segments=96;
      for(let index=0;index<=segments;index+=1){
        const t=index/segments;const angle=t*Math.PI*2*turns;
        points.push(new THREE.Vector3(Math.cos(angle)*radius,(t-.5)*length,Math.sin(angle)*radius));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),segments,.012,7,false);
    };

    const ri51WheelRigs=[];
    const ri51CornerNames=['FL','FR','RL','RR'];
    wheelAssemblies.forEach((wheel,index)=>{
      const base=wheel.root.position.clone();
      const side=Math.sign(base.z)||((index%2)?1:-1);
      const front=Boolean(wheel.front);
      const rig=new THREE.Group();
      rig.name=`RI51X_SUSPENSION_RIG_${ri51CornerNames[index]||index}`;
      rig.position.copy(base);
      ri51SuspensionGroup.add(rig);

      const chassisX=front?.72:-.62;
      const chassisZ=-side*.92;
      const upright=ri51Add(new THREE.CylinderGeometry(.13,.16,.72,16),ri51Materials.carbon,[0,.02,0],[0,0,Math.PI/2],`UPRIGHT_${index}`,rig);
      const hub=ri51Add(new THREE.CylinderGeometry(.12,.12,.24,18),ri51Materials.titanium,[0,0,0],[Math.PI/2,0,0],`HUB_CARRIER_${index}`,rig);
      const upperFront=ri51CylinderBetween([0,.2,0],[chassisX,.56,chassisZ],.026,ri51Materials.carbon,`UPPER_WISHBONE_A_${index}`,rig);
      const upperRear=ri51CylinderBetween([0,.2,0],[chassisX+(front?.38:-.38),.54,chassisZ],.026,ri51Materials.carbon,`UPPER_WISHBONE_B_${index}`,rig);
      const lowerFront=ri51CylinderBetween([0,-.22,0],[chassisX,.03,chassisZ],.03,ri51Materials.carbon,`LOWER_WISHBONE_A_${index}`,rig);
      const lowerRear=ri51CylinderBetween([0,-.22,0],[chassisX+(front?.46:-.46),.01,chassisZ],.03,ri51Materials.carbon,`LOWER_WISHBONE_B_${index}`,rig);
      const trackRod=ri51CylinderBetween([0,.02,0],[front?.35:-.35,.21,chassisZ*1.08],.022,ri51Materials.titanium,`TRACK_ROD_${index}`,rig);
      const pushrod=ri51CylinderBetween([0,.22,0],[front?.54:-.54,.92,chassisZ*.62],.026,ri51Materials.titanium,`PUSHROD_${index}`,rig);

      const damper=new THREE.Group();damper.name=`RI51X_DAMPER_${index}`;damper.position.set(front?.48:-.48,.84,chassisZ*.58);rig.add(damper);
      const body=ri51Add(new THREE.CylinderGeometry(.075,.085,.42,18),ri51Materials.carbon,[0,0,0],[0,0,0],`DAMPER_BODY_${index}`,damper);
      const rod=ri51Add(new THREE.CylinderGeometry(.027,.027,.31,12),ri51Materials.titanium,[0,-.34,0],[0,0,0],`DAMPER_ROD_${index}`,damper);
      const spring=ri51Add(ri51SpringGeometry(.105,.5,8),index<2?ri51Materials.cyan:ri51Materials.violet,[0,0,0],[0,0,0],`SPRING_${index}`,damper);
      const reservoir=ri51Add(new THREE.CylinderGeometry(.052,.052,.24,14),ri51Materials.titanium,[.14,.06,0],[0,0,Math.PI/2],`DAMPER_RESERVOIR_${index}`,damper);
      const travelRing=ri51Add(new THREE.TorusGeometry(.18,.012,8,36),index<2?ri51Materials.glowCyan:ri51Materials.glowViolet,[0,0,0],[Math.PI/2,0,0],`TRAVEL_RING_${index}`,rig);

      const contactPatch=ri51Add(new THREE.PlaneGeometry(.56,.25),index<2?ri51Materials.glowCyan:ri51Materials.glowViolet,[0,-wheel.radius+.025,0],[-Math.PI/2,0,0],`CONTACT_PATCH_${index}`,rig);
      contactPatch.material=contactPatch.material.clone();contactPatch.material.opacity=.12;

      ri51WheelRigs.push({wheel,index,front,side,base,rig,upright,hub,upperFront,upperRear,lowerFront,lowerRear,trackRod,pushrod,damper,body,rod,spring,reservoir,travelRing,contactPatch,lastTravel:0});
    });

    const ri51LoadArrows=[
      {name:'FRONT_LOAD',position:new THREE.Vector3(-3.6,2.8,0),share:()=>ri51Config3d.aeroBalance/100,color:0x70efff},
      {name:'FLOOR_LOAD',position:new THREE.Vector3(.25,2.45,0),share:()=>.46,color:0x9f7cff},
      {name:'REAR_LOAD',position:new THREE.Vector3(3.6,2.85,0),share:()=>1-ri51Config3d.aeroBalance/100,color:0xff4962}
    ].map((spec)=>{
      const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),spec.position,1.8,spec.color,.22,.12);
      arrow.name=`RI51X_${spec.name}`;ri51VectorGroup.add(arrow);return{...spec,arrow};
    });

    const ri51CopMarker=new THREE.Group();ri51CopMarker.name='RI51X_CENTRE_OF_PRESSURE';ri51VectorGroup.add(ri51CopMarker);
    ri51Add(new THREE.TorusGeometry(.26,.018,8,48),ri51Materials.violet,[0,0,0],[Math.PI/2,0,0],'COP_RING',ri51CopMarker);
    ri51Add(new THREE.TorusGeometry(.16,.012,8,40),ri51Materials.cyan,[0,0,0],[0,0,0],'COP_RING_VERTICAL',ri51CopMarker);
    ri51Add(new THREE.CylinderGeometry(.008,.008,2.4,8),ri51Materials.glowViolet,[0,1.2,0],[0,0,0],'COP_BEAM',ri51CopMarker);

    const ri51PressureNodes=[];
    const ri51PressureSpecs=[
      {name:'NOSE_HIGH_PRESSURE',position:[-4.55,.15,0],scale:[1.15,.48,1.48],material:ri51Materials.glowRed,base:.18,component:'front-wing'},
      {name:'FRONT_WING_SUCTION',position:[-4.5,-.42,0],scale:[1.6,.24,2.18],material:ri51Materials.glowCyan,base:.16,component:'front-wing'},
      {name:'FLOOR_LOW_PRESSURE',position:[.2,-.62,0],scale:[4.4,.2,1.35],material:ri51Materials.glowViolet,base:.2,component:'floor'},
      {name:'SIDEPOD_PRESSURE_L',position:[.3,.32,-1.22],scale:[2.1,.62,.45],material:ri51Materials.glowCyan,base:.12,component:'sidepods'},
      {name:'SIDEPOD_PRESSURE_R',position:[.3,.32,1.22],scale:[2.1,.62,.45],material:ri51Materials.glowCyan,base:.12,component:'sidepods'},
      {name:'DIFFUSER_RECOVERY',position:[3.55,-.18,0],scale:[1.55,.58,1.22],material:ri51Materials.glowRed,base:.14,component:'diffuser'},
      {name:'REAR_WING_PRESSURE',position:[4.1,1.12,0],scale:[.8,.5,2.15],material:ri51Materials.glowRed,base:.16,component:'rear-wing'}
    ];
    ri51PressureSpecs.forEach((spec,index)=>{
      const material=spec.material.clone();
      const mesh=ri51Add(new THREE.SphereGeometry(1,28,18),material,spec.position,[0,0,0],spec.name,ri51PressureGroup);
      mesh.scale.set(...spec.scale);mesh.userData.baseScale=new THREE.Vector3(...spec.scale);mesh.userData.baseOpacity=spec.base;mesh.userData.phase=index*.74;mesh.userData.component=spec.component;
      ri51PressureNodes.push(mesh);
    });

    const ri51ParticleMax=constrainedDevice?360:960;
    const ri51Positions=new Float32Array(ri51ParticleMax*3);
    const ri51Colors=new Float32Array(ri51ParticleMax*3);
    const ri51Seeds=[];
    const ri51Cold=new THREE.Color(0x285fff);const ri51Mid=new THREE.Color(0x70efff);const ri51Hot=new THREE.Color(0xff4962);const ri51TempColor=new THREE.Color();
    for(let index=0;index<ri51ParticleMax;index+=1){
      const lane=(index%32)-15.5;const layer=Math.floor(index/32)%6;const phase=((index*0.61803398875)%1+1)%1;
      ri51Seeds.push({lane,layer,phase,noise:Math.sin(index*12.9898)*43758.5453%1});
      ri51Positions[index*3]=-8+phase*16;ri51Positions[index*3+1]=-.4+layer*.26;ri51Positions[index*3+2]=lane*.19;
      ri51Colors[index*3]=.44;ri51Colors[index*3+1]=.93;ri51Colors[index*3+2]=1;
    }
    const ri51FlowGeometry=new THREE.BufferGeometry();
    ri51FlowGeometry.setAttribute('position',new THREE.BufferAttribute(ri51Positions,3));
    ri51FlowGeometry.setAttribute('color',new THREE.BufferAttribute(ri51Colors,3));
    const ri51FlowMaterial=new THREE.PointsMaterial({size:constrainedDevice?.035:.045,vertexColors:true,transparent:true,opacity:.82,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,sizeAttenuation:true});
    const ri51FlowPoints=new THREE.Points(ri51FlowGeometry,ri51FlowMaterial);ri51FlowPoints.name='RI51X_CFD_PARTICLE_FIELD';ri51CfdGroup.add(ri51FlowPoints);

    const ri51Streamlines=[];
    for(let lane=-9;lane<=9;lane+=1){
      const side=lane/9;const points=[];
      for(let sample=0;sample<=80;sample+=1){
        const t=sample/80;const x=-7.8+t*15.6;
        const bodyInfluence=Math.exp(-Math.pow(x*.34,2));
        const y=.25+Math.abs(side)*.28+bodyInfluence*(.55+Math.abs(side)*.35)-Math.exp(-Math.pow((x-.6)*.55,2))*.35;
        const z=side*(2.65-bodyInfluence*.92)+Math.sin(t*Math.PI*2+lane)*.04;
        points.push(new THREE.Vector3(x,y,z));
      }
      const material=new THREE.LineBasicMaterial({color:lane%3===0?0x9f7cff:0x70efff,transparent:true,opacity:.08+(.1-Math.abs(side)*.04),blending:THREE.AdditiveBlending,depthWrite:false});
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);line.name=`RI51X_CFD_STREAMLINE_${lane}`;ri51CfdGroup.add(line);ri51Streamlines.push(line);
    }

    const ri51Vortices=[];
    const ri51VortexSpecs=[
      [-3.7,.2,-1.75,.45,0x70efff],[-3.7,.2,1.75,.45,0x70efff],
      [-1.6,-.38,-1.38,.35,0x9f7cff],[-1.6,-.38,1.38,.35,0x9f7cff],
      [3.6,.2,-1.15,.55,0xff4962],[3.6,.2,1.15,.55,0xff4962],
      [5.2,.78,-.72,.72,0x9f7cff],[5.2,.78,.72,.72,0x9f7cff]
    ];
    ri51VortexSpecs.forEach(([x,y,z,radius,color],index)=>{
      const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});
      const ring=ri51Add(new THREE.TorusGeometry(radius,.018,7,56),material,[x,y,z],[0,index%2?-.35:.35,Math.PI/2],`VORTEX_${index}`,ri51CfdGroup);
      ring.userData.basePosition=ring.position.clone();ring.userData.phase=index*.82;ri51Vortices.push(ring);
    });

    const ri51WakeRibbonMaterial=new THREE.MeshBasicMaterial({color:0x9f7cff,transparent:true,opacity:.075,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});
    const ri51WakeShape=new THREE.Shape();ri51WakeShape.moveTo(0,-.65);ri51WakeShape.quadraticCurveTo(3,-1.2,8,-2.4);ri51WakeShape.lineTo(8,2.4);ri51WakeShape.quadraticCurveTo(3,1.2,0,.65);ri51WakeShape.closePath();
    const ri51WakeRibbon=ri51Add(new THREE.ShapeGeometry(ri51WakeShape,36),ri51WakeRibbonMaterial,[4.5,.65,0],[Math.PI/2,0,0],'REAR_WAKE_RIBBON',ri51CfdGroup);

    const ri51CoolingRings=[];
    ri51WheelRigs.forEach((rig,index)=>{
      const group=new THREE.Group();group.name=`RI51X_BRAKE_COOLING_${index}`;group.position.copy(rig.base);ri51BrakeCoolingGroup.add(group);
      for(let ringIndex=0;ringIndex<3;ringIndex+=1){
        const material=ri51Materials.glowCyan.clone();material.opacity=.09+ringIndex*.025;
        const ring=ri51Add(new THREE.TorusGeometry(.28+ringIndex*.09,.012,7,48),material,[0,0,rig.side*(.18+ringIndex*.07)],[Math.PI/2,0,0],`COOLING_RING_${index}_${ringIndex}`,group);
        ring.userData.phase=ringIndex*.7+index;ri51CoolingRings.push(ring);
      }
      const duct=ri51Add(new THREE.TorusGeometry(.34,.085,14,42,Math.PI*1.55),ri51Materials.carbon,[0,0,rig.side*.28],[Math.PI/2,0,rig.side*.28],`BRAKE_DUCT_${index}`,group);
      duct.scale.set(1,.72,1);
    });

    const ri51LoadState=(frame)=>{
      const speedMs=(frame?.speed||210)/3.6;
      const dynamicPressure=.5*1.225*speedMs*speedMs;
      const downforce=dynamicPressure*3.55;
      const drag=dynamicPressure*.91;
      const braking=THREE.MathUtils.clamp(((frame?.brake||430)-420)/430,0,1);
      const progress=frame?.progress||0;
      const phase=progress*Math.PI*12;
      const pitch=Math.sin(phase+1.1)*2.6-braking*6.5;
      const roll=Math.sin(phase*.63)*4.2;
      const heave=Math.sin(phase*1.8)*1.8+downforce/5200*4.2;
      return{speedMs,dynamicPressure,downforce,drag,braking,phase,pitch,roll,heave};
    };

    const ri51UpdateSuspension=(load,delta)=>{
      const response=1-Math.exp(-delta*(2.5+ri51Config3d.damping*.85));
      const travelValues=[
        load.heave-load.pitch*.48-load.roll*.45,
        load.heave-load.pitch*.48+load.roll*.45,
        load.heave+load.pitch*.38-load.roll*.38,
        load.heave+load.pitch*.38+load.roll*.38
      ];
      ri51WheelRigs.forEach((rig,index)=>{
        const target=THREE.MathUtils.clamp((travelValues[index]||0)*.008,-.085,.085);
        rig.lastTravel=THREE.MathUtils.lerp(rig.lastTravel,target,response);
        rig.wheel.root.position.y=rig.base.y-rig.lastTravel;
        rig.rig.position.y=rig.base.y-rig.lastTravel;
        rig.rod.position.y=-.34-rig.lastTravel*.9;
        rig.rod.scale.y=1+rig.lastTravel*2.2;
        rig.spring.scale.y=THREE.MathUtils.clamp(1-rig.lastTravel*1.8,.78,1.2);
        rig.travelRing.scale.setScalar(1+Math.abs(rig.lastTravel)*3.2);
        rig.travelRing.material.opacity=.08+Math.abs(rig.lastTravel)*2.4;
        const cornerLoad=(load.downforce/4)*(1+(index<2?load.pitch*.015:-load.pitch*.012)+(index%2?load.roll*.012:-load.roll*.012));
        rig.contactPatch.scale.x=.82+cornerLoad/4200;rig.contactPatch.scale.y=.7+cornerLoad/5200;rig.contactPatch.material.opacity=.08+cornerLoad/7200;
        rig.upright.rotation.x=rig.front?Math.sin(load.phase)*.018:Math.sin(load.phase*.72)*.012;
        rig.pushrod.material=cornerLoad>1350?ri51Materials.orange:ri51Materials.titanium;
      });
      const rideOffset=(36-ri51Config3d.rideHeight)*.006-load.downforce*.000006-load.braking*.014;
      world.position.y=THREE.MathUtils.lerp(world.position.y,ri51BaseWorldY+rideOffset,response*.45);
    };

    const ri51UpdateVectors=(load)=>{
      const frontShare=ri51Config3d.aeroBalance/100;
      ri51LoadArrows.forEach((item,index)=>{
        const share=index===0?frontShare:index===1?.46:1-frontShare;
        const length=.8+load.downforce*share/1150;
        item.arrow.setLength(length,.2,.11);item.arrow.position.y=2.1+length;
      });
      const copX=THREE.MathUtils.mapLinear(frontShare,.42,.51,1.25,-.75);
      ri51CopMarker.position.set(copX,-.96,0);ri51CopMarker.rotation.y+=.004;
      ri51VectorGroup.visible=ri51Config3d.showVectors&&(ri51Mode==='dynamics'||ri51Mode==='cfd'||state.view==='technical'||state.view==='aero');
    };

    const ri51UpdatePressure=(load,time)=>{
      const intensity=THREE.MathUtils.clamp(load.dynamicPressure/6200,.15,1.25);
      ri51PressureNodes.forEach((node,index)=>{
        const pulse=1+Math.sin(time*1.7+node.userData.phase)*.045;
        node.scale.copy(node.userData.baseScale).multiplyScalar(pulse*(.9+intensity*.16));
        node.material.opacity=node.userData.baseOpacity*intensity*(.85+Math.sin(time*1.4+index)*.12);
      });
      ri51PressureGroup.visible=ri51Config3d.showPressure&&(ri51Mode==='cfd'||state.view==='aero');
    };

    const ri51UpdateFlow=(load,time)=>{
      const activeCount=Math.round(ri51ParticleMax*ri51Config3d.flowDensity/100);
      ri51FlowGeometry.setDrawRange(0,activeCount);
      const positions=ri51FlowGeometry.attributes.position.array;
      const colors=ri51FlowGeometry.attributes.color.array;
      const flowSpeed=.035+load.speedMs*.00072;
      for(let index=0;index<activeCount;index+=1){
        const seed=ri51Seeds[index];
        const progress=(seed.phase+time*flowSpeed)%1;
        const x=-8.2+progress*17.2;
        const side=seed.lane/15.5;
        const absX=Math.abs(x);
        const noseInfluence=Math.exp(-Math.pow((x+3.7)*.7,2));
        const bodyInfluence=Math.exp(-Math.pow(x*.34,2));
        const floorInfluence=Math.exp(-Math.pow((x-.2)*.26,2));
        const wakeInfluence=THREE.MathUtils.clamp((x-3.2)/5,0,1);
        let z=side*(2.8-bodyInfluence*.9+noseInfluence*.22)+Math.sin(progress*Math.PI*8+seed.layer)*.035;
        let y=-.42+seed.layer*.27+Math.abs(side)*.18+bodyInfluence*(.58+Math.abs(side)*.18);
        if(seed.layer<2)y-=floorInfluence*.52;
        if(x>3.2){z*=1+wakeInfluence*.85;y+=wakeInfluence*(.35+Math.sin(seed.phase*20+time)*.18);}
        positions[index*3]=x;positions[index*3+1]=y;positions[index*3+2]=z;
        const pressure=THREE.MathUtils.clamp(.52+noseInfluence*.43-floorInfluence*.58+wakeInfluence*.18+Math.abs(side)*.08,0,1);
        ri51TempColor.copy(pressure<.5?ri51Cold:ri51Mid).lerp(pressure<.5?ri51Mid:ri51Hot,pressure<.5?pressure*2:(pressure-.5)*2);
        colors[index*3]=ri51TempColor.r;colors[index*3+1]=ri51TempColor.g;colors[index*3+2]=ri51TempColor.b;
      }
      ri51FlowGeometry.attributes.position.needsUpdate=true;ri51FlowGeometry.attributes.color.needsUpdate=true;
      ri51FlowMaterial.opacity=.38+THREE.MathUtils.clamp(load.speedMs/95,0,1)*.5;
      ri51Streamlines.forEach((line,index)=>{line.material.opacity=.055+Math.sin(time*.7+index)*.018+load.speedMs/1800;});
      ri51Vortices.forEach((ring,index)=>{
        ring.rotation.z+=.006+load.speedMs*.00008*(index%2?1:-1);
        ring.position.x=ring.userData.basePosition.x+Math.sin(time*.8+ring.userData.phase)*.08;
        ring.scale.setScalar(.85+load.speedMs/180+Math.sin(time*1.4+index)*.08);
        ring.material.opacity=.08+load.speedMs/650;
      });
      ri51WakeRibbon.material.opacity=ri51Config3d.showWake?(.035+load.drag/9000):0;
      ri51WakeRibbon.scale.z=.85+load.drag/1600;
      ri51CfdGroup.visible=(ri51Mode==='cfd'||state.view==='aero')&&ri51Config3d.showWake;
    };

    const ri51UpdateCooling=(load,time)=>{
      const coolingFactor=ri51Config3d.cooling/100;
      ri51CoolingRings.forEach((ring,index)=>{
        const scale=1+((time*.55+ring.userData.phase)%1)*1.2;
        ring.scale.setScalar(scale);ring.material.opacity=(.16-(scale-1)*.08)*coolingFactor*(.5+load.speedMs/110);
        ring.rotation.z+=.01*(index%2?1:-1);
      });
      ri51BrakeCoolingGroup.visible=(state.view==='thermal'||ri51Mode==='dynamics')&&coolingFactor>.32;
    };

    addEventListener('ri:vehicle-lab-config',(event)=>{
      Object.assign(ri51Config3d,event.detail||{});
      if(ri51Config3d.freeze&&!ri51FrozenFrame)ri51FrozenFrame=state.frame?{...state.frame}:null;
      if(!ri51Config3d.freeze)ri51FrozenFrame=null;
    });
    addEventListener('ri:vehicle-lab-mode',(event)=>{ri51Mode=event.detail?.mode||'overview';});

    let ri51Previous=performance.now();
    let ri51Time=0;
    const ri51Animate=(now)=>{
      const delta=Math.min(.05,(now-ri51Previous)/1000);ri51Previous=now;if(!ri51Config3d.freeze)ri51Time+=delta;
      const frame=ri51Config3d.freeze?(ri51FrozenFrame||state.frame):state.frame;
      const load=ri51LoadState(frame);
      if(!ri51Config3d.freeze)ri51UpdateSuspension(load,delta);
      ri51UpdateVectors(load);ri51UpdatePressure(load,ri51Time);ri51UpdateFlow(load,ri51Time);ri51UpdateCooling(load,ri51Time);
      ri51SuspensionGroup.visible=ri51Config3d.showSuspension&&(ri51Mode==='dynamics'||state.view==='technical'||state.selectedComponent==='front-suspension'||state.selectedComponent==='rear-suspension');
      const lightweight=state.quality==='lightweight';ri51Root.visible=!lightweight;
      requestAnimationFrame(ri51Animate);
    };
    requestAnimationFrame(ri51Animate);

    document.documentElement.dataset.vehicleDynamics='ri51x';
    dispatchEvent(new CustomEvent('ri:dynamics-ready',{detail:{particles:ri51ParticleMax,suspensionRigs:ri51WheelRigs.length,pressureNodes:ri51PressureNodes.length}}));
  } catch (error) {
    console.warn('RI-51X vehicle dynamics extension was skipped:',error);
  }

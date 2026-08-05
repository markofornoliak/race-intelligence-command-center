const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

function prepare(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = DPR();
  const width = Math.max(10, Math.round(rect.width * ratio));
  const height = Math.max(10, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio,0,0,ratio,0,0);
  return { ctx, width:rect.width, height:rect.height, ratio };
}

function css(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function drawTelemetry(canvas, frames, frameIndex, compare=false) {
  if (!canvas || !frames?.length) return;
  const { ctx, width, height } = prepare(canvas);
  ctx.clearRect(0,0,width,height);
  const pad = { l:38, r:18, t:18, b:26 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const line = css('--line','rgba(255,255,255,.12)');
  const cyan = css('--cyan','#64e8ff');
  const lime = css('--lime','#b5ff61');
  const amber = css('--amber','#ffca5c');

  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  for (let i=0;i<=4;i+=1) {
    const y = pad.t + (plotH/4)*i;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(width-pad.r,y); ctx.stroke();
  }
  for (let i=0;i<=6;i+=1) {
    const x = pad.l + (plotW/6)*i;
    ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,height-pad.b); ctx.stroke();
  }

  const drawSeries = (getter, color, min, max, alpha=1, dash=[]) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.7;
    ctx.setLineDash(dash);
    ctx.beginPath();
    frames.forEach((frame,index) => {
      const x = pad.l + (index/(frames.length-1))*plotW;
      const value = getter(frame,index);
      const y = pad.t + (1-(value-min)/(max-min))*plotH;
      index ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    });
    ctx.stroke();
    ctx.restore();
  };

  if (compare) drawSeries((frame,index) => frames[(index+frames.length-8)%frames.length].speed, '#ffffff', 70, 350, .28, [5,6]);
  drawSeries((frame) => frame.speed, cyan, 70, 350, .95);
  drawSeries((frame) => frame.tyre, lime, 70, 115, .9);
  drawSeries((frame) => frame.ers, amber, 0, 100, .85);

  const cursorX = pad.l + (frameIndex/(frames.length-1))*plotW;
  ctx.strokeStyle = '#ffffff'; ctx.globalAlpha=.72; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(cursorX,pad.t); ctx.lineTo(cursorX,height-pad.b); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.globalAlpha=1;
  ctx.beginPath(); ctx.arc(cursorX,pad.t+4,3,0,Math.PI*2); ctx.fill();

  ctx.font = '9px ui-monospace, monospace';
  ctx.fillStyle = css('--muted','#7e8b98');
  ctx.textAlign='right';
  ctx.fillText('350',pad.l-7,pad.t+4);
  ctx.fillText('70',pad.l-7,height-pad.b+4);
}

export function drawCircuit(canvas, points, progress, events=[]) {
  if (!canvas || !points?.length) return;
  const { ctx, width, height } = prepare(canvas);
  ctx.clearRect(0,0,width,height);
  const pad = 28;
  const scaleX = width - pad*2;
  const scaleY = height - pad*2;
  const projected = points.map((p) => ({ x:pad+(p.x+0.56)*scaleX/1.12, y:pad+(p.y+0.42)*scaleY/0.84 }));

  ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=16;
  ctx.beginPath(); projected.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle='rgba(100,232,255,.42)'; ctx.lineWidth=2;
  ctx.beginPath(); projected.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.stroke();

  const pitStart=Math.floor(points.length*.67), pitEnd=Math.floor(points.length*.77);
  ctx.strokeStyle='rgba(255,202,92,.62)'; ctx.lineWidth=4;
  ctx.beginPath();
  for(let i=pitStart;i<=pitEnd;i+=1){const p=projected[i%projected.length];i===pitStart?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);}ctx.stroke();

  events.slice(-4).forEach((event,index)=>{
    const p=projected[(event.frame*3)%projected.length];
    ctx.fillStyle=index===events.slice(-4).length-1?'#ff5d68':'rgba(255,255,255,.32)';
    ctx.beginPath();ctx.arc(p.x,p.y,index===events.slice(-4).length-1?4:2.5,0,Math.PI*2);ctx.fill();
  });

  const exact=progress*(points.length-1);const a=projected[Math.floor(exact)];const b=projected[Math.ceil(exact)%projected.length];const f=exact-Math.floor(exact);
  const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;
  const glow=ctx.createRadialGradient(x,y,0,x,y,18);glow.addColorStop(0,'rgba(100,232,255,.8)');glow.addColorStop(1,'rgba(100,232,255,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#64e8ff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.stroke();
}

export function drawDistribution(canvas, outcomes, mean, p10, p90) {
  if (!canvas || !outcomes?.length) return;
  const { ctx,width,height }=prepare(canvas);ctx.clearRect(0,0,width,height);
  const min=Math.min(...outcomes),max=Math.max(...outcomes);const bins=34;const counts=new Array(bins).fill(0);
  outcomes.forEach(v=>{const index=Math.min(bins-1,Math.floor(((v-min)/(max-min||1))*bins));counts[index]+=1;});
  const peak=Math.max(...counts);const pad={l:25,r:18,t:18,b:24};const plotW=width-pad.l-pad.r,plotH=height-pad.t-pad.b;const gap=2;const barW=plotW/bins;
  counts.forEach((count,index)=>{const h=(count/peak)*plotH;const x=pad.l+index*barW;const gradient=ctx.createLinearGradient(0,height-pad.b-h,0,height-pad.b);gradient.addColorStop(0,'rgba(100,232,255,.9)');gradient.addColorStop(1,'rgba(100,232,255,.12)');ctx.fillStyle=gradient;ctx.fillRect(x+gap/2,height-pad.b-h,Math.max(1,barW-gap),h);});
  const marker=(value,color,label)=>{const x=pad.l+((value-min)/(max-min||1))*plotW;ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,height-pad.b);ctx.stroke();ctx.fillStyle=color;ctx.font='8px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(label,x,pad.t-5);};
  marker(p10,'rgba(255,255,255,.45)','P10');marker(mean,'#ffffff','MEAN');marker(p90,'rgba(255,255,255,.45)','P90');
  ctx.fillStyle='rgba(255,255,255,.42)';ctx.font='8px ui-monospace,monospace';ctx.textAlign='left';ctx.fillText(`${min.toFixed(1)}s`,pad.l,height-7);ctx.textAlign='right';ctx.fillText(`${max.toFixed(1)}s`,width-pad.r,height-7);
}

export function createNetworkSvg(svg,nodes,mode='normal') {
  if (!svg) return;
  const pairs=[['car','garage'],['car','pit-wall'],['garage','pit-wall'],['pit-wall','trackside'],['trackside','factory'],['factory','strategy'],['factory','governed'],['governed','specialist'],['strategy','specialist'],['pit-wall','factory']];
  const lookup=Object.fromEntries(nodes.map(n=>[n.id,n]));
  svg.innerHTML=pairs.map(([a,b],index)=>{const p1=lookup[a],p2=lookup[b];const degraded=mode==='degraded'&&(index===4||index===8);return `<line x1="${p1.x*10}" y1="${p1.y*6.2}" x2="${p2.x*10}" y2="${p2.y*6.2}" class="${degraded?'is-degraded':''}" data-edge="${a}-${b}" />`;}).join('');
}

export function observeCanvases(callback) {
  const observer=new ResizeObserver(()=>callback());
  document.querySelectorAll('canvas').forEach(canvas=>observer.observe(canvas));
  return observer;
}

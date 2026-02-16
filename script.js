const c = document.getElementById('canvas'), ctx = c.getContext('2d');
let running = false, frame = 0, weight = 0, water = 100, rotation = 0, rpm = 0, fail = null;
let parts = {c:[], s:[], g:[], w:[]};

class P {
  constructor(x,y,col) { this.x=x; this.y=y; this.c=col; this.s=2+Math.random()*2; this.r=3+Math.random()*3; }
  update() { this.y+=this.s; }
  draw() { ctx.fillStyle=this.c; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); }
}

function silo(x,y,w,h,txt,col,pct) {
  ctx.fillStyle='#e5e7eb'; ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='#666'; ctx.lineWidth=2; ctx.strokeRect(x,y,w,h);
  if(pct>0) { ctx.fillStyle=col; ctx.fillRect(x,y+h-(h*pct)/100,w,(h*pct)/100); }
  ctx.fillStyle='#888'; ctx.beginPath(); ctx.moveTo(x-10,y); ctx.lineTo(x+w/2,y-30); ctx.lineTo(x+w+10,y); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#000'; ctx.font='bold 12px Arial'; ctx.textAlign='center'; ctx.fillText(txt,x+w/2,y+h+20);
}

function valve(x,y,open,txt) {
  ctx.fillStyle=open?'#10b981':'#ef4444'; ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.stroke();
  ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath();
  if(open) { ctx.moveTo(x-6,y); ctx.lineTo(x+6,y); } else { ctx.moveTo(x,y-6); ctx.lineTo(x,y+6); }
  ctx.stroke();
  ctx.fillStyle='#000'; ctx.font='10px Arial'; ctx.textAlign='center'; ctx.fillText(txt,x,y+25);
}

function sensor(x,y,val,txt,ok) {
  ctx.fillStyle=ok?'#3b82f6':'#ef4444'; ctx.fillRect(x-18,y-12,36,24);
  ctx.strokeStyle='#000'; ctx.lineWidth=1.5; ctx.strokeRect(x-18,y-12,36,24);
  ctx.fillStyle='#fff'; ctx.font='bold 14px Arial'; ctx.textAlign='center'; ctx.fillText('📡',x,y+4);
  ctx.fillStyle='#000'; ctx.font='bold 10px Arial'; ctx.fillText(txt,x,y-20); ctx.fillText(val,x,y+38);
  if(!ok) { ctx.fillStyle='#ef4444'; ctx.fillText('❌',x,y+50); }
}

function mixer(x,y,rot,spd) {
  const ok=fail!=='mixer';
  ctx.fillStyle='#6b7280'; ctx.beginPath();
  ctx.moveTo(x-100,y); ctx.lineTo(x-80,y+150); ctx.lineTo(x+80,y+150); ctx.lineTo(x+100,y); ctx.closePath();
  ctx.fill(); ctx.strokeStyle='#333'; ctx.lineWidth=3; ctx.stroke();
  if(weight>0) {
    const lv=Math.min(weight/10,120);
    ctx.fillStyle='#78716c'; ctx.beginPath();
    ctx.moveTo(x-80+lv/10,y+150-lv); ctx.lineTo(x-80,y+150); ctx.lineTo(x+80,y+150); ctx.lineTo(x+80-lv/10,y+150-lv);
    ctx.closePath(); ctx.fill();
  }
  if(ok) {
    ctx.save(); ctx.translate(x,y+75); ctx.rotate(rot);
    ctx.strokeStyle='#000'; ctx.lineWidth=5;
    for(let i=0;i<4;i++) { ctx.save(); ctx.rotate(Math.PI/2*i); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(50,0); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  }
  ctx.fillStyle=ok?'#10b981':'#ef4444'; ctx.fillRect(x-35,y-35,70,35);
  ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.strokeRect(x-35,y-35,70,35);
  ctx.fillStyle='#fff'; ctx.font='bold 11px Arial'; ctx.textAlign='center'; ctx.fillText('MOTOR',x,y-12);
  ctx.fillStyle='#000'; ctx.font='bold 12px Arial'; ctx.fillText(spd+' RPM',x,y+170);
  if(!ok) { ctx.fillStyle='#ef4444'; ctx.fillText('❌ FALHA',x,y+185); }
}

function tank(x,y,lv) {
  ctx.fillStyle='#e0f2fe'; ctx.fillRect(x,y,80,120);
  ctx.strokeStyle='#0284c7'; ctx.lineWidth=2; ctx.strokeRect(x,y,80,120);
  const h=(lv/100)*120;
  ctx.fillStyle='#06b6d4'; ctx.globalAlpha=0.7; ctx.fillRect(x,y+120-h,80,h); ctx.globalAlpha=1;
  ctx.fillStyle='#000'; ctx.font='bold 12px Arial'; ctx.textAlign='center';
  ctx.fillText('ÁGUA',x+40,y+135); ctx.fillText(Math.round(lv)+'%',x+40,y+150);
}

function draw() {
  ctx.clearRect(0,0,1200,700);
  ctx.fillStyle='#f5f5f5'; ctx.fillRect(0,0,1200,700);
  ctx.fillStyle='#000'; ctx.font='bold 18px Arial'; ctx.textAlign='left';
  ctx.fillText('SISTEMA DE PRODUÇÃO DE CONCRETO',20,30);

  ctx.strokeStyle='#999'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(150,250); ctx.lineTo(150,350); ctx.lineTo(500,350); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(300,250); ctx.lineTo(300,370); ctx.lineTo(500,370); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(450,250); ctx.lineTo(450,390); ctx.lineTo(500,390); ctx.stroke();
  ctx.strokeStyle='#06b6d4'; ctx.beginPath(); ctx.moveTo(940,420); ctx.lineTo(700,420); ctx.stroke();

  silo(110,50,80,200,'CIMENTO','#78716c',running?70:90);
  silo(260,50,80,200,'AREIA','#fbbf24',running?60:85);
  silo(410,50,80,200,'BRITA','#6b7280',running?65:88);
  tank(900,300,water);

  valve(150,280,running,'V1');
  valve(300,300,running,'V2');
  valve(450,320,running,'V3');
  valve(850,420,running&&fail!=='valvula','V4');

  if(running) {
    if(Math.random()<0.3&&fail!=='peso') parts.c.push(new P(150,250,'#78716c'));
    if(Math.random()<0.3&&fail!=='peso') parts.s.push(new P(300,250,'#fbbf24'));
    if(Math.random()<0.3&&fail!=='peso') parts.g.push(new P(450,250,'#6b7280'));
    if(Math.random()<0.3&&water>0&&fail!=='valvula'&&fail!=='nivel') parts.w.push(new P(940,420,'#06b6d4'));
  }
  Object.values(parts).forEach(a => {
    for(let i=a.length-1;i>=0;i--) { a[i].update(); a[i].draw(); if(a[i].y>500) a.splice(i,1); }
  });

  mixer(600,350,rotation,rpm);
  sensor(600,550,weight+'kg','PESO',fail!=='peso');
  sensor(940,250,Math.round(water)+'%','NÍVEL',fail!=='nivel');
  sensor(750,320,'OK','TEMP',true);
  sensor(480,500,'OK','VIB',fail!=='mixer');

  ctx.fillStyle='#555'; ctx.beginPath();
  ctx.moveTo(550,500); ctx.lineTo(530,580); ctx.lineTo(570,600); ctx.lineTo(630,600);
  ctx.lineTo(670,580); ctx.lineTo(650,500); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font='bold 11px Arial'; ctx.textAlign='center';
  ctx.fillText('SAÍDA',600,615);

  if(weight>800) {
    ctx.fillStyle='#f59e0b'; ctx.fillRect(550,630,100,50);
    ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(570,690,15,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(630,690,15,0,Math.PI*2); ctx.fill();
  }
  frame++;
}

function animate() {
  draw();
  if(running&&fail!=='mixer') { rotation+=0.1; rpm=450; } else rpm=0;
  if(running&&fail!=='peso'&&weight<1000) weight+=2;
  if(running&&fail!=='valvula'&&fail!=='nivel'&&water>20) water-=0.3;
  document.getElementById('status').textContent=running?'Produzindo ✅':'Parado ⏸️';
  document.getElementById('weight').textContent=Math.round(weight)+' kg';
  document.getElementById('water').textContent=Math.round(water)+'%';
  document.getElementById('rpm').textContent=rpm;
  requestAnimationFrame(animate);
}

function startProduction() { running=true; fail=null; document.getElementById('alert').classList.remove('active'); }

function stopProduction() {
  running=false; weight=0; water=100; rpm=0; fail=null;
  parts={c:[],s:[],g:[],w:[]};
  document.getElementById('alert').classList.remove('active');
}

function simulateFailure(t) {
  fail=t;
  const m = {
    peso: ['⚠️ FALHA NO SENSOR DE PESO', 'O sensor de peso parou! Sem medição precisa, a dosagem fica incorreta. Resultado: concreto com resistência inadequada, desperdício de materiais e não conformidade. PRODUÇÃO DEVE SER INTERROMPIDA!'],
    nivel: ['⚠️ FALHA NO SENSOR DE NÍVEL', 'Sensor de nível falhou! Impossível saber quantidade de água. Riscos: concreto seco, falta de água durante produção, bomba a seco. Verificação manual necessária!'],
    valvula: ['⚠️ FALHA NA VÁLVULA DE ÁGUA', 'Válvula travada! Água não flui. Consequências: apenas agregados secos, mistura impossível, sobrecarga do motor, produto inútil. AÇÃO URGENTE!'],
    mixer: ['⚠️ FALHA NO MOTOR DO MISTURADOR', 'Motor parou! Sem mistura, materiais ficam segregados. Resultado: concreto heterogêneo, sem resistência mecânica. LOTE DEVE SER DESCARTADO!']
  };
  document.getElementById('alertTitle').textContent=m[t][0];
  document.getElementById('alertMsg').textContent=m[t][1];
  document.getElementById('alert').classList.add('active');
}

animate();
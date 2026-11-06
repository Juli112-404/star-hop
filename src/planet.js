const judgeMode=globalThis.StarHopJudge===true;
const orbit=Arcade.mount(judgeMode?'orbit-best-judge-v1':'orbit-best-endless-v2','无尽');
const {Physics}=OrbitEngine;
const walletKey=judgeMode?'star-hop-judge-endless-wallet-v1':'star-hop-endless-wallet-v1';
const walletLabel=document.querySelector('#wallet');
let run,guide,guideAt=-1,camera=null,view=null;
function loadWallet(){
  try{return new StarEconomy(JSON.parse(localStorage.getItem(walletKey)||'{}'))}
  catch{return new StarEconomy()}
}
let wallet=loadWallet();
function showWallet(){walletLabel.textContent='★ '+wallet.balance}
function saveWallet(){try{localStorage.setItem(walletKey,JSON.stringify(wallet))}catch{}showWallet()}
showWallet();

orbit.onStart=()=>{
  wallet=loadWallet();
  showWallet();
  run=new StarEndless.EndlessRun();
  run.next();
  camera=view=null;
  guideAt=-1;
};
orbit.onAction=()=>run.game.action();
orbit.onRevive=()=>{
  wallet=loadWallet();
  if(!run.revive(wallet)){showWallet();return false}
  saveWallet();
  guideAt=-1;
  return true;
};
orbit.update=dt=>{
  const game=run.game;
  game.step(dt);
  if(game.state==='playing'&&game.used>0&&!game.flight&&!game.inTransit)game.fail('未抵达目标');
  if(run.collect()){wallet=loadWallet();wallet.balance++;saveWallet()}
  if(game.state==='dead'){
    orbit.fail(game.reason,wallet.balance>=StarEndless.revivalCost);
  }else if(run.advance()){
    orbit.setScore(run.score);
    orbit.message(game.perfects?'PERFECT +10':'+10');
    guideAt=-1;
  }
};

const c=orbit.ctx,tau=Math.PI*2;
function circle(p,r,stroke,fill){
  c.beginPath();c.arc(p.x,p.y,r,0,tau);
  if(fill){c.fillStyle=fill;c.fill()}
  if(stroke){c.strokeStyle=stroke;c.stroke()}
}
function line(a,b,color,width=2){
  c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle=color;c.lineWidth=width;c.stroke();c.lineWidth=2;
}
function path(points,color,dashed){
  if(!points?.length)return;
  c.beginPath();c.moveTo(points[0].x,points[0].y);
  for(const p of points.slice(1))p.break?c.moveTo(p.x,p.y):c.lineTo(p.x,p.y);
  if(dashed)c.setLineDash([4,7]);
  c.strokeStyle=color;c.stroke();c.setLineDash([]);
}
function track(p){
  if(!p.move)return;
  const {amp,axis}=p.move;
  c.setLineDash([4,7]);
  line({x:p.x-(axis==='x'?amp:0),y:p.y-(axis==='y'?amp:0)},
       {x:p.x+(axis==='x'?amp:0),y:p.y+(axis==='y'?amp:0)},'#9cb8cf66');
  c.setLineDash([]);
}
function star(p){
  c.beginPath();
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5-Math.PI/2,r=i%2?7:15;
    const x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;
    if(i)c.lineTo(x,y);else c.moveTo(x,y);
  }
  c.closePath();c.fillStyle='#ffe184';c.fill();
}
function key(p){
  circle({x:p.x-7,y:p.y},6,'#ffe184');
  line({x:p.x-1,y:p.y},{x:p.x+15,y:p.y},'#ffe184',3);
  line({x:p.x+10,y:p.y},{x:p.x+10,y:p.y+5},'#ffe184',3);
}
function lock(p){
  c.strokeStyle='#ffe184';c.beginPath();c.arc(p.x,p.y-6,7,Math.PI,tau);c.stroke();
  c.strokeRect(p.x-11,p.y-6,22,16);
}
function scenery(game){
  const l=game.level;
  for(const w of l.wind||[]){
    c.fillStyle='#6acfff20';c.fillRect(w.x,w.y,w.w,w.h);
    for(let i=0;i<12;i++){
      const x=w.x+12+i*37%(w.w-24),y=w.y+12+(i*67+game.time*65)%(w.h-24);
      const speed=Math.hypot(w.ax,w.ay);
      line({x,y},{x:x+w.ax/speed*11,y:y+w.ay/speed*11},'#79caef77');
    }
  }
  for(const g of l.gravity||[]){
    const color=g.force<0?'#ee91bd':'#b393fa';
    circle(g,g.range,color+'66',color+'13');circle(g,g.r,color,color+'88');
    circle(g,g.range*(.52+.12*Math.sin(game.time*2)),color+'55');
    circle(g,g.range*.78,color+'44');
  }
  for(const p of l.portals||[]){
    circle(p.entry,p.r,'#6be4ed','#6be4ed20');circle(p.entry,p.r-7,'#6be4ed66');
    circle(p.exit,p.r,'#bf99ff','#bf99ff20');circle(p.exit,p.r-7,'#bf99ff66');

  }
  for(const o of l.obstacles||[]){track(o);circle(Physics.position(o,game.time),o.r,'#f19088','#8c484c')}
  for(const wall of l.walls||[])line(wall.a,wall.b,'#d98985',8);
  for(const board of l.reflectors||[])line(board.a,board.b,'#a6e4ff',8);
}
function planets(game){
  const l=game.level;
  for(const [i,n] of l.nodes.entries()){
    const p=game.node(i),open=!n.window||game.time%n.window.period<n.window.open;
    c.save();
    if(n.goal)c.globalAlpha=Math.min(1,.35+game.time*3);
    track(n);
    const color=n.goal?(open?'#ffce76':'#708195'):'#8fcded';
    circle(p,n.r,color,color+'2b');circle(p,n.r*.62,color+'99',color+'18');
    if(n.goal){
      if(l.goalKey&&!game.goalReady())lock(p);else circle(p,6,color,color+'55');
    }else{
      circle(p,game.radius(0),'#89b6d655');
      if(game.launchRemaining!==null&&!game.flight&&game.state==='playing'){
        c.beginPath();c.arc(p.x,p.y,n.r+10,-Math.PI/2,-Math.PI/2+tau*game.launchRemaining/n.launchSeconds);
        c.strokeStyle='#ffb274';c.lineWidth=5;c.stroke();c.lineWidth=2;
        c.fillStyle='#ffcc9c';c.font='bold 19px system-ui';c.textAlign='center';
        c.fillText(game.launchRemaining.toFixed(1)+'s',p.x,p.y+n.r+35);
      }
    }
    c.restore();
  }
  if(l.flightKey&&!game.goalReady())key(l.flightKey);
  if(l.pickups?.length&&!game.collected.has(0))star(l.pickups[0]);
}
function framing(level){
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  function include(p,x=0,y=x){
    left=Math.min(left,p.x-x);right=Math.max(right,p.x+x);
    top=Math.min(top,p.y-y);bottom=Math.max(bottom,p.y+y);
  }
  for(const n of [...level.nodes,...level.obstacles||[]]){
    const r=n.r+23;
    include(n,r+(n.move?.axis==='x'?n.move.amp:0),r+(n.move?.axis==='y'?n.move.amp:0));
  }
  for(const g of level.gravity||[])include(g,g.range+10);
  for(const p of level.portals||[]){include(p.entry,p.r+15);include(p.exit,p.r+15)}
  for(const p of [...level.walls||[],...level.reflectors||[]]){include(p.a,14);include(p.b,14)}
  for(const w of level.wind||[]){include(w);include({x:w.x+w.w,y:w.y+w.h})}
  for(const p of level.pickups||[])include(p,p.r+6);
  return {...run.toWorld({x:(left+right)/2,y:(top+bottom)/2}),width:right-left,height:bottom-top,level};
}
orbit.draw=(dt=1/60)=>{
  const {w,h}=orbit;
  c.fillStyle='#0b1220';c.fillRect(0,0,w,h);
  if(!run)return;
  const game=run.game,level=game.level;
  if(view?.level!==level)view=framing(level);
  const fit=Math.max(.1,Math.min((w-24)/Math.max(570,view.width),(h-106)/view.height,1.22));
  if(!camera)camera={x:view.x,y:view.y,scale:fit};
  const blend=1-Math.exp(-11*dt);
  camera.x+=(view.x-camera.x)*blend;
  camera.y+=(view.y-camera.y)*blend;
  camera.scale+=(fit-camera.scale)*blend;
  const scale=camera.scale;
  c.fillStyle='#39546e';
  const wrap=(v,size)=>(v%size+size)%size;
  for(let i=0;i<56;i++){
    c.fillRect(wrap(i*137-camera.x*.19,w),wrap(i*223-camera.y*.19,h),1.5,1.5);
  }
  c.save();c.translate(w/2,(h+58)/2);c.scale(scale,scale);c.translate(-camera.x,-camera.y);c.lineWidth=2;
  c.translate(run.origin.x,run.origin.y);
  const aiming=!game.flight&&!game.inTransit&&game.state==='playing';
  if(aiming&&(guideAt<0||game.time-guideAt>=1/60-.001)){
    guide=game.preview(3.5);guideAt=game.time;
  }
  scenery(game);planets(game);
  if(aiming){
    path(guide?.points,guide?.landing?'#79edc9':'#b7c8d866',true);
    path(guide?.twinPoints,guide?.landing?'#79edc9':'#8fcfff88',true);
  }else{
    path([...game.trail,game.ball],'#a6eddb88',false);
    if(game.twin)path([...game.twin.trail,game.twin.ball],'#8fcfff99',false);
  }
  const radius=Math.max(6,3.5/scale);
  circle(game.ball,radius,null,'#fff');
  if(level.twinOffset){
    const p=game.node(game.current),a=game.angle+game.twinGap(),r=game.radius();
    const twin=game.twin?.ball||{x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r};
    circle(twin,radius,null,'#8fcfff');
  }
  if(game.failurePoint)circle(game.failurePoint,14,'#ff9184');
  c.restore();
};
orbit.onStart();

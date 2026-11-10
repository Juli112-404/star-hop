/* Deterministic simulation shared by the browser and route tests. */
(function(root){
const ballRadius=6.5,wallRadius=5;
const Physics={
 ballRadius,wallRadius,
 hit(a,b,p,r){const dx=b.x-a.x,dy=b.y-a.y,fx=a.x-p.x,fy=a.y-p.y,A=dx*dx+dy*dy,C=fx*fx+fy*fy-r*r;if(C<=0)return 0;if(A<1e-12)return null;const B=2*(fx*dx+fy*dy),D=B*B-4*A*C;if(D<0)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null},
 segment(a,b,p,q){const dx=b.x-a.x,dy=b.y-a.y,ex=q.x-p.x,ey=q.y-p.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)return null;const t=((p.x-a.x)*ey-(p.y-a.y)*ex)/den,u=((p.x-a.x)*dy-(p.y-a.y)*dx)/den;return t>1e-7&&t<=1&&u>=0&&u<=1?t:null},
 wallHit(from,to,wall){
  const {a,b}=wall,r=wallRadius+ballRadius;
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  if(length===0)return Physics.hit(from,to,a,r);
  const capA=Physics.hit(from,to,a,r),capB=Physics.hit(from,to,b,r);
  const project=p=>({
    x:((p.x-a.x)*dx+(p.y-a.y)*dy)/length,
    y:((p.y-a.y)*dx-(p.x-a.x)*dy)/length
  });
  const start=project(from),end=project(to);
  let entry=0,exit=1;
  for(const [axis,min,max] of [['x',0,length],['y',-r,r]]){
    const velocity=end[axis]-start[axis];
    if(Math.abs(velocity)<1e-12){
      if(start[axis]<min||start[axis]>max){entry=Infinity;break}
      continue;
    }
    const t1=(min-start[axis])/velocity,t2=(max-start[axis])/velocity;
    entry=Math.max(entry,Math.min(t1,t2));exit=Math.min(exit,Math.max(t1,t2));
    if(entry>exit){entry=Infinity;break}
  }
  const hit=Math.min(entry,capA??Infinity,capB??Infinity);
  return Number.isFinite(hit)?hit:null;
 },
 position(n,time){
  const {x,y,move}=n;
  if(!move)return {x,y};
  const angle=time*move.rate+(move.phase??0);
  if(move.axis==='orbit')return {x:x+Math.cos(angle)*move.amp,y:y+Math.sin(angle)*(move.ampY??move.amp)};
  const shift=Math.sin(angle)*move.amp;
  return {x:x+(move.axis==='x'?shift:0),y:y+(move.axis==='y'?shift:0)};
 },
 entryAngle(arc,time){return arc.angle+(arc.rate??0)*time},
 turnAngle(surface,time){
  const {turn}=surface;
  return turn?Math.sin(time*turn.rate+(turn.phase??0))*turn.amp:0;
 },
 rotate(point,center,angle){
  const dx=point.x-center.x,dy=point.y-center.y,c=Math.cos(angle),s=Math.sin(angle);
  return {x:center.x+dx*c-dy*s,y:center.y+dx*s+dy*c};
 },
 reflector(surface,time){
  if(!surface.turn)return surface;
  const {a,b}=surface,center={x:(a.x+b.x)/2,y:(a.y+b.y)/2},angle=Physics.turnAngle(surface,time);
  return {a:Physics.rotate(a,center,angle),b:Physics.rotate(b,center,angle),center,angle};
 }
};
class OrbitGame{
 // A field may bend a flight back toward the map from beyond the default right edge.
 constructor(level){this.level=level;this.flightRight=(level.gravity||[]).reduce((right,field)=>Math.max(right,field.x+field.range),670);this.time=0;this.current=0;this.angle=-Math.PI/2;this.state='playing';this.flight=false;this.used=0;this.score=0;this.combo=0;this.perfects=0;this.visited=new Set();this.consumed=new Set();this.keys=new Set();this.switches=new Set();this.gravityUsed=false;this.portalUsed=false;this.portalEvents=[];this.reflectCooldown=0;this.reflections=0;this.portalCooldown=0;this.travelTime=0;this.leftSource=false;this.launchRemaining=level.nodes[0].launchSeconds??null;this.goalClockStart=level.goalDeadlineFrom==null?0:null;this.collected=new Set();this.pendingPickups=new Set();this.failurePoint=null;this.bestWait=0;this.waitOnPlanet=0;this.angle=this.initialAngle();this.ball=this.orbitPoint();this.message='';this.messageTime=0;this.trail=[]}
 node(i){return Physics.position(this.level.nodes[i],this.time)}
 radius(i=this.current){return (this.level.nodes[i].r||38)+5} initialAngle(){const a=this.node(0),b=this.level.portals?.[0]?.entry||this.node(1),d=Math.hypot(b.x-a.x,b.y-a.y);return Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2+Math.asin(Math.min(.95,this.radius()/d))-1.6} orbitPoint(){const p=this.node(this.current),r=this.radius();return{x:p.x+Math.cos(this.angle)*r,y:p.y+Math.sin(this.angle)*r}}
 messageFor(text){this.message=text;this.messageTime=1.4}
 fail(reason){this.state='dead';this.reason=reason;this.failurePoint={x:this.ball.x,y:this.ball.y}}
 gateOpen(g){return (!g.key||this.keys.has(g.key))&&(!g.switch||this.switches.has(g.switch))}
 wallPhase(w){return ((this.time+(w.cycle.phase??0))%w.cycle.period+w.cycle.period)%w.cycle.period}
 wallSolid(w){
  return (!w.switch||!this.switches.has(w.switch))&&
   (!w.closedWhen||this.switches.has(w.closedWhen))&&
   (!w.key||!this.keys.has(w.key))&&
   (!w.cycle||this.wallPhase(w)>=w.cycle.open);
 }
 get goalRemaining(){return this.level.goalDeadline==null||this.goalClockStart===null?null:Math.max(0,this.level.goalDeadline-(this.time-this.goalClockStart))}
 goalReady(){return (this.level.required||[]).every(i=>this.visited.has(i))&&(!this.level.needGravity||this.gravityUsed)&&(!this.level.needPortal||this.portalUsed)&&(!this.level.goalKey||this.keys.has(this.level.goalKey))&&(!this.level.goalSwitch||this.switches.has(this.level.goalSwitch))}
 settlePickups(i){
  for(const index of this.pendingPickups){
   if(this.level.pickups[index].landOn===i&&!this.collected.has(index)){this.collected.add(index);this.score+=5}
  }
  this.pendingPickups.clear();
 }
 action(){if(this.state!=='playing'||this.flight)return;this.bestWait=Math.max(this.bestWait,this.waitOnPlanet);this.used++;this.pendingPickups.clear();const n=this.level.nodes[this.current];if(n.fragile)this.consumed.add(this.current);const p=this.orbitPoint();this.ball={...p,vx:-Math.sin(this.angle)*290*(n.spin||1),vy:Math.cos(this.angle)*290*(n.spin||1)};this.flight=true;this.leftSource=false;this.travelTime=0;this.trail=[]}
 capture(i,miss){
  const n=this.level.nodes[i];
  if(this.consumed.has(i)){this.fail('一次性星球已崩解，不能再返回。请选择另一条路线。');return}
  if(n.switch&&this.level.goalKey&&!this.keys.has(this.level.goalKey)){this.fail('开关需要金色钥匙，先去钥匙星。');return}
  if(n.goal&&!this.goalReady()){this.fail(this.level.lockHint||'还需要先经过本关标出的中继，再进入终点。');return}
  this.lastCaptureMiss=miss;
  this.arrivalHeading=Math.atan2(this.ball.vy,this.ball.vx);
  this.arrivalTime=this.time;
  this.arrivalPoint={x:this.ball.x,y:this.ball.y};
  this.current=i;this.visited.add(i);
  if(i===this.level.goalDeadlineFrom&&this.goalClockStart===null)this.goalClockStart=this.time;
  this.flight=false;this.launchRemaining=n.launchSeconds??null;this.waitOnPlanet=0;
  const p=this.node(i);
  this.angle=Math.atan2(this.ball.y-p.y,this.ball.x-p.x);
  if(n.landingExits){
   const {split,upper,lower}=n.landingExits;
   const below=this.ball.y-p.y>=(n.r||38)*split;
   this.switches.delete(below?upper:lower);
   this.switches.add(below?lower:upper);
  }
  const perfect=miss<=Math.min(10,(n.r||38)*.24);
  this.combo=perfect?this.combo+1:0;this.perfects+=+perfect;this.score+=perfect?20+(this.combo-1)*5:10;
  this.messageFor(perfect?`PERFECT ×${this.combo}`:'捕获成功');
  if(n.key){this.keys.add(n.key);this.messageFor('获得钥匙 · 金色锁已解除')}
  if(n.switch){this.switches.add(n.switch);this.messageFor('开关已激活 · 蓝色闸门打开')}
  this.trail=[];
  if(!this.inTransit&&!this.twinFollower)this.settlePickups(i);
  if(n.goal)this.state='won';
 }
 step(dt){if(this.state!=='playing')return;this.time+=dt;if(this.goalRemaining!==null&&this.goalRemaining<=1e-9){this.fail('抵达时间已到');return}this.messageTime-=dt;this.reflectCooldown=Math.max(0,this.reflectCooldown-dt);this.portalCooldown=Math.max(0,this.portalCooldown-dt);if(!this.flight){this.waitOnPlanet+=dt;if(this.launchRemaining!==null){this.launchRemaining-=dt;if(this.launchRemaining<=0){this.launchRemaining=0;this.fail('起跳时间已到');return}}this.angle+=dt*(this.level.nodes[this.current].orbitRate||2)*(this.level.nodes[this.current].spin||1);this.ball=this.orbitPoint();return}this.travelTime+=dt;const old={x:this.ball.x,y:this.ball.y};
 for(const g of this.level.gravity||[]){const dx=g.x-this.ball.x,dy=g.y-this.ball.y,d=Math.hypot(dx,dy);if(d<g.range){this.gravityUsed=true;const force=g.force*(1-d/g.range);this.ball.vx+=dx/Math.max(d,1)*force*dt;this.ball.vy+=dy/Math.max(d,1)*force*dt;const v=Math.hypot(this.ball.vx,this.ball.vy);this.ball.vx=this.ball.vx/v*290;this.ball.vy=this.ball.vy/v*290}}
 for(const w of this.level.wind||[]){if(this.ball.x>=w.x&&this.ball.x<=w.x+w.w&&this.ball.y>=w.y&&this.ball.y<=w.y+w.h){this.ball.vx+=w.ax*dt;this.ball.vy+=w.ay*dt}}this.ball.x+=this.ball.vx*dt;this.ball.y+=this.ball.vy*dt;this.trail.push(old);if(this.trail.length>100)this.trail.shift();let nearest=null;const add=(event,t)=>{if(t!==null&&(!nearest||t<nearest.t))nearest={...event,t}};const source=this.node(this.current);if(Math.hypot(this.ball.x-source.x,this.ball.y-source.y)>this.radius()+10)this.leftSource=true;
 for(const wall of this.level.walls||[])if(this.wallSolid(wall))add({type:'obstacle'},Physics.wallHit(old,this.ball,wall));
 this.level.nodes.forEach((n,i)=>{if(this.consumed.has(i))return;if(n.window&&this.time%n.window.period>=n.window.open)return;if(i===this.current&&!this.leftSource)return;const p=this.node(i),prev=Physics.position(n,this.time-dt),a={x:old.x-prev.x,y:old.y-prev.y},b={x:this.ball.x-p.x,y:this.ball.y-p.y},dx=b.x-a.x,dy=b.y-a.y;add({type:'node',i,miss:Math.abs(a.x*dy-a.y*dx)/Math.max(.001,Math.hypot(dx,dy))},Physics.hit(a,b,{x:0,y:0},n.r||38))});
 for(const p of this.level.obstacles||[]){
  const now=Physics.position(p,this.time),prev=Physics.position(p,this.time-dt);
  const rx=p.r+6,stretch=rx/((p.ry??p.r)+6);
  const from={x:old.x-prev.x,y:(old.y-prev.y)*stretch};
  const to={x:this.ball.x-now.x,y:(this.ball.y-now.y)*stretch};
  add({type:'obstacle'},Physics.hit(from,to,{x:0,y:0},rx));
 }
 for(const g of this.level.gravity||[])add({type:'core'},Physics.hit(old,this.ball,g,g.r+6));
 for(const g of this.level.gates||[])if(!this.gateOpen(g))add({type:'gate'},Physics.hit(old,this.ball,g,g.r+6));
 
 if(this.reflectCooldown===0)for(const spec of this.level.reflectors||[]){
  const surface=Physics.reflector(spec,this.time);
  const from=spec.turn?Physics.rotate(old,surface.center,surface.angle-Physics.turnAngle(spec,this.time-dt)):old;
  add({type:'reflect',surface},Physics.segment(from,this.ball,surface.a,surface.b));
 }
 for(const sensor of this.level.flySwitches||[])if(!this.switches.has(sensor.switch)){
  add({type:'switch',id:sensor.switch},Physics.hit(old,this.ball,sensor,sensor.r));
 }
 if(this.portalCooldown===0)for(const p of this.level.portals||[])add({type:'portal',portal:p},Physics.hit(old,this.ball,p.entry,p.r));
 if(this.level.flightKey&&!this.keys.has('gold')){
  const key=this.level.flightKey,hit=Physics.hit(old,this.ball,key,key.r);
  if(hit!==null&&(!nearest||hit<=nearest.t))this.keys.add('gold');
 }
 const stop=nearest?{x:old.x+(this.ball.x-old.x)*nearest.t,y:old.y+(this.ball.y-old.y)*nearest.t}:this.ball;
 for(const [i,pickup] of (this.level.pickups||[]).entries()){
  if(this.collected.has(i)||(pickup.from!=null&&pickup.from!==this.current))continue;
  if(Physics.hit(old,stop,pickup,pickup.r||14)===null)continue;
  if(pickup.landOn!=null)this.pendingPickups.add(i);
  else{this.collected.add(i);this.score+=5;this.messageFor('星屑 +5')}
 }
 if(nearest){this.ball.x=stop.x;this.ball.y=stop.y;if(nearest.type==='node'){
  const node=this.level.nodes[nearest.i],arc=node.entryArc;
  if(arc){
   const hitTime=this.time-dt+dt*nearest.t,p=Physics.position(node,hitTime);
   const delta=Math.atan2(this.ball.y-p.y,this.ball.x-p.x)-Physics.entryAngle(arc,hitTime);
   if(Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))>arc.span/2){this.fail('未穿过缺口');return}
  }
  this.capture(nearest.i,nearest.miss);
 }else if(nearest.type==='switch'){this.switches.add(nearest.id)}else if(nearest.type==='reflect'){const p=nearest.surface,dx=p.b.x-p.a.x,dy=p.b.y-p.a.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,dot=this.ball.vx*nx+this.ball.vy*ny;this.ball.vx-=2*dot*nx;this.ball.vy-=2*dot*ny;const v=Math.hypot(this.ball.vx,this.ball.vy);this.ball.x+=this.ball.vx/v*1;this.ball.y+=this.ball.vy/v*1;this.reflectCooldown=.025;this.reflections++;}else if(nearest.type==='portal'){const p=nearest.portal,c=Math.cos(p.rotation),s=Math.sin(p.rotation),vx=this.ball.vx*c-this.ball.vy*s,vy=this.ball.vx*s+this.ball.vy*c;this.ball={x:p.exit.x+vx/290*(p.r+9),y:p.exit.y+vy/290*(p.r+9),vx,vy};this.portalCooldown=.3;this.portalUsed=true;this.portalEvents.push({index:this.level.portals.indexOf(p),x:this.ball.x,y:this.ball.y,angle:Math.atan2(vy,vx)});this.trail=[];this.messageFor('传送完成 · 航向旋转 90°')}else this.fail(nearest.type==='core'?'碰撞':nearest.type==='gate'?'尚未解锁':'碰撞');return}
 if(this.ball.x< -70||this.ball.x>this.flightRight||this.ball.y<70||this.ball.y>650||(this.level.flightTimeout!==false&&this.travelTime>6))this.fail('偏离轨道')}
}
OrbitGame.prototype.clone=function(){const copy=Object.assign(new OrbitGame(this.level),this);for(const k of ['visited','consumed','keys','switches','collected','pendingPickups'])copy[k]=new Set(this[k]);copy.ball={...this.ball};if(this.arrivalPoint)copy.arrivalPoint={...this.arrivalPoint};copy.portalEvents=this.portalEvents.map(e=>({...e}));if(this.twin)copy.twin=this.twin.clone();copy.trail=this.trail.map(p=>({...p}));return copy};
// Preview uses the exact collision, gravity and portal rules without changing the real run.
OrbitGame.prototype.preview=function(duration=.72){
 const points=[],portals=[],twinPoints=[];
 if(this.flight||this.inTransit||this.state==='dead')return {points,portals,twinPoints};
 const sim=this.clone();
 sim.state='playing';
 sim.action();
 points.push({...sim.ball});
 if(sim.twin)twinPoints.push({...sim.twin.ball});
 for(let frame=0;frame<duration*120&&(sim.flight||sim.inTransit)&&sim.state==='playing';frame++){
  const mainFlying=sim.flight,twinFlying=sim.twin?.flight,portalCount=sim.portalEvents.length;
  sim.step(1/120);
  if(sim.portalEvents.length>portalCount){
   points.push({break:true,...sim.ball});
   portals.push({...sim.portalEvents.at(-1)});
  }else if(mainFlying&&(frame%3===0||!sim.flight||sim.state==='dead'))points.push({...sim.ball});
  if(twinFlying&&(frame%3===0||!sim.twin.flight||sim.state==='dead'))twinPoints.push({...sim.twin.ball});
 }
 const pairedLanding=!!sim.twin&&!sim.inTransit&&sim.state!=='dead';
 const landingPoints=pairedLanding&&sim.current!==this.current
  ? [sim.arrivalPoint,sim.twin.arrivalPoint]
  : null;
 const landed=!sim.flight&&!sim.inTransit&&sim.state!=='dead'&&sim.current!==this.current;
 let openingSwitch;
 if(this.level.routeCue&&landed){
  openingSwitch=this.level.flySwitches?.find(sensor=>!this.switches.has(sensor.switch)&&sim.switches.has(sensor.switch))?.switch;
 }
 const exits=landed?this.level.nodes[sim.current].landingExits:null;
 const landingExit=exits?(sim.switches.has(exits.upper)?exits.upper:exits.lower):null;
 return {points,portals,twinPoints,pairedLanding,landingPoints,openingSwitch,landingExit,landingNode:landed?sim.current:null,landing:sim.state==='won',starLanding:sim.collected.size>this.collected.size};
};
// Both balls fly independently, then regroup at fixed chord distance before another launch.
const originalAction=OrbitGame.prototype.action,originalStep=OrbitGame.prototype.step;
OrbitGame.prototype.twinGap=function(){return this.level.twinDistance?2*Math.asin(Math.min(.8,this.level.twinDistance/(2*this.radius()))):this.level.twinOffset};
OrbitGame.prototype.action=function(){if(!this.level.twinOffset)return originalAction.call(this);if(this.state!=='playing'||this.flight||this.inTransit)return;
if(!this.twin){const l={...this.level};delete l.twinOffset;delete l.twinDistance;this.twin=new OrbitGame(l);this.twin.twinFollower=true}const t=this.twin;t.current=this.current;t.angle=this.angle+this.twinGap();t.time=this.time;t.state='playing';t.ball=t.orbitPoint();t.flight=false;t.goalClockStart=this.goalClockStart;t.keys=new Set(this.keys);t.switches=new Set(this.switches);t.visited=new Set(this.visited);t.used=this.used;this.firstArrived=false;this.inTransit=true;originalAction.call(t);originalAction.call(this)};
OrbitGame.prototype.step=function(dt){if(!this.level.twinOffset||!this.twin)return originalStep.call(this,dt);if(this.state!=='playing')return;const t=this.twin;
if(!this.inTransit){originalStep.call(this,dt);t.time=this.time;t.angle=this.angle+this.twinGap();t.ball=t.orbitPoint();return}
if(t.flight&&t.state==='playing')originalStep.call(t,dt);else{t.time+=dt;t.angle+=dt*(t.level.nodes[t.current].orbitRate||2)*(t.level.nodes[t.current].spin||1);t.ball=t.orbitPoint()}
if(this.flight)originalStep.call(this,dt);else{this.time+=dt;this.angle+=dt*(this.level.nodes[this.current].orbitRate||2)*(this.level.nodes[this.current].spin||1);this.ball=this.orbitPoint()}
for(const index of t.collected)this.collected.add(index);if(this.state==='dead'||t.state==='dead'){const failed=t.state==='dead'?t:this;
 const other=failed===this?t:this;
 const missedGoal=failed.reason==='偏离轨道'&&(other.state==='won'||(other===this&&this.firstArrived));
 this.fail(missedGoal?(failed===this?'白球未抵达终点':'蓝球未抵达终点'):failed.reason);
 this.failedBall=failed===this?'white':'blue';
 this.failurePoint={...failed.failurePoint};
 return}
if(this.state==='won'){this.firstArrived=true;this.state='playing'}
if(!this.flight&&!t.flight){if(this.current!==t.current){this.fail('双球未抵达同一星球');return}for(const index of t.pendingPickups)this.pendingPickups.add(index);this.settlePickups(this.current);t.pendingPickups.clear();this.inTransit=false;t.time=this.time;t.angle=this.angle+this.twinGap();t.ball=t.orbitPoint();if(this.level.nodes[this.current].goal){this.firstArrived=true;this.state='won'}}};
const exported={Physics,OrbitGame};if(typeof module!=='undefined'&&module.exports)module.exports=exported;else root.OrbitEngine=exported;
})(typeof globalThis!=='undefined'?globalThis:this);




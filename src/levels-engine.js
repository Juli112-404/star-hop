/* Deterministic simulation shared by the browser and route tests. */
(function(root){
const Physics={
 hit(a,b,p,r){const dx=b.x-a.x,dy=b.y-a.y,fx=a.x-p.x,fy=a.y-p.y,A=dx*dx+dy*dy,C=fx*fx+fy*fy-r*r;if(C<=0)return 0;if(A<1e-12)return null;const B=2*(fx*dx+fy*dy),D=B*B-4*A*C;if(D<0)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null},
 position(n,time){return{x:n.x+(n.move?.axis==='x'?Math.sin(time*n.move.rate)*n.move.amp:0),y:n.y+(n.move?.axis==='y'?Math.sin(time*n.move.rate)*n.move.amp:0)}}
};
class OrbitGame{
 constructor(level){this.level=level;this.time=0;this.current=0;this.angle=-Math.PI/2;this.state='playing';this.flight=false;this.used=0;this.score=0;this.combo=0;this.perfects=0;this.visited=new Set();this.consumed=new Set();this.keys=new Set();this.switches=new Set();this.gravityUsed=false;this.portalUsed=false;this.portalCooldown=0;this.travelTime=0;this.leftSource=false;this.ball=this.orbitPoint();this.message='';this.messageTime=0;this.trail=[]}
 node(i){return Physics.position(this.level.nodes[i],this.time)}
 orbitPoint(){const p=this.node(this.current);return{x:p.x+Math.cos(this.angle)*35,y:p.y+Math.sin(this.angle)*35}}
 messageFor(text){this.message=text;this.messageTime=1.4}
 fail(reason){this.state='dead';this.reason=reason}
 gateOpen(g){return (!g.key||this.keys.has(g.key))&&(!g.switch||this.switches.has(g.switch))}
 goalReady(){return (this.level.required||[]).every(i=>this.visited.has(i))&&(!this.level.needGravity||this.gravityUsed)&&(!this.level.needPortal||this.portalUsed)&&(!this.level.goalKey||this.keys.has(this.level.goalKey))&&(!this.level.goalSwitch||this.switches.has(this.level.goalSwitch))}
 action(){if(this.state!=='playing'||this.flight)return;this.used++;const n=this.level.nodes[this.current];if(n.fragile)this.consumed.add(this.current);const p=this.orbitPoint();this.ball={...p,vx:-Math.sin(this.angle)*290,vy:Math.cos(this.angle)*290};this.flight=true;this.leftSource=false;this.travelTime=0;this.trail=[]}
 capture(i,miss){const n=this.level.nodes[i];if(this.consumed.has(i)){this.fail('一次性星球已崩解，不能再返回。请选择另一条路线。');return}if(n.switch&&this.level.goalKey&&!this.keys.has(this.level.goalKey)){this.fail('开关需要金色钥匙，先去钥匙星。');return}if(n.goal&&!this.goalReady()){this.fail(this.level.lockHint||'还需要先经过本关标出的中继，再进入终点。');return}this.current=i;this.visited.add(i);this.flight=false;const p=this.node(i);this.angle=Math.atan2(this.ball.y-p.y, this.ball.x-p.x);const perfect=miss<=10;this.combo=perfect?this.combo+1:0;this.perfects+=+perfect;this.score+=perfect?20+(this.combo-1)*5:10;this.messageFor(perfect?`PERFECT ×${this.combo}`:'捕获成功');if(n.key){this.keys.add(n.key);this.messageFor('获得钥匙 · 金色锁已解除')}if(n.switch){this.switches.add(n.switch);this.messageFor('开关已激活 · 蓝色闸门打开')}this.trail=[];if(n.goal)this.state='won';else if(this.used>=this.level.budget)this.fail('发射次数用完了，还没到达终点。')}
 step(dt){if(this.state!=='playing')return;this.time+=dt;this.messageTime-=dt;this.portalCooldown=Math.max(0,this.portalCooldown-dt);if(!this.flight){this.angle+=dt*1.65;this.ball=this.orbitPoint();return}this.travelTime+=dt;const old={x:this.ball.x,y:this.ball.y};
 for(const g of this.level.gravity||[]){const dx=g.x-this.ball.x,dy=g.y-this.ball.y,d=Math.hypot(dx,dy);if(d<g.range){this.gravityUsed=true;const force=g.force*(1-d/g.range);this.ball.vx+=dx/Math.max(d,1)*force*dt;this.ball.vy+=dy/Math.max(d,1)*force*dt;const v=Math.hypot(this.ball.vx,this.ball.vy);this.ball.vx=this.ball.vx/v*290;this.ball.vy=this.ball.vy/v*290}}
 this.ball.x+=this.ball.vx*dt;this.ball.y+=this.ball.vy*dt;this.trail.push(old);if(this.trail.length>100)this.trail.shift();let nearest=null;const add=(event,t)=>{if(t!==null&&(!nearest||t<nearest.t))nearest={...event,t}};const source=this.node(this.current);if(Math.hypot(this.ball.x-source.x,this.ball.y-source.y)>48)this.leftSource=true;
 this.level.nodes.forEach((n,i)=>{if(i===this.current&&!this.leftSource)return;const p=this.node(i),prev=Physics.position(n,this.time-dt),a={x:old.x-prev.x,y:old.y-prev.y},b={x:this.ball.x-p.x,y:this.ball.y-p.y},dx=b.x-a.x,dy=b.y-a.y;add({type:'node',i,miss:Math.abs(a.x*dy-a.y*dx)/Math.max(.001,Math.hypot(dx,dy))},Physics.hit(a,b,{x:0,y:0},n.r||38))});
 for(const p of this.level.obstacles||[])add({type:'obstacle'},Physics.hit(old,this.ball,p,p.r+6));
 for(const g of this.level.gravity||[])add({type:'core'},Physics.hit(old,this.ball,g,g.r+6));
 for(const g of this.level.gates||[])if(!this.gateOpen(g))add({type:'gate'},Physics.hit(old,this.ball,g,g.r+6));
 if(this.portalCooldown===0)for(const p of this.level.portals||[])add({type:'portal',portal:p},Physics.hit(old,this.ball,p.entry,p.r));
 if(nearest){this.ball.x=old.x+(this.ball.x-old.x)*nearest.t;this.ball.y=old.y+(this.ball.y-old.y)*nearest.t;if(nearest.type==='node')this.capture(nearest.i,nearest.miss);else if(nearest.type==='portal'){const p=nearest.portal,c=Math.cos(p.rotation),s=Math.sin(p.rotation),vx=this.ball.vx*c-this.ball.vy*s,vy=this.ball.vx*s+this.ball.vy*c;this.ball={x:p.exit.x+vx/290*(p.r+9),y:p.exit.y+vy/290*(p.r+9),vx,vy};this.portalCooldown=.3;this.portalUsed=true;this.trail=[];this.messageFor('传送完成 · 航向旋转 90°')}else this.fail(nearest.type==='core'?'撞到了引力核心，要从它旁边掠过。':nearest.type==='gate'?'闸门还未打开，先捕获钥匙星和开关星。':'撞上了红色陨石，试试绕行。');return}
 if(this.ball.x< -70||this.ball.x>670||this.ball.y<70||this.ball.y>650||this.travelTime>6)this.fail('飞出了星图，调整角度再试一次。')}
}
const exported={Physics,OrbitGame};if(typeof module!=='undefined'&&module.exports)module.exports=exported;else root.OrbitEngine=exported;
})(typeof globalThis!=='undefined'?globalThis:this);


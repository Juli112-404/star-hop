const assert=require('node:assert/strict');
const {OrbitGame,Physics}=require('../src/levels-engine.js');
const levels=require('../src/review-data.js'),proofs=require('./star-proofs.json');
const get=n=>levels[n-1],dt=1/120;
function tick(game,count){
 for(let i=0;i<count&&game.state==='playing';i++)game.step(dt);
}
function fly(game,wait){
 tick(game,Math.round(wait/dt));
 game.action();
 for(let i=0;i<1100&&game.state==='playing'&&(game.flight||game.inTransit);i++)game.step(dt);
 return game;
}
function replay(level,number){
 const game=new OrbitGame(level);
 return proofs[number-1].route.map(({wait})=>fly(game,wait).clone());
}
for(const [n,turns] of [[11,2],[18,1.5],[26,2],[39,1.25]]){
 const level=get(n),relay=level.goalDeadlineFrom;
 assert(Math.abs(level.goalDeadline*(level.nodes[relay??0].orbitRate||2)/(2*Math.PI)-turns)<1e-9);
 for(const airborne of [false,true]){
  const game=new OrbitGame(level);
  if(relay!=null){
   tick(game,1200);
   assert.equal(game.state,'playing');
   assert.equal(game.goalRemaining,null);
   game.capture(relay,0);
   assert.equal(game.goalRemaining,level.goalDeadline);
   tick(game,40);
   const remaining=game.goalRemaining;
   game.capture(relay,0);
   assert.equal(game.goalRemaining,remaining,'returning to the relay cannot reset the clock');
  }
  game.time=game.goalClockStart+level.goalDeadline-dt;
  if(airborne)game.action();
  game.step(dt);
  assert.equal(game.reason,'抵达时间已到');
 }
}
for(const [n,relays] of [[31,[1,2]],[42,[1,2,4]]])for(const i of relays){
 const node=get(n).nodes[i];
 assert(Math.abs(node.launchSeconds*(node.orbitRate||2)-3*Math.PI)<1e-9);
 const game=new OrbitGame(get(n));game.capture(i,0);
 tick(game,Math.ceil(node.launchSeconds/dt)+1);
 assert.equal(game.reason,'起跳时间已到');
}
const level3Baseline=[62,56];
assert.equal(get(3).nodes.length,2);
for(const [i,n] of get(3).nodes.entries())assert(n.r**2/level3Baseline[i]**2<=.5);
for(const [n,i] of [[22,1],[28,1],[34,2]]){
 const p=get(n).nodes[i],a=Physics.position(p,0),b=Physics.position(p,1);
 assert.notEqual(a.x,b.x);
 if(n!==34)assert.notEqual(a.y,b.y);
}
const l29=structuredClone(get(29));
const searchDirect=new OrbitGame(l29);
for(let f=0;f<720;f++){
 assert.notEqual(fly(searchDirect.clone(),0).state,'won','29 must pass moving relay');
 searchDirect.step(dt);
}
assert.deepEqual(replay(get(32),32).map(g=>g.current),[1,2,3]);
const arc=new OrbitGame({nodes:[{x:100,y:260,r:40},{x:300,y:260,r:50,goal:true,entryArc:{angle:0,span:1}}]});
arc.flight=true;arc.ball={x:249,y:260,vx:290,vy:0};arc.step(dt);
assert.equal(arc.reason,'未穿过缺口');
const good=new OrbitGame({nodes:[{x:500,y:260,r:40},{x:300,y:260,r:50,goal:true,entryArc:{angle:0,span:1}}]});
good.flight=true;good.ball={x:351,y:260,vx:-290,vy:0};good.step(dt);
assert.equal(good.state,'won');
const stage43=replay(get(43),43);
assert.deepEqual(stage43.map(g=>g.current),[1,2,0,3]);
assert(stage43[1].consumed.has(1)&&stage43[2].keys.has('gold'));
assert.equal(stage43.at(-1).state,'won');
const stage23=new OrbitGame(get(23));
assert(!stage23.goalReady(),'the blue ring is still required');
stage23.switches.add('blue');
assert(stage23.goalReady(),'opening the gate allows the goal without a relay visit');
const stage45=new OrbitGame(get(45)),doors=stage45.level.walls.filter(w=>w.switch||w.closedWhen);
assert.deepEqual(doors.map(w=>stage45.wallSolid(w)),[true,true]);
const relay45=stage45.node(1);
stage45.ball={...relay45,y:relay45.y-30};
stage45.capture(1,0);
assert.deepEqual(doors.map(w=>stage45.wallSolid(w)),[false,true]);
stage45.ball={...relay45,y:relay45.y+30};
stage45.capture(1,0);
assert.deepEqual(doors.map(w=>stage45.wallSolid(w)),[true,false]);
const stage46=replay(get(46),46);
assert(stage46[0].reflections>0&&stage46.at(-1).switches.has('blue'));
const blocked46=structuredClone(get(46));
delete blocked46.flySwitches;delete blocked46.goalSwitch;
assert.equal(replay(blocked46,46).at(-1).state,'dead');
for(const n of [36,49]){
 const board=get(n).reflectors[0];
 assert.notDeepEqual(Physics.reflector(board,0),Physics.reflector(board,1));
}
console.log('PASS exact orbit deadlines, two-way motion, required routes, entry arcs, burnout, switching, sensor and rotating boards');
const old26={left:287,right:420,top:332,bottom:545},[obstacle]=get(26).obstacles;
assert.equal(get(26).obstacles.length,1);
assert.deepEqual({left:obstacle.x-obstacle.r,right:obstacle.x+obstacle.r,top:obstacle.y-obstacle.ry,bottom:obstacle.y+obstacle.ry},old26);
for(const n of [26,39]){
 const start=new OrbitGame(get(n));
 for(let f=0;f<520;f++){
  assert.notEqual(fly(start.clone(),0).state,'won',n+' must use relay');
  start.step(dt);
 }
}
for(const [n,without] of [[9,l=>{delete l.flySwitches;delete l.goalSwitch}],[18,l=>{delete l.reflectors}],[49,l=>{l.nodes.at(-1).entryArc.angle+=Math.PI}]]){
 const level=structuredClone(get(n));without(level);
 assert.notEqual(replay(level,n).at(-1).state,'won');
}
const altered41=replay(get(41),41);
assert(altered41[1].switches.has('blue')&&altered41.at(-1).state==='won');
const result50=replay(get(50),50).at(-1);
assert.equal(result50.state,'won');
assert(Math.abs(result50.arrivalTime-result50.twin.arrivalTime)>.1);
console.log('PASS original 26 obstacle bounds, no relay bypass, revised gates and level 50 staggered arrival');

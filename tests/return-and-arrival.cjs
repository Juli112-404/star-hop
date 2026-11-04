const assert=require('node:assert/strict'),{OrbitGame}=require('../src/levels-engine.js'),stages=require('../src/review-data.js');
function shot(w){const g=w.clone();g.action();for(let f=0;f<1400&&(g.flight||g.inTransit)&&g.state==='playing';f++)g.step(1/120);return g}
function options(g,target){const w=g.clone(),out=[];for(let f=0;f<400;f++){const q=shot(w);if(q.current===target&&q.state!=='dead'&&!q.inTransit)out.push(q);w.step(1/120)}return out}
assert(!stages[40].walls.some(w=>w.a.x===330&&w.b.x===330));
assert.equal(stages[41].nodes.filter(n=>n.launchSeconds).length,3);for(const i of [1,2,4]){const g=new OrbitGame(stages[41]);g.capture(i,0);assert(Math.abs(g.launchRemaining-1.5*Math.PI)<1e-9);for(let f=0;f<Math.ceil(g.level.nodes[i].launchSeconds*120)+1;f++)g.step(1/120);assert.equal(g.state,'dead');assert.equal(g.reason,'起跳时间已到')}
// Leaving the first relay burns it, so return from the key planet directly to the hub.
const proofs=require('./star-proofs.json');
let g=new OrbitGame(stages[42]);
for(const {wait,target} of proofs[42].route){
 for(let f=0;f<Math.round(wait*120);f++)g.step(1/120);
 g=shot(g);assert.equal(g.current,target);
 if(target===2){
  assert(g.keys.has('gold')&&g.consumed.has(1));
  assert.equal(options(g,3).length,0,'key cannot jump directly to finish');
  assert.equal(options(g,1).length,0,'burned relay cannot be reused');
 }
}
assert.equal(g.state,'won');assert(!stages[42].portals);
assert(!stages[48].portals&&stages[48].reflectors.length);g=new OrbitGame(stages[48]);for(const d of [1,0,2]){const opts=options(g,d);assert(opts.length);g=opts[Math.floor(opts.length/2)]}assert.equal(g.state,'won');assert(g.reflections>0,'backtracking route uses board');assert.equal(stages[49].obstacles.length,0);
// Demonstrate a genuine winning shot with arrivals at distinct times.
const w=new OrbitGame(stages[49]);w.current=2;w.used=2;w.angle=0;w.ball=w.orbitPoint();let maxGap=0;for(let f=0;f<550;f++){const q=shot(w);if(q.state==='won')maxGap=Math.max(maxGap,Math.abs(q.arrivalTime-q.twin.arrivalTime));w.step(1/120)}assert(maxGap>.02,'different arrival times must be accepted');
g=new OrbitGame({nodes:[{x:100,y:100,r:20},{x:500,y:500,r:20,goal:true}],budget:3,flightTimeout:false});g.flight=true;g.leftSource=true;g.ball={x:300,y:300,vx:0,vy:1};for(let f=0;f<7*120;f++)g.step(1/120);assert.equal(g.state,'playing','safe flight has no arbitrary 6-second deadline');
console.log('PASS redundant wall removed, three 1.5-orbit timers, burned relay and direct return, reflection return route, asynchronous twin arrivals gap',maxGap.toFixed(3)+'s');

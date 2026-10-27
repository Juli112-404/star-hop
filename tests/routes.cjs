const assert=require('node:assert/strict');
const {OrbitGame,Physics}=require('../src/levels-engine.js');
const levels=require('../src/levels-data.js');
function clone(g){const copy=Object.assign(new OrbitGame(g.level),g);for(const k of ['visited','consumed','keys','switches'])copy[k]=new Set(g[k]);copy.ball={...g.ball};copy.trail=[];return copy}
function shot(g,a){const q=clone(g);q.angle=a;q.action();for(let f=0;f<721&&q.flight&&q.state==='playing';f++)q.step(1/120);return q}
function find(g,dest){let successes=[];for(let a=-Math.PI;a<Math.PI;a+=.005){const q=shot(g,a);if(q.current===dest&&['playing','won'].includes(q.state))successes.push({a,q})}assert.ok(successes.length,`${g.level.name} destination ${dest} reachable`);const chosen=successes[Math.floor(successes.length/2)];console.log('  target',dest,'successful angles',successes.length,'sample',chosen.a.toFixed(3));return chosen.q}
const routes=[[1],[1,2,3],[1,2],[1,2],[1,2],[1],[1],[2,1,3],[1,2,3]];
for(let i=0;i<levels.length;i++){let g=new OrbitGame(levels[i]);console.log(levels[i].name);for(const target of routes[i])g=find(g,target);assert.equal(g.state,'won');assert.ok(g.used<=levels[i].budget);if(i===5)assert.ok(g.gravityUsed);if(i===6)assert.ok(g.portalUsed);if(i===7)assert.ok(g.consumed.has(1));if(i===8){assert.ok(g.keys.has('gold'));assert.ok(g.switches.has('blue'));assert.ok(g.gateOpen(g.level.gates[0]))}}
// Incomplete objectives cannot be bypassed, even by hitting the goal directly.
for(const i of [5,6,7,8]){const g=new OrbitGame(levels[i]);g.capture(g.level.nodes.length-1,0);assert.equal(g.state,'dead')}
let g=new OrbitGame(levels[7]);g=find(g,1);g=find(g,2);let returned=false;for(let a=-Math.PI;a<Math.PI;a+=.01){const q=shot(g,a);if(q.reason?.includes('崩解')){returned=true;break}}assert.ok(returned,'returning to consumed planet fails through real collision');
g=new OrbitGame(levels[8]);assert.equal(g.gateOpen(g.level.gates[0]),false);g.keys.add('gold');assert.equal(g.gateOpen(g.level.gates[0]),false);g.switches.add('blue');assert.equal(g.gateOpen(g.level.gates[0]),true);
assert.equal(Physics.hit({x:0,y:0},{x:100,y:0},{x:50,y:0},5),.45);
// Wrong order really creates a dead end; the gate cannot be bypassed by shooting at the goal.
g=new OrbitGame(levels[7]);g=find(g,1);g=find(g,2);for(let a=-Math.PI;a<Math.PI;a+=.01)assert.notEqual(shot(g,a).state,'won','wrong order must not have a direct goal route');
const noGravity=structuredClone(levels[5]);noGravity.gravity[0].force=0;let unassisted=0;for(let a=-Math.PI;a<Math.PI;a+=.01){const q=new OrbitGame(noGravity);if(shot(q,a).state==='won')unassisted++}assert.equal(unassisted,0,'gravity stage requires curved flight, not just touching a field');
console.log('PASS all 9 routes, objective locks, consumed planet return, gate conditions and swept collision.');



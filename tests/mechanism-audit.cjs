const assert=require('node:assert/strict'),{OrbitGame}=require('../src/levels-engine.js'),stages=require('../src/review-data.js').map((stage,i)=>({...stage,starProof:require('./star-proofs.json')[i]}));
function shot(g){const q=g.clone();q.action();let startAngle=Math.atan2(q.ball.vy,q.ball.vx);for(let k=0;k<1100&&(q.flight||q.inTransit)&&q.state==='playing';k++)q.step(1/120);return{g:q,deflection:Math.abs(Math.atan2(Math.sin(q.arrivalHeading-startAngle),Math.cos(q.arrivalHeading-startAngle)))}}
function options(g,target,horizon=4.6){const out=[],w=g.clone();let run=0,best=0;for(let f=0;f<horizon*120&&w.state==='playing';f++){const q=shot(w);if(q.g.state!=='dead'&&q.g.current===target&&!q.g.inTransit){out.push({wait:f/120,...q});run++;best=Math.max(best,run)}else run=0;w.step(1/120)}return{out,best:best/120}}
// 37: the approach orbit must be outside the central obstacle; broad portal window.
let g=new OrbitGame(stages[36]);g=options(g,1).out[Math.floor(options(g,1).out.length/2)].g;const p=options(g,2);assert(p.best>=.18);assert(p.out.every(s=>s.g.portalEvents.some(e=>e.index===0)));const noPortal={...stages[36],portals:[]};let g0=new OrbitGame(noPortal);g0.current=g.current;g0.angle=g.angle;g0.ball=g0.orbitPoint();assert.equal(options(g0,2).out.length,0);console.log('PASS 37 portal window',p.best.toFixed(3));
// 42: decorative fields removed. 45: harder targets and wider travel.
assert.equal(stages[41].gravity.length,0);assert(stages[44].nodes[1].r<70&&stages[44].nodes[1].move.amp>=60);
// 44: the wind visibly bends winning paths through both zones.
const windy=stages[43];g=new OrbitGame(windy);
for(const [i,{wait,target}] of windy.starProof.route.entries()){
 for(let f=0;f<Math.round(wait*120);f++)g.step(1/120);
 const transfer=shot(g);assert.equal(transfer.g.current,target);
 if(i===0||i===2)assert(transfer.deflection>=Math.PI/15);
 g=transfer.g;
}
assert.equal(g.state,'won');
// 46: the reflector and remaining upper relay is required by the layout itself.
assert.equal(stages[45].nodes.length,4);
assert(!stages[45].goalKey&&!stages[45].nodes.some(n=>n.key));
g=new OrbitGame(stages[45]);let first=options(g,1);assert(first.out.length&&first.out.every(s=>s.g.reflections>=1));assert.equal(options(new OrbitGame({...stages[45],reflectors:[]}),1).out.length,0);g=first.out[Math.floor(first.out.length/2)].g;assert.equal(options(g,3).out.length,0,'remaining upper relay cannot be bypassed');let middle=options(g,2);assert(middle.out.length);g=middle.out[Math.floor(middle.out.length/2)].g;assert(options(g,3).best>=.075);console.log('PASS 46 reflection required and upper relay cannot be bypassed');
// 47: moving obstacles + reverse spin, no gravity decoration.
assert(!stages[46].gravity);assert(stages[46].obstacles.filter(o=>o.move).length===2);
// 48: arrival starts a real departure timer; flight and pause do not drain it.
assert(!stages[47].nodes[4].window);g=new OrbitGame(stages[47]);g.capture(1,0);assert.equal(g.launchRemaining,4.5);g.state='paused';g.step(10);assert.equal(g.launchRemaining,4.5);g.state='playing';for(let i=0;i<541;i++)g.step(1/120);assert.equal(g.state,'dead');assert.equal(g.reason,'起跳时间已到');
// 49: upper-left vertical wall has been removed.
assert(!stages[48].portals&&stages[48].reflectors.length===1);
// 50: both successful trajectories enter the field, turn visibly, and most fail without it.
const l=stages[49];g=new OrbitGame(l);g.current=2;g.used=2;g.angle=0;g.ball=g.orbitPoint();const last=options(g,3,4.6);assert(last.best>=.04&&last.best<.125);let changed=0,minTurn=Infinity,maxTurn=0;for(const s of last.out){assert(s.g.gravityUsed&&s.g.twin.gravityUsed);minTurn=Math.min(minTurn,s.deflection);maxTurn=Math.max(maxTurn,s.deflection);const empty=new OrbitGame({...l,gravity:[]});empty.current=2;empty.used=2;empty.angle=0;empty.ball=empty.orbitPoint();for(let f=0;f<Math.round(s.wait*120);f++)empty.step(1/120);if(shot(empty).g.state!=='won')changed++}assert(changed/last.out.length>=.5);assert(maxTurn>.5);console.log('PASS 50 field effect: window',last.best.toFixed(3),'turn degrees',Math.round(minTurn*180/Math.PI),Math.round(maxTurn*180/Math.PI),'same-angle failures without field',changed+'/'+last.out.length);




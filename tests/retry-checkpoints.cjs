const assert=require('node:assert/strict'),{OrbitGame}=require('../src/levels-engine.js'),Checkpoint=require('../src/checkpoints.js'),stages=require('../src/review-data.js').map((stage,i)=>({...stage,starProof:require('./star-proofs.json')[i]}));
assert.deepEqual(stages.flatMap((level,i)=>level.checkpointEnabled?[i+1]:[]),[34,42,43,44,48]);
let g=new OrbitGame(stages[42]),session=new Checkpoint(true);g.used=2;g.capture(2,0);assert(session.capture(g,false));g.action();g.collected.add(0);g.fail('碰撞');let restored=session.restore(g);assert.equal(restored.game.current,2);assert(restored.game.keys.has('gold'));assert.equal(restored.game.used,2);assert.equal(restored.game.state,'playing');assert(restored.game.collected.has(0));assert(restored.credited,'banked star remains consumed');assert(!restored.game.failurePoint);restored.game.keys.clear();assert(session.restore(g).game.keys.has('gold'),'restoring cannot mutate snapshot');
g=restored.game;g.used=3;g.capture(1,0);session.capture(g,true);g.used=4;g.capture(0,0);session.capture(g,true);g.action();g.fail('偏离轨道');assert.equal(session.restore(g).game.current,0,'returning to a previous planet updates the latest checkpoint');
g=new OrbitGame(stages[41]);g.used=1;g.capture(1,0);session=new Checkpoint(true);session.capture(g,false);for(let i=0;i<1021;i++)g.step(1/120);assert.equal(g.state,'dead');restored=session.restore(g);assert.equal(restored.game.launchRemaining,8.5);assert.equal(restored.game.current,1);
// Replay the real route, choosing a valid launch after two full orbits on every timed relay.
function fly(source){
 const shot=source.clone();shot.action();
 for(let frame=0;frame<900&&shot.flight&&shot.state==='playing';frame++)shot.step(1/120);
 return shot;
}
g=new OrbitGame(stages[41]);
for(const {wait,target} of g.level.starProof.route){
 if(g.launchRemaining===null){
  for(let f=0;f<Math.round(wait*120);f++)g.step(1/120);
  g=fly(g);
 }else{
  for(let f=0;f<Math.ceil(2*Math.PI*120);f++)g.step(1/120);
  assert(g.launchRemaining>2.2);
  let landing;
  while(g.state==='playing'){
   const shot=fly(g);
   if(shot.current===target&&shot.state!=='dead'){landing=shot;break;}
   g.step(1/120);
  }
  assert(landing,'can still launch successfully after two full orbits');
  g=landing;
 }
 assert.equal(g.current,target);
}
assert.equal(g.state,'won');
// Never save a half-finished double-ball transfer.
g=new OrbitGame(stages[49]);g.used=1;g.flight=false;g.inTransit=true;session=new Checkpoint(true);assert(!session.capture(g,false));g.inTransit=false;g.current=1;g.ball=g.orbitPoint();g.action();const t=g.twin;t.current=1;t.flight=false;g.current=1;g.flight=false;g.inTransit=false;session.capture(g,false);g.fail('碰撞');restored=session.restore(g);assert(!restored.game.flight&&!restored.game.inTransit&&!restored.game.twin.flight);assert.equal(restored.game.current,restored.game.twin.current);
assert.equal(new Checkpoint(false).capture(g,false),false);
const locked=new OrbitGame(stages[48]);locked.capture(2,0);assert.equal(locked.state,'dead');assert.equal(locked.reason,'先取得钥匙');assert(stages[48].nodes.length===3);assert(stages[48].reflectors[0].a.y!==stages[48].reflectors[0].b.y,'board is tilted');
console.log('PASS all long-route flags, last stable retry, retained key/star, return checkpoints, fresh timer, two-orbit launch, twin synchronization and locked finish.');


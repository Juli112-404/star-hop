const assert=require('node:assert/strict'),{OrbitGame}=require('../src/levels-engine.js'),Checkpoint=require('../src/checkpoints.js'),stages=require('../src/review-data.js').map((stage,i)=>({...stage,starProof:require('./star-proofs.json')[i]}));
assert.deepEqual(stages.flatMap((level,i)=>level.checkpointEnabled?[i+1]:[]),[34,41,42,43,44,48]);
let g=new OrbitGame(stages[42]),session=new Checkpoint(true);g.used=2;g.capture(2,0);assert(session.capture(g,false));g.action();g.collected.add(0);g.fail('碰撞');let restored=session.restore(g);assert.equal(restored.game.current,2);assert(restored.game.keys.has('gold'));assert.equal(restored.game.used,2);assert.equal(restored.game.state,'playing');assert(restored.game.collected.has(0));assert(restored.credited,'banked star remains consumed');assert(!restored.game.failurePoint);restored.game.keys.clear();assert(session.restore(g).game.keys.has('gold'),'restoring cannot mutate snapshot');
g=restored.game;g.used=3;g.capture(0,0);session.capture(g,true);g.action();g.fail('偏离轨道');assert.equal(session.restore(g).game.current,0,'returning to a previous planet updates the latest checkpoint');
g=new OrbitGame(stages[41]);g.used=1;g.capture(1,0);session=new Checkpoint(true);session.capture(g,false);const deadline=g.level.nodes[1].launchSeconds;assert(Math.abs(deadline-1.5*Math.PI)<1e-9);for(let i=0;i<=Math.ceil(deadline*120);i++)g.step(1/120);assert.equal(g.state,'dead');restored=session.restore(g);assert.equal(restored.game.launchRemaining,deadline);assert.equal(restored.game.current,1);
// Replay the known 42 route and launch before each timed relay expires.
g=new OrbitGame(stages[41]);
for(const {wait,target} of g.level.starProof.route){
 if(g.launchRemaining!==null)assert(wait<g.launchRemaining);
 for(let frame=0;frame<Math.round(wait*120);frame++)g.step(1/120);
 g.action();
 for(let frame=0;frame<900&&g.flight&&g.state==='playing';frame++)g.step(1/120);
 assert.equal(g.current,target);
}
assert.equal(g.state,'won');
// Never save a half-finished double-ball transfer.
g=new OrbitGame(stages[49]);g.used=1;g.flight=false;g.inTransit=true;session=new Checkpoint(true);assert(!session.capture(g,false));g.inTransit=false;g.current=1;g.ball=g.orbitPoint();g.action();const t=g.twin;t.current=1;t.flight=false;g.current=1;g.flight=false;g.inTransit=false;session.capture(g,false);g.fail('碰撞');restored=session.restore(g);assert(!restored.game.flight&&!restored.game.inTransit&&!restored.game.twin.flight);assert.equal(restored.game.current,restored.game.twin.current);
assert.equal(new Checkpoint(false).capture(g,false),false);
const locked=new OrbitGame(stages[48]);locked.capture(2,0);assert.equal(locked.state,'dead');assert.equal(locked.reason,'先取得钥匙');assert(stages[48].nodes.length===3);assert(stages[48].reflectors[0].a.y!==stages[48].reflectors[0].b.y,'board is tilted');
console.log('PASS all long-route flags, last stable retry, retained key/star, return checkpoints, fresh timer, launch before timeout, twin synchronization and locked finish.');


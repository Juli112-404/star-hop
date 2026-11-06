const assert=require('node:assert/strict');
const {OrbitGame}=require('../src/levels-engine.js');
const pickup={x:210,y:300,r:12,from:0,landOn:1};
const nodes=[
 {x:100,y:380,r:30},
 {x:330,y:300,r:25,goal:true},
 {x:260,y:300,r:25}
];
const dt=1/120;
function shot(opts={},source=0){
 const game=new OrbitGame({nodes:nodes.slice(0,2),pickups:[pickup],...opts});
 game.current=source;game.flight=true;game.leftSource=true;
 game.ball={x:198,y:300,vx:290,vy:0};
 game.step(dt);
 return game;
}
function finish(game){
 for(let i=0;i<140&&game.flight&&game.state==='playing';i++)game.step(dt);
 return game;
}
const safe=shot();
assert(safe.pendingPickups.has(0));
assert.equal(safe.collected.size,0);
assert.equal(safe.clone().pendingPickups.size,1);
assert.equal(finish(safe).state,'won');
assert(safe.collected.has(0));
const wrong=finish(shot({nodes}));
assert.equal(wrong.current,2);
assert.equal(wrong.collected.size,0);
assert.equal(wrong.pendingPickups.size,0);
const other=finish(shot({nodes:[...nodes.slice(0,2),{x:100,y:420,r:30}]},2));
assert.equal(other.state,'won');
assert.equal(other.collected.size,0);
const failed=finish(shot({walls:[{a:{x:270,y:220},b:{x:270,y:380}}]}));
assert.equal(failed.state,'dead');
assert.equal(failed.collected.size,0);
const ordinary=shot({pickups:[{x:210,y:300,r:12}]});
assert(ordinary.collected.has(0),'an endless pickup remains immediate');
console.log('PASS pickups require the marked start and a successful matching landing; collisions and alternate routes earn nothing');
const allStages=require('../src/review-data.js'),proofs=require('./star-proofs.json');
const twinStage=allStages[29];
const pair=new OrbitGame({...twinStage,pickups:[twinStage.starSpot]});
for(let f=0;f<Math.round(proofs[29].route[0].wait/dt);f++)pair.step(dt);
pair.action();
while(pair.state==='playing'&&pair.inTransit&&!pair.pendingPickups.has(0)&&!pair.twin.pendingPickups.has(0))pair.step(dt);
assert(pair.inTransit,'the star is touched before the pair lands');
assert.equal(pair.collected.size,0);
const safePair=pair.clone();
for(let f=0;f<500&&safePair.inTransit&&safePair.state==='playing';f++)safePair.step(dt);
assert.equal(safePair.current,twinStage.starSpot.landOn);
assert(safePair.collected.has(0));
const falling=pair.twin.flight?pair.twin:pair;
falling.ball={x:679,y:600,vx:290,vy:0};
pair.step(dt);
assert.equal(pair.state,'dead');
assert.equal(pair.collected.size,0);
console.log('PASS dual-ball reward waits for both balls and is discarded on either failure');

const assert=require('node:assert/strict');
const {OrbitGame}=require('../src/levels-engine');
const Economy=require('../src/economy');
const {EndlessRun,patterns,familyOf,difficulty,build,findShot,simulate}=require('../src/endless');
const dt=1/120;
for(const p of patterns){
  for(let tier=Math.floor(p.unlock/5);tier<=10;tier++)for(const mirror of [false,true]){
    const hops=Math.max(p.unlock,tier*5);
    const l=build(p,hops,difficulty(Math.max(0,hops-1)).radius,mirror);
    const game=new OrbitGame(l),ready=findShot(game);
    assert(ready,p.id+' tier '+tier+(mirror?' mirrored':''));
    const {shot}=simulate(ready);
    assert.equal(shot.state,'won');
    assert.equal(shot.used,1);
    assert(ready.preview(3.5).landing,p.id+' preview matches landing');
    if(l.nodes[0].launchSeconds)assert(ready.time>=4*Math.PI/l.nodes[0].orbitRate&&ready.launchRemaining>0);
    if(l.portals)assert(shot.portalUsed);
    if(l.reflectors)assert(shot.reflections>0);
    if(l.flightKey)assert(shot.keys.has('gold'));
    if(l.twinOffset)assert.equal(shot.twin.state,'won');
  }
}
assert(new EndlessRun(()=>.199999).next().level.pickups.length===1);
assert.equal(new EndlessRun(()=>.2).next().level.pickups,undefined);
assert.deepEqual([3,5,10].map(hops=>difficulty(hops).radius),[64,62,60]);
assert.equal(difficulty(500).radius,42);
function seeded(seed){
  let state=seed;
  return ()=>((state=Math.imul(state,1664525)+1013904223|0)>>>0)/2**32;
}
const radiusOrders=new Set(),mechanicOrders=new Set(),fourthTypes=new Set(),sides=new Set();
for(let seed=1;seed<=24;seed++){
  const sample=new EndlessRun(seeded(Math.imul(seed,0x9e3779b9)));
  sample.next();
  const radii=[],types=[];
  for(let hop=0;hop<6;hop++){
    const {game}=sample;
    if(hop<3){
      assert.equal(game.level.pattern,'direct');
      const [a,b]=game.level.nodes;
      radii.push(b.r);
      sides.add(Math.sign(b.x-a.x));
    }else{
      assert.notEqual(game.level.pattern,'direct','mechanics must start on the fourth jump');
      const pattern=patterns.find(p=>p.id===game.level.pattern);
      assert(pattern.unlock<=hop);
      types.push(familyOf(pattern));
    }
    const ready=findShot(game);
    assert(ready,'every sampled segment is playable');
    sample.game=simulate(ready).shot;
    assert(sample.advance());
  }
  const bands=radii.map(r=>r>=87?'L':r>=63?'M':'S');
  assert.deepEqual([...bands].sort(),['L','M','S']);
  const sorted=[...radii].sort((a,b)=>a-b);
  assert(sorted[1]-sorted[0]>=14&&sorted[2]-sorted[1]>=18);
  assert.equal(new Set(types).size,3);
  radiusOrders.add(bands.join(''));
  mechanicOrders.add(types.join('/'));
  fourthTypes.add(types[0]);
}
assert.equal(radiusOrders.size,6);
assert(sides.has(-1)&&sides.has(1));
assert(fourthTypes.size>=3&&mechanicOrders.size>=10);
console.log('PASS 24 shuffled openings:',radiusOrders.size,'size orders,',fourthTypes.size,'fourth-jump mechanics,',mechanicOrders.size,'mechanic sequences');
const wallet=new Economy({balance:10});
const run=new EndlessRun(seeded(2459));
run.next();
let previous,stars=0;
const kinds=new Set();
for(let i=0;i<100;i++){
  const game=run.game;
  kinds.add(game.level.pattern);
  if(i<3){
    assert.equal(game.level.pattern,'direct');
  }
  if(game.level.pattern!=='direct')assert.notEqual(run.lastFamily,previous);
  previous=run.lastFamily;
  const ready=findShot(game),result=simulate(ready).shot;
  run.game=result;
  assert.equal(run.score,i*10);
  if(game.level.pickups){
    assert(result.collected.has(0),'generated star is collectable on a winning shot');
    assert(run.collect());wallet.balance++;stars++;
    assert(!run.collect());
  }
  const landed=run.toWorld(result.node(result.current));
  assert(run.advance());
  const source=run.toWorld(run.game.node(0));
  assert(Math.hypot(source.x-landed.x,source.y-landed.y)<1e-9);
  assert.equal(run.game.angle,result.angle);
  assert.equal(run.score,(i+1)*10);
}
assert(new Set(patterns.filter(p=>kinds.has(p.id)).map(familyOf)).size>=14,'one run should cover most unlocked families');
const failed=new EndlessRun(()=>0);
const game=failed.next();
failed.hops=8;
game.collected.add(0);
assert(failed.collect());
game.fail('碰撞');
const empty=new Economy({balance:9});
assert(!failed.revive(empty));
assert.equal(empty.balance,9);
assert(failed.revive(wallet));
assert.equal(wallet.balance,stars);
assert.equal(failed.score,80);
assert.equal(failed.game.level,game.level);
assert.equal(failed.game.current,0);
assert(!failed.game.flight);
assert(failed.game.collected.has(0));
assert(!failed.collect());
assert(!failed.revive(wallet));
console.log('PASS',patterns.length,'families at every available tier and orientation; 100 continuous hops, 20% boundary, collectible paths, fixed scoring, timer and revival');

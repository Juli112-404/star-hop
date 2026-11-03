const assert=require('node:assert/strict');
const {OrbitGame}=require('../src/levels-engine');
const levels=require('../src/review-data');
const proofs=require('./campaign-review-proofs.json');
const dt=1/120;
function fly(game){
  game.action();
  for(let i=0;i<1000&&(game.flight||game.inTransit)&&game.state==='playing';i++)game.step(dt);
  return game;
}
for(const [number,proof] of Object.entries(proofs)){
  const level=levels[number-1],game=new OrbitGame({...level,pickups:[level.starSpot]});
  for(const [index,{wait,target}] of proof.route.entries()){
    for(let f=0;f<Math.round(wait/dt);f++)game.step(dt);
    fly(game);
    assert.notEqual(game.state,'dead',level.name);
    assert.equal(game.current,target,level.name);
    if(index===0)assert(game.collected.has(0),level.name);
  }
  assert.equal(game.state,'won',level.name);
}
for(const number of [18,24]){
  const level=levels[number-1],deadline=level.goalDeadline;
  for(const airborne of [false,true]){
    const game=new OrbitGame(level);
    game.time=deadline-dt;
    if(airborne)game.action();
    game.step(dt);
    assert.equal(game.state,'dead');
    assert.equal(game.reason,'抵达时间已到');
  }
  const paused=new OrbitGame(level);paused.state='paused';paused.step(deadline*2);
  assert.equal(paused.time,0);
  assert(!level.nodes[1].window);
}
for(const [number,minHops] of [[12,2],[13,2],[26,2],[27,3],[29,2],[30,2],[32,3],[33,3],[35,2],[36,2],[39,2],[40,2]]){
  const level=levels[number-1];
  let states=[new OrbitGame(level)];
  for(let hop=1;hop<minHops;hop++){
    const next=[];
    for(const game of states){
      const paths=new Map();
      for(let frame=0;frame<720&&game.state==='playing';frame++){
        if(frame%2===0){
          const shot=fly(game.clone());
          assert.notEqual(shot.state,'won',level.name+' shortcut');
          if(shot.state==='playing'&&!shot.inTransit&&shot.current!==game.current){
            if(!paths.has(shot.current))paths.set(shot.current,[]);
            paths.get(shot.current).push(shot);
          }
        }
        game.step(dt);
      }
      for(const group of paths.values())next.push(group[0],group[Math.floor(group.length/2)],group.at(-1));
    }
    states=next;
  }
}
console.log('PASS updated campaign routes, stars, hard deadlines and sampled minimum hop counts');

const roundTrip=new OrbitGame({...levels[1],budget:5});
let shots=roundTrip;
for(let hop=0;hop<8;hop++){
 const wanted=hop%2===0?1:0;
 let landing;
 for(let frame=0;frame<430;frame++){
  const shot=fly(shots.clone());
  if(shot.state==='playing'&&shot.current===wanted){landing=shot;break}
  shots.step(dt);
 }
 assert(landing,'repeat launch and land safely');
 shots=landing;
}
assert.equal(shots.used,8);
assert.equal(shots.state,'playing');
console.log('PASS a campaign route can land safely more than five times');

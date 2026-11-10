const assert=require('node:assert/strict');
const {OrbitGame}=require('../src/levels-engine');
const levels=require('../src/review-data');
const routes=require('./campaign-review-proofs.json');
const proofs=require('./star-proofs.json');
const dt=1/120;
function fly(game){
  game.action();
  for(let i=0;i<1000&&(game.flight||game.inTransit)&&game.state==='playing';i++)game.step(dt);
  return game;
}
function follow(level,route,verifyExit=false){
  const game=new OrbitGame(level);
  for(const {wait,target,exit} of route){
    for(let f=0;f<Math.round(wait/dt);f++)game.step(dt);
    if(verifyExit&&exit){
      const before=[...game.switches];
      assert.equal(game.preview(level.previewSeconds).landingExit,exit);
      assert.deepEqual([...game.switches],before);
    }
    fly(game);
    if(verifyExit&&exit){
      const {upper,lower}=level.nodes[target].landingExits;
      assert.deepEqual([upper,lower].filter(key=>game.switches.has(key)),[exit]);
    }
    if(game.current!==target||game.state==='dead'||game.flight||game.inTransit)return false;
  }
  return game.state==='won';
}
for(const [number,options] of Object.entries(routes)){
  const level=levels[number-1];
  for(const option of options)assert(follow(level,option,true),level.name+' branch reaches the goal');
}
for(const number of [12,24,33,48]){
  const level=levels[number-1],route=proofs[number-1].route;
  assert(follow(level,route),level.name);
  const walls=level.walls.map(w=>w.cycle?{...w,cycle:undefined}:w);
  assert(!follow({...level,walls},route),level.name+' must use the timed gate');
}
assert(!follow({...levels[30],wind:[]},routes[31][1]),'lower exit needs the wind');
assert(!follow({...levels[35],reflectors:levels[35].reflectors.slice(0,1)},proofs[35].route),'stage 36 uses both boards');
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
for(const [number,minHops] of [[5,2],[12,2],[13,2],[16,2],[20,2],[21,2],[22,2],[26,2],[27,2],[29,2],[30,2],[32,3],[33,3],[35,2],[36,2],[39,2],[40,2]]){
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
console.log('PASS alternate routes, landing exits, required gates, hard deadlines and sampled minimum hop counts');

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

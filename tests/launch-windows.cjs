const assert=require('node:assert/strict');
const {OrbitGame}=require('../src/levels-engine.js');
const levels=require('../src/review-data.js');
const proofs=require('./star-proofs.json');
const dt=1/120;

function readyAfter(game,ticks){
  const next=game.clone();
  for(let i=0;i<ticks;i++)next.step(dt);
  return next;
}
function flight(game){
  game.action();
  for(let i=0;i<1100&&(game.flight||game.inTransit)&&game.state==='playing';i++)game.step(dt);
  return game;
}

for(const number of [31,33,34,35,36,37,38,39]){
  const level=levels[number-1];
  let game=new OrbitGame(level);
  const widths=[];
  for(const {wait,target,exit,bounce} of proofs[number-1].route){
    const ticks=Math.round(wait/dt);
    const qualifies=shot=>shot.state!=='dead'&&!shot.flight&&!shot.inTransit&&shot.current===target&&
      (!exit||shot.switches.has(exit))&&(!bounce||shot.reflections>game.reflections);
    const expected=flight(readyAfter(game,ticks));
    assert(qualifies(expected),level.name+' proof flight');
    let width=1;
    for(const direction of [-1,1]){
      for(let offset=1;offset<=60&&ticks+offset*direction>=0;offset++){
        if(!qualifies(flight(readyAfter(game,ticks+offset*direction))))break;
        width++;
      }
    }
    assert(width>=9,level.name+' verified route has a continuous launch window');
    widths.push(width);
    game=expected;
  }
  assert.equal(game.state,'won');
  console.log('PASS',level.name,'launch window ticks',widths);
}

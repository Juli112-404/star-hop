const assert=require('node:assert/strict');
const {OrbitGame,Physics}=require('../src/levels-engine.js');
const wall={a:{x:300,y:300},b:{x:300,y:500}};
const xy=(x,y)=>({x,y});
const r=Physics.wallRadius+Physics.ballRadius;
assert.equal(Physics.wallHit(xy(300+r,330),xy(300+r,430),wall),0);
assert.equal(Physics.wallHit(xy(300+r+.01,330),xy(300+r+.01,430),wall),null);
assert(Physics.wallHit(xy(270,290),xy(330,290),wall)>0);
assert.equal(Physics.wallHit(xy(270,288),xy(330,288),wall),null);
assert.equal(Physics.wallHit(xy(270,350),xy(330,350),wall),(30-r)/60);
assert.equal(Physics.wallHit(xy(270,290),xy(330,290),{a:wall.a,b:wall.a}),Physics.hit(xy(270,290),xy(330,290),wall.a,r));
const diagonal={a:xy(250,250),b:xy(350,350)};
assert.notEqual(Physics.wallHit(xy(282,298),xy(314,330),diagonal),null);
assert.equal(Physics.wallHit(xy(282,300),xy(284,302),diagonal),null);

function game(level,ball){
  const g=new OrbitGame(level);
  g.ball={...ball};g.flight=true;g.leftSource=true;
  return g;
}
const nodes=[{...xy(120,290),r:20},{...xy(350,290),r:18,goal:true}];
const ball={...xy(270,290),vx:290,vy:0};
const blocked=game({nodes,walls:[wall]},ball);
blocked.step(.25);
assert.equal(blocked.reason,'碰撞');
assert(blocked.failurePoint.x<300);
const clean=game({nodes,walls:[wall]},{...ball,y:288});
clean.step(.25);
assert.equal(clean.state,'won');
const gated=game({nodes,walls:[{...wall,switch:'blue'}]},ball);
gated.switches.add('blue');
gated.step(.25);
assert.equal(gated.state,'won');
const closeGoal=[{...xy(120,350),r:20},{...xy(321,350),r:20,goal:true}];
const withStar=game({nodes:closeGoal,walls:[wall],pickups:[{...xy(310,350),r:4}]},{...ball,y:350});
withStar.step(.25);
assert.equal(withStar.reason,'碰撞');
assert(!withStar.collected.has(0));
console.log('PASS wall body, grazes, round caps, real misses, opened gates and collision before arrival or stars');


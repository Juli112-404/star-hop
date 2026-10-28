const assert=require('node:assert/strict');
const {OrbitGame}=require('../src/levels-engine.js'),stages=require('../src/review-data.js');
const dt=1/120;
function shoot(g){const q=g.clone();q.action();for(let f=0;f<750&&q.flight&&q.state==='playing';f++)q.step(dt);return q}
function options(g,target){const waiting=g.clone(),solutions=[];for(let t=0;t<3.8&&waiting.state==='playing';t+=1/90){const q=shoot(waiting);if(q.current===target&&['playing','won'].includes(q.state))solutions.push({wait:t,game:q});waiting.step(1/90)}return solutions}
function find(g,target){const opts=options(g,target);assert.ok(opts.length,`${g.level.name} target ${target} must be reachable by waiting and clicking`);const best=opts[Math.floor(opts.length/2)];console.log(' target',target,'windows',opts.length,'wait',best.wait.toFixed(2));return best.game}
const routes=[[1],[1,2],[2],[1],[1],[1],[1,2,3],[1,2],[1,2],[1]];
for(let i=0;i<10;i++){console.log(stages[i].name);let g=new OrbitGame(stages[i]);const before=JSON.stringify({ball:g.ball,time:g.time,angle:g.angle,score:g.score});g.preview();assert.equal(JSON.stringify({ball:g.ball,time:g.time,angle:g.angle,score:g.score}),before,'preview cannot mutate game');for(const dest of routes[i])g=find(g,dest);assert.equal(g.state,'won');assert.ok(g.used<=g.level.budget)}
let g=new OrbitGame(stages[2]);g=find(g,1);g=find(g,2);assert.equal(g.state,'won','alternate route must work');assert.ok(stages.every(s=>!s.pickups&&!s.collectGoal&&!s.par),'campaign has no collectible or rating objectives');
g=new OrbitGame(stages[7]);g=find(g,1);assert.equal(g.launchRemaining,4);for(let t=0;t<4.1;t+=dt)g.step(dt);assert.equal(g.state,'dead');assert.equal(g.reason,'起跳时间已到');
g=new OrbitGame(stages[9]);for(let t=0;t<1;t+=dt)g.step(dt);g.action();const remaining=g.launchRemaining;for(let i=0;i<30&&g.state==='playing';i++)g.step(dt);assert.equal(g.launchRemaining,remaining,'timer counts only before launch');
g=new OrbitGame(stages[8]);g.capture(2,0);assert.equal(g.state,'dead','locked goal');g=new OrbitGame(stages[8]);g=find(g,1);assert.ok(g.keys.has('gold'));assert.ok(g.gateOpen(g.level.gates[0]));
g=new OrbitGame(stages[5]);const portalShot=options(g,1)[0];g.step(portalShot.wait);const prediction=g.preview(1.5);assert.ok(prediction.portals.length,'preview has portal direction');const expectedAngle=Math.atan2(Math.cos(g.angle),-Math.sin(g.angle))-Math.PI/2;assert.ok(Math.abs(prediction.portals[0].angle-expectedAngle)<.001);
console.log('PASS 10 routes, both fork routes, preview immutability, deadline and in-flight timer, key lock and rotated portal preview.');


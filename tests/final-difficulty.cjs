const assert=require('node:assert/strict'),{OrbitGame}=require('../src/levels-engine.js'),stages=require('../src/review-data.js').map((stage,i)=>({...stage,starProof:require('./star-proofs.json')[i]})),old={42:{nodes:[66,62,44,60].map(r=>({r}))},48:{nodes:[{}, {},{r:56}]},49:{twinDistance:12,nodes:[66,86,78,92].map(r=>({r}))}};
for(let i=0;i<4;i++)assert(stages[42].nodes[i].r<old[42].nodes[i].r);assert.equal(stages[48].walls.length,0);assert(stages[48].nodes[2].r<old[48].nodes[2].r);
const l=stages[49];assert(l.twinDistance>old[49].twinDistance);assert(l.nodes.every((n,i)=>n.r<old[49].nodes[i].r));assert(l.nodes[1].move&&l.nodes[1].spin===-1);assert(l.nodes[1].launchSeconds&&l.nodes[2].launchSeconds);assert(!l.checkpointEnabled);
let g=new OrbitGame(l);const windows=[];for(const move of l.starProof.route){const w=g.clone();let run=0,best=0;for(let f=0;f<1200&&w.state==='playing';f++){const q=w.clone();q.action();for(let k=0;k<1300&&(q.flight||q.inTransit)&&q.state==='playing';k++)q.step(1/120);if(q.current===move.target&&q.state!=='dead'&&!q.inTransit){run++;best=Math.max(best,run)}else run=0;w.step(1/120)}assert(best>=5,'final-stage shared window must allow deliberate input');windows.push(+(best/120).toFixed(3));for(let f=0;f<Math.round(move.wait*120);f++)g.step(1/120);g.action();for(let k=0;k<1300&&(g.flight||g.inTransit)&&g.state==='playing';k++)g.step(1/120);assert.notEqual(g.state,'dead');assert.equal(g.current,move.target)}assert.equal(g.state,'won');console.log('PASS harder 43/49, final-stage moving reverse timed relay, smaller targets and wider ball spacing; shared launch windows',windows);

 // Isolate the original right-edge regression from the campaign layout.
 const source=new OrbitGame({
  nodes:[{x:660,y:200,r:25},{x:673,y:420,r:62,goal:true}],
  gravity:[{x:695,y:420,r:8,range:95,force:25}],
  twinDistance:5,twinOffset:.3
 });
 source.angle=0;
 source.ball=source.orbitPoint();
 const preview=source.preview(3.5);
 assert(preview.pairedLanding&&preview.points.some(p=>p.x>670));
 const replay=source.clone();
 replay.action();
 let crossed=false;
 for(let frame=0;frame<420&&replay.inTransit&&replay.state==='playing';frame++){
  replay.step(1/120);
  if(replay.flight&&replay.ball.x>670&&replay.twin.state==='won')crossed=true;
 }
 assert(crossed,'white ball must continue beyond the former edge after blue lands');
 assert.equal(replay.state,'won');
 assert(replay.arrivalTime>replay.twin.arrivalTime);
 source.angle=Math.PI;
 source.ball=source.orbitPoint();
 assert(!source.preview(3.5).pairedLanding,'an incorrect launch must not highlight both paths');
 console.log('PASS right-edge flight continues after the first ball lands and both can finish');
 

/* Campaign interface with local progress and wallet storage. */
(()=>{
const judgeMode=globalThis.StarHopJudge===true;
const campaignPace=.94;
const playtestVersion='orbit-variety-v1';
const levelNumber=i=>PlanetLevels[i].number??i+1;
const ballColors={white:'#ffffff',blue:'#9bdeff'};
const realSeconds=simulationTime=>simulationTime/campaignPace;
const countdown=time=>(Math.ceil(realSeconds(time)*10)/10).toFixed(1)+'s';
const storage=judgeMode?'star-hop-judge-progress-v1':'star-hop-review-20261027';
const $=s=>document.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d'),overlay=$('.overlay');let level=0,game,scale=1,ox=0,oy=0,recorded=false,attempt=false,shown=false,completed={},runs=[],preview={points:[],portals:[]},previewClock=0;try{const data=JSON.parse(localStorage.getItem(storage));completed=data?.completed||{};runs=Array.isArray(data?.runs)?data.runs:[]}catch{}
const walletKey=judgeMode?'star-hop-judge-wallet-v1':'star-hop-review-20261027-wallet-permanent-v1';
let pulses=[],lastLaunchFrom=null,playTop=0;
let economy;try{economy=new StarEconomy(JSON.parse(localStorage.getItem(walletKey)||'{}'))}catch{economy=new StarEconomy()}let charged=false,credited=false,checkpoint=null;function walletSave(){try{localStorage.setItem(walletKey,JSON.stringify(economy))}catch{}}
function blocked(){game.state='paused';show('本关挑战机会已用完','★ '+economy.balance+' / 5','5 ★ 兑换一次');}
function save(){try{localStorage.setItem(storage,JSON.stringify({completed,runs:runs.slice(-300)}))}catch{}}
function log(result){
  if(!attempt||recorded)return;
  recorded=true;
  runs.push({level:levelNumber(level),name:game.level.name,configuration:playtestVersion,result,reason:game.reason||'',
    lastLaunchFrom,failedBall:game.failedBall||null,seconds:+realSeconds(game.time).toFixed(2),shots:game.used,
    perfects:game.perfects,maxWait:+realSeconds(Math.max(game.bestWait,game.waitOnPlanet)).toFixed(2),date:new Date().toISOString()});
  save();
}
function unlocked(){if(judgeMode)return PlanetLevels.length-1;let i=0;while(i<PlanetLevels.length-1&&completed[i])i++;return i}
function buttons(){$('#levels').innerHTML=PlanetLevels.map((l,i)=>`<button class="${i===level?'active':''}" ${i>unlocked()?'disabled':''} data-level="${i}" aria-label="${l.name}">${completed[i]?'✓ ':''}${levelNumber(i)} </button>`).join('');$('#levels').querySelectorAll('button').forEach(b=>b.onclick=()=>select(+b.dataset.level));$('#levels .active')?.scrollIntoView({inline:'center',block:'nearest'})}
function show(title,text,label,result=false){overlay.classList.toggle('result',result);overlay.style.display='grid';$('.panel h1').textContent=title;$('.panel p').textContent=text;$('.panel p').style.display=text?'block':'none';$('#primary').textContent=label;$('#retry').style.display=game.state==='won'&&PlanetLevels.length>1?'inline-block':'none';$('#export').style.display=game.state==='paused'?'inline-block':'none'}
function fresh(ready=false){checkpoint=new StarCheckpoint(PlanetLevels[level].checkpointEnabled);charged=false;credited=false;pulses=[];lastLaunchFrom=null;const config=JSON.parse(JSON.stringify(PlanetLevels[level]));if(StarEconomy.shouldSpawnStar()&&config.starSpot)config.pickups=[{...config.starSpot}];game=new OrbitEngine.OrbitGame(config);game.state=ready?'ready':'playing';attempt=!ready;recorded=false;shown=false;previewClock=1;overlay.style.display='none';overlay.classList.remove('result');buttons();status();resize()}
function select(i){
  log('left');level=Math.min(i,unlocked());fresh();
  if(game.level.intro){
    game.state='ready';attempt=false;
    show(game.level.name,game.level.intro,'开始');
  }
}
function restart(){log('restart');const restored=game.state==='dead'?checkpoint?.restore(game):null;if(restored){game=restored.game;credited=restored.credited;charged=false;recorded=false;shown=false;attempt=true;previewClock=1;pulses=[];lastLaunchFrom=null;overlay.style.display='none';overlay.classList.remove('result');buttons();status();resize()}else fresh()}
function status(){let text=`★ ${economy.balance}`;if(!judgeMode){const remaining=economy.remaining(level,!!completed[level]);if(Number.isFinite(remaining))text+=` · 挑战 ${remaining}`;}if(game.level.goalKey)text+=game.keys.has('gold')?' · ⚿ ✓':' · ⚿';if(game.launchRemaining!==null&&!game.flight&&!game.inTransit)text+=` · ${countdown(game.launchRemaining)}`;$('#status').textContent=text}
function action(){
  if(game.state!=='playing'||game.flight||game.inTransit)return;
  if(!charged){
    if(!judgeMode&&!economy.spend(level,!!completed[level])){blocked();return}
    charged=true;walletSave();
  }
  lastLaunchFrom=game.current+1;
  game.action();previewClock=1;status();
}
function result(){
  if(shown)return;
  shown=true;log(game.state);
  if(game.state==='dead'){
    const ball=game.failedBall==='white'?'白球':game.failedBall==='blue'?'蓝球':'';
    const reason=ball&&!game.reason.startsWith(ball)?ball+' · '+game.reason:game.reason;
    show(reason,'',checkpoint?.snapshot?'从落点继续':'↻',true);
  }else{
    completed[level]=1;save();buttons();
    const label=PlanetLevels.length===1?'再玩一次':level===PlanetLevels.length-1?'重新探索':'下一关';
    show('抵达终点','',label,true);
  }
}
// Fit the actual stage instead of shrinking a mostly empty, fixed 600×510 world.
function stageBounds(l){
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  function add(p,x=0,y=x){
    left=Math.min(left,p.x-x);right=Math.max(right,p.x+x);
    top=Math.min(top,p.y-y);bottom=Math.max(bottom,p.y+y);
  }
  function body(p,padding){
    const {move}=p,r=(p.r||38)+padding;
    const dx=move?.axis==='x'||move?.axis==='orbit'?move.amp:0;
    const dy=move?.axis==='orbit'?move.ampY??move.amp:move?.axis==='y'?move.amp:0;
    add(p,r+dx,(p.ry??p.r??38)+padding+dy);
  }
  for(const n of l.nodes)body(n,n.launchSeconds||n.goal&&l.goalDeadline?38:22);
  for(const p of [...l.obstacles||[],...l.gates||[]])body(p,12);
  for(const g of l.gravity||[])add(g,g.range+8);
  for(const w of l.wind||[]){add(w);add({x:w.x+w.w,y:w.y+w.h})}
  for(const p of l.walls||[]){add(p.a,12);add(p.b,12)}
  for(const p of l.reflectors||[]){
    if(!p.turn){add(p.a,20);add(p.b,20);continue}
    const center={x:(p.a.x+p.b.x)/2,y:(p.a.y+p.b.y)/2};
    for(const point of [p.a,p.b]){
      const arm=Math.hypot(point.x-center.x,point.y-center.y);
      const angle=Math.atan2(point.y-center.y,point.x-center.x);
      const min=angle-Math.abs(p.turn.amp),max=angle+Math.abs(p.turn.amp),quarter=Math.PI/2;
      const angles=[min,max];
      for(let k=Math.ceil(min/quarter);k*quarter<=max;k++)angles.push(k*quarter);
      for(const a of angles)add({x:center.x+Math.cos(a)*arm,y:center.y+Math.sin(a)*arm},15);
    }
  }
  for(const p of l.portals||[]){add(p.entry,p.r+25);add(p.exit,p.r+40)}
  for(const p of l.flySwitches||[])add(p,p.r+8);
  if(right-left<420){const mid=(left+right)/2;left=mid-210;right=mid+210}
  if(bottom-top<340){const mid=(top+bottom)/2;top=mid-170;bottom=mid+170}
  return {left,right,top,bottom};
}
function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*d;canvas.height=innerHeight*d;ctx.setTransform(d,0,0,d,0,0);playTop=$('.levelbar').getBoundingClientRect().bottom+12;const bottom=innerHeight-24,b=stageBounds(game.level);scale=Math.max(.15,Math.min((innerWidth-24)/(b.right-b.left),(bottom-playTop)/(b.bottom-b.top),1.3));ox=(innerWidth-(b.right-b.left)*scale)/2-b.left*scale;oy=playTop+(bottom-playTop-(b.bottom-b.top)*scale)/2-b.top*scale}addEventListener('resize',resize);
function circle(p,r,color,fill){ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.lineWidth=1.5;ctx.strokeStyle=color;if(fill){ctx.fillStyle=fill;ctx.fill()}ctx.stroke()}
function drawBall(p,color){
  const radius=OrbitEngine.Physics.ballRadius;
  if(radius*scale<4){
    ctx.beginPath();ctx.arc(p.x,p.y,4.5/scale,0,Math.PI*2);
    ctx.fillStyle=color+'28';ctx.fill();
  }
  ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);
  ctx.fillStyle=color;ctx.fill();
}
function text(p,s,color='#b4c8da',dy=0,size=12){ctx.font=Math.max(size,12/scale)+'px system-ui';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,p.x,p.y+dy)}
function arrow(p,a,color,size=17){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.lineWidth=2;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(-size,0);ctx.lineTo(size,0);ctx.lineTo(size-8,-6);ctx.moveTo(size,0);ctx.lineTo(size-8,6);ctx.stroke();ctx.restore()}
function lock(p,open){ctx.save();ctx.translate(p.x,p.y);const zoom=Math.max(1,1.25/scale);ctx.scale(zoom,zoom);ctx.strokeStyle=open?'#75edce':'#ffd17c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(open?5:0,-5,7,Math.PI,Math.PI*2);ctx.stroke();ctx.strokeRect(-10,-5,20,15);ctx.restore()}
function key(p){ctx.save();ctx.translate(p.x,p.y);const zoom=Math.max(1,1.1/scale);ctx.scale(zoom,zoom);circle({x:-6,y:0},5,'#ffd17c');ctx.beginPath();ctx.moveTo(-1,0);ctx.lineTo(13,0);ctx.lineTo(13,5);ctx.moveTo(8,0);ctx.lineTo(8,5);ctx.stroke();ctx.restore()}
function diamond(p,r,color,fill){ctx.beginPath();ctx.moveTo(p.x,p.y-r);ctx.lineTo(p.x+r,p.y);ctx.lineTo(p.x,p.y+r);ctx.lineTo(p.x-r,p.y);ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=1.8;if(fill){ctx.fillStyle=fill;ctx.fill()}ctx.stroke()}
function drawTrack(points,color,width,dash=[]){
  ctx.beginPath();
  points.forEach((p,i)=>i&&!p.break?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);
  ctx.stroke();ctx.setLineDash([]);
}
const exitColor=(level,key)=>key&&level.walls?.find(w=>w.switch===key)?.color;
function draw(now){ctx.fillStyle='#0b1220';ctx.fillRect(0,0,innerWidth,innerHeight);ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);const l=game.level;for(let i=0;i<70;i++){ctx.fillStyle='#32495e';ctx.fillRect((i*137)%600,100+(i*79)%510,1.4,1.4)}
const aiming=!game.flight&&!game.inTransit&&game.state!=='dead'&&game.state!=='won';
const readySwitch=aiming&&l.routeCue?preview.openingSwitch:null;
if(levelNumber(level)===2){ctx.strokeStyle='#45657b44';ctx.lineWidth=1;ctx.setLineDash([2,10]);const links=[[0,1],[1,2]];for(const [a,b]of links){ctx.beginPath();ctx.moveTo(l.nodes[a].x,l.nodes[a].y);ctx.lineTo(l.nodes[b].x,l.nodes[b].y);ctx.stroke()}ctx.setLineDash([])}
for(const p of l.walls||[]){
  const solid=game.wallSolid(p);
  if(p.cycle){
    const {period,open}=p.cycle,phase=game.wallPhase(p);
    const progress=solid?(phase-open)/(period-open):phase/open;
    ctx.beginPath();ctx.arc(p.a.x,p.a.y,12,-Math.PI/2,-Math.PI/2+2*Math.PI*progress);
    ctx.strokeStyle=solid?p.color:'#75edce';ctx.lineWidth=2.5;ctx.stroke();
  }
  if(!solid){
    if(p.color){circle(p.a,4,p.color);circle(p.b,4,p.color)}
    continue;
  }
  const controlled=p.switch||p.closedWhen;
  ctx.beginPath();ctx.moveTo(p.a.x,p.a.y);ctx.lineTo(p.b.x,p.b.y);
  ctx.lineWidth=OrbitEngine.Physics.wallRadius*2;
  ctx.lineCap='round';
  ctx.strokeStyle=p.color||(controlled?(readySwitch&&p.switch===readySwitch?'#9bdeff':'#79c7ed'):'#b66e72');
  ctx.stroke();ctx.lineCap='butt';
  const rim=p.color||(controlled?'#a5e0ff':'#f5a294');
  circle(p.a,4,rim,'#304d63');
  circle(p.b,4,rim,'#304d63');
}
for(const spec of l.reflectors||[]){
  const p=OrbitEngine.Physics.reflector(spec,game.time);
  ctx.beginPath();ctx.moveTo(p.a.x,p.a.y);ctx.lineTo(p.b.x,p.b.y);
  ctx.strokeStyle='#83d9ff33';ctx.lineWidth=14;ctx.stroke();
  ctx.strokeStyle='#b9f0ff';ctx.lineWidth=5;ctx.stroke();
  circle(p.a,5,'#b9f0ff','#235773');circle(p.b,5,'#b9f0ff','#235773');
  if(p.center)circle(p.center,5,'#b9f0ff','#235773');
}
for(const p of l.flySwitches||[]){
  const active=game.switches.has(p.switch),ready=readySwitch===p.switch;
  const color=active?'#75edce':ready?'#9bdeff':'#79c7ed';
  circle(p,p.r,ready?color:color+'88',color+(ready?'38':'15'));
  diamond(p,9,color,active||ready?color:null);
}
for(const w of l.wind||[]){ctx.fillStyle='#72cdef12';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.strokeStyle='#72cdef66';ctx.strokeRect(w.x,w.y,w.w,w.h);for(let i=0;i<14;i++){const x=w.x+12+(i*37)%(w.w-24),y=w.y+((i*43-game.time*65) % w.h+w.h)%w.h;arrow({x,y},Math.atan2(w.ay,w.ax),'#72cdef99',9)}}
for(const g of l.gravity||[]){circle(g,g.range,g.force<0?'#f6a5ce77':'#b08ae86b',g.force<0?'#f684be0c':'#9767ed0e');for(const r of [.55,.8]){ctx.setLineDash([2,8]);circle(g,g.range*r,'#b08ae833');ctx.setLineDash([])}circle(g,g.r,'#d7b4ff','#6c4c9b');for(let a=0;a<6;a++){const an=a*Math.PI/3;arrow({x:g.x+Math.cos(an)*g.range*.82,y:g.y+Math.sin(an)*g.range*.82},an+(g.force<0?0:Math.PI),g.force<0?'#ed93bf':'#9976cf',10)}}
for(const original of l.obstacles||[]){
 const p={...original,...OrbitEngine.Physics.position(original,game.time)};
 if(p.ry){
  ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(p.x,p.y,p.r+6,p.ry+6,0,0,Math.PI*2);
  ctx.fillStyle='#f18e770c';ctx.fill();ctx.strokeStyle='#f18e7755';ctx.stroke();
  ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.ry,0,0,Math.PI*2);
  ctx.fillStyle='#603b45';ctx.fill();ctx.strokeStyle='#c37770';ctx.stroke();
 }else{circle(p,p.r+6,'#f18e7755','#f18e770c');circle(p,p.r,'#c37770','#603b45');}ctx.beginPath();ctx.moveTo(p.x-9,p.y-9);ctx.lineTo(p.x+9,p.y+9);ctx.moveTo(p.x+9,p.y-9);ctx.lineTo(p.x-9,p.y+9);ctx.strokeStyle='#d19c9455';ctx.stroke()}
for(const g of l.gates||[]){const open=game.gateOpen(g);ctx.setLineDash(open?[3,9]:[]);circle(g,g.r,open?'#75edce55':'#ffd17c88',open?null:'#ffd17c0a');ctx.setLineDash([]);if(!open){ctx.beginPath();ctx.moveTo(g.x-20,g.y-28);ctx.lineTo(g.x+20,g.y+28);ctx.moveTo(g.x-20,g.y);ctx.lineTo(g.x+20,g.y+40);ctx.strokeStyle='#ffd17c88';ctx.lineWidth=4;ctx.stroke()}lock(g,open)}
for(const p of l.portals||[]){const pair=l.portals.indexOf(p),pc=pair?'#ffba77':'#69e9ef';circle(p.entry,p.r,pc,pc+'11');circle(p.entry,p.r-5,'#69e9ef55');circle(p.exit,p.r,pair?'#ffba77':'#cb9dff',pair?'#ffba7711':'#cb9dff11');circle(p.exit,p.r-5,'#cb9dff55');const incoming={x:-Math.sin(game.angle),y:Math.cos(game.angle)};const angle=Math.atan2(incoming.y,incoming.x)+p.rotation;const exit=preview.portals.find(e=>e.index===l.portals.indexOf(p));arrow({x:p.exit.x,y:p.exit.y},exit?.angle??angle,exit?'#edd6ff':'#a083b777',exit?27:18);ctx.save();ctx.translate(p.entry.x,p.entry.y-p.r-18);ctx.beginPath();ctx.moveTo(-10,-8);ctx.lineTo(-10,8);ctx.lineTo(10,8);ctx.strokeStyle='#adc3d1';ctx.lineWidth=1.5;ctx.stroke();ctx.restore()}
for(const [i,p] of (l.pickups||[]).entries()){if(game.state!=='dead'&&!game.collected.has(i)&&(p.from==null||game.current===p.from)&&!game.pendingPickups.has(i)&&!game.twin?.pendingPickups.has(i)){ctx.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?7:15;const x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;k?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fillStyle=preview.starLanding&&!game.flight?'#fff0ac':'#ffdb75';ctx.fill();}}l.nodes.forEach((n,i)=>{
  if(game.consumed.has(i))return;
  const p=game.node(i),r=n.r||38,current=i===game.current;
  const color=n.launchSeconds?'#ffb274':n.key||n.goal?'#ffd17c':n.switch?'#79c7ed':'#75edce';
  const rim=n.entryArc?'#596677':current?'#b2c9db':color;
  circle(p,r,rim,current?'#46658118':color+'13');
  circle(p,r*.62,color,current?'#42697c':color+'33');
  if(n.entryArc){
    const a=OrbitEngine.Physics.entryAngle(n.entryArc,game.time),half=n.entryArc.span/2;
    ctx.beginPath();ctx.arc(p.x,p.y,r,a-half,a+half);
    ctx.lineWidth=6;ctx.strokeStyle='#75edce';ctx.stroke();
  }
  if(n.fragile){
    ctx.beginPath();ctx.moveTo(p.x-9,p.y-r*.5);ctx.lineTo(p.x+4,p.y-4);
    ctx.lineTo(p.x-4,p.y+3);ctx.lineTo(p.x+10,p.y+r*.5);
    ctx.strokeStyle='#ffb274';ctx.lineWidth=3;ctx.stroke();
  }
  if(n.goal){
    if(game.goalRemaining!==null){
      const time=game.goalRemaining;
      ctx.beginPath();ctx.arc(p.x,p.y,r+10,-Math.PI/2,-Math.PI/2+Math.PI*2*time/l.goalDeadline);
      ctx.strokeStyle=realSeconds(time)<2?'#ff7979':'#ffb274';ctx.lineWidth=4;ctx.stroke();
      text(p,countdown(time),'#ffcc9c',r+31,16);
    }
    if(l.goalKey&&!game.keys.has(l.goalKey)){
      ctx.setLineDash([7,5]);circle(p,r+7,'#ffd17c');ctx.setLineDash([]);lock(p,false);
    }else{
      ctx.beginPath();ctx.moveTo(p.x-5,p.y+10);ctx.lineTo(p.x-5,p.y-10);
      ctx.lineTo(p.x+9,p.y-5);ctx.lineTo(p.x-5,p.y);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    }
  }
  if(n.key)key(p);
  if(n.switch)diamond(p,10,color,game.switches.has(n.switch)?color:null);
  if(current&&game.launchRemaining!==null&&!game.flight&&!game.inTransit){
    ctx.beginPath();ctx.arc(p.x,p.y,r+9,-Math.PI/2,-Math.PI/2+Math.PI*2*game.launchRemaining/n.launchSeconds);
    ctx.strokeStyle=realSeconds(game.launchRemaining)<1.2?'#ff7979':'#ffb274';ctx.lineWidth=4;ctx.stroke();
    text(p,countdown(game.launchRemaining),'#ffcc9c',r+31,16);
  }
  if(current&&game.state!=='dead'){
    circle(p,game.radius(),'#9eb2c844');
    ctx.beginPath();ctx.arc(p.x,p.y,game.radius(),game.angle,game.angle+.4);
    ctx.strokeStyle='#d9edf4';ctx.lineWidth=2;ctx.stroke();
  }
  if(n.launchArc){
    const {angle,span}=n.launchArc;
    ctx.beginPath();ctx.arc(p.x,p.y,r+4,angle-span/2,angle+span/2);
    ctx.strokeStyle=current?'#75edce':'#75edce99';ctx.lineWidth=4;ctx.stroke();
  }
  if(n.landingExits){
    const {split,upper,lower}=n.landingExits;
    const edge=Math.asin(split),opposite=Math.PI-edge;
    for(const [key,from,to] of [[lower,edge,opposite],[upper,opposite,Math.PI*2+edge]]){
      const color=exitColor(l,key);
      if(!color)continue;
      ctx.beginPath();ctx.arc(p.x,p.y,r+4,from,to);
      ctx.lineWidth=game.switches.has(key)?5:3;ctx.strokeStyle=color;ctx.stroke();
    }
  }
});
const pairedAim=aiming&&l.gravity?.length&&preview.landingPoints;
const relayExit=aiming&&l.nodes[game.current].launchArc&&preview.landing;
if(readySwitch||(aiming&&l.routeCue&&preview.landing)||relayExit){
  const color=readySwitch?'#9bdeff':'#75edce';
  drawTrack(preview.points,color,2.2,[3,6]);
  circle(preview.points.at(-1),5,color);
}else if(pairedAim){
  drawTrack(preview.points,ballColors.white,2.1,[3,6]);
  drawTrack(preview.twinPoints,ballColors.blue,2.1,[3,6]);
  circle(pairedAim[0],5,ballColors.white);
  circle(pairedAim[1],5,ballColors.blue);
}else if(aiming){
  const pts=preview.points;
  for(let i=1;i<pts.length;i++){
    if(pts[i].break)continue;
    drawTrack([pts[i-1],pts[i]],`rgba(193,220,230,${.7*(1-i/pts.length)+.1})`,1.6,[3,6]);
  }
  if(l.twinOffset)drawTrack(preview.twinPoints||[],'#9bdeffbb',1.6,[3,6]);
}else if(game.flight||game.inTransit||game.state==='dead'){
  if(game.trail.length){
    const crashed=game.state==='dead'&&game.failedBall!=='blue';
    drawTrack([...game.trail,game.ball],crashed?'#ff9c8a':l.twinOffset?'#ffffff99':'#75edce99',2);
  }
  if(game.twin?.trail.length)drawTrack([...game.twin.trail,game.twin.ball],game.failedBall==='blue'?'#ff9c8a':'#9bdeff99',2);
}
const predictedNode=l.nodes[preview.landingNode];
if(aiming&&(predictedNode?.launchArc||predictedNode?.showLanding||preview.landingExit)){
  circle(preview.points.at(-1),5,exitColor(l,preview.landingExit)||'#75edce');
}
if(l.twinOffset){
  let twin=game.twin?.ball;
  if(!twin){
    const p=game.node(game.current),angle=game.angle+game.twinGap();
    twin={x:p.x+Math.cos(angle)*game.radius(),y:p.y+Math.sin(angle)*game.radius()};
  }
  drawBall(twin,ballColors.blue);
}
drawBall(game.ball,ballColors.white);
if(levelNumber(level)===1&&game.used===0&&game.state==='playing'){const p=game.node(0),pulse=12+(Math.sin(game.time*4)+1)*5;circle(game.ball,pulse,'#c0f9eb77');text(p,'点击释放起跳','#d9f7ed',game.radius()+40,18)}
pulses=pulses.filter(p=>now-p.start<440);
for(const {point,r,color,start} of pulses){
  const age=(now-start)/440;
  ctx.save();ctx.globalAlpha=1-age;
  circle(point,r+5+17*age,color);
  ctx.restore();
}
if(game.failurePoint){
  const edge=24;
  const p={
    x:(Math.max(edge,Math.min(innerWidth-edge,ox+scale*game.failurePoint.x))-ox)/scale,
    y:(Math.max(playTop+edge,Math.min(innerHeight-edge,oy+scale*game.failurePoint.y))-oy)/scale
  };
  if(game.failedBall)circle(p,18,ballColors[game.failedBall]);
  circle(p,14,'#ff9486');text(p,'×','#ff9486',5,20);
}
ctx.restore();
if(game.messageTime>0&&game.state==='playing'&&game.message.startsWith('PERFECT')){ctx.font='bold 17px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffe1a4';ctx.fillText(game.message,innerWidth/2,innerHeight*.2)}
}
function pause(){if(game.state==='playing'){game.state='paused';show('已暂停','','继续')}}$('#pause').onclick=pause;$('#restart').onclick=restart;$('#retry').onclick=restart;$('#primary').onclick=()=>{if(!judgeMode&&!charged&&!completed[level]&&economy.remaining(level,false)===0){if(economy.exchange(level)){walletSave();game.state='playing';overlay.style.display='none';status()}else blocked();return}if(game.state==='won')select((level+1)%PlanetLevels.length);else if(game.state==='paused'||game.state==='ready'){attempt=true;game.state='playing';overlay.style.display='none';previewClock=1}else restart()};canvas.onpointerdown=e=>{e.preventDefault();action()};document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
$('#export').onclick=()=>{pause();const data={version:playtestVersion,runs,completed};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='star-hop-local-playtest.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
let prev=0,acc=0;
function advance(dt,now){
  const beforeWhite=game.arrivalPoint,beforeBlue=game.twin?.arrivalPoint;
  const pendingSensors=game.level.flySwitches?.filter(p=>!game.switches.has(p.switch))||[];
  acc+=dt*campaignPace;
  while(acc>=1/120&&game.state==='playing'){
    game.step(1/120);
    if(!credited&&game.collected.size){credited=true;economy.balance++;walletSave()}
    checkpoint?.capture(game,credited);
    acc-=1/120;
  }
  const currentNode=game.level.nodes[game.current];
  if((game.twin||currentNode.launchArc||currentNode.showLanding||currentNode.landingExits)&&game.arrivalPoint&&game.arrivalPoint!==beforeWhite){
    const exits=currentNode.landingExits;
    const key=exits&&(game.switches.has(exits.upper)?exits.upper:exits.lower);
    pulses.push({point:game.arrivalPoint,r:7,color:exitColor(game.level,key)||ballColors.white,start:now});
  }
  if(game.twin?.arrivalPoint&&game.twin.arrivalPoint!==beforeBlue){
    pulses.push({point:game.twin.arrivalPoint,r:7,color:ballColors.blue,start:now});
  }
  for(const p of pendingSensors){
    if(game.switches.has(p.switch))pulses.push({point:p,r:p.r,color:'#79c7ed',start:now});
  }
  if(game.state!=='playing')result();
  status();
}
function frame(t){
  const dt=Math.min((t-prev)/1000||0,.05);
  prev=t;
  if(game.state==='playing')advance(dt,t);
  else acc=0;
  previewClock+=dt;
  const l=game.level;
  const trackStar=game.state==='playing'&&!game.flight&&!game.inTransit&&!game.collected.has(0)&&l.pickups?.[0]?.from===game.current;
  const previewInterval=l.routeCue||l.nodes.some(n=>n.launchArc||n.landingExits) ? .03 : .06;
  if(previewClock>previewInterval||trackStar||(l.twinOffset&&l.gravity?.length)){
    const duration=l.previewSeconds??(l.pickups?.length||l.portals?.length||l.reflectors?.length||l.gravity?.length||l.wind?.length||l.flySwitches?.length?3.5:l.nodes.some(n=>n.move||n.entryArc)?2.4:.95);
    preview=game.preview(duration);
    previewClock=0;
  }
  draw(t);
  requestAnimationFrame(frame);
}
const search=judgeMode&&location.href==='about:srcdoc'?parent.location.search:location.search;
const requested=Number(new URLSearchParams(search).get('level'));
const n=PlanetLevels.findIndex((_,i)=>levelNumber(i)===requested);
select(Math.max(0,n));
requestAnimationFrame(frame);
})();






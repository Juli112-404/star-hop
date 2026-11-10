(function(root){
'use strict';
const isNode=typeof module!=='undefined'&&module.exports;
const {OrbitGame}=isNode?require('./levels-engine.js'):root.OrbitEngine;
const dt=1/120,tau=2*Math.PI,revivalCost=10;

// Keep the endless layouts independent from campaign redesigns.
const endlessLayouts={
  "1": {
    "nodes": [
      {
        "x": 115,
        "y": 340,
        "r": 70
      },
      {
        "x": 390,
        "y": 310,
        "r": 68,
        "goal": true
      }
    ]
  },
  "4": {
    "nodes": [
      {
        "x": 90,
        "y": 420,
        "r": 60
      },
      {
        "x": 480,
        "y": 330,
        "r": 76,
        "goal": true
      }
    ],
    "gravity": [
      {
        "x": 300,
        "y": 280,
        "r": 19,
        "range": 155,
        "force": 1000
      }
    ],
    "obstacles": [
      {
        "x": 300,
        "y": 385,
        "r": 65
      }
    ]
  },
  "5": {
    "nodes": [
      {
        "x": 90,
        "y": 420,
        "r": 60
      },
      {
        "x": 465,
        "y": 300,
        "r": 60,
        "goal": true,
        "move": {
          "axis": "y",
          "amp": 85,
          "rate": 1.1
        }
      }
    ]
  },
  "6": {
    "nodes": [
      {
        "x": 90,
        "y": 430,
        "r": 60
      },
      {
        "x": 455,
        "y": 155,
        "r": 60,
        "goal": true
      }
    ],
    "obstacles": [
      {
        "x": 300,
        "y": 285,
        "r": 78
      }
    ],
    "portals": [
      {
        "entry": {
          "x": 260,
          "y": 430
        },
        "exit": {
          "x": 410,
          "y": 325
        },
        "r": 42,
        "rotation": -1.5707963267948966
      }
    ]
  },
  "10": {
    "nodes": [
      {
        "x": 80,
        "y": 420,
        "r": 63
      },
      {
        "x": 500,
        "y": 400,
        "r": 76,
        "goal": true
      }
    ],
    "obstacles": [
      {
        "x": 300,
        "y": 410,
        "r": 90
      }
    ],
    "reflectors": [
      {
        "a": {
          "x": 130,
          "y": 160
        },
        "b": {
          "x": 470,
          "y": 160
        }
      }
    ]
  },
  "20": {
    "nodes": [
      {
        "x": 80,
        "y": 410,
        "r": 60
      },
      {
        "x": 500,
        "y": 260,
        "r": 69,
        "goal": true
      }
    ],
    "wind": [
      {
        "x": 190,
        "y": 200,
        "w": 190,
        "h": 300,
        "ax": 0,
        "ay": -100
      }
    ],
    "obstacles": [
      {
        "x": 335,
        "y": 380,
        "r": 48
      }
    ]
  },
  "25": {
    "nodes": [
      {
        "x": 100,
        "y": 360,
        "r": 58
      },
      {
        "x": 420,
        "y": 330,
        "r": 81,
        "goal": true
      }
    ],
    "twinDistance": 16,
    "twinOffset": 0.2546557930414639
  },
  "18": {"nodes":[{"x":115,"y":340,"r":70},{"x":390,"y":310,"r":61,"goal":true}]},
  "14": {
    "nodes": [
      {
        "x": 85,
        "y": 360,
        "r": 62
      },
      {
        "x": 500,
        "y": 360,
        "r": 57,
        "goal": true
      }
    ],
    "obstacles": [
      {
        "x": 295,
        "y": 360,
        "r": 48,
        "move": {
          "axis": "y",
          "amp": 110,
          "rate": 1.1
        }
      }
    ]
  },
  "29": {
    "nodes": [
      {
        "x": 90,
        "y": 420,
        "r": 48
      },
      {
        "x": 480,
        "y": 330,
        "r": 59,
        "move": {
          "axis": "y",
          "amp": 38,
          "rate": 0.7
        }
      },
      {
        "x": 555,
        "y": 545,
        "r": 45,
        "goal": true
      }
    ],
    "gravity": [
      {
        "x": 300,
        "y": 280,
        "r": 19,
        "range": 155,
        "force": 1000
      }
    ],
    "obstacles": [
      {
        "x": 300,
        "y": 385,
        "r": 65
      },
      {
        "x": 330,
        "y": 492,
        "r": 64
      }
    ]
  },
  "39": {
    "nodes": [
      {
        "x": 80,
        "y": 420,
        "r": 60
      },
      {
        "x": 500,
        "y": 400,
        "r": 69,
        "move": {
          "axis": "y",
          "amp": 85,
          "rate": 0.5
        }
      },
      {
        "x": 555,
        "y": 603,
        "r": 52,
        "goal": true
      }
    ],
    "obstacles": [
      {
        "x": 300,
        "y": 410,
        "r": 90
      }
    ],
    "reflectors": [
      {
        "a": {
          "x": 110,
          "y": 160
        },
        "b": {
          "x": 450,
          "y": 160
        }
      }
    ]
  },
  "40": {
    "nodes": [
      {
        "x": 90,
        "y": 410,
        "r": 58
      },
      {
        "x": 480,
        "y": 300,
        "r": 71
      },
      {
        "x": 543,
        "y": 526,
        "r": 58,
        "goal": true
      }
    ],
    "wind": [
      {
        "x": 195,
        "y": 180,
        "w": 155,
        "h": 340,
        "ax": 0,
        "ay": -65
      }
    ],
    "obstacles": [
      {
        "x": 330,
        "y": 468,
        "r": 77
      }
    ],
    "twinDistance": 16,
    "twinOffset": 0.2546557930414639
  }
};

function layout(index,count){
  const {nodes,gravity,wind,obstacles,reflectors,portals,twinDistance,twinOffset}=endlessLayouts[index];
  return {nodes:nodes.slice(0,count??nodes.length).map((n,i)=>({...n,goal:i===(count??nodes.length)-1})),gravity,wind,obstacles,reflectors,portals,twinDistance,twinOffset};
}
const patterns=[
  ['direct',0,()=>({nodes:[{x:105,y:345},{x:405,y:345,goal:true}]})],
  ['moving',8,()=>layout(5)],['reverse',9,()=>{const level=layout(1);level.nodes[0].spin=-1;return level}],
  ['portal',12,()=>layout(6)],['bounce',13,()=>layout(10)],['timer',10,()=>layout(1)],
  ['gravity',15,()=>layout(4)],['wind',16,()=>layout(20)],['sweep',14,()=>layout(14)],
  ['fork',11,()=>({nodes:[{x:100,y:350},{x:390,y:200,goal:true},{x:440,y:485,goal:true}]})],
  ['window',18,()=>{const level=layout(18);level.nodes[1].window={period:4,open:2.6};return level}],['repel',19,()=>({"nodes":[{"x":80,"y":420,"r":60},{"x":500,"y":320,"r":78,"goal":true}],"gravity":[{"x":300,"y":400,"r":20,"range":150,"force":-700}],"obstacles":[{"x":300,"y":460,"r":45}]})],['twins',21,()=>layout(25)],
  ['lock',20,()=>({
    nodes:[{x:95,y:355},{x:460,y:350,goal:true}],
    flightKey:{x:280,y:350,r:43},goalKey:'gold',lockHint:'先穿过钥匙，再抵达终点'
  })],
  ['wall',17,()=>({
    nodes:[{x:100,y:365},{x:500,y:360,goal:true}],
    walls:[{a:{x:300,y:280},b:{x:300,y:370}}]
  })],
  ['movingBounce',23,()=>layout(39,2)],['movingGravity',25,()=>{const level=layout(29,2);level.obstacles=level.obstacles.slice(0,1);return level}],
  ['twinWind',28,()=>{const level=layout(40,2);delete level.obstacles;return level}],
  ['timedPortal',24,()=>layout(6)],['timedMoving',22,()=>layout(5)],
  ['reverseWind',26,()=>{const level=layout(20);level.nodes[0].spin=-1;return level}]
].map(([id,unlock,make])=>({id,unlock,make}));

const families={
  timedMoving:'moving',timedPortal:'portal',movingBounce:'bounce',
  movingGravity:'gravity',reverseWind:'wind',twinWind:'twins'
};
const familyOf=pattern=>families[pattern.id]||pattern.id;

function shuffle(items,random){
  const order=items.slice();
  for(let i=order.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [order[i],order[j]]=[order[j],order[i]];
  }
  return order;
}

function difficulty(hops){
  const tier=Math.min(10,Math.floor(hops/5));
  return {tier,radius:hops<8?76-hops:72-3*tier,rate:1.38+.025*tier};
}
function build(pattern,hops,sourceRadius,mirrored,variation=0){
  const {radius,rate}=difficulty(hops);
  const level=structuredClone(pattern.make());
  level.pattern=pattern.id;
  const source=level.nodes[0];
  source.r=sourceRadius;
  source.orbitRate=rate;
  if(pattern.id.startsWith('timer')||pattern.id.startsWith('timed'))source.launchSeconds=3*tau/rate+.25;
  for(const target of level.nodes.slice(1))target.r=radius;
  const target=level.nodes[1];
  const sizeChange=(72-radius)/30;
  if(pattern.id==='direct'){
    const distance=230+Math.min(8,hops)*14+Math.max(0,Math.min(42,hops-8))*2;
    const spread=.16+Math.min(hops,8)*.067;
    const angle=(variation*2-1)*spread;
    target.x=source.x+Math.cos(angle)*distance;
    target.y=source.y+Math.sin(angle)*distance;
  }else if(!pattern.id.startsWith('timed')){
    target.y+=Math.sin(variation*tau)*9;
  }
  for(const n of [...level.nodes,...level.obstacles||[]]){
    if(n.move)n.move.phase=variation*tau;
  }
  const adjustments={gravity:[-25,-25],wind:[-50,-25],reverseWind:[-50,-25],repel:[-25,-60],twins:[-75,0],wall:[0,50],movingBounce:[-75,-75],movingGravity:[-25,0],twinWind:[-120,-20]};
  const shift=adjustments[pattern.id];
  if(shift){target.x+=shift[0]*sizeChange;target.y+=shift[1]*sizeChange}
  if(pattern.id==='reverseWind')target.y-=65;
  if(pattern.id==='repel')level.gravity[0].force=-420;
  if(pattern.id==='wall'){level.walls[0].b.y=345;target.y+=30;}
  if(pattern.id==='bounce'){
    level.reflectors[0].a.y+=65*sizeChange;
    level.reflectors[0].b.y+=65*sizeChange;
  }
  if(level.twinOffset)level.twinDistance=Math.max(8,Math.min(level.twinDistance,Math.round(radius*.2)));
  if(mirrored&&!level.twinOffset){
    const flip=p=>p.x=600-p.x;
    for(const n of level.nodes){flip(n);n.spin=-(n.spin||1)}
    for(const p of [...level.obstacles||[],...level.gravity||[]])flip(p);
    if(level.flightKey)flip(level.flightKey);
    for(const p of [...level.walls||[],...level.reflectors||[]]){flip(p.a);flip(p.b)}
    for(const p of level.portals||[]){flip(p.entry);flip(p.exit);p.rotation=-p.rotation}
    for(const zone of level.wind||[]){zone.x=600-zone.x-zone.w;zone.ax=-zone.ax}
  }
  return level;
}
function simulate(waiting,trace=false){
  const shot=waiting.clone(),points=[];
  shot.action();
  for(let frame=0;frame<720&&(shot.flight||shot.inTransit)&&shot.state==='playing';frame++){
    const flying=shot.flight;
    shot.step(dt);
    if(trace&&flying&&shot.flight)points.push({...shot.ball});
  }
  return {shot,points};
}
function findShot(game){
  const waiting=game.clone(),period=tau/game.level.nodes[0].orbitRate;
  const timed=game.launchRemaining!==null;
  const first=timed?Math.ceil(2*period/dt):0;
  const limit=Math.ceil((timed?game.launchRemaining:3*period)/dt);
  let streak=[];
  for(let frame=0;frame<limit&&waiting.state==='playing';frame++){
    if(frame>=first&&frame%4===0){
      if(simulate(waiting).shot.state==='won'){
        streak.push(waiting.clone());
        if(streak.length===3)return streak[1];
      }else streak=[];
    }
    waiting.step(dt);
  }
  return null;
}
function placeStar(game,proof){
  const {points}=simulate(proof,true);
  const from=game.level.nodes[0],goals=game.level.nodes.slice(1);
  for(const ratio of [.5,.4,.6,.3,.7]){
    const p=points[Math.floor(points.length*ratio)];
    if(!p||p.y<90||p.y>620||Math.hypot(p.x-from.x,p.y-from.y)<from.r+25)continue;
    if(goals.some(n=>Math.hypot(p.x-n.x,p.y-n.y)<n.r+30))continue;
    if(game.level.flightKey&&Math.hypot(p.x-game.level.flightKey.x,p.y-game.level.flightKey.y)<50)continue;
    return {x:p.x,y:p.y,r:15};
  }
  const p=points[Math.floor(points.length/2)];
  return {x:p.x,y:p.y,r:15};
}

class EndlessRun{
  constructor(random=Math.random){
    this.random=random;this.hops=0;this.game=null;this.credited=false;
    this.deck=[];this.unlockedFamilies=new Set();this.lastFamily=null;this.directStreak=0;
  }
  get score(){return this.hops*10}
  mechanicChoices(){
    const byFamily=new Map(),newFamilies=[];
    for(const pattern of patterns.slice(1)){
      if(pattern.unlock>this.hops)continue;
      const family=familyOf(pattern);
      if(!byFamily.has(family))byFamily.set(family,[]);
      byFamily.get(family).push(pattern);
      if(this.unlockedFamilies.has(family))continue;
      this.unlockedFamilies.add(family);
      newFamilies.push(family);
    }
    if(!this.deck.length){
      this.deck=shuffle([...byFamily.keys()],this.random);
    }else{
      for(const family of newFamilies){
        const slot=Math.floor(this.random()*(this.deck.length+1));
        this.deck.splice(slot,0,family);
      }
    }
    return this.deck.filter(family=>family!==this.lastFamily)
      .flatMap(family=>shuffle(byFamily.get(family),this.random));
  }
  next(anchor={x:0,y:0,r:76}){
    const withStar=this.random()<.2;
    const direct=patterns[0];
    const baseJump=this.hops<8||(this.directStreak<2&&this.random()<.25);
    const choices=baseJump?[direct]:[...this.mechanicChoices(),direct];
    const variation=this.random();
    const mirror=this.hops>8&&this.random()<.12;
    for(const pattern of choices){
      const options=pattern===direct?[variation]:[variation,0];
      for(const shape of options){
        const game=new OrbitGame(build(pattern,this.hops,anchor.r,mirror,shape));
        if(Number.isFinite(anchor.angle)){game.angle=anchor.angle;game.ball=game.orbitPoint()}
        const proof=findShot(game);
        if(!proof)continue;
        if(withStar)game.level.pickups=[placeStar(game,proof)];
        const source=game.node(0);
        this.origin={x:anchor.x-source.x,y:anchor.y-source.y};
        this.startAngle=game.angle;
        if(pattern===direct){
          this.directStreak++;
          this.lastFamily=null;
        }else{
          const family=familyOf(pattern);
          this.deck.splice(this.deck.indexOf(family),1);
          this.lastFamily=family;
          this.directStreak=0;
        }
        this.game=game;
        this.credited=false;
        return game;
      }
    }
    throw new Error('No playable endless segment');
  }
  toWorld(p){return {x:p.x+this.origin.x,y:p.y+this.origin.y}}
  advance(){
    if(this.game?.state!=='won')return false;
    const game=this.game;
    const anchor={...this.toWorld(game.node(game.current)),r:game.level.nodes[game.current].r,angle:game.angle};
    this.hops++;
    this.next(anchor);
    return true;
  }
  collect(){
    if(this.credited||!this.game?.collected.size)return false;
    this.credited=true;
    return true;
  }
  revive(wallet){
    if(this.game?.state!=='dead'||wallet.balance<revivalCost)return false;
    this.game=new OrbitGame(this.game.level);
    this.game.angle=this.startAngle;
    this.game.ball=this.game.orbitPoint();
    if(this.credited)this.game.collected.add(0);
    wallet.balance-=revivalCost;
    return true;
  }
}

const api={EndlessRun,patterns,familyOf,difficulty,build,findShot,simulate,revivalCost};
if(isNode)module.exports=api;else root.StarEndless=api;
})(globalThis);



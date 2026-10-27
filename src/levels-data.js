/* Each stage declares its objects, rules and objectives, independent of rendering. */
const stages=[
 {name:'01 · 第一束引力',tag:'基础',brief:'一跳到达金色终点。观察短虚线，判断切线方向。',budget:2,nodes:[{x:110,y:300},{x:365,y:300,goal:true}]},
 {name:'02 · 连续跃迁',tag:'连续',brief:'经过两颗中继星球抵达终点，最多 4 次发射。',budget:4,required:[1,2],nodes:[{x:85,y:410},{x:220,y:255},{x:385,y:395},{x:520,y:215,goal:true}]},
 {name:'03 · 近路还是稳路',tag:'选路',brief:'3 次内抵达小终点，可以经过中继，也可以直接跳终点。',budget:3,nodes:[{x:85,y:395},{x:245,y:215},{x:435,y:360,r:29,goal:true}]},
 {name:'04 · 追上流星',tag:'预判',brief:'先捕获移动中继，再抵达终点。瞄准它将要到达的位置。',budget:3,required:[1],nodes:[{x:90,y:390},{x:280,y:260,move:{axis:'x',amp:65,rate:.9}},{x:495,y:390,goal:true}]},
 {name:'05 · 绕过禁区',tag:'绕障',brief:'借上方中继绕过红色陨石，3 次内抵达终点。',budget:3,nodes:[{x:90,y:400},{x:275,y:195},{x:485,y:400,goal:true}],obstacles:[{x:285,y:395,r:66}]},
 {name:'06 · 引力弹弓',tag:'借力',brief:'一跳掠过紫色引力场，借弯曲航线抵达终点。别撞核心！',budget:1,needGravity:true,lockHint:'本关需要先掠过紫色引力场，试试借力弯曲航线。',nodes:[{x:90,y:420},{x:490,y:330,r:60,goal:true}],gravity:[{x:300,y:280,r:22,range:155,force:1000}],obstacles:[{x:300,y:385,r:65}]},
 {name:'07 · 折叠空间',tag:'传送',brief:'进入青色入口，从紫色出口飞出；航向逆时针旋转 90°。',budget:1,needPortal:true,lockHint:'需要穿过传送门后才能激活终点。',nodes:[{x:90,y:430},{x:410,y:150,goal:true}],portals:[{entry:{x:240,y:430},exit:{x:410,y:320},r:29,rotation:-Math.PI/2}],obstacles:[{x:300,y:285,r:75}]},
 {name:'08 · 不可回头',tag:'单程',brief:'先想好两个标记的收集顺序。橙星离开后崩解；走错顺序会需要返回它。',budget:4,required:[1,2],nodes:[{x:90,y:420},{x:310,y:330,fragile:true},{x:170,y:170},{x:520,y:420,goal:true}],obstacles:[{x:300,y:260,r:35}]},
 {name:'09 · 钥匙与开关',tag:'机关',brief:'先取金色钥匙，再去蓝色开关打开闸门，最后穿门到终点。',budget:3,goalKey:'gold',goalSwitch:'blue',lockHint:'终点仍锁定：需要金色钥匙和蓝色开关。',nodes:[{x:80,y:425},{x:185,y:220,key:'gold'},{x:375,y:390,switch:'blue'},{x:530,y:190,goal:true}],gates:[{x:460,y:280,r:44,key:'gold',switch:'blue'}]}
];
if(typeof module!=='undefined'&&module.exports)module.exports=stages;else globalThis.PlanetLevels=stages;





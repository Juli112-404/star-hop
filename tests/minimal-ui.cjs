const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'../src'),html=fs.readFileSync(path.join(root,'review.html'),'utf8'),source=fs.readFileSync(path.join(root,'review.js'),'utf8');
assert.ok(!/id="(?:mission|metrics-note)"|class="hint"|STAR HOP \/ LOCAL REVIEW/.test(html));
assert.ok(!/keydown|Space|空格/.test(source));
assert.ok(!/keydown|Space|空格/.test(fs.readFileSync(path.join(root,'core.js'),'utf8')));
const {OrbitGame}=require('../src/levels-engine.js'),stages=require('../src/review-data.js');
for(const width of [390,900]){
 const drawn=[],handlers={},elements=new Map();let frame;
 const children=stages.map((_,i)=>({dataset:{level:String(i)},scrollIntoView(){}}));
 const context2d=new Proxy({},{get:(_,k)=>k==='fillText'?((s)=>drawn.push(s)):(()=>{}),set:()=>true});
 function element(){return{style:{},classList:{toggle(){},remove(){}},innerHTML:'',textContent:'',getBoundingClientRect:()=>({bottom:128}),getContext:()=>context2d,scrollIntoView(){},querySelectorAll:()=>children}}
 for(const key of ['canvas','.overlay','.panel h1','.panel p','#primary','#retry','#export','#levels','#levels .active','#status','.levelbar','#pause','#restart'])elements.set(key,element());
 const doc={querySelector(sel){assert.ok(elements.has(sel),'Unexpected or removed DOM reference: '+sel);return elements.get(sel)},addEventListener(n,fn){handlers[n]=fn},createElement(){return{click(){}}}};
 const saved=new Map();
 const scope={StarCheckpoint:require('../src/checkpoints.js'),StarEconomy:require('../src/economy.js'),document:doc,localStorage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)},innerWidth:width,innerHeight:844,devicePixelRatio:1,location:{search:'?level=1'},URLSearchParams,OrbitEngine:require('../src/levels-engine.js'),PlanetLevels:stages,addEventListener(n,f){handlers[n]=f},requestAnimationFrame:f=>frame=f,Math,Date,JSON,Set};
 vm.runInNewContext(source.replace('})();','globalThis.testHooks={game:()=>game,select,action,completed};})();'),scope);frame(16);assert.ok(drawn.includes('点击释放起跳'));assert.equal(elements.get('.overlay').style.display,'none');assert.ok(!handlers.keydown);
 drawn.length=0;elements.get('canvas').onpointerdown({preventDefault(){}});frame(32);assert.ok(!drawn.includes('点击释放起跳'));assert.equal(scope.testHooks.game().used,1);assert.ok(!elements.get('#status').textContent.includes('/'));
 const hook=scope.testHooks;
 children[49].onclick();assert.equal(hook.game().level.name,stages[0].name);
 hook.completed[0]=1;
 children[1].onclick();drawn.length=0;frame(48);assert.ok(!drawn.includes('点击释放起跳'),'unlocked level opens');assert.equal(elements.get('.overlay').style.display,'none');assert.ok(!/<span>/.test(elements.get('#levels').innerHTML));
 elements.get('#pause').onclick();assert.equal(elements.get('#export').style.display,'inline-block');elements.get('#primary').onclick();assert.equal(elements.get('.overlay').style.display,'none');
 for(let i=1;i<49;i++)hook.completed[i]=1;
 delete hook.completed[41];
 hook.select(41);hook.action();hook.game().capture(1,0);frame(100);assert.equal(hook.game().current,1);hook.game().step=()=>hook.game().fail('碰撞');frame(120);assert.equal(elements.get('#primary').textContent,'从落点继续');elements.get('#primary').onclick();assert.equal(hook.game().current,1,'retry restores relay instead of start');assert.equal(hook.game().launchRemaining,stages[41].nodes[1].launchSeconds);assert.equal(hook.game().state,'playing');
 assert.equal(JSON.parse(saved.get('star-hop-review-20261027-wallet-permanent-v1')).used[41],1);
 hook.completed[41]=1;hook.select(49);hook.action();hook.game().capture(1,0);frame(140);hook.game().step=()=>hook.game().fail('碰撞');frame(160);assert.equal(elements.get('#primary').textContent,'↻');elements.get('#primary').onclick();assert.equal(hook.game().current,0,'three-jump level retries from start');
}
console.log('PASS minimal mobile/desktop UI: no footer or stage prompts, no keyboard launch, tutorial only before first shot in level 1, other levels start immediately, pause menu works.');





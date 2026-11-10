const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const scripts=html=>[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]);
function openEdition(name,hash='',search=''){
 const html=fs.readFileSync(path.join(__dirname,'..',name),'utf8');
 const [data,code]=scripts(html),scenes=JSON.parse(data),events={};
 const frame={style:{},contentWindow:{focus(){}},removeAttribute(name){delete this[name]}};
 const document={body:{style:{}},addEventListener:(n,f)=>events[n]=f,getElementById:id=>id==='game'?frame:{textContent:data}};
 const location={search,get hash(){return hash},set hash(value){hash=value&&!value.startsWith('#')?'#'+value:value}};
 vm.runInNewContext(code,{document,location,URLSearchParams,addEventListener:(n,f)=>events[n]=f});
 return {frame,scenes,events,location,html};
}
const normal=openEdition('index.html');
const judge=openEdition('judge.html');
for(const edition of [normal,judge]){
 assert.equal(edition.frame.style.display,'none');
 assert.match(edition.html,/<h2>闯关<\/h2>/);
 assert.match(edition.html,/<h2>无尽<\/h2>/);
 for(const [href,scene] of [['review.html','levels'],['planet.html','planet']]){
  edition.events.click({target:{closest:()=>({getAttribute:()=>href})},preventDefault(){}});
  edition.events.hashchange();
  assert.equal(edition.frame.style.display,'block');
  assert.equal(edition.frame.srcdoc,edition.scenes[scene]);
  edition.events.message({source:edition.frame.contentWindow,data:{starHopNavigate:'index.html'}});
  edition.events.hashchange();
  assert.equal(edition.frame.style.display,'none');
 }
}
const direct=openEdition('judge.html','','?level=40');
assert.equal(direct.frame.srcdoc,direct.scenes.levels);
direct.events.message({source:direct.frame.contentWindow,data:{starHopNavigate:'index.html'}});
direct.events.hashchange();
assert.equal(direct.frame.style.display,'none');
const flag='<script>globalThis.StarHopJudge=true;</script>';
for(const mode of ['levels','planet'])assert.equal(judge.scenes[mode].replace(flag,''),normal.scenes[mode]);
judge.events.message({source:judge.frame.contentWindow,data:{starHopNavigate:'index.html'}});
assert.equal(judge.location.hash,'#home');
judge.location.hash='#home';judge.events.hashchange();assert.equal(judge.frame.style.display,'none');

const campaignKey='star-hop-review-20261027',walletKey=campaignKey+'-wallet-permanent-v1';
const judgeWallet='star-hop-judge-wallet-v1';
const saved=new Map([[campaignKey,JSON.stringify({completed:{0:1}})],[walletKey,'{"balance":8}']]);
function campaign(scene){
 const els=new Map(),options=Array.from({length:50},(_,i)=>({dataset:{level:String(i)}}));
 const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
 function el(s){if(!els.has(s))els.set(s,{style:{},classList:{toggle(){},remove(){}},querySelectorAll:()=>options,getContext:()=>ctx,scrollIntoView(){},getBoundingClientRect:()=>({bottom:130})});return els.get(s)}
 const scope=vm.createContext({document:{querySelector:el,addEventListener(){}},location:{search:''},URLSearchParams,innerWidth:390,innerHeight:844,devicePixelRatio:1,addEventListener(){},requestAnimationFrame(){},localStorage:{getItem:key=>saved.get(key)??null,setItem:(k,v)=>saved.set(k,v)}});
 for(const code of scripts(scene))vm.runInContext(code,scope);
 return {el,options};
}
const regular=campaign(normal.scenes.levels);
assert.equal((regular.el('#levels').innerHTML.match(/disabled/g)||[]).length,48);
regular.options[49].onclick();
assert.match(regular.el('#levels').innerHTML,/class="active"\s+data-level="1"/);
regular.el('canvas').onpointerdown({preventDefault(){}});
assert.equal(JSON.parse(saved.get(walletKey)).used[1],1);
const free=campaign(judge.scenes.levels);
assert(!free.el('#levels').innerHTML.includes('disabled'));
free.options[49].onclick();
assert.match(free.el('#levels').innerHTML,/class="active"\s+data-level="49"/);
for(let i=0;i<7;i++){
 free.el('#restart').onclick();
 free.el('canvas').onpointerdown({preventDefault(){}});
}
assert.deepEqual(JSON.parse(saved.get(judgeWallet)).used,{});
assert.equal(JSON.parse(saved.get(walletKey)).balance,8);
assert.equal(JSON.parse(saved.get(walletKey)).used[1],1);
console.log('PASS both standalone home menus and mode links, judge deep links, 50 free levels, separated storage and normal unlocks/attempts');

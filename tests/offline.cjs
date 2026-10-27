const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const data=JSON.parse(html.match(/<script type="application\/json" id="game-data">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(Object.keys(data),['levels','planet']);
for(const page of Object.values(data)){
 for(const script of page.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
 assert.ok(!/<script[^>]+src=|<link[^>]+href=|https?:\/\//.test(page));
}
assert.ok(!/转个弯|turn\.html|turn\.js/.test(html));
for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
const frame={style:{},contentWindow:{focus(){}},removeAttribute(){this.srcdoc=''}};
const ctx={document:{getElementById:id=>id==='game'?frame:{textContent:JSON.stringify(data)},body:{style:{}},addEventListener(){}},location:{hash:'#levels'},addEventListener(){}};
const main=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
vm.runInNewContext(main,ctx);assert.equal(frame.srcdoc,data.levels);assert.equal(frame.style.display,'block');
ctx.location.hash='#planet';vm.runInNewContext('route()',ctx);assert.equal(frame.srcdoc,data.planet);
ctx.location.hash='';vm.runInNewContext('route()',ctx);assert.equal(frame.style.display,'none');
console.log('PASS: 2 planet modes only; embedded scripts parse; no external resources; lobby/level/endless navigation passes.');


/* Rebuild the self-contained HTML with Node.js. Playing the HTML does not require Node.js. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=__dirname,src=path.join(root,'src');
function read(name){return fs.readFileSync(path.join(src,name),'utf8')}
function inline(name){return read(name).replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,f)=>'<style>'+read(f)+'</style>').replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>{const js=read(f);new vm.Script(js,{filename:f});return '<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script>'})}
const bridge=`<script>document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const href=a.getAttribute('href');if(['index.html','levels.html','review.html','planet.html'].includes(href)){e.preventDefault();parent.postMessage({starHopNavigate:href},'*')}});<\/script>`;
const games={levels:inline('review.html'),planet:inline('planet.html')};
for(const key in games)games[key]=games[key].replace('</body>',bridge+'</body>');
let html=inline('index.html');
html=html.replace('<body>','<body><iframe id="game" title="星际跃迁游戏画面" style="display:none;position:fixed;inset:0;width:100%;height:100dvh;border:0;background:#0b1220;z-index:10"></iframe>');
html=html.replace('</body>',`<script type="application/json" id="game-data">${JSON.stringify(games).replace(/</g,'\\u003c')}</script><script>
const scenes=JSON.parse(document.getElementById('game-data').textContent),frame=document.getElementById('game');
const routes={'levels.html':'levels','review.html':'levels','planet.html':'planet','index.html':''};
function route(){const mode=location.hash.slice(1);if(scenes[mode]){frame.onload=()=>frame.contentWindow.focus();frame.srcdoc=scenes[mode];frame.style.display='block';document.body.style.overflow='hidden'}else{frame.style.display='none';frame.removeAttribute('srcdoc');document.body.style.overflow=''}}
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const href=a.getAttribute('href');if(Object.hasOwn(routes,href)){e.preventDefault();location.hash=routes[href]}});
addEventListener('message',e=>{if(e.source===frame.contentWindow&&Object.hasOwn(routes,e.data?.starHopNavigate))location.hash=routes[e.data.starHopNavigate]});
addEventListener('hashchange',route);route();
</script></body>`);
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Built Star Hop offline HTML:',Buffer.byteLength(html),'bytes');


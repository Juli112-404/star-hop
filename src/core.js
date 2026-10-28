/* Shared presentation, storage and fixed-step clock. Game rules stay in separate files. */
const Arcade=(()=>{
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function mount(id,title){
 document.body.insertAdjacentHTML('beforeend',`<canvas aria-label="${title}游戏画面"></canvas><header class="top"><a href="index.html">← 选择游戏</a><button class="pause" aria-label="暂停">Ⅱ</button><div class="stats"><strong id="score">0</strong>最高 <span id="best">0</span></div></header><div class="overlay"><section class="panel"><h1>${title}</h1><p></p><button>开始挑战</button><a href="index.html">返回选择页</a></section></div>`);
 const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),overlay=document.querySelector('.overlay'),panel=overlay.querySelector('p'),button=overlay.querySelector('button');let best=0;try{best=+localStorage.getItem(id)||0}catch{}document.querySelector('#best').textContent=best;
 const api={canvas,ctx,w:0,h:0,score:0,combo:0,state:'ready',notice:'',noticeTime:0,onStart:()=>{},onAction:()=>{},update:()=>{},draw:()=>{},clamp};
 function resize(){api.w=innerWidth;api.h=innerHeight;let d=Math.min(devicePixelRatio||1,2);canvas.width=api.w*d;canvas.height=api.h*d;ctx.setTransform(d,0,0,d,0,0)}addEventListener('resize',resize);resize();
 api.message=(s)=>{api.notice=s;api.noticeTime=1.25};
 api.award=(perfect)=>{api.combo=perfect?api.combo+1:0;let points=perfect?20+Math.min(api.combo-1,10)*5:10;api.score+=points;document.querySelector('#score').textContent=api.score;api.message(perfect?`PERFECT  +${points}  ×${api.combo}`:`成功 +${points}`);if(api.score>best){best=api.score;document.querySelector('#best').textContent=best;try{localStorage.setItem(id,best)}catch{}}};
 api.fail=(reason)=>{api.state='dead';panel.textContent=`${reason}\n本局 ${api.score} 分 · 最高 ${best} 分`;button.textContent='立即重开';overlay.style.display='grid'};
 function start(){api.score=0;api.combo=0;api.noticeTime=0;document.querySelector('#score').textContent=0;api.state='playing';overlay.style.display='none';api.onStart()}
 button.onclick=()=>{if(api.state==='paused'){api.state='playing';overlay.style.display='none'}else start()};panel.textContent='';
 function pause(){if(api.state!=='playing')return;api.state='paused';panel.textContent='';button.textContent='继续挑战';overlay.style.display='grid'}document.querySelector('.pause').onclick=pause;document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
 canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(api.state==='playing')api.onAction()});
 let prev=0,acc=0;function frame(t){let dt=Math.min((t-prev)/1000||0,0.05);prev=t;if(api.state==='playing'){acc+=dt;while(acc>=1/120){api.update(1/120);acc-=1/120}api.noticeTime-=dt}else acc=0;ctx.clearRect(0,0,api.w,api.h);api.draw();if(api.noticeTime>0){ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 22px system-ui';ctx.fillText(api.notice,api.w/2,api.h*.22)}requestAnimationFrame(frame)}requestAnimationFrame(frame);return api;
}return{mount,clamp};})();



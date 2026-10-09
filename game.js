/* Skyline Sprint — original canvas artwork, no dependencies or external assets. */
(() => {
  'use strict';
  const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
  const $=id=>document.getElementById(id), L=SkylineLevel, STORE='skyline-sprint-v1';
  const read=key=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Private browsing can disable persistence. */}};
  let saved=read(STORE),game=new SkylineEngine.Game(),mode='title',camera=0,accumulator=0,last=0;
  let keys={left:false,right:false,shoot:false},jump=false,particles=[],sound=false,audio=null,noticeUntil=0,visualTime=0;
  let W=1200;const H=675;
  function resize(){W=window.innerWidth<500&&window.innerHeight>window.innerWidth?540:1200;canvas.width=W;canvas.height=H;}
  resize();window.addEventListener('resize',resize);
  if(saved&&(saved.version===1||saved.version===2))$('continue').hidden=false;
  function tone(freq,duration=.09,type='sine',volume=.035) {
    if(!sound)return;
    try {audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.65,audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}
  }
  function notice(text) {$('notice').textContent=text;$('notice').classList.add('show');noticeUntil=performance.now()+2600;}
  function format(t) {return `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;}
  function start(resume=false) {
    game=new SkylineEngine.Game(resume?saved:null);camera=Math.max(0,game.player.x-W*.28);particles=[];mode='playing';accumulator=0;keys={left:false,right:false,shoot:false};jump=false;
    $('overlay').hidden=true;canvas.focus();$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');
    if(!resume){saved=game.save();write(STORE,saved);}
    notice(resume?'Welcome back. Your checkpoint is ready.':'Move → · Space to jump · F to shoot · Wait for tall spikes to retract');
  }
  function pause() {
    if(mode==='title'||mode==='won'||mode==='gameover')return;
    if(mode==='paused'){mode='playing';$('overlay').hidden=true;canvas.focus();last=performance.now();}
    else {mode='paused';keys={left:false,right:false,shoot:false};jump=false;$('overlay').hidden=false;$('overlay').innerHTML='<div class="intro"><span class="pill">TAKE A BREATHER</span><h1>The horizon<br>can <em>wait.</em></h1><p>Your adventure is paused.<br>Press P or Escape to keep going.</p><button class="primary" id="resume">Keep going ↗</button><button class="secondary" id="restart">New run</button></div>';$('resume').onclick=pause;$('restart').onclick=()=>{if(confirm('Start a new run? Your saved checkpoint will be replaced.'))start();};}
    $('pause').textContent=mode==='paused'?'▶':'Ⅱ';$('pause').setAttribute('aria-label',mode==='paused'?'Resume game':'Pause game');
  }
  $('start').onclick=()=>start();$('continue').onclick=()=>start(true);$('pause').onclick=pause;
  $('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Disable sound':'Enable sound');tone(660);};
  const actionFor=code=>({ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyF:'shoot',KeyJ:'shoot'})[code];
  window.addEventListener('keydown',e=>{
    const a=actionFor(e.code);
    if(a&&mode==='playing'){e.preventDefault();if(a==='jump'){if(!e.repeat)jump=true;}else keys[a]=true;}
    if(!e.repeat&&(e.code==='KeyP'||e.code==='Escape'))pause();
    if(!e.repeat&&e.code==='KeyR'&&mode==='playing'){game.respawn();notice('One life used · Back to your checkpoint');}
  });
  window.addEventListener('keyup',e=>{const a=actionFor(e.code);if(a&&a!=='jump')keys[a]=false;});
  window.addEventListener('blur',()=>{if(mode==='playing')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
  for(const button of document.querySelectorAll('[data-key]')) {
    const key=button.dataset.key;
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(mode!=='playing')return;if(key==='jump')jump=true;else keys[key]=true;});
    const release=()=>{if(key!=='jump')keys[key]=false;};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  }
  function burst(x,y,color,count=10){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*170,vy:-Math.random()*170,life:.6,color});}
  function events(){for(const event of game.events.splice(0)) {
    if(event==='jump'){tone(350);burst(game.player.x+15,game.player.y+44,'#e8f5cf',6);}
    if(event==='gateHit')notice('Wait for the tall spikes to retract, then run through');
    if(event==='coin'){tone(850,.12);burst(game.player.x+15,game.player.y+20,'#e7ef9a',5);}
    if(event==='stomp'){tone(200);burst(game.player.x+15,game.player.y+44,'#c8e7ce');}
    if(event==='shoot')tone(690,.055,'triangle',.015);
    if(event==='hit'){tone(230,.08);burst(game.player.x+22,game.player.y+18,'#f0c89b',7);}
    if(event==='enemyShoot'||event==='bossShoot')tone(155,.08,'sawtooth',.008);
    if(event==='spring'){tone(420,.16);burst(game.player.x+15,game.player.y+44,'#b8f5dd',14);}
    if(event==='crumble')tone(120,.1,'triangle',.015);
    if(event.type==='bossHit'){const b=game.level.bosses[event.region];tone(310,.15,'square',.025);burst(b.x+40,b.y+40,'#ffe8ab',18);}
    if(event.type==='bossDefeated'){const b=game.level.bosses[event.region];tone(920,.5);notice(event.region===4?'Guardian defeated! Reach the lighthouse →':'Boss defeated! Keep going →');burst(b.x+40,b.y+40,'#fff2b5',55);}
    if(event==='hunterAwakes')notice('The Shadow Hunter is following you! Turn and fire to stop it.');
    if(event==='hunterHit'){tone(260,.12,'square',.02);const h=game.level.pursuer;burst(h.x+34,h.y+40,'#dcbcf5',9);}
    if(event==='hunterDefeated'){tone(860,.45);notice('Shadow Hunter defeated!');}
    if(event==='respawn'){tone(130,.2);notice(`${game.lives} lives left · Try again!`);camera=Math.max(0,game.player.x-W*.28);saved=game.save();write(STORE,saved);}
    if(event==='gameOver')gameOver();
    if(event==='checkpoint'){tone(660,.3);saved=game.save();write(STORE,saved);notice('⚑ Checkpoint saved · Keep your spark');burst(game.player.x,game.player.y,'#d8f291',22);}
    if(event==='win')win();
  }}
  function win(){mode='won';try{localStorage.removeItem(STORE);}catch{}saved=null;
    const best=read('skyline-sprint-best');if(!best||game.time<best.time)write('skyline-sprint-best',{time:game.time,coins:game.collected.size});
    $('overlay').hidden=false;$('overlay').innerHTML=`<div class="intro"><span class="pill">THE LIGHT IS HOME</span><h1>You reached<br>the <em>skyline.</em></h1><p>Five landscapes. A thousand little leaps.<br>${format(game.time)} · ${game.collected.size} fireflies · ${game.deaths} retries</p><button class="primary" id="again">One more adventure ↗</button><div class="intro-meta">${!best||game.time<best.time?'YOUR FASTEST FINISH ✦':`BEST TIME ${format(best.time)}`}</div></div>`;$('again').onclick=()=>start();tone(980,.5);}
  function gameOver(){mode='gameover';try{localStorage.removeItem(STORE);}catch{}saved=null;keys={left:false,right:false,shoot:false};
    $('overlay').hidden=false;$('overlay').innerHTML='<div class="intro"><span class="pill">OUT OF LIVES</span><h1>Try the trail<br><em>again.</em></h1><p>Six lives are available each run.<br>Use flags and watch the hazards.</p><button class="primary" id="again">Start a new run ↗</button></div>';$('again').onclick=()=>start();tone(115,.4);}
  function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
  function tree(x,y,scale,color){ctx.fillStyle='#35594d';ctx.fillRect(x-5*scale,y-95*scale,10*scale,95*scale);poly([[x-45*scale,y-40*scale],[x,y-160*scale],[x+45*scale,y-40*scale]],color);poly([[x-35*scale,y-90*scale],[x,y-190*scale],[x+35*scale,y-90*scale]],color);}
  function backdrop(theme,region){
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,theme.sky[0]);g.addColorStop(1,theme.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    const sunX=900-camera*.015%160;ctx.fillStyle=region===4?'#e3e8df':'#ffdfa2';ctx.beginPath();ctx.arc(sunX,170,region===4?37:63,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.13;ctx.beginPath();ctx.arc(sunX,170,95,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    if(region===4){ctx.fillStyle='#dfeede';for(let i=0;i<50;i++){const x=(i*137.17-camera*.04)%W;ctx.globalAlpha=.4+.3*Math.sin(i+visualTime);ctx.fillRect((x+W)%W,60+(i*47)%260,2,2);}ctx.globalAlpha=1;}
    for(let layer=0;layer<3;layer++) {
      const parallax=.07+layer*.12,base=450+layer*55,offset=camera*parallax;
      for(let i=Math.floor(offset/420)-1;i<Math.floor(offset/420)+5;i++){
        const x=i*420-offset,h=95+Math.sin(i*7.8+layer)*45+layer*15;
        poly([[x-90,H],[x-90,base],[x+130,base-h],[x+310,base-20],[x+440,base-65],[x+540,base],[x+540,H]],layer===0?theme.far:theme.mountain);
      }
    }
    ctx.globalAlpha=.6;ctx.fillStyle='#edf0d1';
    for(let i=0;i<6;i++){let x=((i*287-camera*.09+visualTime*3)%1500+1500)%1500-100,y=120+(i%3)*60;round(x,y,120+i%2*60,13,20,'#e2e7cd');round(x+20,y-12,60,20,20,'#e2e7cd');}ctx.globalAlpha=1;
    for(let i=Math.floor(camera*.3/210)-1;i<Math.floor(camera*.3/210)+7;i++){const x=i*210-camera*.3;if(region===2)poly([[x,580],[x+25,360],[x+80,325],[x+130,580]],theme.mountain);else tree(x,585,.7+(i%3)*.1,theme.mountain);}
    if(region===4){ctx.fillStyle='#7aa8af55';ctx.fillRect(0,590,W,85);for(let i=0;i<12;i++){ctx.fillStyle='#deedd733';ctx.fillRect((i*143-camera*.2+visualTime*17)%W,605+(i%3)*20,80,2);}}
  }
  function render(){
    const p=game.player,region=Math.min(4,Math.floor(p.x/(L.ROOM*L.ROOMS_PER_REGION))),t=L.themes[region];
    backdrop(t,region);ctx.save();ctx.translate(-Math.round(camera),0);
    const visible=a=>a.x+a.w>=camera-150&&a.x<camera+W+150;
    for(const a of game.level.platforms.filter(visible)){
      if(a.restoreTimer>0)continue;
      round(a.x,a.y,a.w,a.h,a.ground?0:7,a.crumbling?'#9b7565':a.moving?'#4a8190':t.soil);
      round(a.x,a.y,a.w,a.ground?12:6,a.ground?0:5,a.crumbling?'#dfbe9f':a.moving?'#c0e9e3':t.grass);
      if(a.ground){for(let x=a.x+12;x<a.x+a.w;x+=40){ctx.fillStyle='#ffffff0a';ctx.fillRect(x,a.y+28,15,4);ctx.fillRect(x+8,a.y+70,24,4);}for(let x=a.x+16;x<a.x+a.w;x+=57){poly([[x,550],[x-3,537],[x+4,544],[x+9,536],[x+7,550]],t.grass);}}
      else{ctx.fillStyle='#ffffff40';ctx.fillRect(a.x+12,a.y+11,a.w-24,2);if(a.crumbling)for(let x=a.x+25;x<a.x+a.w-10;x+=32)poly([[x,a.y+3],[x+5,a.y+11],[x+11,a.y+8]],'#674b49');}
    }
    for(const c of game.level.checkpoints){if(c.x<camera-60||c.x>camera+W+60)continue;
      ctx.fillStyle='#dde9d6';ctx.fillRect(c.x,475,4,75);const active=c.n<=game.checkpoint.n;
      poly([[c.x+4,475],[c.x+43,483+Math.sin(visualTime*3)*3],[c.x+4,499]],active?'#d8f291':'#aac2c6');
      if(active){ctx.fillStyle='#d8f29122';ctx.beginPath();ctx.arc(c.x+3,520,35,0,Math.PI*2);ctx.fill();}
    }
    for(const h of game.level.hazards.filter(visible)){for(let x=h.x;x<h.x+h.w;x+=13)poly([[x,h.y+h.h],[x+6,h.y],[x+13,h.y+h.h]],'#f6ab90');}
    for(const gate of game.level.spikeGates.filter(visible)){
      round(gate.x-8,gate.baseY-10,gate.w+16,10,4,'#405363');
      if(gate.warning){ctx.globalAlpha=.35+.25*Math.sin(visualTime*18);round(gate.x-3,160,gate.w+6,390,8,'#f2b098');ctx.globalAlpha=1;}
      if(gate.h<=2)continue;
      round(gate.x,gate.y,gate.w,gate.h,8,gate.kind==='rotor'?'#6b607f':'#8a5b65');
      for(let y=gate.baseY-20;y>gate.y+20;y-=38){
        poly([[gate.x+2,y],[gate.x-16,y-18],[gate.x+2,y-28]],'#f4c8aa');
        poly([[gate.x+gate.w-2,y],[gate.x+gate.w+16,y-18],[gate.x+gate.w-2,y-28]],'#f4c8aa');
      }
      poly([[gate.x+3,gate.y+12],[gate.x+gate.w/2,gate.y-18],[gate.x+gate.w-3,gate.y+12]],'#f6d4b5');
      if(gate.kind==='rotor'){
        ctx.save();ctx.translate(gate.x+gate.w/2,gate.y+55);ctx.rotate(visualTime*5);
        for(let i=0;i<8;i++){const a=i*Math.PI/4;poly([[Math.cos(a-.23)*19,Math.sin(a-.23)*19],[Math.cos(a)*31,Math.sin(a)*31],[Math.cos(a+.23)*19,Math.sin(a+.23)*19]],'#e9dbc1');}
        ctx.fillStyle='#463e57';ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.restore();
      } else {for(let y=gate.y+30;y<gate.baseY-20;y+=52)round(gate.x+11,y,gate.w-22,9,3,'#d8a0a0');}
    }
    for(const s of game.level.springs.filter(visible)){round(s.x,s.y,s.w,s.h,4,'#4c9f96');round(s.x+3,s.y-4,s.w-6,7,3,'#d7f3af');for(let x=s.x+8;x<s.x+s.w-5;x+=13)ctx.fillRect(x,s.y+7,5,5);}
    for(const s of game.level.saws.filter(visible)){const cx=s.x+19,cy=s.y+19;ctx.save();ctx.translate(cx,cy);ctx.rotate(visualTime*5);for(let i=0;i<8;i++){const a=i*Math.PI/4;poly([[Math.cos(a-.2)*15,Math.sin(a-.2)*15],[Math.cos(a)*25,Math.sin(a)*25],[Math.cos(a+.2)*15,Math.sin(a+.2)*15]],'#dce5d7');}ctx.fillStyle='#6e8790';ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dce5d7';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.restore();}
    for(const e of game.level.enemies.filter(visible)){if(e.dead)continue;round(e.x,e.y,e.w,e.h,11,'#d48474');round(e.x+3,e.y+4,26,9,5,'#f0b797');ctx.fillStyle='#243d40';ctx.fillRect(e.x+(e.dir>0?23:5),e.y+8,4,4);for(let i=0;i<3;i++){ctx.fillRect(e.x+5+i*9,e.y+21+Math.sin(visualTime*12+i)*2,3,6);}}
    for(const e of game.level.shooters.filter(visible)){if(e.dead)continue;round(e.x,e.y,e.w,e.h,8,'#775e82');round(e.x+6,e.y+8,e.w-12,15,6,'#e6b1b2');ctx.fillStyle='#2c334b';ctx.fillRect(e.x+(p.x<e.x?3:27),e.y+16,10,7);round(e.x+5,e.y+35,28,7,3,'#423f5f');}
    for(const shot of game.shots.filter(visible)){round(shot.x-3,shot.y-2,shot.w+6,shot.h+4,6,'#e7f59966');round(shot.x,shot.y,shot.w,shot.h,4,'#f7f7b7');}
    for(const shot of game.enemyShots.filter(visible)){ctx.fillStyle='#fac2a8';ctx.beginPath();ctx.arc(shot.x+6,shot.y+6,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffefe0';ctx.beginPath();ctx.arc(shot.x+6,shot.y+6,3,0,Math.PI*2);ctx.fill();}
    for(const boss of game.level.bosses)if(boss.x<camera+W+100&&boss.x+boss.w>camera-100&&!boss.dead){
      ctx.save();if(boss.invulnerable>0&&Math.floor(visualTime*18)%2)ctx.globalAlpha=.45;
      const coats=['#50695c','#486c66','#895b51','#5a6287','#57486e'],faces=['#aac9a2','#93c5b7','#e0a77f','#aab8d9','#aa8096'];
      round(boss.x,boss.y,boss.w,boss.h,21,coats[boss.region]);round(boss.x+9,boss.y+18,64,42,17,faces[boss.region]);
      ctx.fillStyle='#fff4bd';ctx.beginPath();ctx.arc(boss.x+27,boss.y+41,8,0,Math.PI*2);ctx.arc(boss.x+55,boss.y+41,8,0,Math.PI*2);ctx.fill();
      poly([[boss.x+10,boss.y+8],[boss.x+18,boss.y-24],[boss.x+32,boss.y+7]],'#e5bb94');poly([[boss.x+50,boss.y+7],[boss.x+64,boss.y-24],[boss.x+73,boss.y+8]],'#e5bb94');
      round(boss.x-10,boss.y+61,102,18,8,coats[boss.region]);round(boss.x+18,boss.y+89,17,17,5,'#392e4c');round(boss.x+50,boss.y+89,17,17,5,'#392e4c');ctx.restore();
      ctx.globalAlpha=.22+.1*Math.sin(visualTime*5);round(boss.x+338,320,8,230,4,'#fff2ae');ctx.globalAlpha=1;
    }
    const hunter=game.level.pursuer;
    if(hunter.active&&!hunter.dead&&visible(hunter)){
      ctx.save();if(hunter.invulnerable>0&&Math.floor(visualTime*20)%2)ctx.globalAlpha=.45;
      round(hunter.x,hunter.y,hunter.w,hunter.h,19,'#332e57');round(hunter.x+8,hunter.y+17,hunter.w-16,37,16,'#766891');
      poly([[hunter.x+5,hunter.y+15],[hunter.x+12,hunter.y-23],[hunter.x+28,hunter.y+14]],'#b391cc');
      poly([[hunter.x+40,hunter.y+14],[hunter.x+55,hunter.y-23],[hunter.x+63,hunter.y+15]],'#b391cc');
      round(hunter.x+13,hunter.y+36,13,8,4,'#ffbfc5');round(hunter.x+42,hunter.y+36,13,8,4,'#ffbfc5');ctx.restore();
    }
    for(const c of game.level.coins){if(c.x<camera-50||c.x>camera+W+50||game.collected.has(c.id))continue;
      const y=c.y+Math.sin(visualTime*3+c.id)*4;ctx.fillStyle='#edf59d20';ctx.beginPath();ctx.arc(c.x,y,15,0,Math.PI*2);ctx.fill();poly([[c.x,y-8],[c.x+4,y-2],[c.x+8,y],[c.x+3,y+3],[c.x,y+8],[c.x-3,y+3],[c.x-8,y],[c.x-3,y-3]],'#eff7b0');}
    for(const s of game.level.signs){if(s.x<camera-400||s.x>camera+W)continue;round(s.x,590,390,35,8,'#142b32aa');ctx.font='12px system-ui';ctx.fillStyle='#e6e9d5';ctx.fillText(s.text,s.x+15,612);}
    const finish=game.level.finish;
    if(finish<camera+W+200){const x=finish+65;ctx.fillStyle='#eadfc0';ctx.fillRect(x,325,65,225);poly([[x-5,325],[x+32,285],[x+70,325]],'#db8e7c');ctx.fillStyle='#df9b7b';ctx.fillRect(x,400,65,25);round(x+12,327,41,39,6,'#fff3b3');round(x+23,510,20,40,8,'#334d58');ctx.globalAlpha=.15;poly([[x+32,342],[x-600,205],[x-600,470]],'#fff6ae');ctx.globalAlpha=1;}
    // A tiny courier: flowing scarf, teal jacket, and a warm lantern glow.
    ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);if(p.invincible>0&&Math.floor(visualTime*12)%2)ctx.globalAlpha=.45;ctx.scale(p.face,1);
    poly([[-8,-7],[-33,-10+Math.sin(visualTime*13)*4],[-25,1],[-6,0]],'#f19b7a');
    const stride=p.grounded?Math.sin(visualTime*(Math.abs(p.vx)>30?17:0))*5:3;
    round(-10,8,8,13+stride,3,'#233b43');round(3,8,8,13-stride,3,'#233b43');round(-12,-7,24,22,6,'#70b9ab');round(-12,-22,24,20,8,'#eac9a1');round(-14,-23,27,8,5,'#254d54');ctx.fillStyle='#233b43';ctx.fillRect(6,-13,3,4);round(10,0,8,12,3,'#eac9a1');ctx.restore();
    for(const q of particles){ctx.globalAlpha=Math.max(0,q.life/.6);ctx.fillStyle=q.color;ctx.fillRect(q.x,q.y,4,4);}ctx.globalAlpha=1;
    ctx.restore();
    $('region-number').textContent=`CHAPTER ${String(region+1).padStart(2,'0')} / 05`;$('region').textContent=t.name;$('coins').textContent=game.collected.size;$('lives').textContent=game.lives;$('timer').textContent=format(game.time);$('progress').style.width=`${Math.min(100,p.x/game.level.finish*100)}%`;
    const activeBoss=game.level.bosses.find(b=>!b.dead&&Math.abs(p.x-b.x)<850)||(hunter.active&&!hunter.dead&&Math.abs(p.x-hunter.x)<850?hunter:null);
    $('boss-ui').hidden=!activeBoss;
    if(activeBoss){$('boss-name').textContent=activeBoss.name;$('boss-health').style.width=`${Math.max(0,activeBoss.health/activeBoss.maxHealth*100)}%`;}
  }
  function frame(now){
    const dt=Math.min(.05,(now-(last||now))/1000);last=now;visualTime+=dt;
    if(mode==='playing'){
      accumulator+=dt;
      while(accumulator>=1/120){game.step(1/120,{...keys,jump});jump=false;events();accumulator-=1/120;if(mode!=='playing'){accumulator=0;break;}}
      const desired=Math.max(0,Math.min(game.level.width-W,game.player.x-W*.28));camera+=(desired-camera)*Math.min(1,dt*6);
      for(const q of particles){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=250*dt;}particles=particles.filter(q=>q.life>0);
    }
    if(noticeUntil&&now>noticeUntil){$('notice').classList.remove('show');noticeUntil=0;}
    render();requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

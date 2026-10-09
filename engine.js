(function(root) {
  'use strict';
  const L=typeof module!=='undefined'&&module.exports?require('./level.js'):root.SkylineLevel;
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  class Game {
    constructor(saved=null) {
      this.level=L.buildLevel(); this.time=0;this.deaths=0;this.collected=new Set();this.won=false;this.events=[];
      this.shots=[];this.enemyShots=[];this.shootCooldown=0;
      this.checkpoint=this.level.checkpoints[0];
      if(saved && saved.version===1 && Number.isInteger(saved.checkpoint)) {
        this.checkpoint=this.level.checkpoints.find(c=>c.n===saved.checkpoint)||this.checkpoint;
        this.time=Number.isFinite(saved.time)?Math.max(0,saved.time):0;
        this.deaths=Number.isFinite(saved.deaths)?Math.max(0,saved.deaths):0;
        this.collected=new Set(Array.isArray(saved.coins)?saved.coins.filter(id=>Number.isInteger(id)&&id>=0&&id<this.level.coins.length):[]);
      }
      this.player={x:this.checkpoint.x,y:504,w:30,h:44,vx:0,vy:0,jumps:0,grounded:false,coyote:0,buffer:0,face:1,invincible:0};
    }
    save() {return {version:1,checkpoint:this.checkpoint.n,time:this.time,deaths:this.deaths,coins:[...this.collected]};}
    respawn() {
      this.deaths++;Object.assign(this.player,{x:this.checkpoint.x,y:504,vx:0,vy:0,jumps:0,grounded:false,coyote:0,buffer:0,invincible:1.2});
      this.shots.length=0;this.enemyShots.length=0;this.shootCooldown=0;
      this.events.push('respawn');
    }
    step(dt,input={}) {
      if(this.won)return;
      this.time+=dt;
      const p=this.player;p.invincible=Math.max(0,p.invincible-dt);
      this.shootCooldown=Math.max(0,this.shootCooldown-dt);
      if(input.shoot && this.shootCooldown===0){
        this.shots.push({x:p.x+p.w/2+p.face*19,y:p.y+19,w:13,h:7,vx:p.face*620,life:1.25});
        this.shootCooldown=.32;this.events.push('shoot');
      }
      const near=this.level.platforms.filter(a=>Math.abs(a.baseX===undefined?a.x-p.x:a.baseX-p.x)<2000);
      for(const a of near) {
        a.dx=0;
        if(a.moving) { const old=a.x;a.x=a.baseX+Math.sin(this.time*1.3+a.phase)*70;a.dx=a.x-old; }
      }
      for(const a of this.level.platforms){
        if(a.restoreTimer>0){a.restoreTimer=Math.max(0,a.restoreTimer-dt);if(a.restoreTimer===0)a.crumbleTimer=0;}
      }
      if(input.jump)p.buffer=.14;else p.buffer=Math.max(0,p.buffer-dt);
      p.coyote=p.grounded?.12:Math.max(0,p.coyote-dt);
      if(p.buffer>0&&p.coyote>0) {
        p.vy=-620;p.jumps=1;p.grounded=false;p.coyote=0;p.buffer=0;this.events.push('jump');
      }
      const dir=(input.right?1:0)-(input.left?1:0), target=dir*L.SPEED;
      p.vx+=(target-p.vx)*Math.min(1,dt*(p.grounded?17:10));if(dir)p.face=dir;
      p.x=Math.max(0,Math.min(this.level.width-p.w,p.x+p.vx*dt));
      const oldBottom=p.y+p.h;
      p.vy=Math.min(950,p.vy+1700*dt);p.y+=p.vy*dt;p.grounded=false;
      for(const a of near) {
        if(!(a.restoreTimer>0)&&p.vy>=0&&oldBottom<=a.y+1&&p.y+p.h>=a.y&&p.x+p.w>a.x&&p.x<a.x+a.w) {
          p.y=a.y-p.h;p.vy=0;p.grounded=true;p.jumps=0;p.x+=a.dx;
          if(a.crumbling){a.crumbleTimer+=dt;if(a.crumbleTimer>=.42){a.restoreTimer=3;this.events.push('crumble');}}
          break;
        }
      }
      for(const s of this.level.springs){
        if(Math.abs(s.x-p.x)>70)continue;
        if(p.vy>=0&&oldBottom<=s.y+s.h+2&&p.y+p.h>=s.y&&p.x+p.w>s.x&&p.x<s.x+s.w){
          p.y=s.y-p.h;p.vy=-820;p.grounded=false;p.jumps=1;p.coyote=0;this.events.push('spring');break;
        }
      }
      for(const c of this.level.checkpoints) {
        if(c.n>this.checkpoint.n&&p.x>=c.x-30&&p.x<c.x+90&&p.y<650) {this.checkpoint=c;this.events.push('checkpoint');}
      }
      for(const c of this.level.coins) {
        if(!this.collected.has(c.id)&&Math.abs(p.x+p.w/2-c.x)<30&&Math.abs(p.y+p.h/2-c.y)<35) {this.collected.add(c.id);this.events.push('coin');}
      }
      for(const e of this.level.enemies) {
        if(Math.abs(e.x-p.x)>1500)continue;
        if(e.dead)continue;
        e.x+=e.dir*e.speed*dt;if(e.x>e.max){e.x=e.max;e.dir=-1;}if(e.x<e.min){e.x=e.min;e.dir=1;}
        if(overlap(p,e)) {
          if(p.vy>0&&oldBottom<=e.y+12) {e.dead=true;p.vy=-440;p.jumps=1;this.events.push('stomp');}
          else if(p.invincible<=0){this.respawn();return;}
        }
      }
      for(const s of this.level.saws){
        if(Math.abs(s.x-p.x)>100)continue;
        s.y=s.baseY+Math.sin(this.time*2.4+s.phase)*28;
      }
      for(const gate of this.level.spikeGates){
        if(Math.abs(gate.x-p.x)>2000)continue;
        const cycle=(this.time+gate.phase)%gate.period;
        const rise=gate.kind==='rotor'?1.2:1.5,top=gate.kind==='rotor'?1.45:1.8,fall=gate.kind==='rotor'?3.6:3.5;
        const fraction=cycle<rise?0:cycle<top?(cycle-rise)/(top-rise):cycle<fall?1:Math.max(0,(gate.period-cycle)/(gate.period-fall));
        gate.h=gate.maxH*fraction;gate.y=gate.baseY-gate.h;gate.warning=cycle>=rise-.45&&cycle<rise;
        if(gate.h>12&&overlap(p,gate)){this.respawn();this.events.push('gateHit');return;}
      }
      for(const e of this.level.shooters){
        if(e.dead||Math.abs(e.x-p.x)>800)continue;
        e.cooldown-=dt;
        if(e.cooldown<=0&&Math.abs(e.x-p.x)<620&&p.grounded){
          this.fireAt(e.x+e.w/2,e.y+12,p.x+p.w/2,p.y+18,220);e.cooldown=2;this.events.push('enemyShoot');
        }
        if(p.invincible<=0&&overlap(p,e)){this.respawn();return;}
      }
      const boss=this.level.boss;
      if(!boss.dead&&Math.abs(boss.x-p.x)<850){
        boss.invulnerable=Math.max(0,boss.invulnerable-dt);
        boss.y=444+Math.sin(this.time*1.8)*16;
        boss.cooldown-=dt;
        if(boss.cooldown<=0&&Math.abs(boss.x-p.x)<680){
          this.fireAt(boss.x+boss.w/2,boss.y+40,p.x+p.w/2,p.y+18,285);
          this.fireAt(boss.x+boss.w/2,boss.y+40,p.x+p.w/2,p.y-35,245);
          boss.cooldown=Math.max(.85,1.55-(boss.maxHealth-boss.health)*.08);this.events.push('bossShoot');
        }
        if(p.invincible<=0&&overlap(p,boss)){this.respawn();return;}
      }
      for(const shot of this.shots){
        shot.x+=shot.vx*dt;shot.life-=dt;
        for(const e of [...this.level.enemies,...this.level.shooters]){
          if(e.dead||Math.abs(e.x-shot.x)>65||!overlap(shot,e))continue;
          if(e.health){e.health--;if(e.health<=0)e.dead=true;}else e.dead=true;
          shot.life=0;this.events.push('hit');break;
        }
        if(shot.life>0&&!boss.dead&&boss.invulnerable<=0&&overlap(shot,boss)){
          boss.health--;boss.invulnerable=.23;shot.life=0;this.events.push('bossHit');
          if(boss.health<=0){boss.dead=true;this.enemyShots.length=0;this.events.push('bossDefeated');}
        }
      }
      this.shots=this.shots.filter(s=>s.life>0);
      for(const shot of this.enemyShots){
        shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
        if(p.invincible<=0&&overlap(shot,p)){this.respawn();return;}
      }
      this.enemyShots=this.enemyShots.filter(s=>s.life>0);
      if(p.y>800||(p.invincible<=0&&(this.level.hazards.some(h=>Math.abs(h.x-p.x)<100&&overlap(p,h))||this.level.saws.some(s=>Math.abs(s.x-p.x)<65&&overlap(p,s))))){this.respawn();return;}
      if(p.x>=this.level.finish&&p.grounded&&boss.dead){this.won=true;this.events.push('win');}
    }
    fireAt(x,y,targetX,targetY,speed){
      const dx=targetX-x,dy=targetY-y,dist=Math.hypot(dx,dy)||1;
      this.enemyShots.push({x,y,w:12,h:12,vx:dx/dist*speed,vy:dy/dist*speed,life:3});
    }
  }
  const api={Game,overlap};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SkylineEngine=api;
})(typeof window!=='undefined'?window:globalThis);

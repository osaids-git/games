(function(root) {
  'use strict';
  const L=typeof module!=='undefined'&&module.exports?require('./level.js'):root.SkylineLevel;
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  class Game {
    constructor(saved=null) {
      this.level=L.buildLevel(); this.time=0;this.deaths=0;this.collected=new Set();this.won=false;this.events=[];
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
      this.events.push('respawn');
    }
    step(dt,input={}) {
      if(this.won)return;
      this.time+=dt;
      const p=this.player;p.invincible=Math.max(0,p.invincible-dt);
      const near=this.level.platforms.filter(a=>Math.abs(a.baseX===undefined?a.x-p.x:a.baseX-p.x)<2000);
      for(const a of near) {
        a.dx=0;
        if(a.moving) { const old=a.x;a.x=a.baseX+Math.sin(this.time*1.3+a.phase)*70;a.dx=a.x-old; }
      }
      if(input.jump)p.buffer=.14;else p.buffer=Math.max(0,p.buffer-dt);
      p.coyote=p.grounded?.12:Math.max(0,p.coyote-dt);
      if(p.buffer>0&&(p.coyote>0||p.jumps<2)) {
        if(p.coyote>0)p.jumps=0;
        p.vy=p.jumps===0?-620:-550;p.jumps++;p.grounded=false;p.coyote=0;p.buffer=0;this.events.push('jump');
      }
      const dir=(input.right?1:0)-(input.left?1:0), target=dir*L.SPEED;
      p.vx+=(target-p.vx)*Math.min(1,dt*(p.grounded?17:10));if(dir)p.face=dir;
      p.x=Math.max(0,Math.min(this.level.width-p.w,p.x+p.vx*dt));
      const oldBottom=p.y+p.h;
      p.vy=Math.min(950,p.vy+1700*dt);p.y+=p.vy*dt;p.grounded=false;
      for(const a of near) {
        if(p.vy>=0&&oldBottom<=a.y+1&&p.y+p.h>=a.y&&p.x+p.w>a.x&&p.x<a.x+a.w) {
          p.y=a.y-p.h;p.vy=0;p.grounded=true;p.jumps=0;p.x+=a.dx;break;
        }
      }
      for(const c of this.level.checkpoints) {
        if(c.n>this.checkpoint.n&&Math.abs(p.x-c.x)<45&&p.grounded) {this.checkpoint=c;this.events.push('checkpoint');}
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
      if(p.y>800||(p.invincible<=0&&this.level.hazards.some(h=>Math.abs(h.x-p.x)<100&&overlap(p,h)))) {this.respawn();return;}
      if(p.x>=this.level.finish&&p.grounded){this.won=true;this.events.push('win');}
    }
  }
  const api={Game,overlap};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SkylineEngine=api;
})(typeof window!=='undefined'?window:globalThis);

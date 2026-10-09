const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game}=require('../engine.js');
const L=require('../level.js');
const step=(g,count,input={})=>{for(let i=0;i<count;i++)g.step(1/120,input);};

test('five chapters have a 5–15 minute minimum traversal and safe checkpoints',()=>{
  const level=L.buildLevel();assert.equal(L.themes.length,5);assert.equal(level.checkpoints.length,36);
  assert.ok(level.finish/L.SPEED>=300&&level.finish/L.SPEED<=900);
  for(const c of level.checkpoints)assert.ok(level.platforms.some(a=>a.ground&&c.x>=a.x&&c.x+30<=a.x+a.w));
  for(const h of level.hazards)assert.ok(level.platforms.some(a=>a.ground&&h.x>=a.x&&h.x+h.w<=a.x+a.w));
  assert.ok(level.saws.length>=10&&level.springs.length>=10);
  assert.ok(level.platforms.some(a=>a.crumbling));
  assert.equal(level.shooters.length,10);assert.equal(level.boss.maxHealth,7);
  assert.equal(level.spikeGates.length,7);
  assert.ok(level.spikeGates.every(g=>g.x<L.ROOM*L.ROOMS_PER_REGION&&g.maxH>=390));
  assert.ok(level.platforms.filter(a=>a.ground).every(a=>a.w>=0));
  const chapter2Start=L.ROOM*L.ROOMS_PER_REGION,chapter2End=chapter2Start*2;
  const chapter2Targets=[...level.enemies,...level.shooters].filter(e=>e.x>=chapter2Start&&e.x<chapter2End);
  assert.equal(chapter2Targets.length,70);
});
test('one jump is available until landing; pressing again in midair has no effect',()=>{
  const g=new Game();step(g,20);assert.ok(g.player.grounded);
  g.step(1/120,{jump:true});assert.equal(g.player.jumps,1);assert.ok(g.player.vy<0);
  step(g,15);const vy=g.player.vy;g.step(1/120,{jump:true});assert.equal(g.player.jumps,1);assert.ok(g.player.vy>vy);
  step(g,200);assert.ok(g.player.grounded);assert.equal(g.player.jumps,0);
});
test('first-chapter spike gates are too high to jump and open on a cycle',()=>{
  const g=new Game(),gate=g.level.spikeGates[0];
  assert.ok(gate.maxH>300);
  Object.assign(g.player,{x:gate.x-80,y:506,grounded:true});
  g.step(1/120);assert.ok(gate.h>300);
  g.player.x=gate.x;g.player.invincible=0;g.step(1/120);
  assert.equal(g.deaths,1);assert.ok(g.events.includes('gateHit'));
  g.player.x=gate.x;g.time=gate.period-gate.phase+.1;g.player.invincible=0;
  g.step(1/120);assert.equal(gate.h,0);assert.equal(g.deaths,1);
  const pop=g.level.spikeGates.find(item=>item.kind==='pop');
  g.player.x=pop.x;g.player.y=506;g.player.invincible=0;g.time=2.2-pop.phase;
  g.step(1/120);assert.equal(g.deaths,2);assert.ok(pop.h>300);
  g.player.x=pop.x;g.player.invincible=0;g.time=pop.period-pop.phase+.1;
  g.step(1/120);assert.equal(pop.h,0);assert.equal(g.deaths,2);
});
test('falling and thorn collisions return to the saved flag',()=>{
  const g=new Game();g.player.y=810;g.step(1/120);assert.equal(g.deaths,1);assert.equal(g.player.x,g.checkpoint.x);
  const h=g.level.hazards[0];Object.assign(g.player,{x:h.x,y:506,invincible:0});g.step(1/120);assert.equal(g.deaths,2);
});
test('stomping a beetle bounces the player',()=>{
  const g=new Game(),e=g.level.enemies[0];Object.assign(g.player,{x:e.x,y:e.y-44,vy:200});g.step(1/120);
  assert.ok(e.dead);assert.ok(g.player.vy<0);assert.equal(g.deaths,0);
});
test('checkpoint progress and collected fireflies survive reload',()=>{
  const g=new Game(),c=g.level.checkpoints[3];Object.assign(g.player,{x:c.x,y:300});g.step(1/120);
  assert.equal(g.checkpoint.n,c.n);g.collected.add(4);g.time=91;
  const restored=new Game(JSON.parse(JSON.stringify(g.save())));assert.equal(restored.checkpoint.n,c.n);assert.equal(restored.time,91);assert.ok(restored.collected.has(4));
  assert.equal(new Game({version:1,checkpoint:999999,time:'oops',coins:[-1,'x',2]}).checkpoint.n,0);
});
test('springs launch the player and cracked platforms give way, then reset',()=>{
  const g=new Game(),spring=g.level.springs[0];
  Object.assign(g.player,{x:spring.x,y:spring.y-44,vy:100});g.step(1/120);
  assert.ok(g.player.vy<-700);assert.ok(g.events.includes('spring'));
  const cracked=g.level.platforms.find(a=>a.crumbling);
  Object.assign(g.player,{x:cracked.x+20,y:cracked.y-44,vy:0,grounded:true});
  step(g,65);assert.ok(cracked.restoreTimer>0);
  step(g,400);assert.equal(cracked.restoreTimer,0);
});
test('spinning saws and enemy bolts send the player back to a checkpoint',()=>{
  const g=new Game(),saw=g.level.saws[0];
  Object.assign(g.player,{x:saw.x,y:506,invincible:0});g.step(1/120);assert.equal(g.deaths,1);
  g.enemyShots.push({x:g.player.x,y:g.player.y,w:12,h:12,vx:0,vy:0,life:1});g.player.invincible=0;
  g.step(1/120);assert.equal(g.deaths,2);
});
test('the player can defeat a firing enemy with sparks',()=>{
  const g=new Game(),shooter=g.level.shooters[0];
  Object.assign(g.player,{x:shooter.x-200,y:506,grounded:true,invincible:100});
  step(g,180,{shoot:true});assert.ok(shooter.dead);assert.ok(g.events.includes('shoot'));
  const another=g.level.shooters[1];another.cooldown=0;Object.assign(g.player,{x:another.x-200,y:506});g.step(1/120);
  assert.ok(g.enemyShots.length>0);
});
test('the guardian fires, takes multiple hits, and gates the finish',()=>{
  const g=new Game(),boss=g.level.boss;
  Object.assign(g.player,{x:g.level.finish,y:506,grounded:true,invincible:100});g.step(1/120);
  assert.equal(g.won,false);
  Object.assign(g.player,{x:boss.x-260,y:506,grounded:true,face:1});
  step(g,800,{shoot:true});assert.ok(boss.dead,`Boss health ${boss.health}`);assert.ok(g.events.includes('bossShoot'));
  g.player.x=g.level.finish;g.player.y=506;g.player.vy=0;g.step(1/120);
  assert.ok(g.won);
});
test('a running jump controller can finish every chapter',()=>{
  const g=new Game();const dt=1/120;
  for(let frame=0;frame<120*900&&!g.won;frame++) {
    const p=g.player;
    const floor=g.level.platforms.find(a=>p.grounded&&p.x+p.w>a.x&&p.x<a.x+a.w&&Math.abs(p.y+p.h-a.y)<2);
    const edge=floor?floor.x+floor.w-p.x:Infinity;
    const danger=g.level.hazards.some(h=>h.x-p.x>0&&h.x-p.x<125);
    const enemy=g.level.enemies.some(e=>!e.dead&&e.x-p.x>-e.w&&e.x-p.x<120&&Math.abs(e.y-p.y)<80);
    const saw=g.level.saws.some(s=>s.x-p.x>-s.w&&s.x-p.x<125&&Math.abs(s.y-p.y)<90);
    const gate=g.level.spikeGates.find(a=>a.x-p.x>0&&a.x-p.x<170);
    const gateCycle=gate&&(g.time+gate.phase)%gate.period;
    const opening=gate&&(gate.kind==='rotor'?1.2:1.5);
    const gateWait=gate&&!(gateCycle<opening&&opening-gateCycle>(gate.x-p.x+gate.w+35)/L.SPEED+.1);
    const jump=p.grounded&&(edge<25||danger||enemy||saw);
    const right=(g.level.boss.dead||p.x<g.level.boss.x-240)&&!gateWait;
    g.step(dt,{right,jump,shoot:true});g.events.length=0;
  }
  assert.ok(g.won,`Stopped at ${g.player.x}, checkpoint ${g.checkpoint.n}, retries ${g.deaths}`);
  assert.ok(g.time>=300&&g.time<=900,`Finish took ${g.time}s`);
  console.log(`Full-course simulation: ${g.time.toFixed(1)} seconds, ${g.deaths} retries, ${g.collected.size} fireflies`);
});

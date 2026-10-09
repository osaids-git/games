const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Game}=require('../engine.js');
const L=require('../level.js');
const step=(g,count,input={})=>{for(let i=0;i<count;i++)g.step(1/120,input);};

test('five chapters have a 5–15 minute minimum traversal and safe checkpoints',()=>{
  const level=L.buildLevel();assert.equal(L.themes.length,5);assert.equal(level.checkpoints.length,35);
  assert.ok(level.finish/L.SPEED>=300&&level.finish/L.SPEED<=900);
  for(const c of level.checkpoints)assert.ok(level.platforms.some(a=>a.ground&&c.x>=a.x&&c.x+30<=a.x+a.w));
  for(const h of level.hazards)assert.ok(level.platforms.some(a=>a.ground&&h.x>=a.x&&h.x+h.w<=a.x+a.w));
});
test('jump, double jump, and landing reset the jump allowance',()=>{
  const g=new Game();step(g,20);assert.ok(g.player.grounded);
  g.step(1/120,{jump:true});assert.equal(g.player.jumps,1);assert.ok(g.player.vy<0);
  step(g,15);g.step(1/120,{jump:true});assert.equal(g.player.jumps,2);
  const vy=g.player.vy;g.step(1/120,{jump:true});assert.ok(g.player.vy>vy);
  step(g,200);assert.ok(g.player.grounded);assert.equal(g.player.jumps,0);
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
  const g=new Game(),c=g.level.checkpoints[3];Object.assign(g.player,{x:c.x,y:506});g.step(1/120);
  assert.equal(g.checkpoint.n,c.n);g.collected.add(4);g.time=91;
  const restored=new Game(JSON.parse(JSON.stringify(g.save())));assert.equal(restored.checkpoint.n,c.n);assert.equal(restored.time,91);assert.ok(restored.collected.has(4));
  assert.equal(new Game({version:1,checkpoint:999999,time:'oops',coins:[-1,'x',2]}).checkpoint.n,0);
});
test('a running jump controller can finish every chapter',()=>{
  const g=new Game();const dt=1/120;
  for(let frame=0;frame<120*900&&!g.won;frame++) {
    const p=g.player;
    const floor=g.level.platforms.find(a=>p.grounded&&p.x+p.w>a.x&&p.x<a.x+a.w&&Math.abs(p.y+p.h-a.y)<2);
    const edge=floor&&floor.x+floor.w-p.x<130;
    const danger=g.level.hazards.some(h=>h.x-p.x>-h.w&&h.x-p.x<125&&p.y+p.h>h.y-40);
    const enemy=g.level.enemies.some(e=>!e.dead&&e.x-p.x>-e.w&&e.x-p.x<120&&Math.abs(e.y-p.y)<80);
    const jump=p.grounded&&(edge||danger||enemy)||(!p.grounded&&p.jumps===1&&p.vy>-40);
    g.step(dt,{right:true,jump});g.events.length=0;
  }
  assert.ok(g.won,`Stopped at ${g.player.x}, checkpoint ${g.checkpoint.n}, retries ${g.deaths}`);
  assert.ok(g.time>=300&&g.time<=900,`Finish took ${g.time}s`);
  console.log(`Full-course simulation: ${g.time.toFixed(1)} seconds, ${g.deaths} retries, ${g.collected.size} fireflies`);
});

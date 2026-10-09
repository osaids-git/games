(function (root) {
  'use strict';
  const ROOM = 1600, ROOMS_PER_REGION = 14, SPEED = 280;
  const themes = [
    { name: 'Sunlit Meadow', sky: ['#508b91','#dfc88d'], mountain: '#517b77', far: '#779c87', soil: '#365a4a', grass: '#b5cf77', accent: '#e7f59c' },
    { name: 'Whispering Woods', sky: ['#234c65','#94a88e'], mountain: '#2d5965', far: '#437972', soil: '#244c45', grass: '#78be9b', accent: '#b7f0c4' },
    { name: 'Amber Canyon', sky: ['#806179','#f5bc83'], mountain: '#986d73', far: '#b98778', soil: '#795649', grass: '#eac18b', accent: '#ffe1a1' },
    { name: 'Cloudbound Peaks', sky: ['#435880','#b2c8d0'], mountain: '#697e9b', far: '#8fa9b9', soil: '#475b75', grass: '#d6e8e0', accent: '#dbf6ff' },
    { name: 'Starlight Coast', sky: ['#172f50','#697d95'], mountain: '#354d6a', far: '#4c6880', soil: '#2f4859', grass: '#8dbabc', accent: '#ffdf91' }
  ];
  function buildLevel() {
    const platforms = [], hazards = [], enemies = [], shooters = [], saws = [], springs = [], spikeGates = [], coins = [], checkpoints = [], signs = [];
    const ground = (x,w) => platforms.push({x,y:550,w,h:150,ground:true});
    const ledge = (x,y,w=150,moving=false,crumbling=false) => platforms.push({x,y,w,h:22,ground:false,moving,crumbling,crumbleTimer:0,restoreTimer:0,baseX:x,baseY:y,phase:x/137});
    const spark = (x,y) => coins.push({x,y,id:coins.length});
    for (let region = 0; region < themes.length; region++) {
      for (let room = 0; room < ROOMS_PER_REGION; room++) {
        const n = region * ROOMS_PER_REGION + room, x = n * ROOM;
        // Every room has a safe entry and exit. Gaps fit within one jump.
        const pattern = n % 7;
        const arena = region===4 && room===13;
        const gaps = arena ? [] : pattern === 2 ? [[650,145],[1130,140]] : pattern === 4 ? [[730,150]] : [[850,150]];
        let cursor = x;
        for (const [offset,width] of gaps) { ground(cursor,x+offset-cursor); cursor=x+offset+width; }
        ground(cursor,x+ROOM-cursor);
        if (arena) {
          ledge(x+500,430,175); ledge(x+1000,390,160);
        } else if (pattern === 0 || pattern === 3) {
          ledge(x+340,450,160); ledge(x+560,355,160); ledge(x+820,335,140,true); ledge(x+1130,430,180);
        } else if (pattern === 1 || pattern === 5) {
          ledge(x+390,465,150); ledge(x+600,400,150,false,region>=1); ledge(x+850,395,180,true); ledge(x+1160,450,160);
        } else if (pattern === 2) {
          ledge(x+480,450,150); ledge(x+760,400,170,true); ledge(x+1030,455,130);
        } else if (pattern === 4) {
          ledge(x+400,460,140); ledge(x+640,365,160); ledge(x+900,350,170,true); ledge(x+1190,445,180);
        } else {
          ledge(x+360,440,200); ledge(x+690,355,190); ledge(x+990,400,160); ledge(x+1250,465,140);
        }
        if (n>0 && !arena) {
          if(region===0 || n%4!==2) hazards.push({x:x+(region===0?540:450),y:532,w:50+region*7,h:18});
          if (pattern===3 || pattern===5) hazards.push({x:x+1280,y:532,w:65,h:18});
          if (room===6 || room===10) shooters.push({x:x+1370,y:505,w:38,h:45,cooldown:1.2,health:2,dead:false});
          else enemies.push({x:x+1190,y:526,w:32,h:24,min:x+1050,max:x+1430,speed:55+region*10,dir:1});
          if (region>=1 && n%4===2) saws.push({x:x+310,y:505,w:38,h:38,baseY:505,phase:n});
          if (region>=1 && n%3===1) springs.push({x:x+390,y:532,w:48,h:18});
        }
        if (region===0 && room%2===0) {
          const rotor=room%4===0, gateX=x+(room===0?690:235);
          spikeGates.push({x:gateX,y:160,w:52,h:390,maxH:390,baseY:550,kind:rotor?'rotor':'pop',period:3.9,phase:room===0?2.1:room*.43,warning:false});
        }
        if (region===1) {
          const extraPositions=[185,(n%3===1?525:400),590,1480];
          for(const offset of extraPositions){
            const start=x+offset;
            enemies.push({x:start,y:526,w:32,h:24,min:start-10,max:start+10,speed:35+room%3*8,dir:1});
          }
        }
        for (let c=0;c<5;c++) spark(x+300+c*55,495);
        spark(x+450,410); spark(x+645,320); spark(x+920,300); spark(x+1220,395);
        if (room%2===0 || arena) checkpoints.push({x:x+110,y:550,region,room,n});
        if (room===0) signs.push({x:x+230,text:['Space = one jump · Wait for tall spikes to retract · F = fire','Springs launch you. Cracked platforms crumble.','Watch for spinning saws and ranged enemies.','Blue platforms drift. Ride them across.','The lighthouse guardian waits in the final arena.'][region]});
        if (arena) signs.push({x:x+230,text:'THE LIGHTHOUSE GUARDIAN · Fire with F or J · Keep moving'});
      }
    }
    const width=ROOM*ROOMS_PER_REGION*themes.length,finish=width-260;
    const boss={x:finish-430,y:444,w:82,h:106,health:7,maxHealth:7,cooldown:1.8,invulnerable:0,dead:false};
    return {platforms,hazards,enemies,shooters,saws,springs,spikeGates,boss,coins,checkpoints,signs,width,finish};
  }
  const api={ROOM,ROOMS_PER_REGION,SPEED,themes,buildLevel};
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  else root.SkylineLevel=api;
})(typeof window!=='undefined'?window:globalThis);

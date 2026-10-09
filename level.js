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
    const platforms = [], hazards = [], enemies = [], coins = [], checkpoints = [], signs = [];
    const ground = (x,w) => platforms.push({x,y:550,w,h:150,ground:true});
    const ledge = (x,y,w=150,moving=false) => platforms.push({x,y,w,h:22,ground:false,moving,baseX:x,baseY:y,phase:x/137});
    const spark = (x,y) => coins.push({x,y,id:coins.length});
    for (let region = 0; region < themes.length; region++) {
      for (let room = 0; room < ROOMS_PER_REGION; room++) {
        const n = region * ROOMS_PER_REGION + room, x = n * ROOM;
        // Every room has a safe entry and exit. Gaps fit within one running jump.
        const pattern = n % 7;
        const gaps = pattern === 2 ? [[650,200],[1130,180]] : pattern === 4 ? [[730,230]] : [[850,160 + region*12]];
        let cursor = x;
        for (const [offset,width] of gaps) { ground(cursor,x+offset-cursor); cursor=x+offset+width; }
        ground(cursor,x+ROOM-cursor);
        if (pattern === 0 || pattern === 3) {
          ledge(x+340,450,160); ledge(x+560,355,160); ledge(x+820,335,140,true); ledge(x+1130,430,180);
        } else if (pattern === 1 || pattern === 5) {
          ledge(x+390,465,150); ledge(x+600,400,150); ledge(x+850,395,180,true); ledge(x+1160,450,160);
        } else if (pattern === 2) {
          ledge(x+480,450,150); ledge(x+760,400,170,true); ledge(x+1030,455,130);
        } else if (pattern === 4) {
          ledge(x+400,460,140); ledge(x+640,365,160); ledge(x+900,350,170,true); ledge(x+1190,445,180);
        } else {
          ledge(x+360,440,200); ledge(x+690,355,190); ledge(x+990,400,160); ledge(x+1250,465,140);
        }
        if (n>0) {
          hazards.push({x:x+540,y:532,w:50+region*7,h:18});
          if (pattern===3 || pattern===5) hazards.push({x:x+1280,y:532,w:65,h:18});
          enemies.push({x:x+1190,y:526,w:32,h:24,min:x+1050,max:x+1430,speed:55+region*10,dir:1});
        }
        for (let c=0;c<5;c++) spark(x+300+c*55,495);
        spark(x+450,410); spark(x+645,320); spark(x+920,300); spark(x+1220,395);
        if (room%2===0) checkpoints.push({x:x+110,y:550,region,room,n});
        if (room===0) signs.push({x:x+230,text:['Move → · Space to jump · Jump again in the air','Bounce on beetles. Keep away from thorns.','Double jump to reach the high paths.','Blue platforms drift. Ride them across.','The lighthouse is just beyond the horizon.'][region]});
      }
    }
    return {platforms,hazards,enemies,coins,checkpoints,signs,width:ROOM*ROOMS_PER_REGION*themes.length,finish:ROOM*ROOMS_PER_REGION*themes.length-260};
  }
  const api={ROOM,ROOMS_PER_REGION,SPEED,themes,buildLevel};
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  else root.SkylineLevel=api;
})(typeof window!=='undefined'?window:globalThis);

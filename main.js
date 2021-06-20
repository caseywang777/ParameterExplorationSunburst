

let paraRange = [{"start": 0, "end": 1, "name": "AAA", "intervals": 5, "colormap": d3.interpolateReds, "subSpaceIntervals": 18}, 
                  {"start": 0.05, "end": 0.07, "name": "B", "intervals": 4, "colormap": d3.interpolateBlues, "subSpaceIntervals": 12}, 
                  {"start": 1.8, "end": 2.5, "name": "C", "intervals": 6, "colormap": d3.interpolateGreens, "subSpaceIntervals": 20} ];

let selectArcEventFunc = function(d){
  console.log("Click on arc:", d.data.nodeInfo);
};

let selectParameterTextEventFunc = function(d){
  console.log("Click on parameter text:", d);
  let invokePara = [];
  let paraName = [];
  paraRange.forEach(function(p){
    paraName.push( p.name );
  });
  d.forEach(p=>{
    let para = {};
    paraName.forEach(pname=>para[pname]=p[pname][0]);
    invokePara.push(para);
  });
  console.log("Invoke para:", invokePara);
};


//create simulation data information
let dataInfoNameColormap = {'v0': d3.interpolateReds,
                            'v1': d3.interpolateReds,
                            'v2': d3.interpolateReds,
                            'v3': d3.interpolateReds,
                            'v4': d3.interpolateReds,
                            'v5': d3.interpolateReds,
                            'v6': d3.interpolateReds,
                            'v7': d3.interpolateReds,
                            'v8': d3.interpolateReds,
                            'v9': d3.interpolateReds };
let dataInfo = [];
let subspaceInfo = SunburstParameterInterface.GetSubspaceSetting(paraRange);
subspaceInfo.forEach(d=>{
  let dtInfo = {};
  Object.keys(dataInfoNameColormap).forEach(k=>{
    dtInfo[k] = Math.random();
  });
  dataInfo.push( dtInfo );
});

//create the UI object
const sunburstUI = new SunburstParameterInterface("#chart-area", 1000, 1000, 250, 
                                                  paraRange, dataInfoNameColormap, dataInfo, 
                                                  0.15, selectArcEventFunc, selectParameterTextEventFunc);

//// test for mouse over the small circle
let selected = [{"AAA": 0.5, "B": 0.06, "C":2}, {"AAA": 0.8, "B": 0.06, "C":2}];
d3.select('#chart-area').append('svg').attr('width', '100').attr('height', '100').append('circle').attr('cx',50).attr('cy',50).attr('r', 10)
    .on('mouseover', function(){
      sunburstUI.hightlight(this, selected);
    } )
    .on('mouseout', function(){
      sunburstUI.unhightlight(this, selected);
    } );

  d3.select('#chart-area').append('svg').attr('width', '100').attr('height', '100').append('circle').attr('cx',70).attr('cy',50).attr('r', 30).attr('fill','red')
  .on('mouseover', function(){
    let selected = []
    for( let i=0; i<100;i++){
      let s = {};
      for(let len = 0; len < paraRange.length; len++){
        s[paraRange[len].name] = Math.random()*(paraRange[len].end - paraRange[len].start) + paraRange[len].start;
      }
      selected.push(s);
    }
    sunburstUI.setVisitedSubspace(selected);
  })


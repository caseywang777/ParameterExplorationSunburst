

let paraRange = [{"start": 0, "end": 1, "name": "AAA", "intervals": 5, "colormap": d3.interpolateReds}, 
                  {"start": 0.05, "end": 0.07, "name": "B", "intervals": 5, "colormap": d3.interpolateBlues}, 
                  {"start": 1.8, "end": 2.5, "name": "C", "intervals": 6, "colormap": d3.interpolateGreens} ];

let selectArcEventFunc = function(d){
  console.log(d.data.nodeInfo);
};

const sunburstUI = new SunburstParameterInterface("#chart-area", 1000, 1000, 250, 
                                                  paraRange, 0.2, selectArcEventFunc);

//// test for mouse over the small circle
let selected = [{"AAA": 0.5, "B": 0.06, "C":2}, {"AAA": 0.8, "B": 0.06, "C":2}];
d3.select('#chart-area').append('svg').attr('width', '100').attr('height', '100').append('circle').attr('cx',50).attr('cy',50).attr('r', 10)
    .on('mouseover', function(){
      sunburstUI.hightlight(this, selected);
    } )
    .on('mouseout', function(){
      sunburstUI.unhightlight(this, selected);
    } );



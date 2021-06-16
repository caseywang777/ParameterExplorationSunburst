class SunburstParameterInterface
{
    // _parentElementID: ID (with #) of the html tag (usually a <div>) to contain this TF interface
    //_visWidth, _visHeight: width and height in pixel of this interface
    //_sunburstRadius: the sunburst radius
    //_parameterInfo: simulation parameter information, min max range and its name, colormap, number of intervals
    //                Example:  _parameterInfo = [{"start": 0, "end": 1, "name": "A", "intervals": 5, "colormap": d3.interpolateReds}, 
    //                                           {"start": 0.05, "end": 0.07, "name": "B", "intervals": 5, "colormap": d3.interpolateBlues}, 
    //                                             {"start": 1.8, "end": 2.5, "name": "C", "intervals": 5, "colormap": d3.interpolateGreens} ];
    //_headRatio: the ratio of head of each arc, example: 0.2
    //_selectArcEventFunc: invoke this function when user clicks on a arc
    constructor(_parentElementID, _visWidth, _visHeight, _sunburstRadius, 
                _parameterInfo, _headRatio,
                _selectArcEventFunc){
        const vis = this;
        this.parentElementID = _parentElementID;
        this.svgWidth = _visWidth;
        this.svgHeight = _visHeight;
        this.sunburstRadius = _sunburstRadius;
        this.parameterInfo = _parameterInfo;
        this.headRatio = _headRatio;
        this.selectArcEventFunc = _selectArcEventFunc;

        this.paraOrderForSubspace = [];
        this.parameterInfo.forEach(function(d,i){
            let dic = {};
            dic['name'] = d.name;
            dic['start'] = d.start;
            dic['nIntervals'] = d.subSpaceIntervals;
            dic['interval'] = (d.end - d.start) / d.subSpaceIntervals;
            vis.paraOrderForSubspace.push(dic);
        });
        
        this.subSpaceData = [];
        this.createSubspaceList(this.parameterInfo, {}, 0);

        this.legendWholeWidth = this.sunburstRadius*2, 
        this.legendWholeHeight = 150;
        this.legendMargin = {top: 20, right: 10, bottom: 10, left: 10};
        this.legendWidth =  this.legendWholeWidth - this.legendMargin.left - this.legendMargin.right;
        this.legendHeight = this.legendWholeHeight - this.legendMargin.top - this.legendMargin.bottom;

        this.svg = d3.select(this.parentElementID).append('g').append('svg').attr('width', this.svgWidth).attr('height', this.svgHeight);
        this.legendG = this.svg.append('g').attr('transform', `translate(20, 20)` );
        this.sunburstG = this.svg.append('g').attr('transform', `translate(${this.sunburstRadius}, ${this.sunburstRadius+this.legendWholeHeight})` );

        this.legendSubG = null;

        this.initVis();
    }

    initVis(){
        const vis = this;
        
        this.buildLegent();
        this.buildSunburst(false);

        

    }

    buildLegent(){
        const vis = this;
        let legendWholeWidth = vis.legendWholeWidth;
        let legendWholeHeight = vis.legendWholeHeight;
        let legendMargin = vis.legendMargin;
        let legendWidth = vis.legendWidth;
        let legendHeight = vis.legendHeight;

        vis.parameterInfo.forEach(function(d, i){
            let paraInterval = (vis.parameterInfo[i].end - vis.parameterInfo[i].start) / vis.parameterInfo[i].intervals;
            let colorInterval = 1.0 / vis.parameterInfo[i].intervals;
            let paraColorMap = [];
            for( let k = 0; k < vis.parameterInfo[i].intervals; k++) paraColorMap.push([vis.parameterInfo[i].start + k*paraInterval, (k+1)*colorInterval ]);
            d['paraColorMap'] = paraColorMap;
        });

        let legendTextYScaleBand = d3.scaleBand().domain(vis.parameterInfo.map(d=>d.name)).range([0, legendHeight]).paddingInner(0.1).paddingOuter(0.05);
        vis.legendSubG = vis.legendG.selectAll("g").data(vis.parameterInfo).enter().append("g").attr('transform', d=>`translate(0, ${legendTextYScaleBand(d.name)})` );
        vis.legendSubG.selectAll("text").data(d=>[d.name]).enter().append("text").text(d=>d+":");
        let colorWidth = 80, colorHeight = 25;
        let legendColormap = vis.legendSubG.selectAll("rect").data(d=>d.paraColorMap.map(dd=>({'paraColorMap': dd, 'colormap':d.colormap, 'name': d.name})))
                        .enter().append("rect").attr("width", colorWidth).attr("height", colorHeight).attr("x", (d,i)=>i*colorWidth+colorWidth).attr("y", 0).attr('fill', d=>d.colormap(d.paraColorMap[1]));
        let legendParaText = vis.legendSubG.selectAll(".paraValueText").data(d=>d.paraColorMap.map(dd=>({'paraColorMap': dd, 'colormap':d.colormap})))
                            .enter().append("text").attr("x", (d,i)=>i*colorWidth+colorWidth).attr("y", 0).text(d=>(d.paraColorMap[0].toFixed(3)+" ~"));

        let drag = d3.drag().on("start", started).on("drag", dragged).on("end", end);
        let startMouseY, oldYTranslate, selectedParaName, paraNameList, paraNameListOld, oldIdx;
        function started(d){
            paraNameList = vis.parameterInfo.map(d=>d.name);
            paraNameListOld = vis.parameterInfo.map(d=>d.name);
            startMouseY = d3.event.y;
            oldYTranslate = parseFloat( d3.select(this).attr("transform").split(",")[1].split(")")[0] );
            selectedParaName = d3.select(this).data()[0].name;
            oldIdx = paraNameListOld.findIndex(d=>d===selectedParaName);
        }
        function dragged(d){
            let g = d3.select(this);
            let currentMouseY = d3.event.y;
            if(currentMouseY < legendMargin.top )currentMouseY = 0 + legendMargin.top - 10;
            if(currentMouseY > legendHeight)currentMouseY = legendHeight;
            let dy = currentMouseY - startMouseY;
            g.attr('transform', `translate(0, ${oldYTranslate + dy})`);
            let bandwidth = legendTextYScaleBand.bandwidth();
            let newIdxDx = dy>0 ? Math.floor(dy/bandwidth) : Math.ceil(dy/bandwidth);
            let newIdx = oldIdx + newIdxDx;
            if( newIdx < 0 )newIdx = 0;
            if( newIdx >= paraNameListOld.length )newIdx = paraNameListOld.length-1;
            paraNameList = paraNameListOld.map(d=>d);
            let element = paraNameList[oldIdx];
            paraNameList.splice(oldIdx, 1);
            paraNameList.splice(newIdx, 0, element);
            let legendTextYScaleBandNew = d3.scaleBand().domain(paraNameList).range([0, legendHeight]).paddingInner(0.1).paddingOuter(0.05);
            vis.legendSubG.transition().duration("50").attr('transform', function(d){
                if(d.name === selectedParaName)return `translate(0, ${oldYTranslate + dy})`;
                return `translate(0, ${legendTextYScaleBandNew(d.name)})`;
            });
        }
        function end(d){
            legendTextYScaleBand = d3.scaleBand().domain(paraNameList).range([0, legendHeight]).paddingInner(0.1).paddingOuter(0.05);
            vis.legendSubG.transition().duration("50").attr('transform', function(d){
                return `translate(0, ${legendTextYScaleBand(d.name)})`;
            });

            //Update what we have to update when the order of parameter change and recreate the sunburst
            let parameterInfoDic = {};
            vis.parameterInfo.forEach(d=>parameterInfoDic[d.name]=d);
            vis.parameterInfo = [];
            paraNameList.forEach(d=>vis.parameterInfo.push(parameterInfoDic[d]));
            vis.buildSunburst( true );
        }
        vis.legendSubG.call(drag);

    }

    buildSunburst( remove ){
        const vis = this;

        if(remove) vis.sunburstG.selectAll("*").remove();

        this.treeData = [{'name': 'root', 'parent': ""}];
        this.createTree(this.parameterInfo, "root", 0, {}, {});
        

        let root = d3.stratify()
              .id(d=>d.name)
              .parentId(d=>d.parent);

              
        let rootNode = root(this.treeData);
        rootNode.sum(function(d) {
            return d.value;
        });

        let partitionLayout = d3.partition().size([2 * Math.PI, this.sunburstRadius]);
        partitionLayout(rootNode);

        this.arcGeneratorBackground = d3.arc()
                                .startAngle(function(d) { return d.x0; })
                                .endAngle(function(d) { return d.x1; })
                                .innerRadius(function(d) { return d.y0; })
                                .outerRadius(function(d) { return d.y1; });

        this.arcGeneratorMain = d3.arc()
                                .startAngle(function(d) { return d.x0; })
                                .endAngle(function(d) { return d.x1; })
                                .innerRadius(function(d) { 
                                    if(d.id === "root")return;
                                    let arcLen = (d.y1 - d.y0) * (1-vis.headRatio);
                                    let visitCount = vis.countVisitedSubspace(d.data.subSpaceIndexInfo);
                                    let visitRatio = ( visitCount/ d.data.totalSubspace );
                                    let arcModify = (1 - visitRatio) * arcLen;
                                    return (d.y1 - d.y0) * vis.headRatio + d.y0 + arcModify; 
                                })
                                .outerRadius(function(d) { return d.y1; });

        this.arcGeneratorHead = d3.arc()
                                    .startAngle(function(d) { return d.x0; })
                                    .endAngle(function(d) { return d.x1; })
                                    .innerRadius(function(d) { return d.y0; })
                                    .outerRadius(function(d) { return (d.y1 - d.y0) * vis.headRatio + d.y0; });

        let allNodes = rootNode.descendants();
        let nodes = this.sunburstG
                        .selectAll('g')
                        .data(allNodes)
                        .enter()
                        .append('g').attr('id', "sunburstGNode");
        nodes.attr('transform', 'scale(0.1)');

        //calculate total subspace belong to each node (include non-leaf node)
        this.treeData.forEach((d)=>{
            if(d.name === "root")return;
            let allDimension = {}
            vis.paraOrderForSubspace.forEach(d=>allDimension[d.name]=d.nIntervals);
            Object.keys( d.subSpaceIndexInfo ).forEach(k=>allDimension[k] = d.subSpaceIndexInfo[k][1] - d.subSpaceIndexInfo[k][0] + 1);
            let totalCount = 1;
            Object.keys(allDimension).forEach(k=>totalCount = allDimension[k]*totalCount);
            d['totalSubspace'] = totalCount;
        });

        this.pathBackground = nodes.append('path')
                            .attr('d', vis.arcGeneratorBackground)
                            .attr('fill', function(d){
                                return 'gray'
                                })
                            .attr('opacity', 1.0)
                            .attr('stroke', 'white');

        this.pathMain = nodes.append('path')
                            .attr('d', vis.arcGeneratorMain)
                            .attr('fill', function(d){
                                if( d.id === "root") return;
                                let idx = 0;
                                vis.parameterInfo.forEach( function(dPara, i){
                                                                if(d.data.paraName === dPara.name) idx = i;
                                                            });
                                let value2Colormap = vis.parameterInfo[idx]['paraColorMap'][d.data.paraIndex][1];
                                return vis.parameterInfo[idx]['colormap'](value2Colormap);                                
                            })
                            .attr('opacity', 1.0)
                            .attr('stroke', 'white');

        this.pathHead = nodes.append('path')
                            .attr('d', vis.arcGeneratorHead)
                            .attr('fill', function(d){
                                if( d.id === "root") return;
                                let idx = 0;
                                vis.parameterInfo.forEach( function(dPara, i){
                                                                if(d.data.paraName === dPara.name) idx = i;
                                                            });
                                let value2Colormap = vis.parameterInfo[idx]['paraColorMap'][d.data.paraIndex][1];
                                return vis.parameterInfo[idx]['colormap'](value2Colormap);                                
                            })
                            .attr('stroke', 'white');
        
        this.pathHead.on("click", vis.selectArcEventFunc);

        this.pathHead.on("mouseover", function(){
                                                let arc = d3.select(this);
                                                arc.attr('stroke', 'red').attr('stroke-width', 2);
                                                let arcData = arc.data()[0].data.nodeInfo;
                                                vis.legendSubG.selectAll('rect').attr('stroke', function(d){
                                                    if( (d.name in arcData) && Math.abs( arcData[d.name][0] - d.paraColorMap[0] ) < 0.00001 ) return 'magenta';
                                                    else return 'white';
                                                }).attr('stroke-width', function(d){
                                                    if( (d.name in arcData) && Math.abs( arcData[d.name][0] - d.paraColorMap[0] ) < 0.00001 ) return 3;
                                                    else return 0;
                                                })
                                        })
                        .on("mouseleave", function(){
                            let arc = d3.select(this);
                            console.log(arc.data())
                            arc.attr('stroke', 'white').attr('stroke-width', 0);
                            vis.legendSubG.selectAll('rect').attr('stroke', 'white').attr('stroke-width',0);
                        })
        nodes.transition().ease(d3.easeExp).duration(1000).attr('transform', 'scale(1)');
    }

    createTree(paraRange, parent, paraIndex, nodeInfo, subSpaceIndexInfo){
        let interval = (paraRange[paraIndex].end - paraRange[paraIndex].start) / paraRange[paraIndex].intervals;
        
        for( let i = 0; i < paraRange[paraIndex].intervals; i ++){
            let start = paraRange[paraIndex].start + i * interval;
            let end = paraRange[paraIndex].start + (i+1) * interval;
            let paraName =  paraRange[paraIndex].name;
        
            let nodeName = parent + "_" + i;
            let newNodeInfo = {...nodeInfo};
            newNodeInfo[paraName] = [start, end];

            let newSubSpaceIndexInfo = {...subSpaceIndexInfo};
            let subspaceIdx = this.paraOrderForSubspace.findIndex(d=>d.name===paraName);
            let oneSubSpaceInfo = this.paraOrderForSubspace[subspaceIdx];
            let subSpaceStartIndex = Math.floor((start - oneSubSpaceInfo['start'])/oneSubSpaceInfo['interval']);
            let subSpaceEndIndex = Math.floor((end-0.000001 - oneSubSpaceInfo['start'])/oneSubSpaceInfo['interval']);//0.000001 avoid the last (not existing) index
            newSubSpaceIndexInfo[paraName] = [subSpaceStartIndex, subSpaceEndIndex];//include subSpaceEndIndex
            let node = {"name": nodeName, "parent": parent, "nodeInfo": newNodeInfo, "paraIndex": i, "paraName": paraRange[paraIndex].name, "subSpaceIndexInfo": newSubSpaceIndexInfo};
        
            if( paraIndex === paraRange.length - 1 ){//leaf node
                node['value'] = 1;
                this.treeData.push(node);
            }else{
                this.treeData.push(node);
                this.createTree(paraRange, nodeName, paraIndex+1, newNodeInfo, newSubSpaceIndexInfo);
            }
        }
    }

    createSubspaceList(paraRange, parents, paraIndex){
        let interval = (paraRange[paraIndex].end - paraRange[paraIndex].start) / paraRange[paraIndex].subSpaceIntervals;
        
        for( let i = 0; i < paraRange[paraIndex].subSpaceIntervals; i ++){
            let start = paraRange[paraIndex].start + i * interval;
            let end = paraRange[paraIndex].start + (i+1) * interval;
            let paraName =  paraRange[paraIndex].name;

            let currentNodeInfo = {...parents};
            currentNodeInfo[paraName] = [(start+end)/2, interval/2];

            if( paraIndex === paraRange.length - 1 ){//leaf node
                currentNodeInfo['visit'] = false;
                this.subSpaceData.push(currentNodeInfo);
            }else{
                this.createSubspaceList(paraRange, currentNodeInfo, paraIndex+1);
            }
        }
    }

    

    listCombinationSubspacesIndex(ret, keys, dic, idx, local){
        let nPara = keys.length;
        let paraName = keys[idx];
        let startIdx = dic[paraName][0];
        let endIdx = dic[paraName][1];

        for( let i = startIdx; i<=endIdx; i++ ){
            let newLocal = {...local};
            newLocal[paraName] = i;
            if( idx === nPara - 1){//leaf node
                ret.push(newLocal);
            }else{
                this.listCombinationSubspacesIndex(ret, keys, dic, idx + 1, newLocal);
            }
        }
    }

    paraDictionaryToSubspaceIndex(dic){
        let idx1D = 0;
        this.paraOrderForSubspace.forEach(function(d,i){
            let pName = d['name'];
            let nInterval = d['nIntervals'];
            let interval = d['interval'];
            let start = d['start'];
            let value = dic[pName];
            let idx = Math.floor((value-start)/interval);
            idx1D = idx1D*nInterval + idx;
        });
        return idx1D; //use this.subSpaceData[idx1D] to access the corresponding subspace 
    }

    subspacIdxDicToSubspace1DIndex(dic){
        let idx1D = 0;
        this.paraOrderForSubspace.forEach(function(d,i){
            let pName = d['name'];
            let nInterval = d['nIntervals'];
            let idx = dic[pName];
            idx1D = idx1D*nInterval + idx;
        });
        return idx1D; //use this.subSpaceData[idx1D] to access the corresponding subspace 
    }

    countVisitedSubspace(dic){
        //dic example: let dic = {"AAA": [2, 5], "B": [1, 3], "C": [5, 8]};
        this.paraOrderForSubspace.forEach(function(d){
            if( !(d.name in dic ) ){
                dic[d.name] = [0, d.nIntervals-1];
            }
        });
        console.log(dic)
        let ret = [];
        this.listCombinationSubspacesIndex(ret, Object.keys(dic), dic, 0, {});
        let visitCount = 0;
        ret.forEach((d)=>{
            let idx1D = this.subspacIdxDicToSubspace1DIndex(d);
            if( this.subSpaceData[idx1D].visit === true)visitCount++;
        });
        return visitCount;
    }

    hightlight( element, selected ){
        const vis = this;
        vis.pathHead.attr("stroke", function(d){
            if( d.data.name === "root") return;
            let arcDt = d.data.nodeInfo;
            let keys = Object.keys(arcDt);
            for(let i=0; i<selected.length; i++){
                let b = true;
                keys.forEach(d => b = b && (arcDt[d][0] <= selected[i][d] && selected[i][d] < arcDt[d][1] ) );
                if(b) return 'red';
            }
            return 'white';
        });

        vis.pathHead.attr("stroke-width", function(d){
            if( d.data.name === "root") return;
            let arcDt = d.data.nodeInfo;
            let keys = Object.keys(arcDt);
            for(let i=0; i<selected.length; i++){
                let b = true;
                keys.forEach(d => b = b && (arcDt[d][0] <= selected[i][d] && selected[i][d] < arcDt[d][1] ) );
                if(b) return 2;
            }
            return 1;
        });
    }

    unhightlight( element, selected ){
        const vis = this;
        vis.pathHead.attr("stroke", 'white' ).attr("stroke-width", 1);
    }

    setVisitedSubspace( visitParas ){
        const vis = this;
        visitParas.forEach(d=>{
            let idx1D = this.paraDictionaryToSubspaceIndex(d);
            this.subSpaceData[idx1D].visit = true;
        })

        vis.pathMain.attr('d', vis.arcGeneratorMain); 
    }
}
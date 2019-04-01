var socket = io.connect();


var graphId = 1;

let nodes = [];

var lines = [];

var svg = d3.select('#graph').append('svg').attr('width', 800).attr('height', 800);
svg.append("svg:defs").append("svg:marker")
    .attr("id", "triangle")
    .attr("refX", 6)
    .attr("refY", 6)
    .attr("markerWidth", 30)
    .attr("markerHeight", 30)
    .attr("markerUnits","userSpaceOnUse")
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 12 6 0 12 3 6")
    .style("fill", "black");
  

let circles;
let links;
let nodeLabels;
let linkLabels;


let wasMoved = false;
let circleClicked = false;

let sourceTarget = [];
let sourceTargetPath = [];
let selectedNode = null;

function draw(nodes){
    clearSVG()

    svg.append("svg:defs").append("svg:marker")
    .attr("id", "triangle")
    .attr("refX", 6)
    .attr("refY", 6)
    .attr("markerWidth", 30)
    .attr("markerHeight", 30)
    .attr("markerUnits","userSpaceOnUse")
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 12 6 0 12 3 6")
    .style("fill", "black");

    

    links = svg.selectAll('line')
    .data(lines, d => 'line' + d.id)
    .enter()
    .append('line')
    .attr('x1', d => getVertex(d.vertex_1, nodes).x)
    .attr('y1', d => getVertex(d.vertex_1, nodes).y)
    .attr('x2', d => getVertex(d.vertex_2, nodes).x)
    .attr('y2', d => getVertex(d.vertex_2, nodes).y)
    .attr('stroke', d=> d.color === 'red'? 'red' : 'black')
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#triangle)")

    

    circles = svg.selectAll('circle')
        .data(nodes, d => 'node' + d.id )
        .enter()
        .append('circle')
        .attr('cx', (d)=>d.x)
        .attr('cy', (d)=>d.y)
        .attr('r', 4)
        // .attr('fill', '#4286f4')
        .attr('stroke', '#0066cc')
        .attr('stroke-width', 2)
        // .on('click', nodeClick)
        .on('mouseover', function(d){
            d3.select(this)
                .attr('fill', '#0066cc')
        })
        .on('mouseout', function(d){
            d3.select(this)
                .attr('fill', '#000')
        })
        .call(d3.drag()
                .on('drag',  dragged)
                .on('end', dragended))
        .on('dblclick', function(d){
            deleteNode(d.id)
        })
        .on('click', function(d){
            d3.event.stopPropagation();

            if(d3.event.ctrlKey){
                console.log('ctrl on node')
                if(sourceTargetPath.length === 0 ){
                    sourceTargetPath.push(d.id)
                } else if(sourceTargetPath.length === 1 && d.id !== sourceTargetPath[0]){
                    
                    sourceTargetPath.push(d.id)
                    
                    findPath(sourceTargetPath[0], sourceTargetPath[1], graphId);
                    sourceTargetPath=[]
                    circleClicked=false;
                }
                return;
            }
            circleClicked = true;
            selectedNode = d.id;
            nodeClick(d, this)
        })
    
        nodeLabels = svg.append('g').selectAll('text')
                        .data(nodes)
                        .enter()
                        .append('text')
                        .attr('x', d=>d.x)
                        .attr('y', d=>d.y - 10)
                        .text(d=> d.id)

        linkLabels = svg.append('g').selectAll('text')
                        .data(lines)
                        .enter()
                        .append('text')
                        .attr('x', d=>(getVertex(d.vertex_1, nodes).x + getVertex(d.vertex_2, nodes).x)/2 )
                        .attr('y', d=>(getVertex(d.vertex_1, nodes).y + getVertex(d.vertex_2, nodes).y)/2 - 5)
                        .text(d=> d.weight)
    
        svg.on('click', function(){
            if(circleClicked) return;
            console.log('svg clicked')
            
            var coords = d3.mouse(this);
            addNode(graphId, coords[0], coords[1]);
                     
            
        });
    

}

function nodeClick(d, element){
    
    // d3.event.stopPropagation();
    // if( d3.event.defaultPrevented ) return;
    var coords = d3.mouse(element);
    if(sourceTarget.length === 0 ){
        sourceTarget.push(d.id)
    } else if(sourceTarget.length === 1 && d.id !== sourceTarget[0]){
        
        sourceTarget.push(d.id)
        let weight = prompt('Enter Weight', 0);
        addLink(sourceTarget[0], sourceTarget[1], weight)
        // findPath();
        sourceTarget=[]
        circleClicked=false;
    }
    
    d3.select(element).raise().attr('fill', '#fff');

}

function clearSVG(){
    d3.select("svg").remove();
    svg = d3.select('#graph').append('svg').attr('width', 800).attr('height', 800);
    circles = null;
    links = null;
}
        
function getVertex(vertex_id, nodes){
   var element;
    nodes.forEach(e => {
        if (e.id === vertex_id) {
            element = e;
        }
    });
    
   return element;
}


function dragged(d) {
    wasMoved = true;
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);

}

function dragended(d){
    d3.event.sourceEvent.stopPropagation();
    
    if(wasMoved){
        console.log(d.id, d3.event.x, d3.event.y);
        nodes[nodes.indexOf(d)] = {id: d.id, x: d3.event.x, y: d3.event.y }
        updateVertex(d.id, d3.event.x, d3.event.y);
        // clearSVG();
        // draw(nodes);
        wasMoved = false;
    } else {
        // circleClicked = true;
        // selectedNode = d.id;
        // nodeClick(d, this)
    }
   
}

getVertices();
getLinks();


function updateVertex(id, x, y){
    
    $.ajax({
        url: 'http://localhost:3000/vertices/update/', 
        type: 'POST', 
        contentType: 'application/json', 
        data: JSON.stringify({'id':id, 'x': x, 'y': y}),
        success: function(data){
            // nodes.push(data);
            // draw(nodes)

            // getVertices()
        }
    })
}

function getVertices(){
    $.get(`http://localhost:3000/vertices`, function(data){
        nodes = data;
        draw(nodes)
        
    })
}

function getLinks(){
    $.get(`http://localhost:3000/links`, function(data){
        lines = data;
        draw(nodes)
        
    })
}

function addNode(graph_id, x, y ){
    
    $.ajax({
        url: 'http://localhost:3000/vertices/add', 
        type: 'POST', 
        contentType: 'application/json', 
        data: JSON.stringify({graph_id: graph_id, x: x, y: y}),
        success: function(data){
            // nodes.push(data);
            // draw(nodes)

            // getVertices();
        }
    
    })
}

function deleteNode(id){
    $.ajax({
        url: 'http://localhost:3000/vertices/delete', 
        type: 'POST', 
        contentType: 'application/json', 
        data: JSON.stringify({id: id}),
        success: function(data){
            // nodes.push(data);
            // draw(nodes)

            // getVertices();
        }
    
    })
}

function addLink(vertex_1, vertex_2, weight ){
    
    $.ajax({
        url: 'http://localhost:3000/links/add', 
        type: 'POST', 
        contentType: 'application/json', 
        data: JSON.stringify({vertex_1: vertex_1, vertex_2: vertex_2, weight: weight}),
        success: function(data){
            // nodes.push(data);
            // draw(nodes)
            // getVertices();
            // getLinks();
        }
    
    })
}

function findPath(source, target, graph){
    console.log('findpath', source, target, graph)
    lines = lines.map(line=>{
        line.color = 'black';
        return line;
    })
    $.get(`http://localhost:3000/path?start=${source}&end=${target}&graph=${graph}`, function(data){
        // nodes = data;
        // draw(nodes)
        let redLinks = data[1];
        let newLines = lines.map(line=>{

            for(let redlink of redLinks){
                if(redlink.id === line.id){
                    line.color = 'red';
                    return line;
                }
            }
            return line;
            
        })

        lines = newLines;
        draw(nodes)
        
        console.log(data)
        
    })
}

// Socket IO
socket.on('new vertex', (data)=>{
    nodes.push(data);
    draw(nodes);
});

socket.on('update vertex', (data)=>{
    console.log(data)
    let newNodes = nodes.map(node=>{
        if(node.id === data.id){
            return data;
        } else {
            return node;
        }
    })
    nodes = newNodes;
    draw(nodes);
});

socket.on('delete vertex', (data)=>{
    let newNodes = nodes.filter(node=>{
        return node.id !== data;
    });
    nodes = newNodes;
    draw(nodes);
});

socket.on('new link', (data)=>{
    lines.push(data);
    draw(nodes)
});

var socket = io.connect();

var $graphForm = $('#graphForm');
var $x = $('#x');
var $y = $('#y');
$graphForm.submit(function(e){
    
    console.log('submitted');
    socket.emit('add vertex', {x: $x.val(), y: $y.val()})
    // e.preventDefault;
    return false;
});

socket.on('new vertex', (data)=>{
    $('body').append('<div> new Vertex: x='+ data.vertex.x + ', y=' + data.vertex.y + '</div>');
});


var graphId = 1;

// let nodes = [{"id":1,"x":25,"y":25},{"id":2,"x":63,"y":164},{"id":3,"x":286,"y":151},{"id":4,"x":220,"y":44},{"id":5,"x":131,"y":102},{"id":6,"x":175,"y":46}];
let nodes = [];

var lines = [];

var svg = d3.select('body').append('svg').attr('width', 500).attr('height', 500);

let circles;
let links;
let nodeLabels;

let linkBuild = [];

let wasMoved = false;
let circleClicked = false;

let sourceTarget = [];
let selectedNode = null;

function draw(nodes){
    clearSVG()
    
    links = svg.selectAll('line')
    .data(lines, d => 'line' + d.id)
    .enter()
    .append('line')
    .attr('x1', d => getVertex(d.vertex_1, nodes).x)
    .attr('y1', d => getVertex(d.vertex_1, nodes).y)
    .attr('x2', d => getVertex(d.vertex_2, nodes).x)
    .attr('y2', d => getVertex(d.vertex_2, nodes).y)
    .attr('stroke', 'black')

    circles = svg.selectAll('circle')
        .data(nodes, d => 'node' + d.id )
        .enter()
        .append('circle')
        .attr('cx', (d)=>d.x)
        .attr('cy', (d)=>d.y)
        .attr('r', 10)
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
    
        nodeLabels = svg.append('text')
                        .data(nodes)
                        .enter()
                        .attr('x', d=>d.x)
                        .attr('y', d=>d.y - 10)
                        .text(d=> d.id)
    
        svg.on('click', function(){
            if(circleClicked) return;
            console.log('svg clicked')
            var coords = d3.mouse(this);
            addNode(graphId, coords[0], coords[1]);
            nodes.push({id:Math.floor(Math.random() * 100 + 6), x: coords[0], y: coords[1]});
            
            draw(nodes);
            // window.prompt('ok?');
            
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
        findPath();
        sourceTarget=[]
        circleClicked=false;
    }
    
    d3.select(element).raise().attr('fill', '#fff');

}

function clearSVG(){
    d3.select("svg").remove();
    svg = d3.select('body').append('svg').attr('width', 500).attr('height', 500);
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
        circleClicked = true;
        
        selectedNode = d.id;
        nodeClick(d, this)
    }
   
}

getVertices();
getLinks();

// init()
// // draw(nodes);


function findPath(){
    // call api to get path

}


function updateVertex(id, x, y){
    
    $.ajax({
        url: 'http://localhost:3000/vertices/update/', 
        type: 'POST', 
        contentType: 'application/json', 
        data: JSON.stringify({'id':id, 'x': x, 'y': y}),
        success: function(data){
            // nodes.push(data);
            // draw(nodes)
            getVertices()
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
            getVertices();
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
            getVertices();
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
            getVertices();
            getLinks();
        }
    
    })
}

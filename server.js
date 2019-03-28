var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var axios = require('axios');

users = [];
connections = [];

server.listen(3000);

const apiUrl = 'http://localhost:8080';

console.log("server running...");
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/vertices', function(req, res){
    var dataset = [
        {id: 1, x: 25, y: 25 },
        {id: 2, x: 50, y: 50},
        {id: 3, x: 200, y: 50},
        {id: 4, x: 50, y: 200},
        {id: 5, x: 150, y: 20},
        {id: 6, x: 50, y: 100},
    ];
    res.json(dataset);
});

axios.get(apiUrl + '/vertices').then(res=>{
    console.log(res.data);
})

io.sockets.on('connection', (socket)=>{
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    // Disconnect
    socket.on('disconnect', (data)=>{
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    // New Vertex
    socket.on('add vertex', (data)=>{
        io.sockets.emit('new vertex', {vertex: data});
        axios.post(apiUrl + '/vertices/create', {
            x: data.x,
            y: data.y,
            graph_id: 1
        }).then(res=>{
            console.log(res.data);
        });
    });
})
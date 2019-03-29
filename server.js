var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var axios = require('axios');

users = [];
connections = [];

server.listen(3000);

app.use(express.static(__dirname + '/public'))

const apiUrl = 'http://[::1]:8080';


console.log("server running...");
app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/vertices', function(req, res){
    axios.get(apiUrl + '/vertices').then(response=>{
        res.json(response.data);
    })
    
});

app.get('/vertices/update', function(req, res){
    let params = req.query;
    console.log(params)
    axios.post(apiUrl+'vertices/update/'+ params.id, {
        x: params.x,
        y: params.y
    }).then(result=>{
        res.json(result.data)
    })
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


var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var axios = require('axios');
var bodyParser = require('body-parser');


users = [];
connections = [];

server.listen(3000);

app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const apiUrl = 'http://[::1]:8080';


console.log("server running...");
app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/vertices', function(req, res){
    axios.get(apiUrl + '/vertices').then(response=>{
        res.json(response.data);
    }).catch(e=>{
        console.log(e.message)
    })
    
});

app.post('/vertices/update', function(req, res){
    let {id, x, y} = req.body
    
    axios.put(apiUrl+'/vertices/'+ id, {
        x: x,
        y: y
    }).then(result=>{
        io.sockets.emit('update vertex', result.data);
        res.json(result.data)
    }).catch(e=>{
        console.log(e.message)
    })
    
})

app.post('/vertices/add', function(req, res){
    let {graph_id, x, y} = req.body
    
    axios.post(apiUrl+'/vertices', {
        x: x,
        y: y,
        graph_id: graph_id
    }).then(result=>{
        io.sockets.emit('new vertex', result.data);
        // res.json(result.data)
        
    }).catch(e=>{
        console.log(e.message)
    })
    
})

app.post('/vertices/delete', function(req, res){
    let {id} = req.body
    
    axios.delete(apiUrl+'/vertices/'+id).then(result=>{
        io.sockets.emit('delete vertex', id);
        res.json(result.data)
    }).catch(e=>{
        console.log(e.message)
    })
    
})

app.get('/links', function(req, res){
    axios.get(apiUrl + '/links').then(response=>{
        res.json(response.data);
    }).catch(e=>{
        console.log(e.message)
    })
    
});

app.post('/links/add', function(req, res){
    let {vertex_1, vertex_2, weight} = req.body
    
    axios.post(apiUrl+'/links', {
        vertex_1: vertex_1,
        vertex_2: vertex_2,
        weight: weight
    }).then(result=>{
        io.sockets.emit('new link', result.data);
        res.json(result.data)
    }).catch(e=>{
        console.log(e.message)
    })
    
})

app.get('/path', function(req, res){
    let {start, end, graph} = req.query;
    axios.get(apiUrl + `/path?start=${start}&end=${end}&graph=${graph}`).then(response=>{
        res.json(response.data);
    }).catch(e=>{
        console.log(e.message)
    })
    
});



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
        
        axios.post(apiUrl + '/vertices/create', {
            x: data.x,
            y: data.y,
            graph_id: 1
        }).then(res=>{
            console.log(res.data);
            io.sockets.emit('new vertex', res.data);
        }).catch(e=>{
            console.log(e.message)
        });
    });
})


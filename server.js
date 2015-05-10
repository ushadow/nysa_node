var fs = require('fs');
var http = require('http');
var WebSocket = require('ws').Server;
var net = require('net');
var BinaryServer = require('binaryjs').BinaryServer;

// Serve client side statically
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);

// link it to express
var bs = BinaryServer({server: server});

// Wait for new user connections
bs.on('connection', function(client){

  // Incoming stream from browsers
  client.on('stream', function(stream, meta){

    // broadcast to all other clients
    for(var id in bs.clients){
      if(bs.clients.hasOwnProperty(id)){
        var otherClient = bs.clients[id];
        if(otherClient != client){
          var send = otherClient.createStream(meta);
          stream.pipe(send);
        }
      }
    }
  });
});

server.listen(9000);
console.log('HTTP and BinaryJS server started on port 9000');

var client = net.createConnection(12591, function() {
  console.log("Connected to controller server.");
});

client.on('error', function(e) {
  console.log(e);
});

client.on('data', function(data) {
  message = JOSON.parse(data);
  if (message.response == 'ok') {
    console.log(message.uri);
  }
});

// Websocket server
var wss = new WebSocket({port: 8000});
wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    console.log(message);
    client.write(message);
  });
});




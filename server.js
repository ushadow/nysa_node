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
  console.log('Connected to controller server.');
});
var controllerWss = new WebSocket({port: 8000});

var wss = {}
var peripheral;

client.on('error', function(e) {
  console.log(e);
});

controllerWss.on('connection', function(controllerWs) {
  client.on('data', function(data) {
    var message = JSON.parse(data.toString());
    if (message.response == 'ok') {
      var nysaPort = message.port;
      var browserPort = nysaPort + 1;
      wss[message.type] = new WebSocket({port: browserPort});
      wss[message.type].on('connection', function(ws) {
        ws.on('message', function(clientMessage) {
          console.log('nysa port:' + nysaPort);
          peripheral = net.createConnection(nysaPort);
          peripheral.on('connect', function() {
            console.log('connected to ' + message.type);
            console.log('send peripheral command: ' + clientMessage);
            peripheral.write(clientMessage);
          });
          peripheral.on('end', function() {
            console.log(message.type + ' disconnected.');
          });
          peripheral.on('error', function(error) {
            console.log('nysa client ' + message.type + ' error:' + error);
          });
        });
        ws.on('close', function() {
          console.log('websocket for ' + message.type + ' is closed');
        });
        ws.on('error', function(error) {
          console.log('peripheral websocket error:' + error);
        });
      });
      message.port = browserPort;
      controllerWs.send(JSON.stringify(message));
    }
  });

  controllerWs.on('message', function(message) {
    console.log(message);
    client.write(message);
  });

  controllerWs.on('close', function() {
    console.log('controller websocket closed.');
  });

  controllerWs.on('error', function(error) {
    console.log('controller websocket error: ' + error);
  });
});

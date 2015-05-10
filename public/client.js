var controllerConnection;

function onOpen() {
  console.log("Connection opened.");
  controllerConnection.send(JSON.stringify({command: 'start-server', type: 'gpio'}));
}

function onReady() {
  controllerConnection = new WebSocket('ws://' + document.location.hostname + ':8000');
  controllerConnection.onopen = onOpen;
}

$(onReady());

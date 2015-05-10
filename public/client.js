var WS_URI_PREFIX = 'ws://' + document.location.hostname + ':';
var controllerConnection;
var peripherals = {};

function onOpen() {
  console.log('Connection opened.');
  controllerConnection.send(JSON.stringify({command: 'start-server', type: 'gpio'}));
  controllerConnection.send(JSON.stringify({command: 'start-server', type: 'video_control'}));
}

function onMessage(event) {
  console.log(event.data);
  res = JSON.parse(event.data);
  peripherals[res.type] = new WebSocket(WS_URI_PREFIX + res.port);
  peripherals[res.type].onopen = function() {
    console.log('Peripheral ' + res.type + ' opened.');
  };
}

$(function() {
  controllerConnection = new WebSocket(WS_URI_PREFIX + '8000');
  controllerConnection.onopen = onOpen;
  controllerConnection.onmessage = onMessage;
  $('#gpio0').button();
  $('#gpio1').button();
  $('#video').button();
  $('#gpio0').click(function() {
    console.log('gpio0 clicked.');
    peripherals['gpio'].send(JSON.stringify({command: 'set_value', pin: 0, value: this.checked ? 1 : 0}));
  });
  $('#gpio1').click(function() {
    console.log('gpio1 clicked.');
    peripherals['gpio'].send(JSON.stringify({command: 'set_value', pin: 1, value: this.checked ? 1 : 0}));
  });
  $('#video').click(function() {
    peripherals['video_control'].send(JSON.stringify({command: this.checked? 'play' : 'stop'}))
  });
});

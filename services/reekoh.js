'use strict';

let WebSocket = require('ws');
let ws = new WebSocket('ws://54.87.230.167:8052');

ws.on('open', function open() {
	console.log('Websocket Connection to Reekoh initialized.');
	done();
});

module.exports = ws;
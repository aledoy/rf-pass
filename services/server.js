'use strict';

const PORT = process.env.PORT || 8080;

let fs = require('fs');
let http = require('http');
let async = require('async');
let express = require('express');
let WebSocket = require('ws');

let app = express();
let server = http.createServer(app);
let wss = new WebSocket.Server({server: server});

app.use(express.static('./public'));

app.get('/', function (req, res) {
	fs.readFile('./public/index.html', 'utf8', function (err, text) {
		res.send(text);
	});
});

server.broadcast = function broadcast(data) {
	async.each(wss.clients, function (client, cb) {
		if (client.readyState === WebSocket.OPEN) client.send(data);
		cb();
	});
};

wss.on('error', function (err) {
	console.error('Error on Websocket Server.');
	console.error(err);

	setTimeout(function () {
		process.exit(1);
	}, 3000);
});

wss.on('connection', function connection(ws) {
	ws.on('message', function (message) {
		console.log('received: %s', message);
	});
});

server.listen(PORT, function () {
	console.log('Web server now listening on %s', PORT);
});

module.exports = server;
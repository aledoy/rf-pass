'use strict';

let fs = require('fs');
let http = require('http');
let async = require('async');
let express = require('express');
let isEmpty = require('lodash.isempty');

let app = express();
let server = http.createServer(app);
let io = require('socket.io')(server);

io.on('error', function (err) {
	console.error('Error on Websocket Server.');
	console.error(err);

	setTimeout(function () {
		process.exit(1);
	}, 3000);
});

server.on('error', function (err) {
	console.error('Error on HTTP Server.');
	console.error(err);

	setTimeout(function () {
		process.exit(1);
	}, 3000);
});

io.on('connection', function (client) {
	console.log('Received new client connection', client.id);
});

app.use(express.static('./public'));

app.get('/', function (req, res) {
	fs.readFile('./public/index.html', 'utf8', function (err, text) {
		res.send(text);
	});
});

server.broadcast = function (data) {
	if (!isEmpty(data))
		io.emit('badgein', data);
};

server.listen(8080, function () {
	console.log('Web server now listening on %s', 8080);
});

module.exports = server;
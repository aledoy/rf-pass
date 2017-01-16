'use strict';

const DEVICE_ID = process.env.DEVICE_CODE;
const PORT = 8080;

let fs = require('fs');
let url = require('url');
let http = require('http');
let async = require('async');
let sqlite3 = require('sqlite3').verbose();
let express = require('express');
let WebSocket = require('ws');
let SerialPort = require('serialport');

let db;

async.series([
	function (done) {
		db = new sqlite3.Database('./db/rb.db', done);
	},
	function (done) {
		db.serialize(function () {
			db.run('CREATE TABLE IF NOT EXISTS attendance(id INTEGER PRIMARY KEY, write_date DATETIME, create_date DATETIME, full_name TEXT, country_represented INT, rfid_tag TEXT, attendance_id INT, id_photo BLOB, country_image BLOB)');
			db.run('CREATE TABLE IF NOT EXISTS country(id INTEGER PRIMARY KEY,name TEXT, image BLOB)');
			db.run('CREATE TABLE IF NOT EXISTS meeting_log(id INTEGER PRIMARY KEY AUTOINCREMENT, write_date DATETIME, rfid_tag TEXT, machine_code TEXT, sync INT)');

			done();
		});
	},
	function (done) {
		let ws = new WebSocket('ws://54.87.230.167:8052');

		ws.on('open', function open() {
			console.log('Websocket Connection to Reekoh initialized.');
			done();
		});

		ws.on('message', function (data) {
			console.log(data);
		});
	},
	function (done) {
		let app = express();
		let server = http.createServer(app);
		let wss = new WebSocket.Server({server: server});

		app.use(express.static('./public'));

		app.get('/', function (req, res) {
			fs.readFile('./public/index.html', 'utf8', function (err, text) {
				res.send(text);
			});
		});

		wss.broadcast = function broadcast(data) {
			wss.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(data);
				}
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
			ws.on('message', function incoming(message) {
				console.log('received: %s', message);
			});
		});

		SerialPort.list(function (err, ports) {
			async.each(ports, function (port, done) {
				console.log(port);

				let rfIdPort = new SerialPort(port.comName, {
					baudRate: 57600,
					autoOpen: false
				});

				rfIdPort.on('error', function (err) {
					console.error('Error on Serial Port.');
					console.error(err);

					setTimeout(function () {
						process.exit(1);
					}, 3000);
				});

				rfIdPort.on('data', function (data) {
					console.log('UTF-8', data.toString());
					console.log('HEX', data.toString('hex'));

					async.series([
						function (cb) {
							console.log('Writing...');
							rfIdPort.write('\x04\x00\x01\xDB\x4B', cb);
						}
					], function (err) {
						if (err) return console.error(err);
					});

					/*db.get('SELECT a.id, a.full_name, a.id_photo, c.image FROM attendance a left join country c on c.name = a.country_represented where a.rfid_tag = $tag', {
					 $tag: data
					 }, function (err, row) {
					 let msg = '';

					 if (err || !row) {
					 msg = `<div class="content-bg">
					 <img src="/static/asean_logos.png"  class="wide-img main-img img-responsive center-block"/>
					 <br/>
					 <br/><br/>
					 <h1 class="participant">Access Denied.</h1>
					 <br/>
					 </div>`;
					 }
					 else {
					 msg = `<div class="content-bg">
					 <img src="/static/asean_logos.png"  class="wide-img main-img img-responsive center-block"/>
					 <br/>
					 <img src="data:;base64,${row.a.id_photo}" class="wide-img main-img img-responsive center-block" />
					 <br/><br/>
					 <h1 class="participant">${row.a.full_name}</h1>
					 <br/>
					 <img src="data:;base64,${row.c.image}" class="img-flag main-img img-responsive center-block" />
					 </div>`;
					 }

					 wss.broadcast(msg);
					 });*/
				});

				rfIdPort.open(function (err) {
					if (err) {
						console.error(`Error opening port ${port.comName}`);
						console.error(err);

						return setTimeout(function () {
							process.exit(1);
						}, 3000);
					}


					console.log(`Port ${port.comName} has been opened.`);
					rfIdPort.write('\x04\x00\x01\xDB\x4B');
				});

				done();
			});
		});

		server.listen(PORT, done);
	}
], function (err) {
	if (err) {
		console.error(err);
		return process.exit(1);
	}

	console.log('Web server now listening on %s', PORT);
});
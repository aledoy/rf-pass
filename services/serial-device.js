'use strict';

let async = require('async');
let SerialPort = require('serialport');

module.exports = {
	connect: function (callback) {
		SerialPort.list(function (err, ports) {
			let device = '';

			async.each(ports, function (port, done) {
				if (!/^\/dev\/ttyUSB/.test(port.comName)) return done();

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
					console.log('Data', data);

					rfIdPort.flush(function () {
						rfIdPort.write(new Buffer([0x04, 0x00, 0x01, 0xDB, 0x4B]));
					});
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
					rfIdPort.flush(function () {
						rfIdPort.write(new Buffer([0x04, 0x00, 0x01, 0xDB, 0x4B]));
					});
				});

				device = rfIdPort;
				done();
			}, function (err) {
				callback(err, device);
			});
		});
	}
};
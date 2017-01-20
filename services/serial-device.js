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

				device = rfIdPort;
				done();
			}, function (err) {
				callback(err, device);
			});
		});
	}
};
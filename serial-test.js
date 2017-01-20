'use strict';

let async = require('async');
let SerialPort = require('serialport');

SerialPort.list(function (err, ports) {
	async.each(ports, function (port, done) {
		console.log(port);

		let rfIdPort = new SerialPort(port.comName, {
			baudRate: 57600,
			parser: SerialPort.parsers.readline(null, 'hex'),
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

			/*setTimeout(function () {
				rfIdPort.flush(function () {
					rfIdPort.write(new Buffer('040001DB4B', 'hex'));
				});
			}, 2000);*/
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

		done();
	});
});
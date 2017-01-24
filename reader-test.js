'use strict';

let async = require('async');
let SerialPort = require('serialport');
let parser = require('./services/parser').serial();

SerialPort.list(function (err, ports) {
	async.each(ports, function (port, done) {
		if (!/^\/dev\/ttyUSB/.test(port.comName)) return done();

		console.log(port);

		let rfIdPort = new SerialPort(port.comName, {
			baudRate: 57600,
			parser: parser,
			autoOpen: false
		});


		let dataListener = function (data) {
			// self.emit('data', data);
			console.log('Data received', data);
		};

		rfIdPort.on('data', dataListener);

		rfIdPort.once('disconnect', function () {
			console.log(`${port.comName} port has been closed/disconnected.`);

			rfIdPort.removeListener('data', dataListener);
		});

		rfIdPort.open(function (err) {
			// Flush all inputs
			rfIdPort.flush(function () {
				// Write this byte sequence to start reading
				rfIdPort.write(new Buffer([0x04, 0x00, 0x01, 0xDB, 0x4B]));
			});
		});
	});
});
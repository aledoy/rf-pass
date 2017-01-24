'use strict';

let async = require('async');
let SerialPort = require('serialport');
let EventEmitter = require('events').EventEmitter;

function RFIDReader() {
	if (!(this instanceof RFIDReader)) {
		return new RFIDReader();
	}

	EventEmitter.call(this);
}

require('util').inherits(RFIDReader, EventEmitter);

RFIDReader.prototype.connect = function (callback) {
	let self = this;
	self.status = 'disconnected';

	SerialPort.list(function (err, ports) {
		if (err) return callback(err);

		async.each(ports, function (port, done) {
			if (!/^\/dev\/ttyUSB/.test(port.comName)) return done();

			console.log(port);

			let rfIdPort = new SerialPort(port.comName, {
				baudRate: 9600,
				autoOpen: false
			});

			let dataListener = function (data) {
				// self.emit('data', data);
				console.log(data);
			};

			rfIdPort.on('data', dataListener);

			rfIdPort.once('disconnect', function () {
				console.log(`${port.comName} port has been closed/disconnected.`);

				self.status = 'disconnected';
				rfIdPort.removeListener('data', dataListener);
				self.emit('disconnect');
			});

			rfIdPort.open(function (err) {
				if (err) throw err;

				self.status = 'connected';

				console.log(`${port.comName} port has been opened.`);

				// Flush all inputs
				rfIdPort.flush(function () {
					// Write this byte sequence to start reading
					rfIdPort.write(new Buffer([0x40, 0x06, 0xEE, 0x01, 0x00, 0x00, 0x00, 0xCB]));
				});
			});

			done();
		}, callback);
	});
};

module.exports = new RFIDReader();
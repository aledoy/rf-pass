'use strict';

let async = require('async');
let SerialPort = require('serialport');
let parser = require('./parser').serial();
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

			let serialPort = new SerialPort(port.comName, {
				baudRate: 57600,
				parser: parser,
				autoOpen: false
			});

			let dataListener = function (data) {
				self.emit('data', data);
			};

			serialPort.on('data', dataListener);

			serialPort.once('disconnect', function () {
				console.log(`${port.comName} port has been closed/disconnected.`);

				self.status = 'disconnected';
				serialPort.removeListener('data', dataListener);
				self.emit('disconnect');
			});

			serialPort.open(function (err) {
				if (err) {
					console.error(`Error opening serial port ${port.comName}`);
					console.error(err);

					throw err;
				}

				self.status = 'connected';

				console.log(`${port.comName} port has been opened.`);

				// Flush all inputs
				serialPort.flush(function () {
					// Write this byte sequence to start reading
					serialPort.write(new Buffer([0x04, 0x00, 0x01, 0xDB, 0x4B]));
				});
			});

			done();
		}, callback);
	});
};

module.exports = new RFIDReader();
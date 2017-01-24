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

			self.comName = port.comName;
			self.port = new SerialPort(port.comName, {
				baudRate: 57600,
				parser: parser,
				//baudRate: 9600,
				autoOpen: false
			});

			done();
		}, callback);
	});
};

RFIDReader.prototype.open = function (callback) {
	let self = this;

	self.port.open(function (err) {
		if (err) throw err;

		self.status = 'connected';

		console.log(`${self.comName} port has been opened.`);

		let dataListener = function (data) {
			// self.emit('data', data);
			console.log('Data received', data);
		};

		self.port.on('data', dataListener);

		self.port.once('disconnect', function () {
			console.log(`${self.comName} port has been closed/disconnected.`);

			self.status = 'disconnected';
			self.port.removeListener('data', dataListener);
			self.emit('disconnect');
		});

		// Flush all inputs
		self.port.flush(function () {
			// Write this byte sequence to start reading
			self.port.write(new Buffer([0x04, 0x00, 0x01, 0xDB, 0x4B]), callback);

			/* async.series([
				function (done) {
					self.port.write(new Buffer([0x40, 0x03, 0x0A, 0x01, 0x23]), done); // Set Antenna
				},
				function (done) {
					self.port.write(new Buffer([0x40, 0x06, 0xEE, 0x01, 0x00, 0x00, 0x00, 0xCB]), done); // List Tags
				}
			], callback); */
		});
	});
};

module.exports = new RFIDReader();
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

			let rfIdPort = new SerialPort(port.comName, {
				baudRate: 57600,
				parser: parser,
				autoOpen: false
			});

			let dataListener = function (data) {
				self.emit('data', data);
			};

			rfIdPort.on('data', dataListener);

			rfIdPort.once('disconnect', function () {
				console.log(`${port.comName} port has been closed/disconnected.`);

				self.status = 'disconnected';
				rfIdPort.removeListener('data', dataListener);
				self.emit('disconnect');
			});

			rfIdPort.open(function (err) {
				if (err) console.error(err);

				self.status = 'connected';

				console.log(`${port.comName} port has been opened.`);

				rfIdPort.flush(function (err) {
					if (err) console.error(err);

					console.log(`${port.comName} inputs have been flushed.`);

					setInterval(function () {
						rfIdPort.write(new Buffer([0x04, 0x00, 0x01, 0xDB, 0x4B]), function (err) {
							if (err) console.error(err);
						});
					}, 50);
				});
			});

			done();
		}, callback);
	});
};

module.exports = new RFIDReader();
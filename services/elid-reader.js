'use strict';

let async = require('async');
let SerialPort = require('serialport');
let parser = require('./parser').elid();
let EventEmitter = require('events').EventEmitter;

function RFIDReader() {
	if (!(this instanceof RFIDReader)) {
		return new RFIDReader();
	}

	EventEmitter.call(this);
}

require('util').inherits(RFIDReader, EventEmitter);

RFIDReader.prototype.connect = function (callback) {
	let int;
	let self = this;
	self.status = 'disconnected';

	SerialPort.list(function (err, ports) {
		if (err) return callback(err);

		async.each(ports, function (port, done) {
			if (!/^\/dev\/ttyUSB/.test(port.comName)) return done();

			console.log(port);

			let readerPort = new SerialPort(port.comName, {
				baudRate: 115200,
				parser: parser,
				autoOpen: false
			});

			let dataListener = function (data) {
				self.emit('data', data);
			};

			readerPort.on('data', dataListener);

			readerPort.once('disconnect', function () {
				console.log(`${port.comName} port has been closed/disconnected.`);

				self.status = 'disconnected';
				readerPort.removeListener('data', dataListener);
				clearInterval(int);
				readerPort = null;
				self.emit('disconnect');
			});

			readerPort.open(function (err) {
				if (err) console.error(err);

				self.status = 'connected';

				console.log(`${port.comName} port has been opened.`);

				readerPort.flush(function (err) {
					if (err) console.error(err);

					console.log(`${port.comName} inputs have been flushed.`);

					int = setInterval(function () {
						if (readerPort.isOpen()) {
							readerPort.write(new Buffer([0x40, 0x06, 0xEE, 0x00, 0x00, 0x00, 0x00, 0xCC]), function (err) {
								if (err) console.error(err);
							});
						}
					}, 50);
				});
			});

			done();
		}, callback);
	});
};

module.exports = new RFIDReader();
'use strict';

let readline = require('readline');

module.exports = {
	init: function (inputStream, callback) {
		callback(null, readline.createInterface({
			input: inputStream,
			output: process.stdout,
			terminal: false
		}));
	},
	serial: function () {
		// Delimiter buffer saved in closure
		let data = '';
		let start = false;

		return function (emitter, buffer) {
			let tmp = buffer.toString('hex');

			if (tmp.lastIndexOf('130001') >= 0 && !start) {
				data = tmp.substr(tmp.lastIndexOf('130001'));
				start = true;
			}
			else if (start) {
				data += tmp;

				if (data.length >= 40) {
					data = data.substring(12, 36);
					data = data.toUpperCase();

					emitter.emit('data', data);
					data = '';
					start = false;
				}
			}
			else
				start = false;
		};
	}
};
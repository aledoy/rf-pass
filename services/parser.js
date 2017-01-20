'use strict';

let readline = require('readline');

module.exports = {
	init: function (inputStream, callback) {
		callback(null, readline.createInterface({
			input: inputStream,
			output: process.stdout,
			terminal: false
		}));
	}
};
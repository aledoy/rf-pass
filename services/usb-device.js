'use strict';

var hid = require('hidstream');

module.exports = {
	connect: function (vendorId, productId, callback) {
		console.log(hid.devices());

		let device = new hid.device({
			vid: vendorId,
			pid: productId,
			parser : hid.parser.newline
		});

		callback(null, device);
	}
};
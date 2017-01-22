'use strict';

module.exports = {
	serial: function () {
		let data = '';
		let start = false;

		return function (emitter, buffer) {
			if (!buffer) return;

			let tmp = buffer.toString('hex');

			if (tmp.indexOf('130001') >= 0 && !start) {
				data = `${tmp}`.substr(tmp.indexOf('130001'));
				start = true;
			}
			else if (start) {
				data += `${tmp}`;

				if (data.length >= 40) {
					data = `${data}`.substring(12, 36);
					data = `${data}`.toUpperCase();

					emitter.emit('data', data);
					data = '';
					start = false;
				}
			}
			else {
				data = '';
				start = false;
			}
		};
	}
};
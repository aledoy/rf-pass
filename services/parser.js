'use strict';

module.exports = {
	generic: function () {
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
	},
	elid: function () {
		return function (emitter, buffer) {
			if (!buffer) return;

			let data = buffer.toString('hex');

			if (data.startsWith('f010ee0106'))
				emitter.emit('data', data);
		};
	}
};
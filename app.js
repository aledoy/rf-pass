'use strict';

const DEVICE_ID = process.env.DEVICE_ID;

let async = require('async');

async.series({
	db: function (done) {
		require('./services/db').init('./db/rb.db', done);
	},
	/*reekoh: function (done) {
		done(null, require('./services/reekoh'));
	},*/
	device: function (done) {
		require('./services/usb-device').connect(process.env.VENDOR_ID || 3727, process.env.PRODUCT_ID || 32, done);
	},
	server: function (done) {
		done(null, require('./services/server'));
	},
}, function (err, result) {
	if (err) {
		console.error(err);
		return process.exit(1);
	}

	/*result.reekoh.on('message', function (data) {
		console.log(data);
	});*/

	result.device.on('data', function (data) {
		data = data.replace(/\r/g, '');
		data = data.replace(/\n/g, '');
		data = data.replace(/\r\n/g, '');

		console.log(data);

		result.db.get('SELECT a.id, a.full_name, a.id_photo, c.image FROM attendance a left join country c on c.name = a.country_represented where a.rfid_tag = $tag', {
			$tag: data
		}, function (err, row) {
			let msg = '';

			if (err || !row) {
				msg = `<div class="content-bg">
                                <img src="/assets/asean_logos.png"  class="wide-img main-img img-responsive center-block"/>
                                <br/>
                                <img src="/assets/avatar.png" class="wide-img main-img img-responsive center-block" />
                                <br/><br/>
                                <h1 class="participant">${(row) ? row.full_name : ''}</h1>
                            </div>`;
			}
			else {
				msg = `<div class="content-bg">
                                <img src="/assets/asean_logos.png"  class="wide-img main-img img-responsive center-block"/>
                                <br/>
                                <img src="data:;base64,${row.id_photo}" class="wide-img main-img img-responsive center-block" />
                                <br/><br/>
                                <h1 class="participant">${row.full_name}</h1>
                                <br/>
                                <img src="data:;base64,${row.image}" class="img-flag main-img img-responsive center-block" />
                            </div>`;
			}

			result.server.broadcast(msg);
		});
	});
});
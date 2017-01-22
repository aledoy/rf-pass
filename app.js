'use strict';

require('dotenv').config()

let map = require('lodash.map');
let path = require('path');
let async = require('async');
let includes = require('lodash.includes');
let isEmpty = require('lodash.isempty');

let currentMeeting = null;

async.parallel({
	localDb: function (done) {
		// Connect to local SQLite Database
		let db = require('./services/local-db');

		db.connect({
			path: path.join(__dirname, 'db', 'rb.db'),
			machineCode: process.env.MACHINE_CODE
		}, function (err) {
			if (!err) console.log('Connected to Local Database');

			done(err, db);
		});
	},
	cloudDb: function (done) {
		// Connect to cloud MySQL Database
		let db = require('./services/cloud-db');

		db.connect({
			host: process.env.CLOUD_DB_HOST,
			port: process.env.CLOUD_DB_PORT,
			user: process.env.CLOUD_DB_USER,
			password: process.env.CLOUD_DB_PASS,
			database: process.env.CLOUD_DB_DATABASE,
			acquireTimeout: 15000
		}, function () {
			console.log('Connected to Cloud Database');
			done(null, db);
		});
	},
	mqttClient: function (done) {
		// Connect to MQTT Broker and subscribe to commands
		let mqtt = require('./services/mqtt');

		mqtt.connect({
			url: process.env.MQTT_URL,
			machineCode: process.env.MACHINE_CODE,
			user: process.env.MQTT_USER,
			pass: process.env.MQTT_PASS
		}, function () {
			mqtt.getClient(done);
		});
	},
	device: function (done) {
		// Connect to Serial RFID Device
		let rfIdReader = require('./services/rfid-reader');

		rfIdReader.connect(function (err) {
			done(err, rfIdReader);
		});
	},
	server: function (done) {
		// Put up the server and serve the static HTML page
		done(null, require('./services/server'));
	},
	cache: function (done) {
		// Initialise the cache
		done(null, require('./services/cache'));
	}
}, function (err, result) {
	if (err) {
		console.error(err);
		return process.exit(1);
	}

	// Get the current meeting for the device
	result.cloudDb.getCurrentMeeting(process.env.MACHINE_CODE, function (err, meeting) {
		if (!err && !isEmpty(meeting)) {
			currentMeeting = meeting.meeting_id;
			console.log(`Current meeting is now ${currentMeeting}`);
		}
	});

	// Listen for messages from the MQTT Broker
	result.mqttClient.on('message', function (topic, message) {
		console.log('Received Message');

		async.waterfall([
			async.constant(message.toString()),
			async.asyncify(JSON.parse)
		], function (err, message) {
			if (err || isEmpty(message)) return;

			// If type is meetinginfo, set the current meeting
			if (message.type === 'meetinginfo') {
				currentMeeting = message.$meeting_id;
				console.log(`Current meeting is now ${currentMeeting}`);
			}

			// If type is participantinfo, add the participant to the local database
			else if (message.type === 'participantinfo') {
				message.meeting_ids = (!isEmpty(message.meeting_ids)) ? message.meeting_ids.join(',') : null;

				result.localDb.addParticipant(message, function (err) {
					if (err) {
						console.error('Error adding participant', err);
						console.error('Participant Info', message);
					}
				});
			}
		});
	});

	// Listen for RFID Tags read by the RFID Reader
	result.device.on('data', function (data) {
		if (!`${data}`.length === 24) return;

		// Check if the tag is on the cache. If it is, don't execute the logic. Tags expire from the cache every 5 secs.
		result.cache.get(data, function (err, cacheResult) {
			if (err || !isEmpty(cacheResult)) return;

			async.parallel([
				function (done) {
					// Log the badge in
					result.localDb.log(data, currentMeeting, done);
				},
				function (done) {
					// Put the tag on the cache
					result.cache.put(data, done);
				},
				function (done) {
					async.waterfall([
						function (cb) {
							// Look up the participant on the Local SQLite Database
							result.localDb.getParticipant(data, function (err, participant) {
								cb(err, participant);
							});
						},
						function (participant, cb) {
							// If Local Database does not have the participant record, look up on the cloud database
							if (isEmpty(participant)) {
								result.cloudDb.getParticipant(data, function (err, participant) {
									if (!isEmpty(participant)) {
										result.localDb.addParticipant(participant, function (err) {
											if (err) console.error(err);
										});
									}

									cb(err, participant);
								});
							}
							else
								cb(null, participant);
						}
					], function (err, participant) {
						let msg = '';
						let meetings = (!isEmpty(participant) && !isEmpty(participant.meeting_ids)) ? `${participant.meeting_ids}`.split(',') : [];

						// If there was an error, show an avatar
						if (err) {
							console.error(err);

							msg = `<div class="content-bg">
									<img src="/assets/asean_logos.png"  class="wide-img main-img img-responsive center-block"/>
									<br/><br/><br/><br/><br/><br/>
									<img src="/assets/headshot_empty.gif" class="wide-img main-img img-responsive center-block" />
									<br/><br/>
									<h1 class="participant"></h1>
								</div>`;
						}

						// If record is found and authorized for the current meeting, show the participant info
						else if (!isEmpty(participant) && includes(meetings, currentMeeting)) {
							msg = `<div class="content-bg">
									<img src="/assets/asean_logos.png"  class="wide-img main-img img-responsive center-block"/>
									<br/><br/><br/><br/><br/><br/>
									<img src="data:;base64,${participant.id_photo}" class="wide-img main-img img-responsive center-block" />
									<br/><br/>
									<h1 class="participant">${participant.full_name}</h1>
								</div>`;
						}

						// Else show an avatart
						else {
							msg = `<div class="content-bg">
									<img src="/assets/asean_logos.png"  class="wide-img main-img img-responsive center-block"/>
									<br/><br/><br/><br/><br/><br/>
									<img src="/assets/headshot_empty.gif" class="wide-img main-img img-responsive center-block" />
									<br/><br/>
									<h1 class="participant">${(participant) ? participant.full_name : ''}</h1>
								</div>`;
						}

						// Propagate the info to the client via websocket
						result.server.broadcast(msg);
					});

					done();
				}
			], function (err) {
				if (err) console.error(err);
			});
		});
	});

	let reconnectDevice = function () {
		console.log('RFID Reader disconnected. Trying to reconnect...');

		let int = setInterval(function () {
			result.device.connect(function () {
				setTimeout(function () {
					if (result.device.status === 'connected') clearInterval(int);
				}, 3000);
			});
		}, 6000);
	};

	// Reconnect to RFID Reader when disconnected
	result.device.on('disconnect', reconnectDevice);

	process.nextTick(function () {
		setTimeout(function () {
			if (result.device.status === 'disconnected')
				reconnectDevice();
		}, 10000);
	});

	// Sync all meeting logs to the cloud database every 15 minutes
	setInterval(function () {
		console.log('Running meeting log sync.');

		result.localDb.getUnsyncedLogs(function (err, logs) {
			let ids = [];

			async.each(logs, function (log, done) {
				let logId = log.id;

				delete log.id;

				result.cloudDb.syncLog(log, function (err) {
					if (!err) ids.push(logId);
					done();
				});
			}, function () {
				// Update all meeting logs in the local database that were synced
				result.localDb.updateSyncedLogs(ids);
				console.log('Meeting log synced.');
			});
		});
	}, 900000);

	console.log('Startup Finished.');
});
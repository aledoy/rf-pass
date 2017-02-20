'use strict';

let db = require('./services/local-db');
let path = require('path');
let async = require('async');

db.connect({
	path: path.join(__dirname, 'db', 'rb.db'),
	machineCode: process.env.MACHINE_CODE
}, function (err) {
	if (err) {
		console.log('Local DB Connection Failed.', err);
		throw err;
	}

	db.getAllParticipants(function (err, participants) {
		if (err) {
			console.log('Failed retrieving all participant records.', err);
			throw err;
		}

		async.each(participants, function (participant, done) {
			if (!participant || !participant.id || !participant.rfid_tag) return done();

			let tag = participant.rfid_tag;
			tag = participant.rfid_tag.toUpperCase();

			db.updateParticipantTag(participant.id, tag, done);
		}, function (err) {
			if (err) {
				console.log('Failed retrieving all participant records.', err);
				throw err;
			}

			console.log('Updated all participant tags.');
			process.exit(0);
		});
	});
});
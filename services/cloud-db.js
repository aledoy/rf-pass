'use strict';

let async = require('async');
let mysql = require('mysql');
let isEmpty = require('lodash.isempty');

let pool;

module.exports = {
	connect: function (options, callback) {
		pool = mysql.createPool(options);

		pool.on('error', (err) => {
			console.error('Error on Connecting to Cloud DB.');
			console.error(err);

			setTimeout(function () {
				process.exit(1);
			}, 3000);
		});

		callback();
	},
	getCurrentMeeting: function (machineCode, callback) {
		async.waterfall([
			function (done) {
				pool.getConnection(done);
			},
			function (connection, done) {
				connection.query({
					sql: 'SELECT * FROM meetings WHERE `machine_code` = ? ORDER BY date DESC LIMIT 1',
					timeout: 5000,
					values: [machineCode]
				}, function (err, results, fields) {
					connection.release();

					if (err) {
						console.error(err);
						done(err);
					}
					else if (isEmpty(results))
						done();
					else
						done(null, results[0]);
				});
			}
		], callback);
	},
	getParticipant: function (tag, callback) {
		async.waterfall([
			function (done) {
				pool.getConnection(done);
			},
			function (connection, done) {
				connection.query({
					sql: 'SELECT full_name, id_photo, meeting_ids FROM attendance WHERE rfid_tag = ? LIMIT 1',
					timeout: 5000,
					values: [tag]
				}, function (err, results, fields) {
					connection.release();

					if (err) {
						console.error(err);
						done(err);
					}
					else if (isEmpty(results))
						done();
					else
						done(null, results[0]);
				});
			}
		], callback);
	},
	syncLog: function (log, callback) {
		async.waterfall([
			function (done) {
				pool.getConnection(done);
			},
			function (connection, done) {
				connection.query(`INSERT INTO meeting_logs SET ?`, log, (err) => {
					connection.release();

					if (err) console.error(err);

					done(err);
				});
			}
		], callback);
	}
};
'use strict';

let sql = require('mssql');
let isEmpty = require('lodash.isempty');

module.exports = {
	connect: function (options, callback) {
		sql.connect(options, callback);
	},
	getCurrentMeeting: function (machineCode, callback) {
		new sql.Request()
			.input('machine_code', sql.NVarChar, machineCode)
			.query('SELECT TOP 1 * FROM meetings WHERE machine_code = @machine_code ORDER BY date DESC', function (err, results) {
				if (err)
					callback(err);
				else if (isEmpty(results))
					callback();
				else
					callback(null, results[0]);
			});
	},
	getParticipant: function (tag, callback) {
		new sql.Request()
			.input('rfid_tag', sql.NVarChar, tag)
			.query('SELECT TOP 1 * FROM participants WHERE rfid_tag = @rfid_tag ORDER BY date DESC', function (err, results) {
				if (err)
					callback(err);
				else if (isEmpty(results))
					callback();
				else
					callback(null, results[0]);
			});
	},
	syncLog: function (log, callback) {
		let request = new sql.Request()
			.input('rfid_tag', sql.NVarChar, log.rfid_tag)
			.input('machine_code', sql.NVarChar, log.machine_code)
			.input('date', sql.DateTime, new Date(log.date));

		if (log.meeting_id) {
			request.input('meeting_id', sql.BigInt, log.meeting_id);

			request.query('INSERT INTO meeting_logs (rfid_tag, machine_code, date, meeting_id) VALUES (@rfid_tag, @machine_code, @date, @meeting_id)', callback);
		}
		else
			request.query('INSERT INTO meeting_logs (rfid_tag, machine_code, date) VALUES (@rfid_tag, @machine_code, @date)', callback);
	}
};
'use strict';

let sql = require('mssql');
let isEmpty = require('lodash.isempty');
let connection;

module.exports = {
	connect: function (options, callback) {
		connection = new sql.Connection(options);

		connection.on('error', function (err) {
			console.error(err);
			throw err;
		});

		connection.connect(callback);
	},
	getCurrentMeeting: function (machineCode, callback) {
		if (connection.connected) {
			let request = new sql.Request(connection);

			request.input('machine_code', sql.NVarChar, machineCode);

			request.query('SELECT TOP 1 * FROM meetings WHERE machine_code = @machine_code ORDER BY date DESC', function (err, results) {
				if (err)
					callback(err);
				else if (isEmpty(results))
					callback();
				else
					callback(null, results[0]);
			});
		}
		else {
			connection.connect(function () {
				let request = new sql.Request(connection);

				request.input('machine_code', sql.NVarChar, machineCode);

				request.query('SELECT TOP 1 * FROM meetings WHERE machine_code = @machine_code ORDER BY date DESC', function (err, results) {
					if (err)
						callback(err);
					else if (isEmpty(results))
						callback();
					else
						callback(null, results[0]);
				});
			});
		}
	},
	getParticipant: function (tag, callback) {
		if (tag) tag = tag.toUpperCase();

		if (connection.connected) {
			let request = new sql.Request(connection);

			request.input('rfid_tag', sql.NVarChar, tag);

			request.query('SELECT TOP 1 * FROM participants WHERE rfid_tag = @rfid_tag ORDER BY date DESC', function (err, results) {
				if (err)
					callback(err);
				else if (isEmpty(results))
					callback();
				else
					callback(null, results[0]);
			});
		}
		else {
			connection.connect(function () {
				let request = new sql.Request(connection);

				request.input('rfid_tag', sql.NVarChar, tag);

				request.query('SELECT TOP 1 * FROM participants WHERE rfid_tag = @rfid_tag ORDER BY date DESC', function (err, results) {
					if (err)
						callback(err);
					else if (isEmpty(results))
						callback();
					else
						callback(null, results[0]);
				});
			});
		}
	},
	getAllParticipants: function (fromId, callback) {
		let request;

		if (connection.connected) {
			request = new sql.Request(connection);
			request.stream = true;

			if (fromId)
				request.query(`SELECT * FROM participants WHERE id > ${fromId} ORDER BY id`);
			else
				request.query('SELECT * FROM participants ORDER BY id');

		}
		else {
			connection.connect(function () {
				request = new sql.Request(connection);
				request.stream = true;

				if (fromId)
					request.query(`SELECT * FROM participants WHERE id > ${fromId} ORDER BY id`);
				else
					request.query('SELECT * FROM participants ORDER BY id');
			});
		}

		callback(null, request);
	},
	syncLog: function (log, callback) {
		if (connection.connected) {
			let request = new sql.Request(connection);

			request.input('rfid_tag', sql.NVarChar, log.rfid_tag);
			request.input('machine_code', sql.NVarChar, log.machine_code);
			request.input('date', sql.DateTime, new Date(log.date));

			if (log.meeting_id) {
				request.input('meeting_id', sql.BigInt, log.meeting_id);

				request.query('INSERT INTO meeting_logs (rfid_tag, machine_code, date, meeting_id) VALUES (@rfid_tag, @machine_code, @date, @meeting_id)', callback);
			}
			else
				request.query('INSERT INTO meeting_logs (rfid_tag, machine_code, date) VALUES (@rfid_tag, @machine_code, @date)', callback);
		}
		else {
			connection.connect(function () {
				let request = new sql.Request(connection);

				request.input('rfid_tag', sql.NVarChar, log.rfid_tag);
				request.input('machine_code', sql.NVarChar, log.machine_code);
				request.input('date', sql.DateTime, new Date(log.date));

				if (log.meeting_id) {
					request.input('meeting_id', sql.BigInt, log.meeting_id);

					request.query('INSERT INTO meeting_logs (rfid_tag, machine_code, date, meeting_id) VALUES (@rfid_tag, @machine_code, @date, @meeting_id)', callback);
				}
				else
					request.query('INSERT INTO meeting_logs (rfid_tag, machine_code, date) VALUES (@rfid_tag, @machine_code, @date)', callback);
			});
		}
	}
};
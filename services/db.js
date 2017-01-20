'use strict';

module.exports = {
	init: function (path, callback) {
		let sqlite3 = require('sqlite3').verbose();

		//let db = new sqlite3.Database('./db/rb.db');
		let db = new sqlite3.Database(path);

		db.serialize(function (err) {
			db.run('CREATE TABLE IF NOT EXISTS attendance(id INTEGER PRIMARY KEY, write_date DATETIME, create_date DATETIME, full_name TEXT, country_represented INT, rfid_tag TEXT, attendance_id INT, id_photo BLOB, country_image BLOB)');
			db.run('CREATE TABLE IF NOT EXISTS country(id INTEGER PRIMARY KEY,name TEXT, image BLOB)');
			db.run('CREATE TABLE IF NOT EXISTS meeting_log(id INTEGER PRIMARY KEY AUTOINCREMENT, write_date DATETIME, rfid_tag TEXT, machine_code TEXT, sync INT)');

			callback(err, db);
		});
	}
};
'use strict';

let async = require('async');
let sqlite3 = require('sqlite3').verbose();
let db;

module.exports = {
	connect: function (options, callback) {
		db = new sqlite3.Database(options.path);

		db.serialize(function (err) {
			if (err) return callback(err);

			async.series([
				function (done) {
					db.run('CREATE TABLE IF NOT EXISTS "participant" ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `attendance_id` INTEGER NOT NULL, `full_name` TEXT NOT NULL, `id_photo` BLOB NOT NULL, `rfid_tag` TEXT NOT NULL, `meeting_ids` TEXT )', done);
				},
				function (done) {
					db.run('CREATE TABLE IF NOT EXISTS "meeting_logs" ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `rfid_tag` TEXT NOT NULL, `machine_code` TEXT NOT NULL DEFAULT \'' + options.machineCode + '\', `meeting_id` TEXT, `sync` INTEGER DEFAULT 0 )', done);
				},
				function (done) {
					db.run('CREATE INDEX IF NOT EXISTS `tag_index` ON "participant" (`rfid_tag` ASC)', done);
				}
			], callback);
		});
	},
	addParticipant: function (participant, callback) {
		db.run('INSERT INTO participant (`attendance_id`, `full_name`, `id_photo`, `rfid_tag`, `meeting_ids`) VALUES ($attendance_id, $full_name, $id_photo, $rfid_tag, $meeting_ids)', {
			$attendance_id: participant.attendance_id,
			$full_name: participant.full_name,
			$id_photo: participant.id_photo,
			$rfid_tag: participant.rfid_tag,
			$meeting_ids: participant.meeting_ids
		}, callback);
	},
	getParticipant: function (tag, callback) {
		db.get('SELECT full_name, id_photo, meeting_ids FROM participant WHERE rfid_tag = $tag LIMIT 1', {
			$tag: data
		}, callback);
	},
	log: function (tag, meetingId, callback) {
		db.run('INSERT INTO meeting_logs (`rfid_tag`, `meeting_id`) VALUES ($tag, $meetingId)', {
			$tag: data,
			$meetingId: meetingId
		}, callback);
	},
	getUnsyncedLogs: function(callback) {
		db.all('SELECT id, date, rfid_tag, machine_code, meeting_id FROM meeting_logs WHERE sync = 0', callback);
	},
	updateSyncedLogs: function (logIds, callback) {
		db.run(`UPDATE meeting_logs SET sync = 1 WHERE id IN (${logIds})`, callback);
	}
};
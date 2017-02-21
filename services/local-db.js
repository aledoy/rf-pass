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
					db.run('CREATE TABLE IF NOT EXISTS "participants" ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `attendance_id` INTEGER NOT NULL, `full_name` TEXT NOT NULL, `id_photo` BLOB NOT NULL, `rfid_tag` TEXT NOT NULL, `meeting_ids` TEXT )', done);
				},
				function (done) {
					db.run('CREATE TABLE IF NOT EXISTS "meeting_logs" ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `rfid_tag` TEXT NOT NULL, `machine_code` TEXT NOT NULL DEFAULT \'' + options.machineCode + '\', `meeting_id` TEXT, `sync` INTEGER DEFAULT 0 )', done);
				},
				function (done) {
					db.run('CREATE TABLE IF NOT EXISTS "sync_log" ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `cloud_id` INTEGER NOT NULL )', done);
				},
				function (done) {
					db.run('CREATE INDEX IF NOT EXISTS `tag_index` ON "participants" (`rfid_tag` ASC)', done);
				},
				function (done) {
					db.run('CREATE INDEX IF NOT EXISTS `attendance_id_index` ON "participants" (`attendance_id` ASC)', done);
				},
				function (done) {
					db.run('CREATE INDEX IF NOT EXISTS `sync_index` ON "meeting_logs" (`sync` ASC)', done);
				},
				function (done) {
					db.run('CREATE INDEX IF NOT EXISTS `date_index` ON "meeting_logs" (`date` ASC)', done);
				}
			], callback);
		});
	},
	addParticipant: function (participant, callback) {
		let tag;

		if (participant && participant.rfid_tag) tag = participant.rfid_tag.toUpperCase();

		db.run('INSERT INTO participants (`attendance_id`, `full_name`, `id_photo`, `rfid_tag`, `meeting_ids`) VALUES ($attendance_id, $full_name, $id_photo, $rfid_tag, $meeting_ids)', {
			$attendance_id: participant.attendance_id,
			$full_name: participant.full_name,
			$id_photo: participant.id_photo,
			$rfid_tag: tag,
			$meeting_ids: participant.meeting_ids
		}, callback);
	},
	getParticipant: function (tag, callback) {
		db.get('SELECT id, full_name, rfid_tag, id_photo, group_concat(meeting_ids) as meeting_ids FROM participants WHERE rfid_tag = $tag GROUP BY full_name, rfid_tag, id_photo ORDER BY id DESC LIMIT 1', {
			$tag: tag
		}, callback);
	},
	getAllParticipants: function (callback) {
		db.all('SELECT id, rfid_tag FROM participants', callback);
	},
	updateParticipantTag: function (id, tag, callback) {
		db.run(`UPDATE participants SET rfid_tag = $tag WHERE id = $id`, {
			$id: id,
			$tag: tag
		}, callback);
	},
	deleteParticipantByAttendanceId: function (attendanceId, tag, callback) {
		if (tag) tag = tag.toUpperCase();

		db.run('DELETE FROM participants WHERE attendance_id = $attendanceId OR rfid_tag = $tag', {
			$attendanceId: attendanceId,
			$tag: tag
		}, callback);
	},
	log: function (machineCode, tag, meetingId, callback) {
		db.run('INSERT INTO meeting_logs (`machine_code`, `rfid_tag`, `meeting_id`) VALUES ($machineCode, $tag, $meetingId)', {
			$machineCode: machineCode,
			$tag: tag,
			$meetingId: meetingId
		}, callback);
	},
	getUnsyncedLogs: function (callback) {
		db.all('SELECT id, date, rfid_tag, machine_code, meeting_id FROM meeting_logs WHERE sync = 0 ORDER BY date', callback);
	},
	updateSyncedLogs: function (logIds, callback) {
		db.run(`UPDATE meeting_logs SET sync = 1 WHERE id IN (${logIds})`, callback);
	},
	logCloudSync: function (cloudId, callback) {
		db.run('INSERT INTO sync_log (`cloud_id`) VALUES ($cloudId)', {
			$cloudId: cloudId
		}, callback);
	},
	getLatestCloudSync: function (callback) {
		db.get('SELECT cloud_id FROM sync_log ORDER BY id DESC LIMIT 1', function (err, record) {
			callback(err, record || null);
		});
	},
	deleteAllCloudSyncLogs: function (callback) {
		db.run('DELETE FROM sync_log', callback);
	}
};

'use strict';

let mqtt = require('mqtt');
let mqttClient;

module.exports = {
	connect: function (options, callback) {
		mqttClient = mqtt.connect(options.url, {
			keepalive: 5,
			clientId: options.machineCode,
			username: options.user,
			password: options.pass,
			reconnectPeriod: 1000
		});

		mqttClient.on('connect', function () {
			console.log('MQTT Client connected to server.');

			mqttClient.subscribe(options.machineCode);

			console.log(`MQTT Client subscribed to ${options.machineCode}`);
		});

		mqttClient.on('offline', function() {
			console.log('MQTT Client went offline.');
		});

		mqttClient.on('reconnect', function() {
			console.log('MQTT Client reconnecting to server.');
		});

		callback();
	},
	getClient: function (callback) {
		callback(null, mqttClient);
	}
};
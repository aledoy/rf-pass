'use strict';

let mqtt = require('mqtt');
let mqttClient;

module.exports = {
	connect: function (options, callback) {
		mqttClient = mqtt.connect(options.url, {
			keepalive: 300,
			clientId: options.machineCode,
			username: options.user,
			password: options.pass,
			reconnectPeriod: 1000
		});

		mqttClient.on('error', function (err) {
			console.error('Error on MQTT Client');
			console.error(err);

			return setTimeout(function () {
				process.exit(1);
			}, 3000);
		});

		mqttClient.on('connect', function () {
			console.log('Connected to Reekoh MQTT Server');

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
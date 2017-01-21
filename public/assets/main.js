$(document).ready(function () {
	socket = io.connect('ws://localhost:8080', {
		reconnection: true,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 5000,
		reconnectionAttempts: Infinity
	});

	socket.on('connect', function () {
		console.log('Socket.io Connected');
	});

	socket.on('badgein', function (data) {
		console.log('Badge in detected.');
		$('#current').html(data).show().delay(15000).fadeOut();
	});
});

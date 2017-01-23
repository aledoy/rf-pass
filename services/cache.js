'use strict';

let NodeCache = require('node-cache');
let myCache = new NodeCache({
	stdTTL: 5,
	checkperiod: 5
});

module.exports = {
	put: function (key, callback) {
		myCache.set(key, 'val', callback);
	},
	get: function (key, callback) {
		myCache.get(key, callback);
	}
};
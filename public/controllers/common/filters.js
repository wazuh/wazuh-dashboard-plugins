const app = require('ui/modules').get('app/wazuh', []);

app
	.filter('prettyJSON', function() {
		return function(json) {
			return angular.toJson(json, true);
		};
	})
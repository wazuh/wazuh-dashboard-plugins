const app = require('ui/modules').get('app/wazuh', []);
app
	.directive('dynamic', function($compile) {
		return {
			restrict: 'A',
			replace: true,
			link: function(scope, ele, attrs) {
				scope.$watch(attrs.dynamic, function(html) {
					ele.html(html);
					$compile(ele.contents())(scope);
				});
			},
		};
	});
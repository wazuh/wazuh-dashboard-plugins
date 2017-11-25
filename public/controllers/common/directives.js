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
	})
	.directive('menuTop',function(){
		return{
			template:
			`<md-nav-bar class="wazuhMenuNav" md-selected-nav-item="menuNavItem" nav-bar-aria-label="navigation menu">` +
			`	<md-nav-item id="header_logo" md-nav-href="#/" name="logo" aria-hidden="true">` +
			`		<img aria-hidden="true" kbn-src="/plugins/wazuh/img/logo_white.png" height="44" weight="252"></img>` +
			`	</md-nav-item>` +
			`	<md-nav-item ng-class="{menuSelectedChangeColor: menuNavItem == 'overview' }" md-nav-href="#/overview" name="overview">Overview</md-nav-item>` +
			`	<md-nav-item ng-class="{menuSelectedChangeColor: menuNavItem == 'manager' }" md-nav-href="#/manager" name="manager">Manager</md-nav-item>` +
			`	<md-nav-item ng-class="{menuSelectedChangeColor: menuNavItem == 'agents' }" md-nav-href="#/agents" name="agents">Agents</md-nav-item>` +
			`	<md-nav-item ng-class="{menuSelectedChangeColor: menuNavItem == 'discover' }" md-nav-href="#/wazuh-discover" name="discover">Discover</md-nav-item>` +
			`	<md-nav-item style="color:white !important;" class="wazuhMenuNavBar_gear" md-nav-href="#/settings" name="settings"><i class="fa fa-cog ng-scope" aria-hidden="true" ></i></md-nav-item>` +
			`</md-nav-bar>`
		};
	});
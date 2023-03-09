// Note: ideally this lives in collections/services/search/distributed/groups
// but that is not implemented yet.
// So we go to the raw conf file

define(
	[
		'jquery',
		'underscore',
		'@splunk/swc-mc',
		'splunk_monitoring_console/models/DistsearchGroup'
	],
	function(
		$,
		_,
		SwcMC,
		DistsearchGroupModel
	) {
		
		return SwcMC.SplunkDsBaseCollection.extend({
			url: '/services/search/distributed/groups',
			model: DistsearchGroupModel
		});
	} 
);
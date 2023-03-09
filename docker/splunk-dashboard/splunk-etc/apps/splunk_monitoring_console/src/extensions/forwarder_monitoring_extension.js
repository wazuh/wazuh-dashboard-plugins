define([
	'jquery',
	'underscore',
	'collections/services/saved/Searches',
	'splunkjs/mvc/simplexml/ready!'
], function(
	$,
	_,
	SavedSearchCollection
) {
	var savedSearchCollection = new SavedSearchCollection();
	savedSearchCollection.fetch({
		data: {
            app: 'splunk_monitoring_console',
            owner: '-',
            search: 'name="DMC Forwarder - Build Asset Table"'
        }
	}).done(function() {
		if (savedSearchCollection.models[0].entry.content.get('disabled')) {
			$('.fieldset').hide();
			$('.dashboard-row').hide();
			$('#forwarder_monitoring_extension').show();	// tell user to enable forwarder monitoring
		}
		else {
			$('#forwarder_monitoring_extension').hide();
		}
	}).fail(function() {
		$('#forwarder_monitoring_extension').html(_('Cannot find the saved search: DMC Forwarder - Build Asset Table').t()).show();
	});
});
define([
	'underscore',		
	'jquery',
	'splunkjs/mvc/searchmanager',
    'splunk.util',
	'splunkjs/mvc/simplexml/ready!'
], function(
	_,
	$,
	SearchManager,
	utils
) {
	var ASSET_TABLE_LOOKUP = "|inputlookup dmc_assets where search_group=\"dmc_group_kv_store\"";
	var NO_KVSTORE_MSG = "You have no KV Store collections configured.";
	var ERROR_MSG = "We were unable to retrieve your KV Store instances. Please try again later.";

	$('.fieldset').hide();
	$('.dashboard-row').hide();

	var kvStoreSearch = new SearchManager({
        id: 'kv-store-lookup',
        search: ASSET_TABLE_LOOKUP,
        autostart: true,
        auto_cancel: 5,
        cache: false,
        preview: true
    });

	// If no result exists, then there is no instance assigned as a kv_store.
	// Display a message and hide all the panels.
	kvStoreSearch.on("search:done", function(properties) {
		var numResults = properties.content.resultCount;
		if(numResults === 0) {
			$('#kv_store_instance_extension').html("<p>" + _(NO_KVSTORE_MSG).t() + "</p>").show();
		} else {
			$('.fieldset').show();
			$('.dashboard-row').show();
			$('#kv_store_instance_extension').hide();
		}
	}).on("search:failed search:error search:cancelled", function() {
		$('#kv_store_instance_extension').html("<p>" + _(ERROR_MSG).t() + "</p>").show();
	});
});
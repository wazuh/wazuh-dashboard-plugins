define([
    'underscore',
    'jquery',
    'splunkjs/mvc/sharedmodels',
    'splunkjs/mvc/simplexml',
    'splunkjs/mvc/utils',
    'splunk.util'
], function(_, $, SharedModels, SimpleXml, Utils, SplunkUtil) {
    var REDIRECT_VIEWS = [
        'index_detail_deployment',
        'indexes_and_volumes_deployment',
        'indexing_performance_deployment',
        'kv_store_deployment',
        'resource_usage_deployment',
        'search_activity_deployment',
        'shc_app_deployment',
        'shc_artifact_replication',
        'shc_conf_rep',
        'shc_scheduler_delegation_statistics',
        'shc_status_and_conf',
        'volume_detail_deployment'
    ];
    var NOT_AVAILABLE_VIEW = 'standalone';
    var thisPage = Utils.getPageInfo().page;
    var APP = SharedModels.get('app').get('app');
    var currentApp = SharedModels.get('appLocal');
    var appUrlPrefix = '/app/' + encodeURIComponent(APP);

    var invokeStandalone = function() {
        $('.preload .dashboard-header:after').css('display', 'none');
        $('.dashboard-header .edit-dashboard-menu').css('display', 'none');
        $('.empty-dashboard').css('visibility', 'hidden');
    };

    if (_.contains(REDIRECT_VIEWS, thisPage)) {
        $('.dashboard-body > :not(.dashboard-header)').css('visibility', 'hidden');
        currentApp.dfd.then(function() {
            var configured = currentApp.entry.content.get('configured');
            if (!configured) {
                $('.dashboard-header').append('<p>' + _("This dashboard is not available, because the Monitoring Console is in standalone mode.").t() + '</p>');
                invokeStandalone();
            } else {
                $('.dashboard-body > :not(.dashboard-header)').css('visibility', 'visible');
            }
        });
    }

    if (thisPage === "standalone") {
        invokeStandalone();
    }
});

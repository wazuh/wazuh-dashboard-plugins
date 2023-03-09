define(['jquery', 'underscore', 'splunk_monitoring_console/contrib/backbone'], function($, _, Backbone) {
    // inject a reference to jquery in case we ever run it in no conflict mode
    Backbone.$ = $;
    return Backbone.noConflict();
});
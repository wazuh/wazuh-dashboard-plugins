/**
 * Created by ykou on 3/11/15.
 */
define([
    'underscore',
    "splunk_monitoring_console/models/splunk_health_check/CheckList",
    "@splunk/swc-mc"
], function(
    _,
    Model,
    SwcMC
) {
    return SwcMC.SplunkDsBaseCollection.extend({
        url: 'configs/conf-checklist',
        model: Model,
        fetch: function(options) {
            options || (options = {});
            options.data || (options.data = {});
            // the app and owner options are always needed when fetching a custom conf file.
            _.defaults(options.data, {
                app: '-',
                owner: '-'
            });
            return SwcMC.SplunkDsBaseCollection.prototype.fetch.call(this, options);
        },

        // returns an array of enabled check items. 
        filterByEnabled: function() {
            return this.filter(function(item) {
                return !item.isDisabled();
            });
        }
    });
});
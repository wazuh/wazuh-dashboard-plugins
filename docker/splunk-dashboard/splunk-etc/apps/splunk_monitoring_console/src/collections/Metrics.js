define(['underscore', 'splunk_monitoring_console/models/Metric', '@splunk/swc-mc'], function (_, Model, SwcMC) {
    return SwcMC.SplunkDsBaseCollection.extend({
        initialize: function () {
            SwcMC.SplunkDsBaseCollection.prototype.initialize.apply(this, arguments);
        },
        model: Model,
        url: 'configs/conf-splunk_monitoring_console_assets',
        fetch: function (options) {
            options = _.defaults(options || {}, { count: 0 });
            options.data = _.defaults(options.data || {}, {
                app: 'splunk_monitoring_console',
                owner: 'nobody',
                count: -1,
                search: 'name=metric:*',
            });

            return SwcMC.SplunkDsBaseCollection.prototype.fetch.call(this, options);
        },
        /**
         * Process the metrics so they can be rendered.
         * @param enabledOnly {Boolean} if true, only return enabled metrics
         * @returns {Object}
         */
        getMetrics: function (enabledOnly) {
            var metrics = {};
            this.map(function (metric) {
                if ((enabledOnly && !metric.entry.content.attributes.disabled) || !enabledOnly) {
                    var name = metric.entry.attributes.name;
                    metrics[name] = {};
                    metrics[name].displayName = metric.entry.content.attributes.display_name;
                    metrics[name].search = metric.entry.content.attributes.search;
                    metrics[name].description = metric.entry.content.attributes.description;
                    metrics[name].disabled = metric.entry.content.attributes.disabled;
                    metrics[name].recommended = SwcMC.GeneralUtils.normalizeBoolean(
                        metric.entry.content.attributes.recommended
                    );
                }
            });
            return metrics;
        },
        /**
         * Process the metrics so they can be rendered
         * Only return metrics that are enabled.
         * @returns {Object}
         */
        getEnabledMetrics: function () {
            return this.getMetrics(true);
        },
    });
});

define(
    [
        'underscore',
        '@splunk/swc-mc'
    ],
    function(
        _,
        SwcMC
    ) {
        return SwcMC.SplunkDBaseModel.extend({
            url: 'saved/bookmarks/monitoring_console',
            urlRoot: 'saved/bookmarks/monitoring_console',
            id: 'monitoring_console',
            initialize: function() {
                SwcMC.SplunkDBaseModel.prototype.initialize.apply(this, arguments);
            },
            save: function(attributes, options) {
                if (this.isNew()) {
                    options = options || {};
                    options.data = _.defaults(options.data || {}, {
                        app: 'splunk_monitoring_console',
                        owner: 'nobody',
                        name: this.entry.get('name'),
                    });
                }
                return SwcMC.SplunkDBaseModel.prototype.save.call(this, attributes, options);
            }
        });
    }
);

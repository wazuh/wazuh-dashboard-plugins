define(
    [
        'underscore',
        'splunk_monitoring_console/models/StaticIdSplunkDBase'
    ],
    function(
        _,
        BaseModel
    ) {
        return BaseModel.extend({
            initialize: function() {
                BaseModel.prototype.initialize.apply(this, arguments);
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
                return BaseModel.prototype.save.call(this, attributes, options);
            },
        }, {
            id: '/servicesNS/nobody/splunk_monitoring_console/configs/conf-splunk_monitoring_console_assets'
        });
    }
);
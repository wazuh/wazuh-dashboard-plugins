define(
    [
        'underscore',
        'module',
        'backbone',
        'splunk_monitoring_console/views/table/controls/SimpleDialog'
    ],
    function(
        _,
        module,
        Backbone,
        SimpleDialog
    ) {
        return SimpleDialog.extend({
            moduleId: module.id,
            initialize: function(options) {
                var defaults = {};
                this.options = _.extend({}, defaults, this.options);
                SimpleDialog.prototype.initialize.apply(this, arguments);
            },
            render: function() {
                this.$(SimpleDialog.FOOTER_SELECTOR).append(SimpleDialog.BUTTON_DONE);
                return this;
            }
        });
    }
);

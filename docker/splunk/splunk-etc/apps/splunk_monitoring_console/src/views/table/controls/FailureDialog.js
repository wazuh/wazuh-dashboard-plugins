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
        var button_continue = '<a href="#" class="btn modal-btn-continue pull-right" data-dismiss="modal">' + _('Continue').t() + '</a>';
        return SimpleDialog.extend({
            moduleId: module.id,
            initialize: function(options) {
                var defaults = {
                    title: _("Error").t(),
                    message: _("Something went wrong. Please try again later.").t()
                };
                this.options = _.extend({}, defaults, this.options);
                SimpleDialog.prototype.initialize.apply(this, arguments);
            },
            render: function() {
                this.$(SimpleDialog.FOOTER_SELECTOR).append(button_continue);
                return this;
            }
        });
    }
);


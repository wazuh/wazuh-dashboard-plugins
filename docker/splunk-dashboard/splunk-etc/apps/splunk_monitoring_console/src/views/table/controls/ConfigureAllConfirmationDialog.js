define(
    [
        'jquery',
        'underscore',
        'module',
        'backbone',
        'splunk_monitoring_console/views/table/controls/SimpleDialog',
        '@splunk/swc-mc'
    ],
    function(
        $,
        _,
        module,
        Backbone,
        SimpleDialog,
        SwcMC
    ) {
    var BUTTON_OVERVIEW = '<a href="#" class="btn btn-primary modal-btn-primary overview pull-left" data-dismiss="modal">' + _('Go to Overview').t() + '</a>';
    var BUTTON_REFRESH = '<a href="#" class="btn btn-primary modal-btn-primary refresh pull-right" data-dismiss="modal">' + _('Refresh').t() + '</a>';
        return SimpleDialog.extend({
            moduleId: module.id,
            initialize: function(options) {
                var defaults = {title: _("Success!").t()};
                this.options = _.extend({}, defaults, this.options);
                SimpleDialog.prototype.initialize.apply(this, arguments);

                this.application = this.options.application;
            },
            events: $.extend({}, SimpleDialog.prototype.events, {
                'click .btn.refresh': function(e) {
                    this.hide();
                    location.reload();
                },
                'click .btn.overview': function(e) {
                    this.hide();
                    SwcMC.SplunkUtil.redirect_to([
                        'app',
                        this.application.get('app'),
                        //'Overview'
                        'monitoringconsole_overview'
                    ].join('/'));
                }
            }),
            render: function() {
                this.$(SimpleDialog.FOOTER_SELECTOR).append(BUTTON_OVERVIEW);
                this.$(SimpleDialog.FOOTER_SELECTOR).append(BUTTON_REFRESH);
                return this;
            }
        });
    }
);


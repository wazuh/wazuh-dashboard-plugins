define(
    [
        'jquery',
        'underscore',
        'backbone',
        'module',
        'splunk_monitoring_console/views/table/controls/SimpleDialog',
        '@splunk/swc-mc'
    ],
    function(
        $,
        _,
        Backbone,
        module,
        SimpleDialog,
        SwcMC
    ) {
        var TEXT = {
            TITLE: _('Switch to Distributed Mode').t(),
            P1: _('Do not configure the DMC in distributed mode if this is a production search head. Doing so can change the behavior of all searches on this instance.  This is dangerous and unsupported.').t(),
            P2_1: _('If you want to configure the DMC in distributed mode, you must locate the DMC on an instance that is not a production search head.').t(),
            P2_2: _('Learn more').t(),
            P3: _('Are you sure you want to continue?').t()
        };

        return SimpleDialog.extend({
            moduleId: module.id,

            initialize: function(options) {
                this.compiledMessageTemplate = _.template(this.messageTemplate);

                var defaults = {
                    title: TEXT.TITLE,
                    message: this.compiledMessageTemplate({
                        helpLink: SwcMC.URIRoute.docHelp(
                            this.model.application.get('root'),
                            this.model.application.get('locale'),
                            'app.splunk_monitoring_console.monitoringconsole_configure'
                        )
                    }),
                    keyboard: false,
                    backdrop: 'static'
                };
                this.options = _.extend({}, defaults, this.options);
                SimpleDialog.prototype.initialize.apply(this, arguments);
            },

            events: $.extend(
                SimpleDialog.prototype.events,
                {
                    'click .btn.cancel': function(e) {
                        this.trigger('proceed', false);
                    },
                    'click .btn.affirmative-continue': function(e) {
                        this.trigger('proceed', true);
                    }
                }
            ),

            render: function() {
                this.$(SimpleDialog.FOOTER_SELECTOR).append(SimpleDialog.BUTTON_CANCEL);
                this.$(SimpleDialog.FOOTER_SELECTOR).append(SimpleDialog.BUTTON_AFFIRMATIVE_CONTINUE);
                return this;
            },

            messageTemplate: '' +
                '<p class="alert alert-warning"><i class="icon-alert"></i>' + TEXT.P1 + '<br/><br/>' +
                TEXT.P2_1 + '<br/><a href="<%- helpLink %>" class="external" target="_blank">' + TEXT.P2_2 + '</a></p>' +
                '<p>' + TEXT.P3 + '</p>'
        });
    }
);


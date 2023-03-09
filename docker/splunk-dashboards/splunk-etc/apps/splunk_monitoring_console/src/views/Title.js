define(
    [
        'underscore',
        'module',
        '@splunk/swc-mc'
    ],
    function(
        _,
        module,
        SwcMC
    )
    {
        return SwcMC.BaseView.extend({
            moduleId: module.id,
            initialize: function() {
                SwcMC.BaseView.prototype.initialize.apply(this, arguments);
            },
            render: function() {
                var root = (SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH.indexOf("/") === 0 ?
                    SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH.substring(1) :
                    SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH
                );

                this.$el.html(this.compiledTemplate({
                    _: _,
                    helpLink: SwcMC.URIRoute.docHelp(root, SwcMC.SplunkConfig.LOCALE, "app.splunk_monitoring_console.monitoringconsole_configure")
                }));
                return this;
            },
            template: '\
                <h2 class="section-title"><%- _("Setup").t() %></h2>\
                <p class="section-description">\
                    <%- _("Current topology of Splunk Enterprise deployment.").t() %>\
                    <a class="external" href="<%- helpLink %>" target="_blank"><%- _("Learn more").t()%></a>\
                </p>\
            '
        });
    }
);

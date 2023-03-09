define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'contrib/text!splunk_monitoring_console/views/splunk_health_check/ProgressBar.html',
    'splunk_monitoring_console/views/splunk_health_check/ProgressBar.pcss'
], function(
    _,
    module,
    SwcMC,
    Template,
    css
) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.listenTo(this.model, 'change:checked change:total', this.render);
        },
        render: function() {
            var current = this.model.get('checked');
            var total = this.model.get('total');
            var ratio = total ? current / total * 100 : 0;
            var percent = ratio < 100 ? ratio : 100;
            this.$el.attr('aria-live', 'assertive');
            this.$el.attr('role', 'status');
            this.$el.html(this.compiledTemplate({
                percent: percent,
                splunkUtils: SwcMC.SplunkUtil
            }));
            return this;
        }
    });
});
/**
 * Created by ykou on 9/28/15.
 */
define(
[
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/splunk_health_check/ReasonCountDistributed',
    'splunk_monitoring_console/views/splunk_health_check/ReasonCountStandalone',
    'splunk_monitoring_console/views/splunk_health_check/utils',
    'contrib/text!splunk_monitoring_console/views/splunk_health_check/Task.html',
    'splunk_monitoring_console/views/splunk_health_check/pcss/icon-style.pcss'
], function(
    _,
    module,
    SwcMC,
    ReasonCountDistributed,
    ReasonCountStandalone,
    utils,
    Template,
    iconStyleCSS
) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,
        tagName: 'tr',
        className: 'check-item',
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            var isDistributedMode = this.model.dmcConfigs.isDistributedMode();
            var _ReasonCountView = isDistributedMode ? ReasonCountDistributed : ReasonCountStandalone;
            this.children.reasonCount = new _ReasonCountView({
                model: {
                    task: this.model.task
                }
            });

            this.listenTo(this.model.task, 'change:status', this.render);
        },

        render: function() {
            // NOTE: all the show/hide logic are in the template.
            this.$el.html(this.compiledTemplate({
                title: this.model.task.getTitle(),
                category: this.model.task.getCategory(),
                tags: this.model.task.getTags()
            }));

            if (!this.model.task.isReady()) {
                this.$('.check-item-results').append(this.children.reasonCount.render().$el);
            }

            // Set the row id attribute on the root tag which is a TR
            this.$el.attr('data-check-item-id', this.model.task.getID());

            return this;
        }
    });
});
/**
 * Created by claral on 6/21/16.
 */
define(
[
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/splunk_health_check/utils',
    'contrib/text!splunk_monitoring_console/views/splunk_health_check/ReasonCountStandalone.html',
    'splunk_monitoring_console/views/splunk_health_check/ReasonCountStandalone.pcss',
    'splunk_monitoring_console/views/splunk_health_check/pcss/icon-style.pcss'
], function(
    _,
    module,
    SwcMC,
    utils,
    Template,
    css,
    iconStyleCSS
) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,
        render: function() {
            var isDone = this.model.task.isDone();
            var sevLevel = this.model.task.getSeverityLevel();
            var messageText = '';
            if (isDone) {
                if (sevLevel)  {
                    messageText = this.model.task.getFailText();
                    if (sevLevel == -1) {
                        messageText = utils.TASK_NOT_APPLICABLE;
                    }
                } else {
                    messageText = utils.TASK_COMPLETE_SUCCESS;
                }
            }

            this.$el.html(this.compiledTemplate({
                iconClassName: isDone ? utils.SEVERITY_LEVEL_ICON_CLASS_NAME[sevLevel].icon : utils.ICON_CLASS_NAME.rotate,
                tooltip: isDone ? utils.SEVERITY_LEVEL_ICON_CLASS_NAME[sevLevel].tooltip : '',
                messageText: messageText,
                isDone: isDone
            }));

            this.$('.health-tooltip-link').tooltip();

            return this;
        }
    });
});

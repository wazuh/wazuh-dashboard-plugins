/**
 * Created by claral on 6/28/16.
 */
define(
[
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/splunk_health_check/utils',
    'contrib/text!splunk_monitoring_console/views/splunk_health_check/TaskInfo.html',
    'splunk_monitoring_console/views/splunk_health_check/TaskInfo.pcss'
], function(
    _,
    module,
    SwcMC,
    utils,
    Template,
    css
) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,
        className: 'task-info',

        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

        },

        render: function() {
            var description = '';
            var message = '';
            var suggestedAction = '';
            var docLinks = [];
            var docTitles = [];

            if (this.model.task) {
                description = this.model.task.getDesc();
                if (this.model.task.isDone()) {
                    if (this.model.task.getSeverityLevel()) {
                        message = this.model.task.getFailText();
                        if (this.model.task.getSeverityLevel() == -1 ) {
                            message = utils.TASK_NOT_APPLICABLE;
                        }
                        suggestedAction = this.model.task.getSuggestedAction();
                        var root = this.model.application.get('root');
                        var locale = this.model.application.get('locale');
                        if (this.model.task.getDocLink()) {
                            var docs = this.model.task.getDocLink().split(',');
                            for (var i = 0; i < docs.length; i++) {
                                docLinks.push(SwcMC.URIRoute.docHelp(root, locale, docs[i].trim()));
                            }
                        }
                        if (this.model.task.getDocTitle()) {
                            var titles = this.model.task.getDocTitle().split(',');
                            for (i = 0; i < titles.length; i++) {
                                docTitles.push(SwcMC.SplunkUtil.sprintf(_('Learn more about %s').t(), titles[i].trim()));
                            }
                        }
                    } else {
                        message = utils.TASK_COMPLETE_SUCCESS;
                        var two_d = this.model.task.getResult().raw.rows;
                        var severity_level_array = two_d.map(function(value,index) { return value[5]; });
                        if (severity_level_array.indexOf("-1") >= 0) {
                            message = utils.TASK_INCLUDE_SUCCESS_AND_NA;
                        }
                    }
                } else {
                    message = utils.TASK_NOT_COMPLETE_YET;
                }
            }

            this.$el.html(this.compiledTemplate({
                description: description,
                message: message,
                suggestedAction: suggestedAction,
                docLinks: docLinks,
                docTitles: docTitles
            }));

            return this;
        }
    });
});
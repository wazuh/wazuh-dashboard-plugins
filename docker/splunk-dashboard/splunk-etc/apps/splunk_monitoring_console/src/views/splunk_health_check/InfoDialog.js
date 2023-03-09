/**
 * Created by claral on 6/29/16
 */

define([
    'underscore',
    'backbone',
    'module',
    'splunk_monitoring_console/views/splunk_health_check/Results',
    'splunk_monitoring_console/views/splunk_health_check/TaskInfo',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/splunk_health_check/InfoDialog.pcss'
],

    function(
        _,
        Backbone,
        module,
        ResultsView,
        TaskInfoView,
        SwcMC,
        css
        ) {

        return SwcMC.ModalView.extend({
            moduleId: module.id,
            className: SwcMC.ModalView.CLASS_NAME + ' info-dialog-modal modal-extra-wide',
            render: function() {
                var title = '';
                if (this.model.task) {
                    title = this.model.task.getTitle();
                }

                this.$el.html(SwcMC.ModalView.TEMPLATE);
                this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(_.escape(title));
                this.$(SwcMC.ModalView.BODY_SELECTOR).show();
                this.$(SwcMC.ModalView.BODY_SELECTOR).append(SwcMC.ModalView.FORM_HORIZONTAL);

                if (this.model.task) {
                    this.children.taskInfo = new TaskInfoView({
                        model: this.model
                    });
                    this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).append(this.children.taskInfo.render().$el);

                    this.children.results = new ResultsView({
                        model: this.model,
                        showExpand: false
                    });
                    this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).append(this.children.results.render().$el);
                }

                this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_CLOSE);
                return this;
            }
        });
    });

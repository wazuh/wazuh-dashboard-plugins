define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'contrib/text!splunk_monitoring_console/views/splunk_health_check/Action.html',
    'splunk_monitoring_console/views/splunk_health_check/Action.pcss'
], function (
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

            this.listenTo(this.model.conductor, 'change:state change:checked', this.render);
        },

        events: {
            'click .btn-start-check': 'startCheck',
            'click .btn-stop-check': 'stopCheck',
            'click .btn-continue-check': 'continueCheck',
            'click .btn-reset-check': 'resetCheck'
        },

        startCheck: function() {
            // clean up before starting
            this.model.conductor.resetConductor();
            this.model.conductor.start();
            this.trigger('startCheck');
            this.trigger('hideResultsSidebar');
        },

        stopCheck: function() {
            this.model.conductor.stop();
        },

        continueCheck: function() {
            // the difference between start and continue is, start will reset conductor before start, continue will not.
            this.model.conductor.start();
        },

        resetCheck: function() {
            this.model.conductor.resetConductor();
            this.trigger('hideResultsSidebar');
            this.model.conductor.trigger('hideFilters');
            this.render();
        },
        
        render: function() {
            this.$el.html(this.compiledTemplate({
                conductor: this.model.conductor
            }));
            
            return this;
        }
    });
});
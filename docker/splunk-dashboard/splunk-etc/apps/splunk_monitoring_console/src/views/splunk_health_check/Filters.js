
define([
    'jquery',
    'underscore',
    'module',
    'backbone',
    '@splunk/swc-mc',
    'contrib/text!splunk_monitoring_console/views/splunk_health_check/Filters.html',
    'splunk_monitoring_console/views/splunk_health_check/Filters.pcss',
    'bootstrap'
], function(
    $,
    _,
    module,
    Backbone,
    SwcMC,
    Template,
    css
    // tooltip
) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,

        events: {
            'click .health-check-filter': function(e) {
                e.preventDefault();

                var filteredTasks;
                var visibleTasks = this.collection.tasks;
                var canonicalTasks = this.collection.tasks.getCanonicalTasks();
                var statusType = $(e.target).closest('.health-check-filter').attr('class').split(' ')[1];
                var statusCode = {
                    'health-check-filter-all': null,
                    'health-check-filter-error': 3,
                    'health-check-filter-warning': 2,
                    'health-check-filter-info': 1,
                    'health-check-filter-success': 0,
                    'health-check-filter-unavailable': -1
                }[statusType];

                if (statusCode === null) {
                    visibleTasks.reset(canonicalTasks.models);
                } else {
                    filteredTasks = canonicalTasks.filter(function(task) {
                       return task.getReasonSummary().hasOwnProperty(statusCode);
                    }, this);
                    visibleTasks.reset(filteredTasks);
                }
                
                this.$('.health-check-filter').removeClass('highlighted');
                this.$('.' + statusType).addClass('highlighted');

                this.trigger('hideResultsSidebar');
            }
        },

        render: function() {
            var canonicalTasks = this.collection.tasks.getCanonicalTasks();
            var statusCounts = canonicalTasks.chain()
                .map(function(task) {
                    return _.keys(task.getReasonSummary());
                })
                .flatten()
                .countBy()
                .value();

            this.$el.html(this.compiledTemplate({
                all: canonicalTasks.length,
                error: statusCounts[3] || 0,
                warning: statusCounts[2] || 0,
                info: statusCounts[1] || 0,
                success: statusCounts[0] || 0,
                unavailable: statusCounts[-1] || 0
            }));

            this.$('.health-check-filter-all').addClass('highlighted');

            this.$('.health-check-filter-all').tooltip({
                animation: false,
                title: _('View all checks.').t(),
                container: 'body',
                template: '<div id="health-check-filter-all_tpl" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
            });

            this.$('.health-check-filter-error').tooltip({
                animation: false,
                title: _('View checks with an error message.').t(),
                container: 'body',
                template: '<div id="health-check-filter-error_tpl" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
            });

            this.$('.health-check-filter-warning').tooltip({
                animation: false,
                title: _('View checks with a warning message.').t(),
                container: 'body',
                template: '<div id="health-check-filter-warning_tpl" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
            });

            this.$('.health-check-filter-info').tooltip({
                animation: false,
                title: _('View checks with an information message.').t(),
                container: 'body',
                template: '<div id="health-check-filter-info_tpl" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
            });

            this.$('.health-check-filter-success').tooltip({
                animation: false,
                title: _('View checks with a success message.').t(),
                container: 'body',
                template: '<div id="health-check-filter-success_tpl" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
            });

            this.$('.health-check-filter-unavailable').tooltip({
                animation: false,
                title: _('View checks with a not applicable message.').t(),
                container: 'body',
                template: '<div id="health-check-filter-unavailable_tpl" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
            });

            return this;
        }
    });
});

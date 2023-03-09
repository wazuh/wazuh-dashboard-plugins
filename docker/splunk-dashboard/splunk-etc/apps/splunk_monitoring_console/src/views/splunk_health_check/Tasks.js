/**
 * Created by ykou on 9/28/15.
 */
define(
[
    'jquery',
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/splunk_health_check/Task',
    'contrib/text!splunk_monitoring_console/views/splunk_health_check/Tasks.html',
    'splunk_monitoring_console/views/splunk_health_check/Tasks.pcss'
], function(
    $,
    _,
    module,
    SwcMC,
    TaskView,
    Template,
    css
) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,
        className: 'check-list',
        events: {
            'click th.sorts': function(e) {
                e.preventDefault();

                if (this.model.conductor.get('state') === 'running') {
                    return;
                }

                var icon = $(e.target).closest('th').find('i');
                var sortDir =  icon.hasClass('asc') ? 'desc': 'asc';
                var sortAttr = $(e.target).closest('th').attr('data-sort-key');

                this.$('i').removeClass('asc').removeClass('desc');
                icon.addClass(sortDir);
                this.collection.tasks.sortBy(sortAttr, sortDir);
            },
            'click tr.check-item': function(e) {
                e.preventDefault();

                // Trigger sidebar
                var task = this.getTaskFromTarget(e);
                this.collection.tasks.trigger('showResultSidebar', task);

                // Highlight row
                this.$('.check-item').children().removeClass('highlighted');
                $(e.target).closest('tr').children().addClass('highlighted');

            }
        },
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.listenTo(this.model.conductor, 'change:checked', this.render);
            this.listenTo(this.collection.tasks, 'reset sort', this.render);
        },

        getTaskFromTarget: function(event) {
            var id = $(event.target).closest('tr').data('check-item-id');
            return _.find(this.collection.tasks.models, function(task) {
                return id === task.getID();
            }, this);
        },

        render: function() {
            if (!this.$el.html()) {
                this.$el.html(this.compiledTemplate());
            } else {
                this.$('.check-item-table-body').empty();
            }

            if (this.collection.tasks.length) {
                this.children.tasks = this.collection.tasks.map(function(task) {
                    return new TaskView({
                        model: {
                            task: task,
                            conductor: this.model.conductor,
                            dmcConfigs: this.model.dmcConfigs
                        }
                    });
                }, this);

                this.children.tasks.forEach(function(taskView) {
                    this.$el.find('.check-item-table-body').append(taskView.render().$el);
                }.bind(this));
            } else {
                this.$el.find('.check-item-table-body').append(_('<tr><td colspan="4">There are no health check items matching your filters.</td></tr>').t());
            }

            return this;
        }
    });
});
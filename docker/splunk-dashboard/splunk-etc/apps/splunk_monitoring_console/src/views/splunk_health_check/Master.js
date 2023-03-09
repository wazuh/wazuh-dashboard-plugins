define([
    'jquery',
    'underscore',
    'module',
    'backbone',
    'splunk_monitoring_console/views/Download',
    'splunk_monitoring_console/views/utils',
    'splunk_monitoring_console/views/splunk_health_check/ProgressBar',
    'splunk_monitoring_console/views/splunk_health_check/Action',
    'splunk_monitoring_console/views/splunk_health_check/Filters',
    'splunk_monitoring_console/views/splunk_health_check/Tasks',
    'splunk_monitoring_console/views/splunk_health_check/Scope',
    'splunk_monitoring_console/views/splunk_health_check/Sidebar',
    'splunk_monitoring_console/views/splunk_health_check/InfoDialog',
    '@splunk/swc-mc',
    'contrib/text!splunk_monitoring_console/views/splunk_health_check/Master.html',
    'splunk_monitoring_console/views/splunk_health_check/Master.pcss'
], function(
    $,
    _,
    module,
    Backbone,
    DownloadView,
    utils,
    ProgressBarView,
    ActionView,
    FiltersView,
    TasksView,
    ScopeView,
    SidebarView,
    InfoDialog,
    SwcMC,
    Template,
    css
) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,
        events: {
            'click a.expand-results': function(e) {
                var task = this.getTaskFromTarget(e);
                this.children.infoDialog = new InfoDialog({
                    model: {
                        task: task,
                        application: this.model.application
                    },
                    onHiddenRemove: true
                });
                
                this.children.infoDialog.render().appendTo($("body"));
                this.children.infoDialog.show();

                e.preventDefault();
            }
        },

        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.collection.tasks.reset(this.collection.tasks.filter(function(task) {
                var environment = this.model.dmcConfigs.isDistributedMode() ? 'distributed' : 'standalone';
                var excludedEnvironments = (task.getEnvironmentsToExclude() || '').split(',');

                return !_.contains(excludedEnvironments, environment);
            }, this));

            this.children.scopeView = new ScopeView({
                model: {
                    conductor: this.model.conductor,
                    dmcConfigs: this.model.dmcConfigs,
                    application: this.model.application
                },
                collection: {
                    tasks: this.collection.tasks,
                    appLocalsUnfilteredAll: this.collection.appLocalsUnfilteredAll
                }
            });

            this.children.progressView = new ProgressBarView({
                model: this.model.conductor
            });
            
            this.children.actionView = new ActionView({
                model: {
                    conductor: this.model.conductor
                }
            });

            if (this.model.application.get('app') === 'splunk_monitoring_console') {
                this.children.downloadView = new DownloadView({
                    model: {
                        application: this.model.application
                    },
                    collection: {
                        appLocalsUnfilteredAll: this.collection.appLocalsUnfilteredAll,
                        appLocalsDisabled: this.collection.appLocalsDisabled
                    }
                });
            }

            this.children.filtersView = new FiltersView({
                collection: {
                    tasks: this.collection.tasks
                }
            });

            this.children.tasksView = new TasksView({
                model: {
                    conductor: this.model.conductor,
                    dmcConfigs: this.model.dmcConfigs
                },
                collection: {
                    tasks: this.collection.tasks
                }
            });

            this.children.sidebar = new SidebarView({
                model: {
                    task: undefined,
                    dmcConfigs: this.model.dmcConfigs,
                    application: this.model.application
                }
            });

            this.model.conductor.on('hideFilters', function() {
                this.children.filtersView.detach();
                this.children.scopeView.enable();
            }, this);

            this.model.conductor.on('showFilters', function() {
                this.$('.health-check-filters-container').append(this.children.filtersView.render().$el);
            }, this);

            this.children.filtersView.on('hideResultsSidebar', function() {
                this.updateSidebar();
            }, this);

            this.children.actionView.on('startCheck', function() {
                this.children.scopeView.disable();
            }, this);

            this.children.actionView.on('hideResultsSidebar', function() {
                this.updateSidebar();
            }, this);

            this.children.sidebar.on('hideResultsSidebar', function() {
                this.updateSidebar();
            }, this);

            this.collection.tasks.on('showResultSidebar', function(task) {
                this.updateSidebar(task);
            }, this);
        },

        updateSidebar: function(task) {
            if (task) {
                this.children.sidebar.setTask(task);
                this.$('.health-check-sidebar-display').append(this.children.sidebar.render().$el);
                this.$('.health-check-sidebar-display').css('display','');
                this.$('.splunk-health-check-container').css('padding-right', '500px');
            } else {
                this.$('.health-check-sidebar-display').hide();
                this.$('.splunk-health-check-container').css('padding-right', '0');
            }
        },

        getTaskFromTarget: function(event) {
            var id = $(event.target).closest('a').data('check-item-id');
            return _.find(this.collection.tasks.models, function(task) {
                return id === task.getID();
            }, this);
        },

        render: function() {
            var root = this.model.application.get('root');
            var locale = this.model.application.get('locale');
            var appName = this.model.application.get('app');
            var healthCheckContentLink = SwcMC.URIRoute.page(root, locale, appName, 'monitoringconsole_check_list');
            var description = _('Comprehensive health check for Splunk Enterprise Instances. To add additional items to this list go to: ').t();

            this.$el.html(this.compiledTemplate({
                healthCheckContentLink: healthCheckContentLink,
                description: description
            }));

            this.$('.health-check-scope').append(this.children.scopeView.render().$el);
            this.$('.progress-bar-module').append(this.children.progressView.render().$el);
            if (appName === 'splunk_monitoring_console') {
                this.$('.action-module').append(this.children.downloadView.render().$el);
            }
            this.$('.action-module').append(this.children.actionView.render().$el);
            this.$('.health-check-table-display').append(this.children.tasksView.render().$el);
            this.$('.health-check-sidebar-display').append(this.children.sidebar.render().$el);

            this.updateSidebar();

            return this;
        }
    });
});
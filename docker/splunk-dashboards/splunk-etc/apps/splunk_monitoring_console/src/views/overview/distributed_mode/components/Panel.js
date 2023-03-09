/**
 * Created by ykou on 1/12/15.
 */
define([
    'jquery',
    'underscore',
    'module',
    '@splunk/swc-mc',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/components/Panel.html'
], function(
    $,
    _,
    module,
    SwcMC,
    Template
) {
    /**
     * @param {SearchManager}   this.options.instanceMachineCountSearchManager - search for # instance and # machine
     * @param {String}          this.options.instanceCountFieldName - search result field name of # instance
     * @param {String}          this.options.machineCountFieldName - search result field name of # machine
     * @param {SearchManager}   this.options.downCountSearchManager - search for # down instance
     * @param {String}          this.options.downCountFieldName - search result field name of # down instance
     * @param {String}          this.options.icon - icon for this panel
     */
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        className: 'dmc-distributed-panel',
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.instanceMachineCountSearchManager = this.options.instanceMachineCountSearchManager;
            this.instanceMachineCountSearchManagerDfd = $.Deferred();
            this.instanceMachineCountSearchResultDfd = $.Deferred();
            this.instanceMachineCountSearchProperties = {};
            this.instanceCountFieldName = this.options.instanceCountFieldName;
            this.machineCountFieldName = this.options.machineCountFieldName;

            this.downCountSearchManager = this.options.downCountSearchManager;
            this.downCountSearchResultDfd = $.Deferred();
            this.downCountFieldName = this.options.downCountFieldName;

            this.dataToRender = {
                instanceCount: -1,
                ROLE: 'unknown',
                ROLE_PLURAL: 'unknowns',
                machineCount: -1,
                ICON: 'not found',
                downCount: -1,
                SEARCH_GROUP: ''
            };

            this._startListenToInstanceMachineCountSearch();
            this._startListenToDownCountSearch();
        },
        render: function() {
            if (this.isInstanceMachineCountSearchRunning()) {   // main search manager is still running
                this.$el.html(_.template(this.loadingTemplate, {
                    ROLE_PLURAL: this.dataToRender.ROLE_PLURAL
                }));
            }

            this.instanceMachineCountSearchManagerDfd.then(function() {
                if (this.noSearchResult()) { // search returns no result
                    this.$el.hide();
                    return this;
                }

                this.instanceMachineCountSearchResultDfd.then(function() {
                    // has no instance of given role
                    if (this.noInstanceFound()) {
                        this.$el.hide();
                        return this;
                    }

                    // start rendering panel
                    this.$el.html(this.compiledTemplate(this.dataToRender));

                    this.downCountSearchResultDfd.then(function() {
                        if (this.getDownCount() > 0) {    // show warning message
                            this.$('.dmc-down-count').html(this.dataToRender.downCount);
                            this.$('.dmc-warning-message').addClass('active');
                        }
                    }.bind(this));

                    _.each(this.children, function(child) {
                        this.$el.append(child.render().$el);
                    }, this);
                }.bind(this));
            }.bind(this));

            return this;
        },
        isInstanceMachineCountSearchRunning: function() {   // main search manager is still running
            return this.instanceMachineCountSearchManagerDfd.state() != 'resolved';
        },
        noSearchResult: function() {
            // NOTE: all search result data are strings, so that the count would be strings as well
            var resultCount = parseInt(this.instanceMachineCountSearchProperties.content.resultPreviewCount, 10) || 0;
            return (this.instanceMachineCountSearchManagerDfd.state() == 'resolved') &&
                    (resultCount <= 0);
        },
        noInstanceFound: function() {
            // NOTE: all search result data are strings, so that the count would be strings as well
            var instanceCount = parseInt(this.dataToRender.instanceCount, 10) || 0;
            var machineCount = parseInt(this.dataToRender.machineCount, 10) || 0;
            return (this.instanceMachineCountSearchResultDfd.state() == 'resolved') && (instanceCount <= 0 || machineCount <= 0);
        },
        getDownCount: function() {
            // NOTE: all search result data are strings, so that the count would be strings as well
            var downCount = parseInt(this.dataToRender.downCount, 10) || 0;
            return (this.downCountSearchResultDfd.state() == 'resolved') && downCount;
        },
        _startListenToInstanceMachineCountSearch: function() {
            var sm = this.instanceMachineCountSearchManager;
            var smDfd = this.instanceMachineCountSearchManagerDfd;
            var srDfd = this.instanceMachineCountSearchResultDfd;
            var iField = this.instanceCountFieldName;
            var mField = this.machineCountFieldName;

            this.listenTo(sm, 'search:done', function(properties) {
                this.instanceMachineCountSearchProperties = properties;
                smDfd.resolve();

                var resultModel = sm.data('preview');
                this.listenTo(resultModel, 'data', function() {
                    var data = resultModel.collection().models[0];
                    this.dataToRender.instanceCount = data.get(iField);
                    this.dataToRender.machineCount = data.get(mField);
                    srDfd.resolve();
                });
                this.listenTo(resultModel, 'error', function() {
                    SwcMC.Console.log('search result model error: ', resultModel, sm);
                });
            });
            this.listenTo(sm, 'search:cancelled search:error search:failed', function() {
                SwcMC.Console.log('search not finished! ', sm);
            });
        },
        _startListenToDownCountSearch: function() {
            var sm = this.downCountSearchManager;
            var dfd = this.downCountSearchResultDfd;
            var field = this.downCountFieldName;

            this.listenTo(sm, 'search:done', function() {
                var resultModel = sm.data('preview');
                this.listenTo(resultModel, 'data', function() {
                    var data = resultModel.collection().models[0];
                    this.dataToRender.downCount = data.get(field);
                    dfd.resolve();
                });
                this.listenTo(resultModel, 'error', function() {
                    SwcMC.Console.log('search result model error:', resultModel, sm);
                });
            });
            this.listenTo(sm, 'search:cancelled search:error search:failed', function() {
                SwcMC.Console.log('search not finished! ', sm);
            });
        },
        template: Template,
        loadingTemplate: '<div class="dmc-panel-loading-icon"></div><div class="dmc-panel-loading-text"><%= _("Searching for " + ROLE_PLURAL + "...").t() %></div>'
    });
});
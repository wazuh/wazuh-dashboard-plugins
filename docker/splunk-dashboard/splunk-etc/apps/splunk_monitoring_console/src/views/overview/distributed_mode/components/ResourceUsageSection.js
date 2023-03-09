/**
 * Created by ykou on 1/20/15.
 */
define([
    'jquery',
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/overview/distributed_mode/components/ProgressBar',
    'splunk_monitoring_console/views/overview/distributed_mode/topology/StatusFilter',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/components/ResourceUsageSection.html'
], function(
    $,
    _,
    module,
    SwcMC,
    ProgressBarView,
    StatusFilterView,
    Template
) {
    /**
     * Resource Usage section.
     * This is basically a wrapper for the CPU and Memory viz bar.
     *
     * @param {SearchManager}   cpuSearchManager        - search manager for cpu usage.
     * @param {String}          cpuFieldName            - field name for cpu usage in search result.
     * @param {SearchManager}   memorySearchManager     - search manager for memory usage.
     * @param {String}          memoryFieldName         - field name for memory usage in search result.
     * @param {String}          SEARCH_GROUP            - url for drilldown action.
     * @param {String}          CPU_TOOLTIP (optional)
     * @param {string}          MEMORY_TOOLTIP (optional)
     */
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        className: 'dmc-single-values-section',
        initialize: function() {
            var that = this;

            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.managementRoles = this.options.managementRoles;
            this.compiledStatusFilterTemplate = _.template(this.statusFilterTemplate);

            this.children.cpuProgressViz = new ProgressBarView({
                searchManager: this.options.cpuSearchManager,
                searchResultFieldName: [this.options.cpuFieldName, this.options.cpuFieldName],
                BEFORE_LABEL: _('CPU').t(),
                drilldownHref: 'javascript:void(0);',
                TOOLTIP: this.options.CPU_TOOLTIP,
                clickHandler: this._getStatusFilterClickHandler('cpu_system_pct'),
                color: function(value) {
                    return "@" + that.model.thresholdConfig.getStatus('cpu_system_pct', value);
                }
            });

            this.children.memoryProgressViz = new ProgressBarView({
                searchManager: this.options.memorySearchManager,
                searchResultFieldName: [this.options.memoryFieldName, this.options.memoryFieldName],
                BEFORE_LABEL: _('Memory').t(),
                drilldownHref: 'javascript:void(0);',
                TOOLTIP: this.options.MEMORY_TOOLTIP,
                clickHandler: this._getStatusFilterClickHandler('mem_used'),
                color: function(value) {
                    return "@" + that.model.thresholdConfig.getStatus('mem_used', value);
                }
            });

            this.children.cpuStatusFilter = new StatusFilterView({
                collection: {
                    instances: this.collection.instances
                },
                model: {
                    thresholdConfig: this.model.thresholdConfig
                },
                sortKey: 'cpu_system_pct',
                clickHandler: this._getStatusFilterClickHandler('cpu_system_pct')
            });
            
            this.children.memoryStatusFilter = new StatusFilterView({
                collection: {
                    instances: this.collection.instances
                },
                model: {
                    thresholdConfig: this.model.thresholdConfig
                },
                sortKey: 'mem_used',
                clickHandler: this._getStatusFilterClickHandler('mem_used')
            });

            this.listenTo(this.collection.instances, 'sync reset', this.debouncedRender);
        },
        render: function() {
            var avgCpuDisplay = 'N/A',
                avgMemDisplay = 'N/A',
                instancesMeta = this.collection.instances.meta,
                avgCpu = instancesMeta.get('stats.avg.cpu_system_pct'),
                avgMem = instancesMeta.get('stats.avg.mem_used');

            if (_.isNumber(avgCpu)) {
                avgCpuDisplay = avgCpu.toFixed(2) + '%';
            }
            if (_.isNumber(avgMem)) {
                avgMemDisplay = avgMem.toFixed(2) + '%';
            }

            this.$el.html(this.compiledTemplate());

            if (this.collection.instances.length > 0) {
                if (this.collection.instances.length > 1) {
                    this.$('.dmc-cpu-viz').replaceWith(this.compiledStatusFilterTemplate({
                        contentClass: 'dmc-cpu-viz',
                        beforeLabel: _('CPU').t(),
                        afterLabel: avgCpuDisplay + '<br/>' + _('average').t()
                    }));
                    this.$('.dmc-cpu-viz').append(this.children.cpuStatusFilter.render().$el);

                    this.$('.dmc-memory-viz').replaceWith(this.compiledStatusFilterTemplate({
                        contentClass: 'dmc-memory-viz',
                        beforeLabel: _('Memory').t(),
                        afterLabel: avgMemDisplay + '<br/>' + _('average').t()
                    }));
                    this.$('.dmc-memory-viz').append(this.children.memoryStatusFilter.render().$el);
                } else {
                    this.$('.dmc-cpu-viz').append(this.children.cpuProgressViz.render().$el);
                    this.$('.dmc-memory-viz').append(this.children.memoryProgressViz.render().$el);
                }
            }

            return this;
        },
        _getStatusFilterClickHandler: function(key) {
            var that = this,
                fetchState = {
                    sortKey: key
                };

            if (this.managementRoles) {
                fetchState.managementRoles = this.managementRoles;
            }

            return function(e, range) {
                if (_.isNumber(range)) {
                    range = that.model.thresholdConfig.getRange(key, range);
                }
                that.model.state.set('showTopology', true);
                that.model.fetchState.set($.extend(fetchState, {
                    ranges: [range]
                }));
            };
        },
        template: Template,
        statusFilterTemplate: '\
            <div class="dmc-resource-usage-thresholds"> \
                <div class="dmc-resource-usage-before-label"><%= beforeLabel %></div> \
                <div class="dmc-resource-usage-content <%- contentClass %>"></div> \
                <div class="dmc-resource-usage-after-label"><%= afterLabel %></div> \
                <div class="cleafix"></div> \
            </div> \
        '
    });
});
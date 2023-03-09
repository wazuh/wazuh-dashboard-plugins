define(
    [
        'jquery',
        'underscore',
        'module',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/overview/Alerts',
        'contrib/text!splunk_monitoring_console/views/overview/standalone_mode/Master.html',
        '../Master.pcss',
        '../classic-distributed.pcss',
        '../topology.pcss'
    ],
    function(
        $,
        _,
        module,
        SwcMC,
        AlertsView,
        Template,
        css,
        classicDistributedCss,
        topologyCss
    ) {
        var DMC_INDEXING_RATE_DOC = _('Snapshot.').t();
        var DMC_DISK_USAGE_DOC = _('Disk usage and capacity aggregated across all partitions that Splunk uses.').t();
        var DMC_SEARCH_CONCURRENCY_DOC = _('Snapshot.').t();
        var DMC_CPU_USAGE_DOC = _('Machine-wide.').t();
        var DMC_MEMORY_USAGE_DOC = _('Physical memory.').t();
        var DMC_SPLUNK_CPU_USAGE_DOC = _('Snapshot.').t();
        var DMC_ALL_PROCESS_CPU_USAGE_DOC = _('Snapshot.').t();
        var DMC_SPLUNK_MEMORY_USAGE_DOC = _('Snapshot.').t();
        var DMC_ALL_PROCESS_MEMORY_USAGE_DOC = _('Snapshot.').t();
        var DMC_KV_STORE_COLLECTION_SIZE_DOC = _('Aggregated size on disk.').t();
        var DMC_KV_STORE_COLLECTION_COUNT_DOC = _('Distinct count of collections.').t();

        var DMC_TOOLTIP_DELAY = '\'{"show": "750", "hide": "0"}\'';

        var hoverOnSingleValue = function() {
            $(this).css({
                'text-decoration': 'underline',
                'cursor': 'pointer'
            });
        };

        var hoverOffSingleValue = function() {
            $(this).css({
                'text-decoration': 'none',
                'cursor': 'default'
            });
        };

        var hoverOnViz = function() {
            $(this).css({
                'cursor': 'pointer'
            });
        };

        var getFullPath = function(path) {
            var root = SwcMC.Utils.getPageInfo().root;
            var locale = SwcMC.Utils.getPageInfo().locale;
            return (root ? '/'+root : '') + '/' + locale + path;
        };

        var drilldownToIndexingPerformance = function() {
            return function(e) {
                var isNewTab = '_self';
                if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
                    isNewTab = '_blank';
                }
                window.open(getFullPath('/app/splunk_monitoring_console/indexing_performance_instance'), isNewTab);
            };
        };

        var drilldownToSearchActivity = function() {
            return function(e) {
                var isNewTab = '_self';
                if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
                    isNewTab = '_blank';
                }
                window.open(getFullPath('/app/splunk_monitoring_console/search_activity_instance'), isNewTab);
            };
        };

        var drilldownToResourceUsageInstance = function() {
            return function(e) {
                var isNewTab = '_self';
                if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
                    isNewTab = '_blank';
                }
                window.open(getFullPath('/app/splunk_monitoring_console/resource_usage_instance'), isNewTab);
            };
        };

        var drilldownToResourceUsageMachine = function() {
            return function(e) {
                var isNewTab = '_self';
                if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
                    isNewTab = '_blank';
                }
                window.open(getFullPath('/app/splunk_monitoring_console/resource_usage_machine'), isNewTab);
            };
        };

        var drilldownToLicenseUsage = function() {
            return function(e) {
                var isNewTab = '_self';
                if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
                    isNewTab = '_blank';
                }
                window.open(getFullPath('/app/splunk_monitoring_console/license_usage_today'), isNewTab);
            };
        };

        var drilldownToKVStoreView = function(role) {
            return function(e) {
                var isNewTab = '_self';
                if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
                    isNewTab = '_blank';
                }
                window.open(getFullPath('/app/splunk_monitoring_console/kv_store_instance'), isNewTab);
            };
        };

        var computeMemory = function(memMb) {
            var units = 'MB';
            var mem = parseInt(memMb, 10);

            if (mem > 1024) {
                mem = mem/1024;
                units = 'GB';
            }

            mem = Math.round(mem*100)/100;

            return {
                mem: mem,
                units: units
            };
        };

        return SwcMC.BaseView.extend({
            moduleId: module.id,
            initialize: function() {
                SwcMC.BaseView.prototype.initialize.apply(this, arguments);
                this.$el.html(this.compiledTemplate({
                    DMC_TOOLTIP_DELAY: DMC_TOOLTIP_DELAY,
                    DMC_INDEXING_RATE_DOC: DMC_INDEXING_RATE_DOC,
                    DMC_DISK_USAGE_DOC: DMC_DISK_USAGE_DOC,
                    DMC_SEARCH_CONCURRENCY_DOC: DMC_SEARCH_CONCURRENCY_DOC,
                    DMC_CPU_USAGE_DOC: DMC_CPU_USAGE_DOC,
                    DMC_MEMORY_USAGE_DOC: DMC_MEMORY_USAGE_DOC,
                    DMC_SPLUNK_CPU_USAGE_DOC: DMC_SPLUNK_CPU_USAGE_DOC,
                    DMC_ALL_PROCESS_CPU_USAGE_DOC: DMC_ALL_PROCESS_CPU_USAGE_DOC,
                    DMC_SPLUNK_MEMORY_USAGE_DOC: DMC_SPLUNK_MEMORY_USAGE_DOC,
                    DMC_ALL_PROCESS_MEMORY_USAGE_DOC: DMC_ALL_PROCESS_MEMORY_USAGE_DOC,
                    DMC_KV_STORE_COLLECTION_SIZE_DOC: DMC_KV_STORE_COLLECTION_SIZE_DOC,
                    DMC_KV_STORE_COLLECTION_COUNT_DOC: DMC_KV_STORE_COLLECTION_COUNT_DOC
                }));

                this.listenTo(this.options.searchManager.kvStoreRoleSearch, 'search:done', function(properties) {
                    if (properties.content.resultPreviewCount == 0) {
                        this.$('.smc-standalone-kv-store-panel').remove();
                    }
                }.bind(this));

                var RESOURCE_USAGE_FIELD_COLORS = "{ \"Free\": 0xCCCCCC, \"Idle\": 0xCCCCCC, \"Non-Splunk processes\": 0x999999 }";
                var SERIES_COLORS = "[0x5479af, 0x87a1c7, 0xa1b5d3, 0xbbc9df, 0xd4ddeb]";

                // VIEWS

                // INDEXING
                var indexingRate = new SwcMC.SingleView({
                    id: 'indexing-rate-element',
                    managerid: this.options.searchManager.indexingRateSearch.id,
                    underLabel: _('Total').t(),
                    field: 'average_KBps',
                    el: this.$('#indexing-rate-element')
                });
                indexingRate.$el.click(drilldownToIndexingPerformance()).hover(hoverOnSingleValue, hoverOffSingleValue);

                var licenseUsageResultsModel = this.options.searchManager.licenseUsageManager.data('results');
                licenseUsageResultsModel.on('data', function() {
                    var usage = licenseUsageResultsModel.data();
                    var totalGB = usage.rows[0][usage.fields.indexOf('totalGB')];
                    var usedGB = usage.rows[0][usage.fields.indexOf('usedGB')];
                    var usedPct = Math.round((usedGB/totalGB)*100) || 0;

                    var $licenseUsage = this.$('#license-usage-element');
                    $licenseUsage.find('.smc-progress-bar').attr(
                        { 'aria-valuenow': usedPct }
                    ).css(
                        { 'width': usedPct + '%' }
                    );
                    $licenseUsage.find('.smc-percent-used').text(usedPct + '%');

                    if (usedPct === 100) {
                        $licenseUsage.find('.smc-progress-bar').css('background-color', 'red');
                    }
                    $licenseUsage.find('.smc-sr-only').text(usedPct + '%');

                    $licenseUsage.click(drilldownToLicenseUsage()).hover(hoverOnViz);
                }.bind(this));

                var diskUsageResultsModel = this.options.searchManager.diskUsageManager.data('results');
                diskUsageResultsModel.on('data', function() {
                    var usage = diskUsageResultsModel.data();
                    var total = usage.rows[0][usage.fields.indexOf('total_capacity')];
                    var free = usage.rows[0][usage.fields.indexOf('total_free')];
                    var usedPct = Math.round(( (total - free)/total) * 100);

                    var $diskUsage = this.$('#disk-usage-element');
                    $diskUsage.find('.smc-progress-bar').attr(
                        { 'aria-valuenow': usedPct }
                    ).css(
                        { 'width': usedPct + '%' }
                    );
                    $diskUsage.find('.smc-percent-used').text(usedPct + '%');
                    if (usedPct === 100) {
                        $diskUsage.find('.smc-progress-bar').css('background-color', 'red');
                    }
                    $diskUsage.find('.smc-sr-only').text(usedPct + '%');
                    $diskUsage.click(drilldownToResourceUsageInstance()).hover(hoverOnViz);
                }.bind(this));


                var totalSearchView = new SwcMC.SingleView({
                    id: 'concurrent-searches-element',
                    managerid: this.options.searchManager.searchCountByTypeSearch.id,
                    underLabel: 'Searches',
                    field: 'Total',
                    el: this.$('#concurrent-searches-element')
                });
                totalSearchView.$el.click(drilldownToSearchActivity()).hover(hoverOnSingleValue, hoverOffSingleValue);
                var searchPieViz = new SwcMC.ChartView({
                    id: 'searches-by-type-element',
                    managerid: this.options.searchManager.searchCountByTypeSearch.id,
                    type: "pie",
                    "charting.seriesColors": SERIES_COLORS,
                    el: this.$('#searches-by-type-element')
                }).render();
                searchPieViz.$el.click(drilldownToSearchActivity()).hover(hoverOnViz);


                // CPU: hostwide
                var totalCPUView = new SwcMC.SingleView({
                    id: 'cpu-usage-element',
                    managerid: this.options.searchManager.totalCpuMemUsageSearch.id,
                    underLabel: _('All Processes').t(),
                    field: 'total_cpu',
                    el: this.$('#cpu-usage-element')
                });
                totalCPUView.$el.click(drilldownToResourceUsageMachine()).hover(hoverOnSingleValue, hoverOffSingleValue);
                // CPU: splunk processes
                var splunkCPUUsageView = new SwcMC.SingleView({
                    id: 'splunk-cpu-usage-element',
                    managerid: this.options.searchManager.totalCpuMemUsageSearch.id,
                    underLabel: _('Splunk Enterprise').t(),
                    field: 'total_splunk_cpu',
                    el: this.$('#splunk-cpu-usage-element')
                });
                splunkCPUUsageView.$el.click(drilldownToResourceUsageInstance()).hover(hoverOnSingleValue, hoverOffSingleValue);
                var CPUPieView = new SwcMC.ChartView({
                    id: 'cpu-usage-by-process-element',
                    managerid: this.options.searchManager.cpuResourceUsageSearch.id,
                    type: 'pie',
                    "charting.fieldColors": RESOURCE_USAGE_FIELD_COLORS,
                    "charting.seriesColors": SERIES_COLORS,
                    el: this.$('#cpu-usage-by-process-element')
                }).render();
                CPUPieView.$el.click(drilldownToResourceUsageMachine()).hover(hoverOnViz);
                // Memory usage: hostwide
                var totalMemView = new SwcMC.SingleView({
                    id: 'mem-usage-element',
                    managerid: this.options.searchManager.totalCpuMemUsageSearch.id,
                    field: 'total_mem',
                    underLabel: _('All Processes').t(),
                    el: this.$('#mem-usage-element')
                });
                totalMemView.$el.click(drilldownToResourceUsageMachine()).hover(hoverOnSingleValue, hoverOffSingleValue);
                // Memory usage: splunk processes
                var splunkMemView = new SwcMC.SingleView({
                    id: 'splunk-mem-usage-element',
                    managerid: this.options.searchManager.totalCpuMemUsageSearch.id,
                    field: 'total_splunk_mem',
                    underLabel: _('Splunk Enterprise').t(),
                    el: this.$('#splunk-mem-usage-element')
                });
                splunkMemView.$el.click(drilldownToResourceUsageInstance()).hover(hoverOnSingleValue, hoverOffSingleValue);
                var memPieView = new SwcMC.ChartView({
                    id: 'mem-usage-by-process-element',
                    managerid: this.options.searchManager.memResourceUsageSearch.id,
                    type: 'pie',
                    "charting.fieldColors": RESOURCE_USAGE_FIELD_COLORS,
                    "charting.seriesColors": SERIES_COLORS,
                    el: this.$('#mem-usage-by-process-element')
                }).render();
                memPieView.$el.click(drilldownToResourceUsageMachine()).hover(hoverOnViz);

                // KV Store
                var kvStoreSize = new SwcMC.SingleView({
                    id: "kv-store-size",
                    underLabel: _("Size of Collections (MB)").t(),
                    managerid: this.options.searchManager.kvStoreCollectionSizeSearch.id,
                    field: "sizeMB",
                    el: this.$('#kv-store-size')
                }).render();
                kvStoreSize.$el.click(drilldownToKVStoreView()).hover(hoverOnSingleValue, hoverOffSingleValue);

                var kvStoreCollections = new SwcMC.SingleView({
                    id: "kv-store-collections",
                    underLabel: _("Collections").t(),
                    managerid: this.options.searchManager.kvStoreCollectionCountSearch.id,
                    field: "collections",
                    el: this.$('#kv-store-collections')
                }).render();
                kvStoreCollections.$el.click(drilldownToKVStoreView()).hover(hoverOnSingleValue, hoverOffSingleValue);

                var kvStoreOplogSize = new SwcMC.SingleView({
                    id: "kv-store-oplog-size",
                    underLabel: _("Oplog Size (MB)").t(),
                    managerid: "kv-store-oplog-size-search",
                    field: "oplogsizeMB",
                    el: this.$('#kv-store-oplog-size')
                }, {tokens: true}).render();
                kvStoreCollections.$el.click(drilldownToKVStoreView()).hover(hoverOnSingleValue, hoverOffSingleValue);

                var memory = computeMemory(this.model.serverInfoModel.entry.content.get('physicalMemoryMB'));

                this.$('.splunk-version').text(this.model.serverInfoModel.entry.content.get('version'));
                this.$('.os-details').text(
                    this.model.serverInfoModel.entry.content.get('os_name') + ', ' +
                    memory.mem + ' ' + memory.units + ' Physical Memory, ' +
                    this.model.serverInfoModel.entry.content.get('numberOfCores') + ' CPU Cores'
                );

                this.children.alertsView = new AlertsView({
                    deferreds: this.options.deferreds,
                    model: this.model,
                    collection: this.collection
                });

                // NOTE: need to manualy call this, otherwise tooltip will not show.
                this.$('.smc-tooltip-link').tooltip();
            },
            render: function() {
                this.$('.smc-alerts-view-standalone-container').append(this.children.alertsView.render().$el);
                return this;
            },
            template: Template
        });
    }
);

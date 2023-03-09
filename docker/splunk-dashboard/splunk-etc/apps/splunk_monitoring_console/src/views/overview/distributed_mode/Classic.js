/**
 * Created by ykou on 12/29/14.
 */
define([
        'underscore',
        'module',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/overview/distributed_mode/components/IndexerPanel',
        'splunk_monitoring_console/views/overview/distributed_mode/components/SearchHeadPanel',
        'splunk_monitoring_console/views/overview/distributed_mode/components/ClusterMasterPanel',
        'splunk_monitoring_console/views/overview/distributed_mode/components/LicenseMasterPanel',
        'splunk_monitoring_console/views/overview/distributed_mode/components/DeploymentServerPanel'
    ],
    function(
        _,
        module,
        SwcMC,
        IndexerPanelView,
        SearchHeadPanelView,
        ClusterMasterPanelView,
        LicenseMasterPanelView,
        DeploymentServerPanelView
    ) {
        var DMC_DOC = {
            DMC_INDEXER_TOTAL_INDEXING_RATE_DOC: _('Snapshot, aggregated across all 6.2 or later indexers.').t(),
            DMC_INDEXER_AVERAGE_INDEXING_RATE_DOC: _('Snapshot, averaged across all 6.2 or later indexers.').t(),
            DMC_INDEXER_CPU_DOC: _('Snapshot machine-wide CPU usage averaged across all indexers.').t(),
            DMC_INDEXER_MEMORY_DOC: _('Snapshot machine-wide physical memory usage averaged across all indexers.').t(),
            DMC_SEARCH_HEAD_TOTAL_SEARCHES_DOC: _('Snapshot search concurrency aggregated across all search heads.').t(),
            DMC_SEARCH_HEAD_AVERAGE_SEARCHES_DOC: _('Snapshot search concurrency averaged across all search heads.').t(),
            DMC_SEARCH_HEAD_CPU_DOC: _('Snapshot machine-wide CPU usage averaged across all search heads.').t(),
            DMC_SEARCH_HEAD_MEMORY_DOC: _('Snapshot machine-wide physical memory usage averaged across all search heads.').t(),
            DMC_CLUSTER_MASTER_BUCKETS_DOC: _('Total number of bucket copies, aggregated across all cluster peers').t(),
            DMC_CLUSTER_MASTER_RAWDATA_SIZE_DOC: _('Represents a unique set of all compressed rawdata in replicated indexes.').t(),
            DMC_CLUSTER_MASTER_CPU_DOC: _('Snapshot machine-wide CPU usage averaged across all cluster masters.').t(),
            DMC_CLUSTER_MASTER_MEMORY_DOC: _('Snapshot machine-wide physical memory usage averaged across all cluster masters.').t(),
            DMC_LICENSE_MASTER_WARNINGS_DOC: _('Number of license peers with at least one hard warning.').t(),
            DMC_LICENSE_MASTER_LICENSE_USAGE_DOC: _('License usage and capacity aggregated across all license masters.').t(),
            DMC_LICENSE_MASTER_CPU_DOC: _('Snapshot machine-wide CPU usage averaged across all license masters.').t(),
            DMC_LICENSE_MASTER_MEMORY_DOC: _('Snapshot machine-wide physical memory usage averaged across all license masters.').t(),
            DMC_DEPLOYMENT_SERVER_CPU_DOC: _('Snapshot machine-wide CPU usage averaged across all deployment servers.').t(),
            DMC_DEPLOYMENT_SERVER_MEMORY_DOC: _('Snapshot machine-wide physical memory usage averaged across all deployment servers.').t()
        };

        return SwcMC.BaseView.extend({
            moduleId: module.id,
            initialize: function() {
                SwcMC.BaseView.prototype.initialize.apply(this, arguments);

                this.children.indexerPanel = new IndexerPanelView({
                    collection: {
                        indexers: this.collection.indexers
                    },
                    model: {
                        state: this.model.state,
                        fetchState: this.model.indexerFetchState,
                        thresholdConfig: this.model.thresholdConfig
                    },
                    searchManager: this.options.searchManager,
                    instanceMachineCountSearchManager: this.options.searchManager.instanceMachineCountSearch,
                    instanceCountFieldName: 'dmc_group_indexer_instance_count',
                    machineCountFieldName: 'dmc_group_indexer_machine_count',
                    downCountSearchManager: this.options.searchManager.indexersPostProcess,
                    downCountFieldName: 'num_down',
                    DMC_DOC: DMC_DOC
                });

                this.children.searchHeadPanel = new SearchHeadPanelView({
                    collection: {
                        searchHeads: this.collection.searchHeads
                    },
                    model: {
                        state: this.model.state,
                        fetchState: this.model.searchHeadFetchState,
                        thresholdConfig: this.model.thresholdConfig
                    },
                    searchManager: this.options.searchManager,
                    instanceMachineCountSearchManager: this.options.searchManager.instanceMachineCountSearch,
                    instanceCountFieldName: 'dmc_group_search_head_instance_count',
                    machineCountFieldName: 'dmc_group_search_head_machine_count',
                    downCountSearchManager: this.options.searchManager.searchHeadsPostProcess,
                    downCountFieldName: 'num_down',
                    DMC_DOC: DMC_DOC
                });

                this.children.clusterMasterPanel = new ClusterMasterPanelView({
                    collection: {
                        clusterMasters: this.collection.clusterMasters
                    },
                    model: {
                        state: this.model.state,
                        fetchState: this.model.auxiliaryFetchState,
                        thresholdConfig: this.model.thresholdConfig
                    },
                    searchManager: this.options.searchManager,
                    instanceMachineCountSearchManager: this.options.searchManager.instanceMachineCountSearch,
                    instanceCountFieldName: 'dmc_group_cluster_master_instance_count',
                    machineCountFieldName: 'dmc_group_cluster_master_machine_count',
                    downCountSearchManager: this.options.searchManager.clusterMastersPostProcess,
                    downCountFieldName: 'num_down',
                    DMC_DOC: DMC_DOC
                });

                this.children.licenseMasterPanel = new LicenseMasterPanelView({
                    collection: {
                        licenseMasters: this.collection.licenseMasters
                    },
                    model: {
                        state: this.model.state,
                        fetchState: this.model.auxiliaryFetchState,
                        thresholdConfig: this.model.thresholdConfig
                    },
                    searchManager: this.options.searchManager,
                    instanceMachineCountSearchManager: this.options.searchManager.instanceMachineCountSearch,
                    instanceCountFieldName: 'dmc_group_license_master_instance_count',
                    machineCountFieldName: 'dmc_group_license_master_machine_count',
                    downCountSearchManager: this.options.searchManager.licenseMastersPostProcess,
                    downCountFieldName: 'num_down',
                    DMC_DOC: DMC_DOC
                });

                this.children.deploymentServerPanel = new DeploymentServerPanelView({
                    collection: {
                        deploymentServers: this.collection.deploymentServers
                    },
                    model: {
                        state: this.model.state,
                        fetchState: this.model.auxiliaryFetchState,
                        thresholdConfig: this.model.thresholdConfig
                    },
                    searchManager: this.options.searchManager,
                    instanceMachineCountSearchManager: this.options.searchManager.instanceMachineCountSearch,
                    instanceCountFieldName: 'dmc_group_deployment_server_instance_count',
                    machineCountFieldName: 'dmc_group_deployment_server_machine_count',
                    downCountSearchManager: this.options.searchManager.deploymentServersPostProcess,
                    downCountFieldName: 'num_down',
                    DMC_DOC: DMC_DOC
                });

                this._startListenToSearchManagers();
            },
            _startListenToSearchManagers: function() {
                _.each(this.options.searchManager, function(searchManager) {
                    this.listenTo(searchManager, 'search:cancelled search:error search:failed', function() {
                        this.$('.dmc-overview-search-error-banner').show();
                    });
                }, this);
            },
            render: function() {
                this.$el.html(this.template);
                this.$el.append(this.children.indexerPanel.render().$el);
                this.$el.append(this.children.searchHeadPanel.render().$el);
                this.$el.append(this.children.clusterMasterPanel.render().$el);
                this.$el.append(this.children.licenseMasterPanel.render().$el);
                this.$el.append(this.children.deploymentServerPanel.render().$el);
                return this;
            },
            template: '<div class="alert alert-error dmc-overview-search-error-banner" style="display: none;"><i class="icon-alert"></i>' + _('One or more searches failed or cancelled, please make sure all Splunk instances are up and double check the ').t() + '<a href="monitoringconsole_configure">setup</a>' + _(' page.').t() + '</div>'
        });
    }
);

/**
 * Created by ykou on 1/22/15.
 */
define([
    'underscore',
    'module',
    'splunk_monitoring_console/views/overview/distributed_mode/components/Panel',
    'splunk_monitoring_console/views/overview/distributed_mode/components/ClusterMasterStatusSection',
    'splunk_monitoring_console/views/overview/distributed_mode/components/ResourceUsageSection',
    'contrib/text!splunk_monitoring_console/svg/ClusterMaster.svg'
], function(
    _,
    module,
    PanelView,
    ClusterMasterStatusSectionView,
    ResourceUsageSectionView,
    ClusterMasterIcon
) {
    /**
     * please refer to Panel.js for the params info.
     */
    return PanelView.extend({
        moduleId: module.id,
        initialize: function() {
            PanelView.prototype.initialize.apply(this, arguments);

            this.dataToRender = _.extend(this.dataToRender || {}, {
                ROLE: _('Cluster Manager').t(),
                ROLE_PLURAL: _('Cluster Manger').t(),
                ICON: ClusterMasterIcon,
                SEARCH_GROUP: 'dmc_group_cluster_master'
            });

            this.children.clusterMasterStatusSection = new ClusterMasterStatusSectionView({
                searchManager: this.options.searchManager,
                SEARCH_GROUP: 'dmc_group_cluster_master',
                DMC_DOC: this.options.DMC_DOC
            });

            this.children.resourceUsageSection = new ResourceUsageSectionView({
                collection: {
                    instances: this.collection.clusterMasters
                },
                model: {
                    state: this.model.state,
                    fetchState: this.model.fetchState,
                    thresholdConfig: this.model.thresholdConfig
                },
                managementRoles: 'cluster_master',
                cpuSearchManager: this.options.searchManager.clusterMastersPostProcess,
                cpuFieldName: 'cpu',
                memorySearchManager: this.options.searchManager.clusterMastersPostProcess,
                memoryFieldName: 'mem',
                SEARCH_GROUP: 'dmc_group_cluster_master',
                CPU_TOOLTIP: this.options.DMC_DOC.DMC_CLUSTER_MASTER_CPU_DOC,
                MEMORY_TOOLTIP: this.options.DMC_DOC.DMC_CLUSTER_MASTER_MEMORY_DOC
            });
        },
        render: function() {
            return PanelView.prototype.render.apply(this, arguments);
        }
    });
});

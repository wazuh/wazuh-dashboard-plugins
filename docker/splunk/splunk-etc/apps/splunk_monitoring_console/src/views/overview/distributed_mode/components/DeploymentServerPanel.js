/**
 * Created by ykou on 1/26/15.
 */
define([
    'underscore',
    'module',
    'splunk_monitoring_console/views/overview/distributed_mode/components/Panel',
    'splunk_monitoring_console/views/overview/distributed_mode/components/DeploymentServerStatusSection',
    'splunk_monitoring_console/views/overview/distributed_mode/components/ResourceUsageSection',
    'contrib/text!splunk_monitoring_console/svg/DeploymentServer.svg'
], function(
    _,
    module,
    PanelView,
    DeploymentServerStatusSectionView,
    ResourceUsageSectionView,
    DeploymentServerIcon
) {
    /**
     * please refer to Panel.js for the params info.
     */
    return PanelView.extend({
        moduleId: module.id,
        initialize: function() {
            PanelView.prototype.initialize.apply(this, arguments);

            this.dataToRender = _.extend(this.dataToRender || {}, {
                ROLE: _('Deployment Server').t(),
                ROLE_PLURAL: _('Deployment Servers').t(),
                ICON: DeploymentServerIcon,
                SEARCH_GROUP: 'dmc_group_deployment_server'
            });

            this.children.statusSection = new DeploymentServerStatusSectionView({
                searchManager: this.options.searchManager,
                SEARCH_GROUP: 'dmc_group_deployment_server',
                DMC_DOC: this.options.DMC_DOC
            });

            this.children.resourceUsageSection = new ResourceUsageSectionView({
                collection: {
                    instances: this.collection.deploymentServers
                },
                model: {
                    state: this.model.state,
                    fetchState: this.model.fetchState,
                    thresholdConfig: this.model.thresholdConfig
                },
                managementRoles: 'deployment_server',
                cpuSearchManager: this.options.searchManager.deploymentServersPostProcess,
                cpuFieldName: 'cpu',
                memorySearchManager: this.options.searchManager.deploymentServersPostProcess,
                memoryFieldName: 'mem',
                SEARCH_GROUP: 'dmc_group_deployment_server',
                CPU_TOOLTIP: this.options.DMC_DOC.DMC_DEPLOYMENT_SERVER_CPU_DOC,
                MEMORY_TOOLTIP: this.options.DMC_DOC.DMC_DEPLOYMENT_SERVER_MEMORY_DOC
            });
        },
        render: function() {
            return PanelView.prototype.render.apply(this, arguments);
        }
    });
});
/**
 * Created by ykou on 1/22/15.
 */
define([
    'underscore',
    'module',
    'splunk_monitoring_console/views/overview/distributed_mode/components/Panel',
    'splunk_monitoring_console/views/overview/distributed_mode/components/LicenseSlaveWarningSection',
    'splunk_monitoring_console/views/overview/distributed_mode/components/LicenseUsageSection',
    'splunk_monitoring_console/views/overview/distributed_mode/components/ResourceUsageSection',
    'contrib/text!splunk_monitoring_console/svg/LicenseServer.svg'
], function(
    _,
    module,
    PanelView,
    LicenseSlaveWarningSectionView,
    LicenseUsageSectionView,
    ResourceUsageSectionView,
    LicenseMasterIcon
) {
    /**
     * please refer to Panel.js for the params info.
     */
    return PanelView.extend({
        moduleId: module.id,
        initialize: function() {
            PanelView.prototype.initialize.apply(this, arguments);

            this.dataToRender = _.extend(this.dataToRender || {}, {
                ROLE: _('License Manager').t(),
                ROLE_PLURAL: _('License Managers').t(),
                ICON: LicenseMasterIcon,
                SEARCH_GROUP: 'dmc_group_license_master'
            });

            this.children.slaveWarningsSection = new LicenseSlaveWarningSectionView({
                searchManager: this.options.searchManager.licenseMasterWarningSearch,
                DMC_DOC: this.options.DMC_DOC.DMC_LICENSE_MASTER_WARNINGS_DOC
            });

            this.children.licenseUsageSection = new LicenseUsageSectionView({
                searchManager: this.options.searchManager.licenseMasterUsageSearch,
                searchResultFieldName: ['usage_pct', 'output'],
                DMC_DOC: this.options.DMC_DOC.DMC_LICENSE_MASTER_LICENSE_USAGE_DOC
            });

            this.children.resourceUsageSection = new ResourceUsageSectionView({
                collection: {
                    instances: this.collection.licenseMasters
                },
                model: {
                    state: this.model.state,
                    fetchState: this.model.fetchState,
                    thresholdConfig: this.model.thresholdConfig
                },
                managementRoles: 'license_master',
                cpuSearchManager: this.options.searchManager.licenseMastersPostProcess,
                cpuFieldName: 'cpu',
                memorySearchManager: this.options.searchManager.licenseMastersPostProcess,
                memoryFieldName: 'mem',
                SEARCH_GROUP: 'dmc_group_license_master',
                CPU_TOOLTIP: this.options.DMC_DOC.DMC_LICENSE_MASTER_CPU_DOC,
                MEMORY_TOOLTIP: this.options.DMC_DOC.DMC_LICENSE_MASTER_MEMORY_DOC
            });
        },
        render: function() {
            return PanelView.prototype.render.apply(this, arguments);
        }
    });
});

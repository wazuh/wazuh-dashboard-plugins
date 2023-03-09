/**
 * Created by ykou on 1/22/15.
 */
define([
    'underscore',
    'module',
    'splunk_monitoring_console/views/overview/distributed_mode/components/Panel',
    'splunk_monitoring_console/views/overview/distributed_mode/components/ConcurrentSearchSection',
    'splunk_monitoring_console/views/overview/distributed_mode/components/ResourceUsageSection',
    'contrib/text!splunk_monitoring_console/svg/SearchHead.svg'
], function(
    _,
    module,
    PanelView,
    ConcurrentSearchSectionView,
    ResourceUsageSectionView,
    SearchHeadIcon
) {
    /**
     * please refer to Panel.js for the params info.
     */
    return PanelView.extend({
        moduleId: module.id,
        initialize: function() {
            PanelView.prototype.initialize.apply(this, arguments);

            this.dataToRender = _.extend(this.dataToRender || {}, {
                ROLE: _('Search Head').t(),
                ROLE_PLURAL: _('Search Heads').t(),
                ICON: SearchHeadIcon,
                SEARCH_GROUP: 'dmc_group_search_head'
            });

            this.children.concurrentSearchSection = new ConcurrentSearchSectionView({
                collection: {
                    instances: this.collection.searchHeads
                },
                searchManager: this.options.searchManager,
                SEARCH_GROUP: 'dmc_group_search_head',
                DMC_DOC: this.options.DMC_DOC
            });

            this.children.resourceUsageSection = new ResourceUsageSectionView({
                collection: {
                    instances: this.collection.searchHeads
                },
                model: {
                    state: this.model.state,
                    fetchState: this.model.fetchState,
                    thresholdConfig: this.model.thresholdConfig
                },
                cpuSearchManager: this.options.searchManager.searchHeadsPostProcess,
                cpuFieldName: 'cpu',
                memorySearchManager: this.options.searchManager.searchHeadsPostProcess,
                memoryFieldName: 'mem',
                SEARCH_GROUP: 'dmc_group_search_head',
                CPU_TOOLTIP: this.options.DMC_DOC.DMC_SEARCH_HEAD_CPU_DOC,
                MEMORY_TOOLTIP: this.options.DMC_DOC.DMC_SEARCH_HEAD_MEMORY_DOC
            });
        },
        render: function() {
            return PanelView.prototype.render.apply(this, arguments);
        }
    });
});
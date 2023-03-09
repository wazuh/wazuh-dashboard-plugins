/**
 * Created by ykou on 1/15/15.
 */
define([
    'underscore',
    'module',
    'splunk_monitoring_console/views/overview/distributed_mode/components/Panel',
    'splunk_monitoring_console/views/overview/distributed_mode/components/IndexingRateSection',
    'splunk_monitoring_console/views/overview/distributed_mode/components/ResourceUsageSection',
    'contrib/text!splunk_monitoring_console/svg/Indexer.svg'
], function(
    _,
    module,
    PanelView,
    IndexingRateSectionView,
    ResourceUsageSectionView,
    IndexerIcon
) {
    /**
     * please refer to Panel.js for the params info.
     */
    return PanelView.extend({
        moduleId: module.id,
        initialize: function() {
            PanelView.prototype.initialize.apply(this, arguments);

            this.dataToRender = _.extend(this.dataToRender || {}, {
                ROLE: _('Indexer').t(),
                ROLE_PLURAL: _('Indexers').t(),
                ICON: IndexerIcon,
                SEARCH_GROUP: 'dmc_group_indexer'
            });

            this.children.indexingRateSection = new IndexingRateSectionView({
                collection: {
                    instances: this.collection.indexers
                },
                searchManager: this.options.searchManager,
                SEARCH_GROUP: 'dmc_group_indexer',
                DMC_DOC: this.options.DMC_DOC
            });

            this.children.resourceUsageSection = new ResourceUsageSectionView({
                collection: {
                    instances: this.collection.indexers
                },
                model: {
                    state: this.model.state,
                    fetchState: this.model.fetchState,
                    thresholdConfig: this.model.thresholdConfig
                },
                cpuSearchManager: this.options.searchManager.indexersPostProcess,
                cpuFieldName: 'cpu',
                memorySearchManager: this.options.searchManager.indexersPostProcess,
                memoryFieldName: 'mem',
                SEARCH_GROUP: 'dmc_group_indexer',
                CPU_TOOLTIP: this.options.DMC_DOC.DMC_INDEXER_CPU_DOC,
                MEMORY_TOOLTIP: this.options.DMC_DOC.DMC_INDEXER_MEMORY_DOC
            });
        },
        render: function() {
            return PanelView.prototype.render.apply(this, arguments);
        }
    });
});
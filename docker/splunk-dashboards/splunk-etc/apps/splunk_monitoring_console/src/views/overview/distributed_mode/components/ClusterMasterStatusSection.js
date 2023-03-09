/**
 * Created by ykou on 1/22/15.
 */
define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/overview/distributed_mode/components/SingleValue',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/components/ClusterMasterStatusSection.html'
], function(
    _,
    module,
    SwcMC,
    SingleValueView,
    Template
) {
    /**
     * Indexing Rate section of Indexer Panel.
     * This basically is a warpper for Single Value components.
     * @param: {SearchManager}  searchManager   - all search managers needed for this section.
     * @param: {String}         SEARCH_GROUP    - search group for drilldown
     * @Param: {Object}         DMC_DOC         - all doc strings for tooltips.
     */
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        className: 'dmc-single-values-section',
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.children.peersSearchable = new SingleValueView({
                searchManager: this.options.searchManager.peersSearchableSearch,
                searchResultFieldName: 'count',
                UNDER_LABEL: _('Peers Searchable').t(),
                drilldownHref: '',
                TOOLTIP: ''
            });

            this.children.indexesSearchable = new SingleValueView({
                searchManager: this.options.searchManager.indexesSearchableSearch,
                searchResultFieldName: 'count',
                UNDER_LABEL: _('Indexes Searchable').t(),
                drilldownHref: '',
                TOOLTIP: ''
            });

            this.children.bucketCopies = new SingleValueView({
                searchManager: this.options.searchManager.bucketsCountSearch,
                searchResultFieldName: 'total_buckets',
                UNDER_LABEL: _('Bucket Copies').t(),
                drilldownHref: '',
                TOOLTIP: this.options.DMC_DOC.DMC_CLUSTER_MASTER_BUCKETS_DOC
            });

            this.children.rawDataSize = new SingleValueView({
                searchManager: this.options.searchManager.totalBucketSizeSearch,
                searchResultFieldName: 'total_index_size_gb',
                UNDER_LABEL: _('Rawdata Size').t(),
                drilldownHref: '',
                TOOLTIP: this.options.DMC_DOC.DMC_CLUSTER_MASTER_RAWDATA_SIZE_DOC
            });
        },
        render: function() {
            this.$el.html(this.compiledTemplate());
            this.$('.dmc-peers-searchable').append(this.children.peersSearchable.render().$el);
            this.$('.dmc-indexes-searchable').append(this.children.indexesSearchable.render().$el);
            this.$('.dmc-bucket-copies').append(this.children.bucketCopies.render().$el);
            this.$('.dmc-raw-data-size').append(this.children.rawDataSize.render().$el);
            return this;
        },
        template: Template
    });
});
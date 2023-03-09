/**
 * Created by ykou on 1/15/15.
 */
define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/overview/distributed_mode/components/SingleValueWithResults',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/components/IndexingRateSection.html'
], function(
    _,
    module,
    SwcMC,
    SingleValueWithResultsView,
    Template
) {
    /**
     * Indexing Rate section of Indexer Panel.
     * This basically is a warpper for the two Single Value With Results components: Total Indexing Rate and Average Indexing Rate.
     * @param: {String}         SEARCH_GROUP    - search group for drilldown
     * @Param: {Object}         DMC_DOC         - all doc strings for tooltips.
     */
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        className: 'dmc-single-values-section',
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.collection.instances, 'sync reset', this.render);
        },
        render: function() {
            var instancesMeta = this.collection.instances.meta;
            var totalIndexingRate = instancesMeta.get('stats.total.indexing_rate') || 'N/A';
            var avgIndexingRate = instancesMeta.get('stats.avg.indexing_rate') || 'N/A';

            this.children.totalIndexingRate = new SingleValueWithResultsView({
                UNDER_LABEL: _('Total').t(),
                result: totalIndexingRate,
                drilldownHref: 'indexing_performance_deployment?form.group=' + this.options.SEARCH_GROUP,
                TOOLTIP: this.options.DMC_DOC.DMC_INDEXER_TOTAL_INDEXING_RATE_DOC
            });

            this.children.averageIndexingRate = new SingleValueWithResultsView({
                UNDER_LABEL: _('Average').t(),
                result: avgIndexingRate,
                drilldownHref: 'indexing_performance_deployment?form.group=' + this.options.SEARCH_GROUP,
                TOOLTIP: this.options.DMC_DOC.DMC_INDEXER_AVERAGE_INDEXING_RATE_DOC
            });

            this.$el.html(this.compiledTemplate());
            this.$('.dmc-total-indexing-rate').append(this.children.totalIndexingRate.render().$el);
            this.$('.dmc-average-indexing-rate').append(this.children.averageIndexingRate.render().$el);
            return this;
        },
        template: Template
    });
});
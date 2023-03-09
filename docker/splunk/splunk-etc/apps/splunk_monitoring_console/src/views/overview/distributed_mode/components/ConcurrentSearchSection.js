/**
 * Created by ykou on 1/22/15.
 */
define([
    'jquery',
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/overview/distributed_mode/components/SingleValueWithResults',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/components/ConcurrentSearchSection.html'
], function(
    $,
    _,
    module,
    SwcMC,
    SingleValueWithResultsView,
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
            this.listenTo(this.collection.instances, 'sync reset', this.render);
        },
        render: function() {
            var instancesMeta = this.collection.instances.meta;
            var totalSearchConcurrency = instancesMeta.get('stats.total.search_concurrency') || 'N/A';
            var avgSearchConcurrency = instancesMeta.get('stats.avg.search_concurrency') || 'N/A';

            this.children.totalSearches = new SingleValueWithResultsView({
                UNDER_LABEL: _('Total').t(),
                result: totalSearchConcurrency,
                drilldownHref: 'search_activity_deployment?form.group=' + this.options.SEARCH_GROUP,
                TOOLTIP: this.options.DMC_DOC.DMC_SEARCH_HEAD_TOTAL_SEARCHES_DOC
            });

            this.children.averageSearches = new SingleValueWithResultsView({
                UNDER_LABEL: _('Average').t(),
                result: avgSearchConcurrency,
                drilldownHref: 'search_activity_deployment?form.group=' + this.options.SEARCH_GROUP,
                TOOLTIP: this.options.DMC_DOC.DMC_SEARCH_HEAD_AVERAGE_SEARCHES_DOC
            });

            this.$el.html(this.compiledTemplate());
            this.$('.dmc-total-searches').append(this.children.totalSearches.render().$el);
            this.$('.dmc-average-searches').append(this.children.averageSearches.render().$el);
            return this;
        },
        template: Template
    });
});
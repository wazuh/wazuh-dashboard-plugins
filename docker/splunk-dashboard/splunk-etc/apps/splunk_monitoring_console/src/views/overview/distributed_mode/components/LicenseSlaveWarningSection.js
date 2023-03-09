/**
 * Created by ykou on 1/22/15.
 */
define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/overview/distributed_mode/components/SingleValue',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/components/LicenseSlaveWarningSection.html'
], function(
    _,
    module,
    SwcMC,
    SingleValueView,
    Template
) {
    /**
     * Indexing Rate section of Indexer Panel.
     * This basically is a warpper for the two Single Value components: Total Indexing Rate and Average Indexing Rate.
     * @param: {SearchManager}  searchManager   - all search managers needed for this section.
     * @param: {String}         SEARCH_GROUP    - search group for drilldown
     * @Param: {Object}         DMC_DOC         - all doc strings for tooltips.
     */
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        className: 'dmc-single-values-section',
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.children.warnings = new SingleValueView({
                searchManager: this.options.searchManager,
                searchResultFieldName: 'count',
                UNDER_LABEL: '',
                drilldownHref: 'license_usage_today',
                TOOLTIP: this.options.DMC_DOC
            });
        },
        render: function() {
            this.$el.html(this.compiledTemplate());
            this.$el.append(this.children.warnings.render().$el);
            return this;
        },
        template: Template
    });
});
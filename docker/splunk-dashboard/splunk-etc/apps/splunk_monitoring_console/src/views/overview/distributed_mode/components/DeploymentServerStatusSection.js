/**
 * Created by ykou on 1/26/15.
 */
define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/overview/distributed_mode/components/SingleValue',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/components/DeploymentServerStatusSection.html'
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

            this.children.clientCount = new SingleValueView({
                searchManager: this.options.searchManager.deploymentServerClientCountSearch,
                searchResultFieldName: 'count',
                UNDER_LABEL: _('Clients').t()
            });

            this.children.appCount = new SingleValueView({
                searchManager: this.options.searchManager.deploymentServerAppCountSearch,
                searchResultFieldName: 'count',
                UNDER_LABEL: _('Apps').t()
            });
        },
        render: function() {
            this.$el.html(this.compiledTemplate());
            this.$('.dmc-client-count').append(this.children.clientCount.render().$el);
            this.$('.dmc-app-count').append(this.children.appCount.render().$el);
            return this;
        },
        template: Template
    });
});
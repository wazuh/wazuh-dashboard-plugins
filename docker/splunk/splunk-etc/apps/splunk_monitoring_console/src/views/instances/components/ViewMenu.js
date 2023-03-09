/**
 * Created by ykou on 8/5/14.
 */
define([
    'jquery',
    'module',
    '@splunk/swc-mc'
], function(
    $,
    module,
    SwcMC
    ) {
    return SwcMC.PopTartView.extend({
        moduleId: module.id,
        events: {
            'click .dmc-custom-drilldown-action': 'onClickMenuItem'
        },
        onClickMenuItem: function(e) {
            e.preventDefault();
            this.hide();
            window.open($(e.target).data('target'), '_blank');
        },
        render: function() {
            this.$el.html(this.compiledTemplate({
                instance: this.options.instance,
                earliest: this.options.earliest,
                latest: this.options.latest,
                roles: this.options.roles
            }));
            return this;
        },
        template:
        '<div class="dropdown-menu dropdown-menu-narrow dmc-dropdown-menu popdown-dialog-body popdown-dialog-padded">' +
            '<div class="arrow"></div>' +
            '<ul>' +
                '<li style="<%= _.contains(roles, "dmc_group_indexer") || _.contains(roles, "indexer") ? "" : "display: none" %>">' +
                    '<a href="#" class="dmc-custom-drilldown-action" data-target="indexing_performance_instance?form.splunk_server=<%= instance %>&form.time.earliest=<%= earliest %>&form.time.latest=<%= latest %>"><%= _("Indexing Performance").t() %></a>' +
                '</li>' +
                '<li>' +
                    '<a href="#" class="dmc-custom-drilldown-action" data-target="resource_usage_instance?form.splunk_server=<%= instance %>&form.time.earliest=<%= earliest %>&form.time.latest=<%= latest %>"><%= _("Resource Usage").t() %></a>' +
                '</li>' +
                '<li style="<%= _.contains(roles, "dmc_group_indexer") || _.contains(roles, "dmc_group_search_head") || _.contains(roles, "indexer") || _.contains(roles, "search_head") ? "" : "display: none" %>">' +
                    '<a href="#" class="dmc-custom-drilldown-action" data-target="search_activity_instance?form.splunk_server=<%= instance %>&form.time.earliest=<%= earliest %>&form.time.latest=<%= latest %>&form.dmc_group=*&form.role=<%= (_.contains(roles, "dmc_group_indexer") || _.contains(roles, "indexer")) ? "dmc_group_indexer" : "dmc_group_search_head" %>"><%= _("Search Activity").t() %></a>' +
                '</li>' +
                '<li style="<%= _.contains(roles, "dmc_group_search_head") || _.contains(roles, "search_head") ? "" : "display: none" %>">' +
                    '<a href="#" class="dmc-custom-drilldown-action" data-target="search_usage_statistics_instance?form.splunk_server=<%= instance %>&form.time.earliest=<%= earliest %>&form.time.latest=<%= latest %>"><%= _("Search Usage Statistics").t() %></a>' +
                '</li>' +
                '<li style="<%= _.contains(roles, "dmc_group_kv_store") || _.contains(roles, "kv_store") ? "" : "display: none" %>">' +
                    '<a href="#" class="dmc-custom-drilldown-action" data-target="kv_store_instance?form.splunk_server=<%= instance %>&form.time.earliest=<%= earliest %>&form.time.latest=<%= latest %>"><%= _("KV Store").t() %></a>' +
                '</li>' +
            '</ul>' +
        '</div>'

});
});
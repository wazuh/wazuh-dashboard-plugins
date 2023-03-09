define(
    [
        'jquery',
        'underscore',
        'module',
        '@splunk/swc-mc'
    ],
    function(
        $,
        _,
        module,
        SwcMC
    ) {
        var roleDrilldowns = {
                indexer: 'indexing_performance_instance',
                'search_head': 'search_activity_instance'
            },
            roleLabels = {
                indexer: _('Indexer').t(),
                'search_head': _('Search head').t(),
                auxiliary: _('Other').t()
            };

        return SwcMC.PopTartView.extend({
            moduleId: module.id,
            className: 'dropdown-menu dmc-dropdown-menu',
            initialize: function(options) {
                options = _.defaults(options, { 
                    mode: 'dialog'
                });
                SwcMC.PopTartView.prototype.initialize.call(this, options);

                this.listenTo(this.model.fetchState, 'change:role', this.render);
            },
            events: $.extend(SwcMC.PopTartView.prototype.events, {
                'click input[type="checkbox"]': function(e) {
                    var $el = $(e.target);
                    if ($el.prop('checked')) {
                        this.model.state.set(
                            'relatedTo',
                            this.model.instance.entry.content.get('serverName')
                        );
                    } else {
                        this.model.state.set(
                            'relatedTo',
                            ''
                        );
                    }
                }
            }),
            render: function() {
                var role = this.model.fetchState.get('role'), // Even though the instance may have many roles, this is its acting role
                    roleDrilldown = roleDrilldowns[role];

                this.el.innerHTML = SwcMC.PopTartView.prototype.template_menu;
                this.$el.append(this.compiledTemplate({
                    _: _,
                    title: roleLabels[role],
                    instanceData: this.model.instance.entry.content.toJSON(),
                    instanceModel: this.model.instance,
                    resourceUsageUrl: SwcMC.SplunkUtil.make_full_url(
                        '/app/splunk_monitoring_console/resource_usage_machine',
                        {
                            'form.machine': this.model.instance.entry.content.get('machine')
                        }
                    ),
                    instanceDetailsUrl: roleDrilldown && SwcMC.SplunkUtil.make_full_url(
                        '/app/splunk_monitoring_console/' + roleDrilldown,
                        {
                            'form.splunk_server': this.model.instance.entry.content.get('serverName')
                        }
                    ),
                    canHideUnconnected: role === 'indexer' || role === 'search_head'
                }));
                this.$('input[type="checkbox"]').prop('checked', this.model.instance.entry.content.get('serverName') === this.model.fetchState.get('relatedTo'));
                return this;
            },
            template: '\
                <h3><%- title %></h3> \
                <p><%- instanceData.serverName %></p> \
                <% if (instanceDetailsUrl) { %> \
                <p>\
                    <a href="<%= instanceDetailsUrl %>" target="_blank" class="external"><%- _("Instance details").t() %></a>\
                </p>\
                <% } %> \
                <p>\
                    <a href="<%= resourceUsageUrl %>" target="_blank" class="external"><%- _("Resource usage (machine)").t() %></a>\
                </p>\
                <% if (canHideUnconnected) { %> \
                <form class="dmc-hide-unconnected"> \
                    <input type="checkbox"></input> <%- _("Hide unconnected").t() %> \
                </form> \
                <% } %> \
                <dl class="dl-horizontal list-dotted"> \
                    <% if (instanceData.up_down_status === 1 && _.isString(instanceData.machine)) { %> \
                    <dt><%- _("Machine").t() %></dt><dd><%- instanceData.machine %></dd> \
                    <% if (_.contains(instanceData.role, "auxiliary") && instanceData.management_roles.length) { %> \
                    <dt><%- _("Roles").t() %></dt><dd><%- _.map(instanceData.management_roles, function(r) { return instanceModel.getServerRoleI18n(r); }).join(", ") %></dd> \
                    <% } %> \
                    <% if (instanceData.indexerClusters.length) { %> \
                    <dt><%- _("Indexer clusters").t() %></dt><dd><%- instanceData.indexerClusters.join(", ") %></dd> \
                    <% } %> \
                    <% if (instanceData.searchHeadClusters.length) { %> \
                    <dt><%- _("Search head clusters").t() %></dt><dd><%- instanceData.searchHeadClusters.join(", ") %></dd> \
                    <% } %> \
                     <% if (instanceData.customGroups.length) { %> \
                    <dt><%- _("Custom groups").t() %></dt><dd><%- instanceData.customGroups.join(", ") %></dd> \
                    <% } %> \
                    <% if (instanceData.cpu_arch) { %> \
                    <dt><%- _("Platform").t() %></dt><dd><%- instanceData.cpu_arch %></dd> \
                    <% } %> \
                    <% if (instanceData.os_name && instanceData.os_version) { %> \
                    <dt><%- _("OS").t() %></dt><dd><%- instanceData.os_name + " " + instanceData.os_version %></dd> \
                    <% } %> \
                    <% if (instanceData.numberOfCores) { %> \
                        <% if (instanceData.numberOfVirtualCores) { %> \
                        <dt><%- _("CPU Cores (Physical/Virtual)").t() %></dt><dd><%- instanceData.numberOfCores + " / " + instanceData.numberOfVirtualCores %></dd> \
                        <% } %> \
                        <% if (!instanceData.numberOfVirtualCores) { %> \
                        <dt><%- _("CPU Cores (Physical/Virtual)").t() %></dt><dd><%- instanceData.numberOfCores + " / " + "N/A" %></dd> \
                        <% } %> \
                    <% } %> \
                    <% if (instanceData.physicalMemoryMB) { %> \
                    <dt><%- _("Physical memory installed").t() %></dt><dd><%- instanceData.physicalMemoryMB %> MB</dd> \
                    <% } %> \
                    <% if (instanceData.version) { %> \
                    <dt><%- _("Splunk version").t() %></dt><dd><%- instanceData.version %></dd> \
                    <% } %> \
                    <% if (_.contains(instanceData.role, "indexer") && _.isNumber(instanceData.indexing_rate)) { %> \
                    <dt><%- _("Indexing rate").t() %></dt><dd><%- instanceData.indexing_rate %> KB/s</dd> \
                    <% } %> \
                    <% if (_.contains(instanceData.role, "search_head") && _.isNumber(instanceData.search_concurrency)) { %> \
                    <dt><%- _("Search concurrency").t() %></dt><dd><%- instanceData.search_concurrency %></dd> \
                    <% } %> \
                    <% if (_.isNumber(instanceData.up_down_status)) { %> \
                    <dt><%- _("Status").t() %></dt><dd><%- instanceModel.getContentLabel("up_down_status") %></dd> \
                    <% } %> \
                    <% if (_.isNumber(instanceData.cpu_system_pct)) { %> \
                    <dt><%- _("CPU usage").t() %></dt><dd><%- instanceModel.getContentLabel("cpu_system_pct") %></dd> \
                    <% } %> \
                    <% if (_.isNumber(instanceData.mem_used)) { %> \
                    <dt><%- _("Memory usage").t() %></dt><dd><%- instanceModel.getContentLabel("mem_used") %></dd> \
                    <% } %> \
                    <% } else { %> \
                    <dt><%- _("Status").t() %></dt><dd><%- instanceModel.getContentLabel("up_down_status") %></dd> \
                    <% } %> \
                </dl> \
            '
        });
    }
);

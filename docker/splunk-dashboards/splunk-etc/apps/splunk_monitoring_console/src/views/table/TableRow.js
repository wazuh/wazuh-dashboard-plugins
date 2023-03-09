define(
    [
        'jquery',
        'underscore',
        'module',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/table/controls/EditMenu'
    ],
    function(
        $,
        _,
        module,
        SwcMC,
        EditMenu) {
        return SwcMC.BaseView.extend({
            moduleId: module.id,

            tagName: 'tr',

            className: 'expand',

            initialize: function() {
                SwcMC.BaseView.prototype.initialize.apply(this, arguments);
                this.collection = this.collection || {};
                this.$el.addClass((this.options.index % 2) ? 'odd' : 'even');
                this.compiledRolesTemplate = this.compileTemplate(this.rolesTemplate);
                this.compiledTagsTemplate = this.compileTemplate(this.tagsTemplate);
                this.compiledTitleTemplate = this.compileTemplate(this.titleTemplate);
                this.compiledMachineTemplate = this.compileTemplate(this.machineTemplate);
                this.compiledProblemsTemplate = this.compileTemplate(this.problemsTemplate);
                this.activate();
            },

            events: $.extend(SwcMC.BaseView.prototype.events, {
                'mousedown td.actions > a.dropdown-toggle': function(e) {
                    var $target = $(e.currentTarget);
                    if (this.children.editmenu && this.children.editmenu.shown) {
                        this.children.editmenu.hide();
                        e.preventDefault();
                        return;
                    }

                    this.children.editmenu = new EditMenu({
                        model: {
                            peer: this.model.peer,
                            asset: this.model.asset,
                            state: this.model.state,
                            appLocal: this.model.appLocal,
                            application: this.model.application
                        },
                        collection: {
                            peers: this.collection.peers
                        },
                        onHiddenRemove: true
                    });
                    $('body').append(this.children.editmenu.render().el);
                    this.children.editmenu.show($target);
                },

                'click td.actions > a.dropdown-toggle': function(e) {
                    e.preventDefault();
                },

                'click label.checkbox.unchecked': function (e) {
                    e.preventDefault();
                    this.selectPeer();
                },

                'click label.checkbox.checked': function(e) {
                    e.preventDefault();
                    this.deselectPeer();
                }
            }),

            startListening: function() {
                this.listenTo(
                    this.model.peer.entry.content,
                    'change:active_server_roles',
                    this.updateServerRoles
                );
                this.listenTo(
                    this.model.peer.entry.content,
                    'change:tags',
                    this.updateTags
                );
                this.listenTo(
                    this.model.appLocal.entry.content,
                    'change:configured',
                    this.updateTags
                );
                this.listenTo(
                    this.model.peer.entry.content,
                    'change:host',
                    this.updateHost
                );
                this.listenTo(
                    this.model.peer.entry.content,
                    'change:host_fqdn',
                    this.updateHostFqdn
                );
                this.listenTo(
                    this.model.peer.entry.content,
                    'change:status-toggle',
                    this.updateStatus
                );
                this.listenTo(
                    this.model.peer.entry.content,
                    'change:status-toggle',
                    this.updateProblems
                );
                this.listenTo(
                    this.model.peer,
                    'select-all-click',
                    this.selectPeer
                );
                this.listenTo(
                    this.model.peer,
                    'deselect-all-click',
                    this.deselectPeer
                );
                this.listenTo(
                    this.model.peer.entry.content,
                    'change:indexerClusters',
                    this.updateIndexerClusters
                );
                this.listenTo(
                    this.model.peer.entry.content,
                    'change:searchHeadClusters',
                    this.updateSearchHeadClusters
                );
            },

            selectPeer: function() {
                this.$el.find('label').removeClass('unchecked').addClass('checked');
                this.$el.find('i.icon-check').show();
                this.model.peer.set('bulk-selected', true);
            },

            deselectPeer: function(){
                this.$el.find('label').removeClass('checked').addClass('unchecked');
                this.$el.find('i.icon-check').hide();
                this.model.peer.set('bulk-selected', false);
            },

            updateStatus: function() {
                if(this.model.peer.entry.content.get('state') === 'Configured') {
                    this.$('td.status-toggle').html("<span class='icon-check-circle configured'> " + _("Configured").t() + "</span>");
                } else {
                    this.$('td.status-toggle').html("<span class='icon-alert-circle new'> " + _("New").t() + "</span>");
                }
                if(this.model.peer.entry.content.get('status-toggle') === 'Enabled') {
                    this.$('td.state').html("<span class='icon-check enabled'></span> " + _("Enabled").t());
                } else {
                    this.$('td.state').html("<span class='icon-x disabled'></span> " + _("Disabled").t());
                }
            },

            updateServerRoles: function() {
                var html = "";
                if(this.model.peer.entry.content.get('status-toggle') === "Enabled") {
                    _.each(this.model.peer.entry.content.get('active_server_roles'), function(role) {
                        var roleI18n = this.model.peer.getServerRoleI18n(role);
                        html += "<div class=\"server_roles\">";
                        html += "<div title=\"" + roleI18n + "\" class=\"" + role + "_group\">";
                        html += "<span>" + roleI18n + "</span>";
                        html += "</div>";
                        html += "</div>";
                    }.bind(this));
                } else {
                    html = "<div title=\"No server roles.\"></div>";
                }
                this.$('td.primary-peer-roles').html(html);

            },

            updateTags: function() {
                this.$('td.tags').html(this.compiledTagsTemplate({
                    _: _,
                    configured: this.model.appLocal.entry.content.get('configured'),
                    tags: this.model.peer.entry.content.get('tags')
                }));
            },

            updateHost: function() {
                this.$('td.title.splunk-server').html(this.compiledTitleTemplate({
                    host: this.model.peer.entry.content.get("host"),
                    hostTitle: this.model.peer.entry.content.get('host') + (this.model.peer.isConfigured() ? '' : _(' is not configured.').t())
                }));
            },

            updateHostFqdn: function() {
                this.$('td.machine').html(this.compiledMachineTemplate({
                    hostFqdn: this.model.peer.entry.content.get('host_fqdn')
                }));
            },

            updateProblems: function() {
                var errorMessages = this.model.peer.entry.content.get("errorMessages");
                var warningMessages = this.model.peer.entry.content.get("warningMessages");
                this.$('td.problems').html(this.compiledProblemsTemplate({
                    errorMessages: errorMessages,
                    warningMessages: warningMessages
                }));
            },

            updateIndexerClusters: function() {
                var indexerClusters = this.model.peer.entry.content.get('indexerClusters');
                this.$('td.indexer-cluster').text(_.isArray(indexerClusters) ? indexerClusters.join(', ') : '');
            },

            updateSearchHeadClusters: function() {
                var searchHeadClusters = this.model.peer.entry.content.get('searchHeadClusters');
                this.$('td.searchhead-cluster').text(_.isArray(searchHeadClusters) ? searchHeadClusters.join(', ') : '');
            },

            render: function() {
                this.$el.html(this.compiledTemplate({
                    peer: this.model.peer,
                    index: this.options.index,
                    isLocal: this.options.isLocal
                }));
                this.updateStatus();
                this.updateServerRoles();
                this.updateTags();
                this.updateHost();
                this.updateHostFqdn();
                this.updateProblems();
                this.updateIndexerClusters();
                this.updateSearchHeadClusters();

                this.$('.dmc_alert_tooltip').tooltip();

                return this;
            },

            template: '\
                <td class="expands">\
                    <a href="#">\
                        <i class="icon-triangle-right-small"></i>\
                    </a>\
                </td>\
                <% if (!isLocal) { %> \
                <td class="checkbox">\
                    <label class="checkbox <%- peer.get("bulk-selected") ? "checked" : "unchecked" %>">\
                        <a href="#" class="btn">\
                            <i class="icon-check" style="<%- peer.get("bulk-selected") ? "" : "display:none;" %>">\
                            </i>\
                        </a>\
                    </label>\
                </td>\
                <td class="splunk-server title"></td>\
                <% } else { %> \
                <td class="splunk-server title"></td>\
                <td class="checkbox"></td>\
                <% } %> \
                <td class="title" title="<%- peer.entry.content.get("peerName") || peer.entry.content.get("serverName") || _("N/A").t() %>">\
                    <%- peer.entry.content.get("peerName") || peer.entry.content.get("serverName") || _("N/A").t() %>\
                </td>\
                <td class="machine"></td>\
                <td class="primary-peer-roles"></td>\
                <td class="tags"></td>\
                <td class="indexer-cluster"></td>\
                <td class="searchhead-cluster"></td>\
                <td class="state"></td>\
                <td class="status-toggle"></td>\
                <td class="problems"></td>\
                <td class="actions">\
                    <a class="dropdown-toggle" href="#"><%- _("Edit").t() %><span class="caret"></span></a>\
                </td>\
            ',

            problemsTemplate: '\
                <% if (errorMessages.length > 0) { %>\
                <div data-toggle="tooltip" title="' + _("You have some unresolved errors. Expand this row to view.").t() + '" class="dmc_alert_tooltip alert alert-error">\
                    <span class="icon-alert"></span>\
                </div>\
                <% } else if (warningMessages.length > 0) { %>\
                <div data-toggle="tooltip" title="' + _("You have some unresolved warnings. Expand this row to view.").t() + '" class="dmc_alert_tooltip alert alert-warning">\
                    <span class="icon-alert"></span>\
                </div>\
                <% } %>\
            ',

            rolesTemplate: '\
                <div class="server_roles"></div>\
            ',

            titleTemplate: '\
                <span title="<%- hostTitle %>"> <%- host %></span>\
            ',

            machineTemplate: '\
                <span title="<%- hostFqdn %>"><%- hostFqdn %></span>\
            ',

            tagsTemplate: '\
                <% if (!configured) { %> \
                    <%- _("Only available in distributed mode.").t() %> \
                <% } else { %> \
                    <% _.each(tags, function(tag) { %>\
                    <span class="grouptag"><%- tag %></span>\
                    <% }) %> \
                <% } %> \
            '
        });
    }
);

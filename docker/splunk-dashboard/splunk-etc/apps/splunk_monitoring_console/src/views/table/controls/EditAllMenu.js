define(
    [
        'jquery',
        'underscore',
        'backbone',
        'module',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/table/controls/EditAllServerRolesDialog',
        'splunk_monitoring_console/views/table/controls/EditAllGroupsDialog',
        'splunk_monitoring_console/views/table/controls/EditAllDisableDialog',
        'splunk_monitoring_console/views/table/controls/EditAllSuccessFailureDialog'
    ],
    function(
        $,
        _,
        Backbone,
        module,
        SwcMC,
        EditAllServerRolesDialogView,
        EditAllGroupsDialog,
        EditAllDisableDialog,
        EditAllSuccessFailureDialog
    ) {

        return SwcMC.PopTartView.extend({
            moduleId: module.id,
            className: 'dropdown-menu',
            initialize: function(options) {
                options = _.defaults(options, { mode: 'menu' });
                SwcMC.PopTartView.prototype.initialize.call(this, options);
            },

            events: {
                'click a.disabled': function(e) {
                    e.preventDefault();
                },

                'click a.edit-all-server-roles.enabled': function(e) {
                    e.preventDefault();

                    var dialog = new EditAllServerRolesDialogView({
                        model: {
                            state: this.model.state
                        },
                        collection: {
                            peers: this.collection.peers
                        },
                        onHiddenRemove: true
                    });
                    $('body').append(dialog.render().el);
                    dialog.show();
                },

                'click a.edit-all-groups.enabled': function(e) {
                    e.preventDefault();

                    var dialog = new EditAllGroupsDialog({
                        model: {
                            state: this.model.state
                        },
                        collection: {
                            peers: this.collection.peers
                        },
                        onHiddenRemove: true
                    });
                    $('body').append(dialog.render().el);
                    dialog.show();
                },

                'click a.edit-all-disable.enabled': function(e) {
                    e.preventDefault();

                    var dialog = new EditAllDisableDialog({
                        model: {
                            state: this.model.state
                        },
                        collection: {
                            peers: this.collection.peers
                        }
                    });
                    $('body').append(dialog.render().el);
                    dialog.show();
                },

                'click a.edit-all-enable.enabled': function(e) {
                    e.preventDefault();
                    var settingsAsset = this.collection.peers.models[0].collection.assets.find(function (asset) {
                        return asset.entry.get('name') === 'settings';
                    });
                    var blackList = settingsAsset.entry.content.get('blackList').split(',');

                    this.collection.peers.where({'bulk-selected': true}).forEach(function(peer) {
                        var peerName = peer.entry.get('name');
                        if ($.inArray(peerName, blackList) !== -1) {
                            blackList.splice( $.inArray(peerName, blackList), 1 );
                            peer.entry.content.set('status-toggle', 'Enabled');
                            peer.resetInitialInternalServerRoles();
                        }
                    }.bind(this));

                    settingsAsset.entry.content.set('blackList', blackList.join(','));

                    settingsAsset.save().then(function() {
                        this.hide();
                        this.model.state.set('changesMade', true);
                        var dialog = new EditAllSuccessFailureDialog({
                            title: _("Enable Selected Instances").t(),
                            message: _("Selected instances successfully enabled.").t()
                        });
                        $('body').append(dialog.render().el);
                        dialog.show();
                    }.bind(this)).catch(function() {
                        this.hide();
                        this.model.state.set('changesMade', true);
                        var dialog = new EditAllSuccessFailureDialog({
                            title: _("Enable Selected Instances").t(),
                            message: _("Failed to enable selected instances. Please try again later.").t()
                        });
                        $('body').append(dialog.render().el);
                        dialog.show();
                    }.bind(this));
                }
            },
            render: function() {
                this.el.innerHTML = SwcMC.PopTartView.prototype.template_menu;
                var editMenuDisabled = this.collection.peers.where({'bulk-selected': true}).length === 0;
                this.$el.append(this.compiledTemplate({
                    disabled: editMenuDisabled ? 'disabled' : 'enabled'
                }));
                return this;
            },
            template: '\
                <ul class="first-group">\
                    <li><a href="#" class="edit-all-server-roles <%= disabled %>"><%- _("Set Server Roles").t() %></a></li>\
                    <li><a href="#" class="edit-all-groups <%= disabled %>"><%- _("Set Custom Groups").t() %></a></li>\
                    <li><a href="#" class="edit-all-disable <%= disabled %>"><%- _("Disable Monitoring").t() %></a></li>\
                    <li><a href="#" class="edit-all-enable <%= disabled %>"><%- _("Enable Monitoring").t() %></a></li>\
                </ul>\
            '
        });

    }
);


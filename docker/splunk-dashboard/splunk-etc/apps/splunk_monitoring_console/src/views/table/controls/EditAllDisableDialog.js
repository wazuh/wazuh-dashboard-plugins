define(
    [
        'jquery',
        'underscore',
        'module',
        'backbone',
        'splunk_monitoring_console/views/table/controls/SimpleDialog',
        'splunk_monitoring_console/views/table/controls/EditAllSuccessFailureDialog'
    ],
    function(
        $,
        _,
        module,
        Backbone,
        SimpleDialog,
        EditAllSuccessFailureDialog
    ) {
        var BUTTON_DISABLE = '<a href="#" class="btn btn-primary" data-dismiss="modal">' + _('Disable Selected Instances').t() + '</a>';
        return SimpleDialog.extend({
            moduleId: module.id,
            initialize: function() {
                var defaults = {
                    title: _("Disable All Selected Instances").t(),
                    message: _.template(this.defaultMessageTemplate)
                };
                this.options = _.extend({}, defaults, this.options);
                SimpleDialog.prototype.initialize.apply(this, arguments);
            },

            defaultMessageTemplate: '\
                <div class="alert alert-warning">\
                    <span class="icon-alert"></span> <%= _(" All your preconfigured roles will be lost.").t() %></span>\
                </div>\
                <div>\
                    <p>\
                        <%= _("Are you sure you want to disable the selected instances?").t() %>\
                    </p>\
                </div>',

            events: $.extend({}, SimpleDialog.prototype.events, {
                'click .btn-primary': function(e) {
                    e.preventDefault();

                    var selectedPeers = this.collection.peers.filter(function(peer) {
                        return peer.get('bulk-selected');
                    });
                    var selectedPeersNames = selectedPeers.map(function(peer) {
                        peer.removeAllServerRoles();
                        return peer.entry.get('name');
                    });
                    var settingsAsset = this.collection.peers.assets.find(function(asset) {
                        return asset.entry.get('name') === 'settings';
                    });

                    var blackList = settingsAsset.entry.content.get('blackList');
                    blackList = $.trim(blackList) ? blackList.split(',') : [];
                    blackList = _.union(blackList, selectedPeersNames);

                    settingsAsset.entry.content.set('blackList', blackList.join(','));
                    var deferred = [settingsAsset.save(), this.collection.peers.saveSelected()];
                    $(e.target).prop('disabled', true);
                    Promise.all(deferred).done(function () {
                        _(selectedPeers).each(function(peer) {
                            peer.entry.content.set("errorMessages", []);
                            peer.entry.content.set("warningMessages", []);
                            this.model.state.trigger("updateRows");
                            peer.entry.content.set('status-toggle', 'Disabled');
                            this.model.state.set('changesMade', true);
                        }.bind(this));

                        this.hide();
                        var dialog = new EditAllSuccessFailureDialog({
                            title: _("Disable Selected Instances").t(),
                            message: _("Selected instances successfully disabled.").t()
                        });
                        $('body').append(dialog.render().el);
                        dialog.show();
                    }.bind(this)).catch(function() {
                        this.hide();
                        var dialog = new EditAllSuccessFailureDialog({
                            title: _("Disable Selected Instances").t(),
                            message: _("Failed to disable selected instances. Please try again later").t()
                        });
                        $('body').append(dialog.render().el);
                        dialog.show();
                    });
                }
            }),
            render: function() {
                this.$(SimpleDialog.FOOTER_SELECTOR).append(SimpleDialog.BUTTON_CANCEL);
                this.$(SimpleDialog.FOOTER_SELECTOR).append(BUTTON_DISABLE);
                return this;
            }
        });
    }
);

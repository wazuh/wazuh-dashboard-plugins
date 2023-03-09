define(
    [
        'jquery',
        'underscore',
        'module',
        'backbone',
        'splunk_monitoring_console/views/table/controls/SimpleDialog',
        'splunk_monitoring_console/views/table/controls/ConfirmationDialog',
        'splunk_monitoring_console/views/table/controls/FailureDialog'

    ],
    function(
        $,
        _,
        module,
        Backbone,
        SimpleDialog,
        ConfirmationDialog,
        FailureDialog
    ) {
    var BUTTON_DISABLE = '<a href="#" class="btn btn-primary" data-dismiss="modal">' + _('Disable').t() + '</a>';
        return SimpleDialog.extend({
            moduleId: module.id,
            initialize: function() {
                var defaults = {
                    title: _("Disable Instance").t(),
                    message: '<div class="alert alert-warning"><i class="icon-alert"></i>' + _("All your preconfigured roles will be lost.").t() + '</div>' + '<p>' + _("Are you sure you want to disable this instance?").t() + '</p>'
                };
                this.options = _.extend({}, defaults, this.options);
                SimpleDialog.prototype.initialize.apply(this, arguments);
            },
            events: $.extend({}, SimpleDialog.prototype.events, {
                'click .btn-primary': function(e) {
                    e.preventDefault();

                    // add instance to blacklist
                    var assets = this.model.peer.collection ? this.model.peer.collection.assets : this.collection.peers.assets;
                    var settingsAsset = assets.find(function(asset) {
                        return asset.entry.get('name') === 'settings';
                    });
                    var blackList = settingsAsset.entry.content.get('blackList');
                    blackList = $.trim(blackList) ? blackList.split(',') : [];
                    blackList.push(this.model.peer.entry.get('name'));
                    settingsAsset.entry.content.set('blackList', blackList.join(','));

                    // remove this instance from all distributed groups
                    this.model.peer.removeAllServerRoles();

                    var deferred = [settingsAsset.save(), this.model.peer.save()];
                    $(e.target).prop('disabled', true);
                    Promise.all(deferred).then(function() {
                        this.model.peer.entry.content.set("errorMessages", []);
                        this.model.peer.entry.content.set("warningMessages", []);
                        this.model.state.trigger("updateRows");
                        this.model.peer.entry.content.set('status-toggle', 'Disabled');
                        this.model.state.set('changesMade', true);
                        this.hide();
                        var dialog = new ConfirmationDialog({
                            message: _("Your instance has been disabled.").t()
                        });
                        $('body').append(dialog.render().el);
                        dialog.show();
                    }.bind(this)).catch(function() {
                        this.hide();
                        var dialog = new FailureDialog().render();
                        $('body').append(dialog.el);
                        dialog.show();
                    }.bind(this));
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


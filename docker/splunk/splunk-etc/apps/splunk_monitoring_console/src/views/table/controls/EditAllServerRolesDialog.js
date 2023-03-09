define(
    [
        'jquery',
        'underscore',
        'module',
        'backbone',
        'splunk_monitoring_console/models/Peer',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/table/controls/EditAllSuccessFailureDialog'
    ],
    function(
        $,
        _,
        module,
        Backbone,
        PeerModel,
        SwcMC,
        EditAllSuccessFailureDialog
    ) {

        return SwcMC.ModalView.extend({
            moduleId: module.id,
            initialize: function(options) {
                SwcMC.ModalView.prototype.initialize.apply(this, arguments);

                this.model.working = new Backbone.Model();
                this.collection = this.collection || {};
                this.collection.flashMessages = new SwcMC.FlashMessagesCollection();

                var canonicalRoles = PeerModel.getAllPrimaryRoles();
                _.each(canonicalRoles, function(roleId) {
                    this.model.working.set(roleId, false);
                    this.children[roleId + 'Field'] = new SwcMC.ControlGroupView({
                        controlType: 'SyntheticCheckbox',
                        controlOptions: {
                            modelAttribute: roleId,
                            model: this.model.working
                        },
                        label: this.collection.peers.at(0).getServerRoleI18n(roleId)
                    });
                }, this);

                this.children.flashMessage = new SwcMC.FlashMessagesLegacyView({
                    collection: this.collection.flashMessages
                });

            },

            events: $.extend({}, SwcMC.ModalView.prototype.events, {
                'click .btn-primary': function(e) {
                    e.preventDefault();
                    var dialog = this;
                    var uiRoles = this.model.working.toJSON();
                    var roles = [];

                    this.collection.flashMessages.reset();

                    _.each(_.keys(uiRoles), function(uiRoleKey) {
                        if (uiRoles[uiRoleKey]) {
                            roles.push(uiRoleKey);
                        }
                    });

                    var selected_peers = this.collection.peers.filter(function(peer){
                        return peer.get('bulk-selected');
                    });

                    var error = _.chain(selected_peers).map(function(peer){
                        return peer.entry.content.validate({'active_server_roles': roles});
                    }).filter(function(message){
                        return message;
                    }).first().value();

                    if (error) {
                        this.collection.flashMessages.reset([{
                            type: 'error',
                            html: error
                        }]);
                        return;
                    }

                    _(selected_peers).each(function(peer) {
                        peer.entry.content.set('active_server_roles', roles);
                    }.bind(this));

                    $(e.target).prop('disabled', true);
                    this.collection.peers.saveSelected().then(function() {
                        this.model.state.set('changesMade', true);
                        this.hide();
                        var dialog = new EditAllSuccessFailureDialog({
                            title: _("Set Server Roles").t(),
                            message: _("Selected instances successfully updated.").t()
                        });
                        $('body').append(dialog.render().el);
                        dialog.show();
                    }.bind(this)).catch(function() {
                        this.model.state.set('changesMade', true);
                        this.hide();
                        var dialog = new EditAllSuccessFailureDialog({
                            title: _("Set Server Roles").t(),
                            message: _("Failed to update selected instances. Please try again later").t()
                        });
                        $('body').append(dialog.render().el);
                        dialog.show();
                    }.bind(this));
                }
            }),
            render : function() {
                this.$el.html(SwcMC.ModalView.TEMPLATE);
                this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(_("Set Server Roles").t());
                this.$(SwcMC.ModalView.BODY_SELECTOR).prepend(this.children.flashMessage.render().el);
                this.$(SwcMC.ModalView.BODY_SELECTOR).append(SwcMC.ModalView.FORM_HORIZONTAL);
                _.each(_.keys(this.children), function(childKey) {
                    if (childKey !== 'flashMessage') {
                        this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).append(this.children[childKey].render().el);
                    }
                }, this);
                this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_CANCEL);
                this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_SAVE);
                return this;
            }
        });
    }
);
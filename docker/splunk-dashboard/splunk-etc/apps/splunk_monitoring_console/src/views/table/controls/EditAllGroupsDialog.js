define(
    [
        'jquery',
        'underscore',
        'backbone',
        'module',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/table/controls/MultiInputControl',
        'splunk_monitoring_console/views/table/controls/EditAllSuccessFailureDialog'
    ],
    function(
        $,
        _,
        Backbone,
        module,
        SwcMC,
        MultiInputControl,
        EditAllSuccessFailureDialog
    ) {
        return SwcMC.ModalView.extend({
            moduleId: module.id,
            initialize: function() {
                SwcMC.ModalView.prototype.initialize.apply(this, arguments);

                this.model.working = new Backbone.Model({
                    'tags': ''
                });

                this._warningMessageIsShowing = false;

                this.collection = this.collection || {};
                this.collection.flashMessages = new SwcMC.FlashMessagesCollection();

                this.groupTagsInputControl = new MultiInputControl({
                    dataTestName: "dmc-editallgroups-multiselect",
                    allowNewValues: true,
                    model: this.model.working,
                    collection: this.collection.peers,
                    modelAttribute: 'tags',
                    attributeType: 'array',
                    placeholder: _('Choose groups').t(),
                    collectionMethod: 'getAllTags'
                });

                this.children.groupTags = new SwcMC.ControlGroupView({
                    label: _("Group Tags").t(),
                    controlClass: 'controls-block',
                    controls: [this.groupTagsInputControl.options.component]
                });

                this.children.flashMessage = new SwcMC.FlashMessagesLegacyView({
                    collection: this.collection.flashMessages
                });

            },
            events: $.extend({}, SwcMC.ModalView.prototype.events, {
                'click .btn-primary': function(e) {
                    e.preventDefault();

                    if(!this._warningMessageIsShowing) {
                        this._warningMessageIsShowing = true;
                        this.collection.flashMessages.reset([{
                            type: 'warning',
                            html: _("Saving group tags will overwrite all existing group tags.").t()
                        }]);
                        return;
                    }

                    var tags = this.model.working.get('tags');
                    tags = $.trim(tags) ? tags.split(',') : [];

                    this.collection.flashMessages.reset();

                    var selected_peers = this.collection.peers.filter(function(peer){
                        return peer.get('bulk-selected');
                    });

                    var error = _.chain(selected_peers).map(function(peer){
                        return peer.entry.content.validate({'tags': tags});
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
                        peer.entry.content.set('tags', tags);
                    }.bind(this));

                    $(e.target).prop('disabled', true);
                    this.collection.peers.saveSelected().then(function() {
                        this.model.state.set('changesMade', true);
                        this.hide();
                        var dialog = new EditAllSuccessFailureDialog({
                            title: _("Set Custom Groups").t(),
                            message: _("Selected instances successfully updated.").t()
                        });
                        $('body').append(dialog.render().el);
                        dialog.show();
                    }.bind(this)).catch(function() {
                        this.model.state.set('changesMade', true);
                        this.hide();
                        var dialog = new EditAllSuccessFailureDialog({
                            title: _("Set Custom Groups").t(),
                            message: _("Failed to update selected instances. Please try again later").t()
                        });
                        $('body').append(dialog.render().el);
                        dialog.show();
                    }.bind(this));
                }
            }),
            render: function() {
                this.$el.html(SwcMC.ModalView.TEMPLATE);
                this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(_("Set Group Tags").t());
                this.$(SwcMC.ModalView.BODY_SELECTOR).prepend(this.children.flashMessage.render().el);
                this.$(SwcMC.ModalView.BODY_SELECTOR).append(SwcMC.ModalView.FORM_HORIZONTAL);
                this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).append(this.children.groupTags.render().el);
                this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_CANCEL);
                this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_SAVE);
                return this;
            }
        });
    }
);
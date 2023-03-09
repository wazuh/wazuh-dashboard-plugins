define(
    [
        'underscore',
        'module',
        'backbone',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/table/controls/SimpleDialog'
    ],
    function(
        _,
        module,
        Backbone,
        SwcMC,
        SimpleDialog
    ) {
        return SimpleDialog.extend({
            moduleId: module.id,
            initialize: function(options) {
                var defaults = {
                    title: _("Error").t()
                };

                this.options = _.extend({}, defaults, this.options);
                SimpleDialog.prototype.initialize.apply(this, arguments);

                this.collection = this.collection || Backbone.Collection();

                this.collection.flashMessages = new SwcMC.FlashMessagesCollection();

                this.children.flashMessagesView = new SwcMC.FlashMessagesLegacyView({
                    collection: this.collection.flashMessages
                });

                this.collection.flashMessages.reset([{
                    type: "error",
                    html: _("You have some unresolved errors that need to be fixed before you can proceed. Check the problems column and expand for more detail.").t()
                }]);
            }, 
            render: function() {
                this.$(SimpleDialog.BODY_SELECTOR).append(this.children.flashMessagesView.render().el);
                this.$(SimpleDialog.FOOTER_SELECTOR).append(SimpleDialog.BUTTON_CANCEL);

                this.$('.btn.cancel').text(_("Continue").t());
                this.$('.btn.cancel').css("float", "right");
                return this;
            }
        });
    }
);
define(
    [
        'underscore',
        'module',
        'backbone',
        '@splunk/swc-mc'
    ],
    function(
        _,
        module,
        Backbone,
        SwcMC
    ) {
        var TEMPLATE_WITHOUT_CLOSE = '\
                <div class="' + SwcMC.ModalView.HEADER_CLASS + '">\
                    <h1 class="modal-title">&nbsp;</h1>\
                </div>\
                <div class="' +  SwcMC.ModalView.BODY_CLASS + '">\
                </div>\
                <div class="' + SwcMC.ModalView.FOOTER_CLASS + '">\
                </div>\
            ',
            BUTTON_AFFIRMATIVE_CONTINUE = '<a href="#" class="btn affirmative-continue btn-primary modal-btn-primary pull-right" data-dismiss="modal">' + _('Continue').t() + '</a>';

        return SwcMC.ModalView.extend(
            {
                moduleId: module.id,
                initialize: function() {
                    this.options = _.extend({onHiddenRemove: true}, this.options);
                    SwcMC.ModalView.prototype.initialize.apply(this, arguments);

                    this.title = this.options.errorMessage ? _("Error").t() : this.options.title;
                    this.message = this.options.message;
                    this.errorMessage = this.options.errorMessage;

                    this.collection = this.collection || {};
                    this.collection.flashMessages = new SwcMC.FlashMessagesCollection();

                    this.children.flashMessage = new SwcMC.FlashMessagesLegacyView({
                        collection: this.collection.flashMessages,
                        escape: false
                    });

                    this.$el.html(TEMPLATE_WITHOUT_CLOSE);
                    this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(this.title);
                    this.$(SwcMC.ModalView.BODY_SELECTOR).prepend(this.children.flashMessage.render().el);
                    this.$(SwcMC.ModalView.BODY_SELECTOR).append(this.message);

                    if (this.errorMessage) {
                        this.collection.flashMessages.reset([{
                            type: 'error',
                            html: this.errorMessage
                        }]);
                    }

                },
                render: function() {
                    return this;
                },
                TEMPLATE_WITHOUT_CLOSE: TEMPLATE_WITHOUT_CLOSE
            },
            {
                BUTTON_AFFIRMATIVE_CONTINUE: BUTTON_AFFIRMATIVE_CONTINUE
            }
        );
    }
);


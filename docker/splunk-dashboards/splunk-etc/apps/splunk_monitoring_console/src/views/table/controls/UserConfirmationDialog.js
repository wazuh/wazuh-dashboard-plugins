define(
	[
		'jquery',
		'underscore',
		'module',
		'backbone',
		'@splunk/swc-mc'
	],
	function(
		$,
		_,
		module,
		Backbone,
		SwcMC
	) {

		return SwcMC.ModalView.extend({
			moduleId: module.id,
			initialize: function() {
				SwcMC.ModalView.prototype.initialize.apply(this, arguments);

				this.collection = this.collection || {};
				this.collection.flashMessages = new SwcMC.FlashMessagesCollection();

				this.children.flashMessage = new SwcMC.FlashMessagesLegacyView({ 
					collection: this.collection.flashMessages
				});

				this.collection.flashMessages.reset(_.map(this.options.messages, function(message) {
	            	return {
	            		type: 'warning',
	            		html: message
	            	};
	            }));
			},
			events: $.extend({}, SwcMC.ModalView.prototype.events, {
				'click .btn-primary': function(e) {
					e.preventDefault();
					this.hide();
					this.model.confirm.trigger('confirmed');
				}
			}),
	        render: function() {
	            var root = (SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH.indexOf("/") === 0 ?
					SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH.substring(1) :
					SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH
                );

	            this.$el.html(SwcMC.ModalView.TEMPLATE);
	            this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(_("Are you sure?").t());
	            this.$(SwcMC.ModalView.HEADER_SELECTOR).append("<div><p style='font-size: 10px;'><a style='font-weight:bold;' href='"+SwcMC.URIRoute.docHelp(root, SwcMC.SplunkConfig.LOCALE, "app.splunk_monitoring_console.warnings")+"' target='_blank'>"+_("Learn more").t()+"</a>"+_(" about warnings.").t()+"</p></div>");

	            this.$(SwcMC.ModalView.BODY_SELECTOR).prepend(this.children.flashMessage.render().el);
	            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_CANCEL);
	            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_SAVE);

	            this.$('.btn-primary').text(_("Save").t());
	            this.$('.btn.cancel').text(_("Continue editing").t());

	            this.$(SwcMC.ModalView.HEADER_SELECTOR).css({'padding':'15px 0 10px 20px'});
	            return this;
	        }
		});
	}
);
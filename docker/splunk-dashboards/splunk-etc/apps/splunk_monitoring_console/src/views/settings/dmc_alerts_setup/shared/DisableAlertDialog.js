/**
 * @author atruong
 * @date 4/25/15
 *
 * Confirmation dialog for disabling a preconfigured dmc alert
 */
 
define([
	'jquery',
	'underscore',
	'backbone',
	'module',
	'@splunk/swc-mc'
], function (
	$,
	_,
	Backbone,
	module,
	SwcMC
) {
	return SwcMC.ModalView.extend({
		moduleId: module.id,
		className: SwcMC.ModalView.CLASS_NAME,

		initialize: function (options) {
			SwcMC.ModalView.prototype.initialize.apply(this, arguments);
			this.children.flashMessagesView = new SwcMC.FlashMessagesView({ model: { alert: this.model.alert } });
			this.alertName = this.model.alert.entry.get('name');
		},

		events: $.extend({}, SwcMC.ModalView.prototype.events, {
			'click .modal-btn-disable': function(e) {
				e.preventDefault();
				this.model.alert.entry.content.set('disabled', true);
				this.model.alert.save().done(_(function () {
					this.updateDisableFailedMessage(false);
					this.hide();
				}).bind(this)).fail(_(function () {
					this.updateDisableFailedMessage(true);
				}).bind(this));
			}
		}),

		updateDisableFailedMessage: function(failed) {
	        if (failed) {
	            var errMessage = _('Failed to disable alert.').t();
	            this.children.flashMessagesView.flashMsgHelper.addGeneralMessage('disable_failed',
	                {
	                    type: SwcMC.SplunkdUtils.ERROR,
	                    html: errMessage
	                });
	        } else {
	            this.children.flashMessagesView.flashMsgHelper.removeGeneralMessage('disable_failed');
	        }
	    },

		render: function () {
			var BUTTON_DISABLE = '<a href="#" class="btn btn-primary modal-btn-disable modal-btn-primary">' + _('Disable').t() + '</a>';
			this.$el.html(SwcMC.ModalView.TEMPLATE);
			this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html( _('Disable Alert').t());
			this.$(SwcMC.ModalView.BODY_SELECTOR).show();
			this.$(SwcMC.ModalView.BODY_SELECTOR).append(SwcMC.ModalView.FORM_HORIZONTAL);
			this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).html(_(this.dialogFormBodyTemplate).template({alertName: this.alertName}));
			this.children.flashMessagesView.render().appendTo(this.$('.flash-messages-view-placeholder'));
			this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_CANCEL);
			this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(BUTTON_DISABLE);
			return this;
		},

		dialogFormBodyTemplate: '\
			<div class="flash-messages-view-placeholder"></div>\
			<p class="confirmation-text"><%= _("Are you sure you want to disable the following alert?").t() %></p>\
			<p class="alert-name-text"><i><%= alertName %></i></p>\
		'
	});
});
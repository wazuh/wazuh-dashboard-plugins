define(
	[
		'jquery',
		'underscore',
		'module',
		'backbone',
		'splunk_monitoring_console/models/Peer',
		'@splunk/swc-mc',
		'splunk_monitoring_console/views/table/controls/ConfirmationDialog',
		'splunk_monitoring_console/views/table/controls/FailureDialog'
	],
	function(
		$,
		_,
		module,
		Backbone,
		PeerModel,
		SwcMC,
		ConfirmationDialog,
		FailureDialog
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
					this.model.working.set(
						roleId,
						_.contains(
							this.model.peer.entry.content.get('active_server_roles'),
							roleId
						)
					);
					this.children[roleId + 'Field'] = new SwcMC.ControlGroupView({
						controlType: 'SyntheticCheckbox',
						controlOptions: {
							modelAttribute: roleId,
							model: this.model.working
						},
						label: this.model.peer.getServerRoleI18n(roleId)
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

					var error = this.model.peer.entry.content.validate({
						'active_server_roles': roles
					});

					if (error) {
						this.collection.flashMessages.reset([{
							type: 'error',
							html: error
						}]);
					} else {
						var oldRoles = this.model.peer.entry.content.get('active_server_roles');
						this.model.peer.entry.content.set('active_server_roles', roles);

						$(e.target).prop('disabled', true);
						this.model.peer.save().then(function() {
							this.model.state.set('changesMade', true);
							dialog.hide();
							var confirmationDialog = new ConfirmationDialog({
		            			message: _("Your server roles have updated successfully.").t()
		            		}).render();
		            		$('body').append(confirmationDialog.el);
		            		confirmationDialog.show();
						}.bind(dialog)).catch(function() {
							dialog.hide();
							this.model.peer.entry.content.set('active_server_roles', oldRoles);
                    		var failureDialog = new FailureDialog().render();
                    		$('body').append(failureDialog.el);
                       		failureDialog.show();
						}.bind(dialog));
					}
				}
			}),
	        render : function() {
	            this.$el.html(SwcMC.ModalView.TEMPLATE);
	            this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(_("Edit Server Roles").t());
	            this.$(SwcMC.ModalView.BODY_SELECTOR).prepend(this.children.flashMessage.render().el);
				this.$(SwcMC.ModalView.BODY_SELECTOR).append('<h4 class="instance-name">' + _.escape(this.model.peer.entry.content.get('peerName')) + '</h4>');
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

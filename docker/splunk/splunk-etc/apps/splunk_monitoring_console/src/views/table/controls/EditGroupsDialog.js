define(
	[
		'jquery',
		'underscore',
		'backbone',
		'module',
		'@splunk/swc-mc',
	    'splunk_monitoring_console/views/table/controls/MultiInputControl',
	    'splunk_monitoring_console/views/table/controls/ConfirmationDialog',
	    'splunk_monitoring_console/views/table/controls/FailureDialog'
	],
	function(
		$,
		_,
		Backbone,
		module,
		SwcMC,
		MultiInputControl,
		ConfirmationDialog,
		FailureDialog
	) {
		return SwcMC.ModalView.extend({
			moduleId: module.id,
			initialize: function() {
				SwcMC.ModalView.prototype.initialize.apply(this, arguments);

				this.model.working = new Backbone.Model({
					'tags': this.model.peer.entry.content.get('tags').join(',')
				});
				this.collection = this.collection || {};
				this.collection.flashMessages = new SwcMC.FlashMessagesCollection();

				this.groupTagsInputControl = new MultiInputControl({
					dataTestName: "dmc-editgroups-multiselect",
					allowNewValues: true,
					model: this.model.working,
					collection: this.collection.peers,
					modelAttribute: 'tags',
					attributeType: 'array',
					collectionMethod: 'getAllTags',
					placeholder: _('Choose groups').t()
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

	            	var tags = this.model.working.get('tags');
	            	tags = $.trim(tags) ? tags.split(',') : [];

	            	this.collection.flashMessages.reset();
	            	var error = this.model.peer.entry.content.validate({
	            		'tags': tags
	            	});

	            	if (error) {
	            		this.collection.flashMessages.reset([{
	            			type: 'error',
	            			html: error
	            		}]);
	            	} else {
	            		var oldTags = this.model.peer.entry.content.get('tags');
		            	this.model.peer.entry.content.set('tags', tags);

		            	$(e.target).prop('disabled', true);
		            	this.model.peer.save().then(function() {
                            /*
                            SPL-177576 Removing a new Custom Group
                            was giving error as the newly created group
                            models were not having fetched after saving
                            so they didn't have URL/ID where HTTP DELETE
                            could be called when trying to remove them.

                            Fetching all the models again after saving
                            will prevent this issue.
                            */
                            this.collection.peers.fetch();
		            		this.model.state.set('changesMade', true);

		            		this.hide();
		            		var confirmationDialog = new ConfirmationDialog({
		            			message: _("Your custom groups have updated successfully.").t()
		            		}).render();
		            		$('body').append(confirmationDialog.el);
		            		confirmationDialog.show();
		            	}.bind(this)).catch(function() {
		      				this.hide();

		            		this.model.peer.entry.content.set('tags',oldTags);
		            		var dialog = new FailureDialog().render();
		            		$('body').append(dialog.el);
                        	dialog.show();
		            	}.bind(this));
		            }
	            }
	        }),
			render: function() {
	            this.$el.html(SwcMC.ModalView.TEMPLATE);
	            this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(_("Edit Group Tags").t());
	            this.$(SwcMC.ModalView.BODY_SELECTOR).prepend(this.children.flashMessage.render().el);
	            this.$(SwcMC.ModalView.BODY_SELECTOR).append('<h4 class="instance-name">' + _.escape(this.model.peer.entry.content.get('peerName')) + '</h4>');
	            this.$(SwcMC.ModalView.BODY_SELECTOR).append(SwcMC.ModalView.FORM_HORIZONTAL);
	            this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).append(this.children.groupTags.render().el);
	            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_CANCEL);
	            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_SAVE);
	            return this;
	        }
		});
	}
);

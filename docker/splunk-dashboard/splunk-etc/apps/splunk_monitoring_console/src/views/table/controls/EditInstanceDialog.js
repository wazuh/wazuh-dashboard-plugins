define(
	[
		'jquery',
		'underscore',
		'backbone',
		'module',
		'@splunk/swc-mc',
		'splunk_monitoring_console/views/table/controls/ConfirmationDialog',
		'splunk_monitoring_console/views/table/controls/FailureDialog',
		'splunk_monitoring_console/views/table/controls/MultiInputControl'
	],
	function(
		$,
		_,
		Backbone,
		module,
		SwcMC,
		ConfirmationDialog,
		FailureDialog,
		MultiInputControl
	) {

		return SwcMC.ModalView.extend({
			moduleId: module.id,
			initialize: function() {
				SwcMC.ModalView.prototype.initialize.apply(this, arguments);

				this.model.working = new Backbone.Model({
					host: this.model.peer.entry.content.get('host') || '',
					hostFqdn: this.model.peer.entry.content.get('host_fqdn') || '',
					indexerClusters: (this.model.peer.entry.content.get('indexerClusters') || []).join(','),
					searchHeadClusters: (this.model.peer.entry.content.get('searchHeadClusters').slice() || []).join(',')
				});
				this.collection = this.collection || {};
				this.collection.flashMessages = new SwcMC.FlashMessagesCollection();

				this.children.hostField = new SwcMC.ControlGroupView({
					label: _("Instance (host)").t(),
					controlType: 'Text',
					controlOptions: {
						modelAttribute: 'host',
						model: this.model.working
					},
					tooltip: _('The "host" metadata field that an instance uses to tag the events it reads from data inputs. Set in inputs.conf / [default] / host.').t()
				});

				this.children.hostFqdnField = new SwcMC.ControlGroupView({
					label: _("Machine name").t(),
					controlType: 'Text',
					controlOptions: {
						modelAttribute: 'hostFqdn',
						model: this.model.working
					},
					tooltip: _('The host name of the machine on which this instance is running.').t()
				});

				this.indexerClustersControl = new MultiInputControl({
					model: this.model.working,
					collection: this.model.peer.entry.content.get('type') === 'localInstance' ? this.collection.peers : this.model.peer.collection,
					modelAttribute: 'indexerClusters',
					attributeType: 'array',
					collectionMethod: 'getAllIndexerClusters',
					placeholder: _('Choose indexer clusters').t()
				});
				this.children.indexerClustersField = new SwcMC.ControlGroupView({
					label: _('Indexer clusters').t(),
					controlClass: 'controls-block',
					controls: [this.indexerClustersControl.options.component]
				});

				this.searchHeadClustersControl = new MultiInputControl({
					model: this.model.working,
					collection: this.model.peer.entry.content.get('type') === 'localInstance' ? this.collection.peers : this.model.peer.collection,
					modelAttribute: 'searchHeadClusters',
					attributeType: 'array',
					collectionMethod: 'getAllSearchHeadClusters',
					placeholder: _('Choose search head clusters').t()
				});
				this.children.searchHeadClustersField = new SwcMC.ControlGroupView({
					label: _('Search head clusters').t(),
					controlClass: 'controls-block',
					controls: [this.searchHeadClustersControl.options.component]
				});

				this.children.flashMessage = new SwcMC.FlashMessagesLegacyView({
					collection: this.collection.flashMessages
				});

				this.children.helpLink = SwcMC.URIRoute.docHelp(
					this.model.application.get('root'),
					this.model.application.get('locale'),
					'learnmore.dmc.instancename'
				);
			},

			events: $.extend({}, SwcMC.ModalView.prototype.events, {
				'click .btn-primary': function(e) {
					e.preventDefault();
					var that = this,
						error = null;

					that.collection.flashMessages.reset();

					if (that.model.peer.canEditHosts()) {
						error = that.model.peer.entry.content.validate({
							host: that.model.working.get('host'),
							host_fqdn: that.model.working.get('hostFqdn')
						});
					}
					if (that.model.peer.canEditIndexerClusters()) {
						error = error || that.model.peer.entry.content.validate({
							indexerClusters: that.model.working.get('indexerClusters').split(',')
						});
					}
					if (that.model.peer.canEditSearchHeadClusters()) {
						error = error || that.model.peer.entry.content.validate({
							searchHeadClusters: that.model.working.get('searchHeadClusters').split(',')
						});	
					}

					if (error) {
						that.collection.flashMessages.reset([{
							type: 'error',
							html: error
						}]);
					} else {
						var oldHost = that.model.peer.entry.content.get('host'),
							oldHostFqdn = that.model.peer.entry.content.get('host_fqdn'),
							oldIndexerClusters = that.model.peer.entry.content.get('indexerClusters'),
							oldSearchHeadClusters = that.model.peer.entry.content.get('searchHeadClusters'),
							workingIndexerClusters = null,
							workingSearchHeadClusters = null,
							toSet = {};

						if (that.model.peer.canEditHosts()) {
							toSet = $.extend(toSet, {
								host: that.model.working.get('host'),
								host_fqdn: that.model.working.get('hostFqdn')
							});
						}
						if (that.model.peer.canEditIndexerClusters()) {
							workingIndexerClusters = this.model.working.get('indexerClusters');
							toSet = $.extend(toSet, {
								indexerClusters: workingIndexerClusters ? workingIndexerClusters.split(',') : []
							});
						}
						if (that.model.peer.canEditSearchHeadClusters()) {
							workingSearchHeadClusters = this.model.working.get('searchHeadClusters');
							toSet = $.extend(toSet, {
								searchHeadClusters: workingSearchHeadClusters ? workingSearchHeadClusters.split(',') : []
							});
						}


						that.model.peer.entry.content.set(toSet);
						$(e.target).prop('disabled', true);
						that.model.peer.save().then(function() {
							that.model.state.set('changesMade', true);
							if (that.model.peer.canEditHosts()) {
								that.model.peer.hasHostOverrides(true);
							}
							if (that.model.peer.canEditIndexerClusters()) {
								that.model.peer.hasIndexerClusterOverride(true);
							}
							if (that.model.peer.canEditSearchHeadClusters()) {
								that.model.peer.hasSearchHeadClusterOverride(true);
							}

							that.hide();
		            		var confirmationDialog = new ConfirmationDialog({
		            			message: _("Your instance name has updated successfully.").t()
		            		}).render();
		            		$('body').append(confirmationDialog.el);
		            		confirmationDialog.show();
						}.bind(that)).catch(function() {
							this.model.peer.entry.content.set('host', oldHost);
							this.model.peer.entry.content.set('host_fqdn', oldHostFqdn);
							this.model.peer.entry.content.set('indexerClusters', oldIndexerClusters);
							this.model.peer.entry.content.set('searchHeadClusters', oldSearchHeadClusters);
							that.hide();
	                    	var dialog = new FailureDialog().render();
	                    	$('body').append(dialog.el);
	                        dialog.show();
                   		}.bind(this));
					}


				}
			}),
			render: function() {
				var instanceName = '<h4 class="instance-name">' + _.escape(this.model.peer.entry.content.get('peerName')) + '</h4>';
				var helpLink = '<a href="' + this.children.helpLink + '" class="external help-link" target="_blank">' + _('Learn More').t() + '</a>';

				this.$el.html(SwcMC.ModalView.TEMPLATE);
	            this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(_("Edit Instance").t());
	            this.$(SwcMC.ModalView.BODY_SELECTOR).prepend(this.children.flashMessage.render().el);
				this.$(SwcMC.ModalView.BODY_SELECTOR).append(instanceName + helpLink);
	            this.$(SwcMC.ModalView.BODY_SELECTOR).append(SwcMC.ModalView.FORM_HORIZONTAL);
	            if (this.model.peer.canEditHosts()) {
	            	this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).append(this.children.hostField.render().el);
	            	this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).append(this.children.hostFqdnField.render().el);
	            }
	            if (this.model.peer.canEditIndexerClusters()) {
	            	this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).append(this.children.indexerClustersField.render().el);
	            }
	            if (this.model.peer.canEditSearchHeadClusters()) {
	            	this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).append(this.children.searchHeadClustersField.render().el);	
	            }
	            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_CANCEL);
	            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_SAVE);
	            return this;
			}
		});

	}
);
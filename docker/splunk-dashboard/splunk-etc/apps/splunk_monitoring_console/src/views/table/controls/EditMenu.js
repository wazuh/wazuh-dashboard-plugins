define(
	[
		'jquery',
		'underscore',
		'module',
		'@splunk/swc-mc',
		'splunk_monitoring_console/views/table/controls/EditServerRolesDialog',
		'splunk_monitoring_console/views/table/controls/EditGroupsDialog',
		'splunk_monitoring_console/views/table/controls/EditInstanceDialog',
	    'splunk_monitoring_console/views/table/controls/DisableConfirmationDialog',
        'splunk_monitoring_console/views/table/controls/ConfirmationDialog',
        'splunk_monitoring_console/views/table/controls/FailureDialog'
    ],
	function(
		$,
		_,
		module,
		SwcMC,
		EditServerRolesDialogView,
		EditGroupsDialogView,
		EditInstanceDialogView,
        DisableConfirmationDialogView,
        ConfirmationDialogView,
        FailureDialog
	) {

		return SwcMC.PopTartView.extend({
			moduleId: module.id,
			className: 'dropdown-menu',
			initialize: function(options) {
				options = _.defaults(options, { mode: 'menu' });
				SwcMC.PopTartView.prototype.initialize.call(this, options);

				this.model.appLocal.entry.content.on('change:configured', this._updateConfigured, this);
			},
			events: {
				'click a.edit-server-roles': function(e) {
					e.preventDefault();

					var dialog = new EditServerRolesDialogView({
                        model: {
                            peer: this.model.peer,
                            state: this.model.state
                        },
                        onHiddenRemove: true
                    });
                    $('body').append(dialog.render().el);
                    dialog.show();

				},
				'click a.edit-groups': function(e) {
					e.preventDefault();

					var dialog = new EditGroupsDialogView({
						model: {
							peer: this.model.peer,
							state: this.model.state
						},
						collection: {
							peers: this.collection.peers
						},
						onHiddenRemove: true
					});
					$('body').append(dialog.render().el);
					dialog.show();
				},
				'click a.edit-instance': function(e) {
					e.preventDefault();

					var dialog = new EditInstanceDialogView({
						model: {
							peer: this.model.peer,
							state: this.model.state,
							application: this.model.application
						},
						collection: {
							peers: this.collection.peers
						},
						onHiddenRemove: true
					});
					$('body').append(dialog.render().el);
					dialog.show();
				},
                'click a.disable-instance': function(e) {
                    e.preventDefault();

                    var dialog = new DisableConfirmationDialogView({
                        model: {
                            peer: this.model.peer,
                            state: this.model.state
                        },
						collection: {
							peers: this.collection.peers
						}
                    });
                    $('body').append(dialog.render().el);
                    dialog.show();
                },
                'click a.enable-instance': function(e) {
                    e.preventDefault();

                    // remove instance from blacklist
                    var settingsAsset = this.collection.peers.assets.find(function(asset) {
                        return asset.entry.get('name') === 'settings';
                    });
                    var blackList = settingsAsset.entry.content.get('blackList');
                    blackList = $.trim(blackList) ? blackList.split(',') : [];
                    blackList = blackList.filter(function(elem) { return elem != this.model.peer.entry.get('name'); }.bind(this));
                    settingsAsset.entry.content.set('blackList', blackList.join(','));

                    this.model.peer.entry.content.set('status-toggle', 'Enabled');

                    //reset internal server roles for instance
                    this.model.peer.resetInitialInternalServerRoles();
                    settingsAsset.save().then(function() {
                    	this.model.state.set('changesMade', true);

                        var dialog = new ConfirmationDialogView({
                            message: _("Instance has successfully been enabled.").t()
                        });
                        $('body').append(dialog.render().el);
                        dialog.show();
                    }.bind(this)).catch(function() {
                    	var dialog = new FailureDialog().render();
                        dialog.show();
                    }.bind(this));
                }
			},
			render: function() {
				this.el.innerHTML = SwcMC.PopTartView.prototype.template_menu;
				this.$el.append(this.compiledTemplate({
					_: _,
					disabled: this.model.peer.entry.content.get('status-toggle') === 'Disabled',
					edit: this.model.peer.canEditInstanceDetails(),
                    local: this.model.peer.entry.content.get('type') === 'localInstance',
                    // Set true if monitoring configured in distributed mode. false if standalone mode.
                    configured: this.model.appLocal.entry.content.get('configured')
				}));
				this._updateConfigured();
				return this;
			},
			_updateConfigured: function() {
				if (this.model.appLocal.entry.content.get('configured')) {
					this.$('.edit-groups-container').show();
				} else {
					this.$('.edit-groups-container').hide();
				}
			},
			template: '\
                <ul class="first-group">\
                    <% if (disabled) { %>\
                		<li><a href="#" class="enable-instance"><%- _("Enable Monitoring").t() %></a></li>\
                	<% } else { %>\
	                    <li><a href="#" class="edit-server-roles"><%- _("Edit Server Roles").t() %></a></li>\
                    	<li class="edit-groups-container"><a href="#" class="edit-groups"><%- _("Edit Custom Groups").t() %></a></li>\
	                    <% if (edit) { %>\
		                    <li><a href="#" class="edit-instance"><%- _("Edit Instance").t() %></a></li>\
                        <% } %>\
                        <% if (configured) { %>\
		                    <li><a href="#" class="disable-instance"><%- _("Disable Monitoring").t() %></a></li>\
	                    <% } %>\
                    <% } %>\
                </ul>\
            '
		});

	}
);

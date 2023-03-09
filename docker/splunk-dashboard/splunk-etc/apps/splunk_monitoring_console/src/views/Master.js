define(
	[
		'jquery',
		'underscore',
		'backbone',
		'module',
		'splunk_monitoring_console/views/Title',
		'splunk_monitoring_console/views/table/Master',
		'@splunk/swc-mc',
        'splunk_monitoring_console/views/table/controls/ConfigureAllConfirmationDialog',
        'splunk_monitoring_console/views/table/controls/FailureDialog',
        'splunk_monitoring_console/views/table/controls/SimpleDialog',
        'splunk_monitoring_console/views/table/controls/ErrorDialog',
        'splunk_monitoring_console/views/table/controls/UserConfirmationDialog',
        'splunk_monitoring_console/views/table/controls/ResetToFactoryModeConfirmationDialog',
        'splunk_monitoring_console/views/table/controls/DistributedModeWarningDialog',
        './Master.pcss'
	],
	function(
		$,
		_,
		Backbone,
		module,
		TitleView,
		TableView,
		SwcMC,
        ConfigureAllConfirmationDialog,
        FailureDialog,
        SimpleDialog,
        ErrorDialog,
        UserConfirmationDialog,
		ResetToFactoryModeConfirmationDialog,
		DistributedModeWarningDialog,
        css
	){
		var DMC_DUPLICATE_INSTANCE_NAME_ERROR = _("Duplicate instance name. Ensure each instance has a unique instance (host) name.").t();
		var DMC_DUPLICATE_SPLUNK_SERVER_NAME_ERROR = _("Duplicate splunk server name. Each instance needs a unique value of serverName in server.conf.").t();
		var DMC_EMPTY_INSTANCE_NAME_ERROR = _("Empty instance name. Click Edit and ensure each instance has a unique instance (host) name.").t();
		var DMC_EMPTY_MACHINE_NAME_ERROR = _("Empty machine name. Click Edit and ensure each instance has a machine name.").t();
		var DMC_OLD_VERSION_ERROR = _("This instance's Splunk version is too old. Ensure each instance is at least version 6.1.").t();
		var DMC_BOTH_SEARCH_HEAD_AND_INDEXER_WARNING_SPECIFIC = _("This instance is both a search head and an indexer. We strongly discourage this configuration.").t();
		var DMC_BOTH_SEARCH_HEAD_AND_INDEXER_WARNING_GENERIC = _("At least one of your instances is both a search head and an indexer. We strongly discourage this configuration.").t();
		var DMC_BOTH_INDEXER_WITH_KV_STORE_WARNING_SPECIFIC = _("This instance is an indexer with a KV store. We strongly discourage this configuration.").t();
		var DMC_BOTH_INDEXER_WITH_KV_STORE_WARNING_GENERIC = _("At least one of your instances is both an indexer with a KV store. We strongly discourage this configuration.").t();
		var DMC_BOTH_CLUSTER_MASTER_AND_INDEXER_WARNING_SPECIFIC = _("This instance is both a cluster manager and an indexer. We strongly discourage this configuration.").t();
		var DMC_BOTH_CLUSTER_MASTER_AND_INDEXER_WARNING_GENERIC = _("At least one of your instances is both a cluster manager and an indexer. We strongly discourage this configuration.").t();
		var DMC_INSTANCE_NOT_FORWARDING_LOGS_GENERIC = _("At least one of your instances is not forwarding its internal logs.").t();
		var DMC_INSTANCE_NOT_FORWARDING_LOGS_SPECIFIC = _("This instance is not forwarding its internal logs.").t();
		var DMC_INSTANCE_FORWARDING_STATE_UNKNOWN = _("The forwarding state of this instance cannot be determined.").t();
		var DMC_DEPLOYMENT_SERVER_PLUS_OTHER_ROLES_SPECIFIC = _("This instance is a deployment server plus other non-deployer roles. We recommend only deployer roles per deployment server.").t();
		var DMC_DEPLOYMENT_SERVER_PLUS_OTHER_ROLES_GENERIC = _("At least one of your instances is a deployment server plus other non-deployer roles. We recommend only deployer roles per deployment server.").t();
		var DMC_SHC_DEPLOYER_PLUS_OTHER_ROLES_SPECIFIC = _("This instance is a search head deployer plus other non-deployer roles. We recommend only deployer roles per search head deployer.").t();
		var DMC_SHC_DEPLOYER_PLUS_OTHER_ROLES_GENERIC = _("At least one of your instances is a search head deployer plus other non-deployer roles. We recommend only deployer roles per search head deployer.").t();
		var DMC_INDEXER_PLUS_OTHER_ROLES_SPECIFIC = _("This instance is an indexer plus other roles. We recommend only one role per indexer.").t();
		var DMC_INDEXER_PLUS_OTHER_ROLES_GENERIC = _("At least one of your instances is an indexer plus other roles. We recommend only one role per indexer.").t();
		var DMC_INDEXER_CLUSTER_IS_GUID_SPECIFIC = _("This instance appears to have no indexer cluster label set. We recommend you set the indexer cluster label on the cluster manager.").t();
		var DMC_INDEXER_CLUSTER_IS_GUID_GENERAL = _("At least one of your instances appears to have no indexer cluster label set. We recommend you set the indexer cluster label on the cluster manager.").t();
		var DMC_SEARCH_HEAD_CLUSTER_IS_GUID_SPECIFIC = _("This instance appears to have no search head cluster label set. We recommend you set the search head cluster on any search head cluster member.").t();
		var DMC_SEARCH_HEAD_CLUSTER_IS_GUID_GENERAL = _("At least one of your instances appears to have no search head cluster label set. We recommend you set the search head cluster on any search head cluster member.").t();
		var DMC_SHC_DEPLOYER_NO_CLUSTER_SPECIFIC = _("This instance is a search head deployer without a search head cluster label. We recommend you edit this instance to set its search head cluster label.").t();
		var DMC_SHC_DEPLOYER_NO_CLUSTER_GENERAL =_("At least one of your instances is a search head deployer without a search head cluster label. We recommend you edit these instances to set their search head cluster labels.").t();
		var DMC_GENERIC_ERROR_MESSAGE = _("You have some unresolved errors that need to be fixed before you can proceed.").t();
		var DMC_LOADING_MESSAGE = _("Please wait while we save your configuration.").t();
		var DMC_CONFIGURE_ALL_CONFIRMATION_MESSAGE = _("Your changes have been applied.").t() + '<p><strong>' + _("It may take a few minutes for your instances to be updated.").t() + '</strong></p>';
		var DMC_STANDALONE_MODE_LABEL = _("Standalone").t();
		var DMC_DISTRIBUTED_MODE_LABEL = _("Distributed").t();

        var DMC_STANDALONE_PATTERN = /^DMC Asset - Build Standalone Asset Table$/;
		var GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

		var generateNotRespondPeerErrorMessage = function() {
			var url = SwcMC.SplunkUtil.make_url("/manager/splunk_monitoring_console/search/distributed/peers");
			return _("Unable to connect to this instance. Go ").t() + "<a target='_blank' href='"+url+"''>here</a>" + _(" and ensure this instance has been configured properly.").t();
		};

        var getPeersErrorMessage = function(peersNotWritten) {
        	if (!peersNotWritten.length) {
        		return null;
        	}

        	var firstPart = _("Configuration for instance ").t();

        	if (peersNotWritten.length === 1) {
        		firstPart += '<b>' + peersNotWritten[0] + '</b>';
        	} else if (peersNotWritten.length === 2) {
        		firstPart += '<b>' + peersNotWritten[0] + '</b>' + _(" and ").t() + '<b>' + peersNotWritten[1] + '</b>';
        	} else { // 3 or more
        		var theRest = peersNotWritten.length - 2;
        		firstPart += '<b>' + peersNotWritten[0] + '</b>' + _(" and ").t() + '<b>' + peersNotWritten[1] + '</b>' + ", " + _("and ").t() + '<b>' + theRest + '</b>' + _(" more").t();
        	}
        	firstPart += _(" could not be written.").t();

        	var secondPart = _("Please make sure these instances are up. Check ").t() + '<a href="' +
				SwcMC.SplunkUtil.make_url('/manager/splunk_monitoring_console/search/distributed/peers') +
        		'">' + _("settings").t() + '</a> ' +
        		_("for more information.").t();

        	return firstPart + " " + secondPart;
        };

		return SwcMC.BaseView.extend({
			moduleId: module.id,
			_originallyConfigured: null,

			initialize: function() {
				SwcMC.BaseView.prototype.initialize.apply(this, arguments);

				this._originallyConfigured = this.model.appLocal.entry.content.get('configured');

				this.collection = this.collection || {};
                this.collection.flashMessages = new SwcMC.FlashMessagesCollection();

                this.children.flashMessages = new SwcMC.FlashMessagesLegacyView({
                    collection: this.collection.flashMessages,
                    escape: false
                });


				this.children.title = new TitleView();

				// Mode switcher is not displayed for cloud, Lite and Splunk Free instances
				if (this._isModeSwitchVisible()) {
					this.children.standaloneSwitch = new SwcMC.ControlGroupView({
						controlClass: 'standalone-switch',
						controlType: 'SyntheticRadio',
						controlOptions: {
							model: this.model.appLocal.entry.content,
							modelAttribute: 'configured',
							className: 'btn-group',
							items: [
								{ value: false, label: DMC_STANDALONE_MODE_LABEL },
								{ value: true, label: DMC_DISTRIBUTED_MODE_LABEL }
							]
						}
					});
				}
				else {
				    this.children.standaloneSwitch = new SwcMC.LabelControlView({
				        additionalClassNames: 'mode'
				    });
					var currentMode = _('Mode: ').t() + (this.model.appLocal.entry.content.get('configured') == '1' ? DMC_DISTRIBUTED_MODE_LABEL : DMC_STANDALONE_MODE_LABEL);
				    this.children.standaloneSwitch.setValue(currentMode);
				}

                /*
                if(this.model.appLocal.entry.content.get("configured")) {
	                this.collection.peers.on('sync', _.debounce(function() {
		                if(this._cannotConnectToServers()) {
		                	this.trigger("hasError");
		                }
	                }.bind(this)));
	            }
				*/

	            // this.once('hasError', function() {
	            // 	this._renderGenericErrorMessage();
	            // 	this.model.state.trigger("updateRows");
	            // }.bind(this));

				this.children.localInstanceTable = new TableView({
					model: {
						state: this.model.state,
						appLocal: this.model.appLocal,
						application: this.model.application,
						localInstance: this.model.localInstance
					},
					collection: { peers: this.collection.peers }
				});

				this.children.table = new TableView({
					model: {
						state: this.model.state,
						appLocal: this.model.appLocal,
						application: this.model.application
					},
					collection: { peers: this.collection.peers }
				});

				this.children.confirmResetDialog = new ResetToFactoryModeConfirmationDialog({
					model: this.model,
					collection: this.collection
				});

				this.model.appLocal.entry.content.on('change:configured', this._updateConfigured, this);
				this.model.state.on('change:changesMade', this._updateChangesMade, this);
			},

			events: $.extend({}, SwcMC.BaseView.prototype.events, {
                'click .btn.configure': function(e) {
                    e.preventDefault();
                    this.collection.flashMessages.reset();

                    var peersDfd = null;

                    if (this.model.appLocal.entry.content.get('configured')) {
                    	 // Validation
	                    // 1. If we have a duplicate instance name or machine name, warn and block the save.

	                    // clearing error/warning array for local instance
	                    this.model.localInstance.entry.content.set("errorMessages", []);
	                    this.model.localInstance.entry.content.set("warningMessages", []);

	                    // clearing error/warning array for each instance
	                    this.collection.peers.each(function(peer) {
	                    	peer.entry.content.set("errorMessages", []);
	                    	peer.entry.content.set("warningMessages", []);
	                    });
	                    var peersPlusLocal = _(this.collection.peers.toArray().concat([this.model.localInstance]));

	                    // flags that indicate whether there is an error or warning (to display messages)
		                var has_error = false;
		                var has_warning = false;

		                // find all instances thare currently cannot be connected to
	                    if(this._cannotConnectToServers()) {
		                	has_error = true;
		                }

		                // using an object as a map to find duplicates
	                    var duplicateInstanceMap = {};
	                    peersPlusLocal.each(function(peer) {
	                    	// if a peer is disabled, dont display an error message for it
	                    	if(peer.entry.content.get("status-toggle") !== "Enabled") { return; }

	                    	var host = peer.entry.content.get('host');
	                    	if(!$.trim(host)) { return; }
	                    	if(!duplicateInstanceMap[host]) {
	                    		duplicateInstanceMap[host] = peer;
	                    	} else {
	                    		var duplicatePeer = duplicateInstanceMap[host];
	                    		duplicatePeer.entry.content.get("errorMessages").push(DMC_DUPLICATE_INSTANCE_NAME_ERROR);
	                    		peer.entry.content.get("errorMessages").push(DMC_DUPLICATE_INSTANCE_NAME_ERROR);

	                    		has_error = true;
	                    	}
	                    }.bind(this));

		                // using an object as a map to find duplicates
	                    var duplicateSplunkServerMap = {};
	                    peersPlusLocal.each(function(peer) {
	                    	// if a peer is disabled, dont display an error message for it
	                    	if(peer.entry.content.get("status-toggle") !== "Enabled") { return; }

	                    	var splunk_server = peer.entry.content.get('peerName');
	                    	if(!$.trim(splunk_server)) { return; }
	                    	if(!duplicateSplunkServerMap[splunk_server]) {
	                    		duplicateSplunkServerMap[splunk_server] = peer;
	                    	} else {
	                    		var duplicatePeer = duplicateInstanceMap[splunk_server];
	                    		duplicatePeer.entry.content.get("errorMessages").push(DMC_DUPLICATE_SPLUNK_SERVER_NAME_ERROR);
	                    		peer.entry.content.get("errorMessages").push(DMC_DUPLICATE_SPLUNK_SERVER_NAME_ERROR);

	                    		has_error = true;
	                    	}
	                    }.bind(this));

	                    this.collection.peers.each(function(peer) {
	                    	var splunkVersion = peer.entry.content.get('version'),
	                    		versionSplit = splunkVersion ? splunkVersion.split('.') : [],
	                    		majorVersion = !!versionSplit.length && +versionSplit[0],
	                    		minorVersion = !!versionSplit.length && +versionSplit[1];

	                    	// if a peer is disabled, dont display an error message for it
	                    	if(peer.entry.content.get("status-toggle") !== "Enabled") { return; }

	                    	if(!$.trim(peer.entry.content.get('host'))) {
	                    		peer.entry.content.get("errorMessages").push(DMC_EMPTY_INSTANCE_NAME_ERROR);
	                    		has_error = true;
	                    	}
	                    	if(!$.trim(peer.entry.content.get('host_fqdn'))) {
	                    		peer.entry.content.get("errorMessages").push(DMC_EMPTY_MACHINE_NAME_ERROR);
	                    		has_error = true;
	                    	}

	                    	// Only allow instance versions >=6.1
	                    	if (_.isNaN(majorVersion) ||
	                    		_.isNaN(minorVersion) ||
	                    		(majorVersion === 6 && minorVersion < 1) ||
	                    		(majorVersion < 6)) {

	                    		peer.entry.content.get("errorMessages").push(DMC_OLD_VERSION_ERROR);
	                    		has_error = true;
	                    	}
	                    }.bind(this));

	                    // if(has_error) {
	                    // 	this._renderGenericErrorMessage();
	                    // }

	                    // More validations:
	                    // 1. Are there any SH + Indexers?
	                    var allInstances = this.collection.peers.toArray().concat([this.model.localInstance]);
	                    var verificationMessages = [];

	                    var shWithIndexers = _.filter(allInstances, function(instance) {
	                    	if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }

	                    	var roles = instance.entry.content.get('active_server_roles');
	                    	return _.contains(roles, 'search_head') && _.contains(roles, 'indexer');
	                    });
	                    if (shWithIndexers.length > 0) {
	                    	_.each(shWithIndexers, function(instance) {
	                    		if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    		instance.entry.content.get("warningMessages").push(DMC_BOTH_SEARCH_HEAD_AND_INDEXER_WARNING_SPECIFIC);
	                    	});
	                    	has_warning = true;
	                    	verificationMessages.push(DMC_BOTH_SEARCH_HEAD_AND_INDEXER_WARNING_GENERIC);
	                    }

	                    // Add more confirm validations here

	                    // disabling this warning for Dash. proper emission of kvstore is needed by the backend
	                    // var kvWithIndexers = _.filter(allInstances, function(instance) {
	                    // 	var roles = instance.entry.content.get('active_server_roles');
	                    // 	return _.contains(roles, 'kv_store') && _.contains(roles, 'indexer');
	                    // });
	                    // if (kvWithIndexers.length > 0) {
	                    // 	_.each(kvWithIndexers, function(instance) {
	                    // 		instance.entry.content.get("warningMessages").push(DMC_BOTH_INDEXER_WITH_KV_STORE_WARNING_SPECIFIC);
	                    // 	});
	                    // 	verificationMessages.push(DMC_BOTH_INDEXER_WITH_KV_STORE_WARNING_GENERIC);
	                    // }

	                    var clusterMasterWithIndexers = _.filter(allInstances, function(instance) {
	                    	if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }

	                    	var roles = instance.entry.content.get('active_server_roles');
	                    	return _.contains(roles, 'cluster_master') && _.contains(roles, 'indexer');
	                    });
	                    if (clusterMasterWithIndexers.length > 0) {
	                    	_.each(clusterMasterWithIndexers, function(instance) {
	                    		if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    		instance.entry.content.get("warningMessages").push(DMC_BOTH_CLUSTER_MASTER_AND_INDEXER_WARNING_SPECIFIC);
	                    	});
	                    	has_warning = true;
	                    	verificationMessages.push(DMC_BOTH_CLUSTER_MASTER_AND_INDEXER_WARNING_GENERIC);
	                    }

	                    var deploymentServerWithMore = _.filter(allInstances, function(instance) {
	                    	if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }

	                    	var roles = instance.entry.content.get('active_server_roles');
	                    	return _.contains(roles, 'deployment_server') &&
	                    		_.without(roles, 'deployment_server', 'shc_deployer').length > 0;
	                    });
	                    if (deploymentServerWithMore.length > 0) {
	                    	_.each(deploymentServerWithMore, function(instance) {
	                    		if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    		instance.entry.content.get("warningMessages").push(DMC_DEPLOYMENT_SERVER_PLUS_OTHER_ROLES_SPECIFIC);
	                    	});
	                    	has_warning = true;
	                    	verificationMessages.push(DMC_DEPLOYMENT_SERVER_PLUS_OTHER_ROLES_GENERIC);
	                    }
	                    var shcDeployerWithMore = _.filter(allInstances, function(instance) {
	                    	if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }

	                    	var roles = instance.entry.content.get('active_server_roles');
	                    	return _.contains(roles, 'shc_deployer') &&
	                    		_.without(roles, 'deployment_server', 'shc_deployer').length > 0;
	                    });
	                    if (shcDeployerWithMore.length > 0) {
	                    	_.each(deploymentServerWithMore, function(instance) {
	                    		if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    		instance.entry.content.get("warningMessages").push(DMC_SHC_DEPLOYER_PLUS_OTHER_ROLES_SPECIFIC);
	                    	});
	                    	has_warning = true;
	                    	verificationMessages.push(DMC_SHC_DEPLOYER_PLUS_OTHER_ROLES_GENERIC);
	                    }

	                    var indexerWithMore = _.filter(allInstances, function(instance) {
	                    	if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }

	                    	var roles = instance.entry.content.get('active_server_roles');
	                    	return _.contains(roles, 'indexer') && roles.length > 1;
	                    });
	                    if (indexerWithMore.length > 0) {
	                    	_.each(indexerWithMore, function(instance) {
	                    		if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    		instance.entry.content.get("warningMessages").push(DMC_INDEXER_PLUS_OTHER_ROLES_SPECIFIC);
	                    	});
	                    	has_warning = true;
	                    	verificationMessages.push(DMC_INDEXER_PLUS_OTHER_ROLES_GENERIC);
	                    }

	                    var indexersWithGuidIndexerClusterLabel = _.filter(allInstances, function(instance) {
	                    	if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    	return !!_.find(
	                    		instance.entry.content.get('indexerClusters'),
	                    		function(cluster) { return GUID_REGEX.test(cluster); }
	                    	);
	                    });
	                    if (indexersWithGuidIndexerClusterLabel.length > 0) {
	                    	_.each(indexersWithGuidIndexerClusterLabel, function(instance) {
	                    		if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    		instance.entry.content.get("warningMessages").push(DMC_INDEXER_CLUSTER_IS_GUID_SPECIFIC);
	                    	});
	                    	has_warning = true;
	                    	verificationMessages.push(DMC_INDEXER_CLUSTER_IS_GUID_GENERAL);
	                    }

	                    var searchHeadsWithGuidSearchHeadClusterLabels = _.filter(allInstances, function(instance) {
	                    	if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    	return !!_.find(
	                    		instance.entry.content.get('searchHeadClusters'),
	                    		function(cluster) { return GUID_REGEX.test(cluster); }
	                    	);
	                    });
	                    if (searchHeadsWithGuidSearchHeadClusterLabels.length > 0) {
	                    	_.each(searchHeadsWithGuidSearchHeadClusterLabels, function(instance) {
	                    		if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    		instance.entry.content.get("warningMessages").push(DMC_SEARCH_HEAD_CLUSTER_IS_GUID_SPECIFIC);
	                    	});
	                    	has_warning = true;
	                    	verificationMessages.push(DMC_SEARCH_HEAD_CLUSTER_IS_GUID_GENERAL);
	                    }

	                    var searchHeadDeployersWithoutClusterLabel = _.filter(allInstances, function(instance) {
	                    	if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    	var searchHeadClusters = instance.entry.content.get('searchHeadClusters'),
	                    		roles = instance.entry.content.get('active_server_roles');

	                    	return _.contains(roles, 'shc_deployer') && (
	                    		!_.isArray(searchHeadClusters) || searchHeadClusters.length === 0
	                    	);
	                    });
	                    if (searchHeadDeployersWithoutClusterLabel.length > 0) {
	                    	_.each(searchHeadDeployersWithoutClusterLabel, function(instance) {
	                    		if(instance.entry.content.get("status-toggle") !== "Enabled") { return; }
	                    		instance.entry.content.get("warningMessages").push(DMC_SHC_DEPLOYER_NO_CLUSTER_SPECIFIC);
	                    	});
	                    	has_warning = true;
	                    	verificationMessages.push(DMC_SHC_DEPLOYER_NO_CLUSTER_GENERAL);
	                    }

	                    var instancesWithUnknownForwardingState = [];
	                    var instancesNotForwardingLogs = [];
	                    _.each(allInstances, function(instance) {
	                    	// if instance is disabled or contains the indexer role -- return
	                    	if( instance.entry.content.get("status-toggle") !== "Enabled" || _.contains(instance.entry.content.get('active_server_roles'), 'indexer') ) { return; }

	                    	// if the field does not exist, instance fowarding state is unknown
	                    	if( _.isUndefined(instance.entry.content.get('isForwarding')) ) {
	                    		instancesWithUnknownForwardingState.push(instance);
	                    		return;
	                    	}

	                    	if( !instance.entry.content.get('isForwarding') ) {
	                    		instancesNotForwardingLogs.push(instance);
	                    		return;
	                    	}
	                    });

	                    if( instancesNotForwardingLogs.length ) {
	                    	_.each(instancesNotForwardingLogs, function(instance) {
	                    		instance.entry.content.get("warningMessages").push(DMC_INSTANCE_NOT_FORWARDING_LOGS_SPECIFIC);
	                   	 	});

		                    _.each(instancesWithUnknownForwardingState, function(instance) {
								instance.entry.content.get("warningMessages").push(DMC_INSTANCE_FORWARDING_STATE_UNKNOWN);
							});

	                    	has_warning = true;
	                    	verificationMessages.push(DMC_INSTANCE_NOT_FORWARDING_LOGS_GENERIC);
	                    }

	                    if(has_error || has_warning) { this.model.state.trigger("updateRows"); }

	                    if(has_error) {
	                    	var errorDialog = new ErrorDialog();
	                    	$('body').append(errorDialog.render().el);
	                    	errorDialog.show();
	                    	return;
	                    }

	                    // TODO bug: canceling causes some JS error (Mike Papales)

	                    if (has_warning) {
	                    	var userConfirmModel = new Backbone.Model();
	                    	var userConfirmationDialog = new UserConfirmationDialog({
                                messages: verificationMessages,
                                model: {
	                    			confirm: userConfirmModel
	                    		},
	                    		onHiddenRemove: true
	                    	});
	                    	$('body').append(userConfirmationDialog.render().el);
	                    	userConfirmationDialog.show();

	                    	userConfirmModel.on('confirmed', function() {
	                    		this._applyChanges(this.collection.peers.save());
	  	                    }, this);
	                    	return;
	                    }


                    	peersDfd = this.collection.peers.save();
                    } else {
                    	peersDfd = this.collection.peers.disable();
                    }

                  	this._applyChanges(peersDfd);
                },
				'click .btn-reset-to-factory': function(e) {
					e.preventDefault();
					this.children.confirmResetDialog.show();
				}
            }),

			_applyChanges: function(peersDfd) {
				var isConfigured = this.model.appLocal.entry.content.get('configured');

				// three nav xml files exist: one for default, distributed mode, and single instance mode
				var nav = new SwcMC.DataUINavModel();
				// grabbing default to write in later
				var nav_default = new SwcMC.DataUINavModel({
					id: "/servicesNS/nobody/splunk_monitoring_console/data/ui/nav/default"
				});
				var navDfd = $.Deferred();
				var navDefaultDfd = $.Deferred();
				var nav_html = "";
				var nav_mode = isConfigured ? "default.distributed" : "default.single";

				// grabbing the correct nav file based on the state we are trying to enter
				nav.fetch({url: SwcMC.SplunkdUtils.fullpath(nav.url + "/" + nav_mode, {
					app: "splunk_monitoring_console",
					owner: "nobody"
				})}).done(function() {
					nav_html = nav.entry.content.get("eai:data");
					navDfd.resolve();
				}.bind(this)).fail(function() {
					//console.log("Source nav fetch failed.");
				});

				navDfd.then(function() {
					nav_default.entry.content.set("eai:data", nav_html);
					nav_default.save().done(function() { navDefaultDfd.resolve(); });
				});

				var loading = new SimpleDialog({
                	title: _("Loading...").t(),
                	message: DMC_LOADING_MESSAGE
                }).render();

                /** SPL-96615: we don't need to run [DMC Asset - Build Standalone Asset Table] on start up anymore,
                 * because we will build dmc_assets right now.
                 */
                var dmcStandaloneSearch = this.collection.savedSearches.find(function(savedSearch) {
                    return DMC_STANDALONE_PATTERN.test(savedSearch.entry.get('name'));
                });
				dmcStandaloneSearch.entry.content.set('disabled', true);

				/*
				 * SPL-177995:
				 * Adding Health Config model to control whether we need to turn on the distributed_health_reporter feature
				 * It should map to whether MC is on distributed mode: (distributed_health_reporter = On) or standalone mode:
				 * (distributed_health_reporter = Off)
				 */
				this.model.appLocal.entry.content.get('configured') ?
					this.model.healthConfig.entry.content.set('disabled', false) :
					this.model.healthConfig.entry.content.set('disabled', true);

                var deferred = [peersDfd, this.model.appLocal.save(), this.model.healthConfig.save(), navDefaultDfd, dmcStandaloneSearch.save()];
				loading.show();
				Promise.all(deferred).then(function([response]) {
                	this.model.state.set('changesMade', false);
                	var peersErrorMessage = null;

					if (isConfigured) { // we are currently in distributed mode
                    	var hostIdx = response.fields.indexOf('host');
                    	var peerUriIdx = response.fields.indexOf('peerURI');
                    	var hostsWritten = _.uniq(
                    		_.pluck(
                    			_.filter(response.rows, function(row) {
                    				return row[peerUriIdx] !== 'localhost';
                    			}),
                    		hostIdx
                    	));
	                    var shouldHaveWritten = _.uniq(this.collection.peers.filter(function(peer) {
	                    	return peer.entry.content.get('active_server_roles').length > 0;
	                    }).map(function(peer) {
	                    	return peer.entry.content.get('host');
	                    }));

	                    var peersNotWritten = _.difference(shouldHaveWritten, hostsWritten);
	                    peersErrorMessage = getPeersErrorMessage(peersNotWritten);
	                }

                	loading.hide();
                    var dialog = new ConfigureAllConfirmationDialog({
                    	application: this.model.application,
                    	errorMessage: peersErrorMessage,
                        message: DMC_CONFIGURE_ALL_CONFIRMATION_MESSAGE
                    }).render();
                    dialog.show();
                }.bind(this)).catch(function() {
                	loading.hide();
					var dialog;
					if(this.collection.peers.assets.models.length > 0 && this.collection.peers.assets.models[0].error.get('messages').length > 0 && this.collection.peers.assets.models[0].error.get('messages')[0].message) {
						dialog = new FailureDialog({message: _(this.collection.peers.assets.models[0].error.get('messages')[0].message).t()}).render();
					} else {
						dialog = new FailureDialog().render();
					}
                    dialog.show();
				}.bind(this));

			},

			/* simple check that also flags the instances that current cannot be reached */
			_cannotConnectToServers: function() {
				return _.reduce(this.collection.peers.models, function(memo, peer) {
					if(peer.entry.content.get('status') !== "Up" && peer.entry.content.get("status-toggle") === "Enabled") {
						/* pushes the corresponding error message into the instance's list of errors */
						peer.entry.content.get("errorMessages").push(generateNotRespondPeerErrorMessage());
            			return memo || true;
            		} else {
            			return memo;
            		}
            	}, false);
			},

			_renderGenericErrorMessage: function() {
                this.collection.flashMessages.reset([{
                	type: 'error',
                	html: DMC_GENERIC_ERROR_MESSAGE
                }]);
			},

			_updateConfigured: function() {

				var isConfigured = this.model.appLocal.entry.content.get('configured');
				this.model.state.set(
					'changesMade',
					isConfigured !== this._originallyConfigured
				);
				if (isConfigured) { // Moving to distributed mode
					//show the warning dialog only if the user was not originally
					//in the distributed mode.
					if(this._originallyConfigured === isConfigured) {
						this.$('.table-wrapper').css('visibility','visible');
					} else  {
						this._showDistributedModeWarningDialog();
					}

				} else { // Moving to standalone mode
					this.$('.table-wrapper').css('visibility','hidden');
				}
			},

			_showDistributedModeWarningDialog : function() {

				var dialog = new DistributedModeWarningDialog({
					model: {
						application: this.model.application
					}
				});
				dialog.render().show();
				dialog.on('proceed', function(proceed) {
					if (proceed) {
						this.$('.table-wrapper').css('visibility','visible');
					} else {
						this.model.appLocal.entry.content.set('configured', false);
					}
				}, this);
			},

			_updateChangesMade: function() {
				var $btnEl = this.$('.section-header .btn.configure');
				$btnEl.removeClass('btn-primary');
				$btnEl.removeClass('btn-secondary');

				$btnEl.addClass(
					this.model.state.get('changesMade') ?
					'btn-primary' :
					'btn-secondary'
				);
			},

			_isModeSwitchVisible: function() {
				return !(this.model.serverInfoModel.isCloud() || this.model.serverInfoModel.isLite() || this.model.serverInfoModel.isFreeLicense());
			},

			render: function() {
				var that = this;

				that.$el.html(that.template);
				that.children.title.render().appendTo(that.$('.section-header'));
				that.children.flashMessages.render().appendTo(that.$('.section-header'));
				if(this._isModeSwitchVisible()) that.$('.section-header').append(this.labelTemplate);
				that.children.standaloneSwitch.render().appendTo(that.$('.section-header'));
				that.$('.section-header').append(this.buttonTemplate);
				$('<h3 class="smc-subtitle">' + _('This instance').t() + '</h3>').appendTo(that.$('.single-instance-wrapper'));
				that.children.localInstanceTable.render().appendTo(that.$('.single-instance-wrapper'));
				$('<h3 class="smc-subtitle">' + _('Remote instances').t() + '</h3>').appendTo(that.$('.table-wrapper'));
				that.children.table.render().appendTo(that.$('.table-wrapper'));
				this.$el.append(this.children.confirmResetDialog.render().$el);

				if (!this.model.appLocal.entry.content.get('configured')) {
					that.$('.table-wrapper').css('visibility','hidden');
				}

				that._updateChangesMade();

				return that;
			},

			template: '<div class="section-padded section-header"></div><div class="single-instance-wrapper main-section"><div class="divider"></div></div><div class="table-wrapper"></div>',
			buttonTemplate: '<div class="apply-changes" ><button class="btn btn-primary configure btn-apply-changes">' + _("Apply Changes").t() + '</button><button class="btn btn-reset-to-factory">' + _("Reset All Settings").t() + '</button></div>',
			labelTemplate: '<div class="mode-label">Mode</div>'
		});
	}
);

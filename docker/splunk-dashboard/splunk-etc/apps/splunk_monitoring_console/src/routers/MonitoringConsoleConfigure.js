define(
	[
		'underscore',
		'jquery',
		'backbone',
		'splunk_monitoring_console/collections/Peers',
		'splunk_monitoring_console/collections/services/data/LookupTableFiles',
		'@splunk/swc-mc',
		'splunk_monitoring_console/collections/ThresholdConfigs',
		'splunk_monitoring_console/models/LocalInstance',
		'splunk_monitoring_console/views/Master'
	],
	function(
		_,
		$,
		Backbone,
		PeersCollection,
		LookupTableFilesCollection,
		SwcMC,
		ThresholdConfigsCollection,
		LocalInstanceModel,
		ManagementConsoleConfigureView
	) {
		return SwcMC.BaseListingsRouter.extend({
			initialize: function() {
				SwcMC.BaseListingsRouter.prototype.initialize.apply(this, arguments);
				this.setPageTitle(_('Setup').t());
				this.loadingMessage = _('Loading...').t();

				this.stateModel.set({
					sortKey: 'peerName',
					sortDirection: 'asc',
					count: 25,
					offset: 0,
					search: '',
					changesMade: false
				});
				this.collection.peers = new PeersCollection();
				this.collection.lookups = new LookupTableFilesCollection();
				this.collection.savedSearches = new SwcMC.SavedSearchesCollection();
				this.collection.thresholdConfigs = new ThresholdConfigsCollection();
				this.model.localInstance = new LocalInstanceModel({}, {
					distsearchGroups: this.collection.peers.distsearches
				});

				// TODO I don't know why I have to do this
				this.deferreds.appLocals.then(function() {
					this.model.appLocal = this.collection.appLocals.find(function(appLocal) {
						return appLocal.entry.get('name') === this.model.application.get('app');
					}, this);

					// we have to bind event listener here because this.model.appLocal is re-assigned here.
					this.listenTo(this.model.appLocal.entry.content, 'change:configured', this._updateLocalInstanceStatus);
				}.bind(this));

				$(window).on('beforeunload', function() {
					if (this.stateModel.get('changesMade')) {
						return _("Please apply your changes!").t();
					}
				}.bind(this));

				this.listenTo(this.collection.peers.distsearches, 'sync', this._updateLocalInstanceStatus);
			},

			initializeAndRenderViews: function() {
				var serverInfoModel = new SwcMC.ServerInfoModel();
				var serverInfoDfs = serverInfoModel.fetch();
				/* 
				 * SPL-177995:
				 * Adding Health Config model to control whether we need to turn on the distributed_health_reporter feature
				 * It should map to whether MC is on distributed mode: (distributed_health_reporter = On) or standalone mode:
				 * (distributed_health_reporter = Off)
				 */
				var healthConfigModel = new SwcMC.HealthConfigModel({ id: 'distributed_health_reporter' });
				var healthConfigDfs = healthConfigModel.fetch();

				Promise.all([serverInfoDfs, healthConfigDfs]).then(function() {
					this.managementConsoleConfigureView = new ManagementConsoleConfigureView({
						model: {
							state: this.stateModel,
							appLocal: this.model.appLocal,
							application: this.model.application,
							localInstance: this.model.localInstance,
							serverInfoModel: serverInfoModel,
							healthConfig: healthConfigModel
						},
						collection: {
							peers: this.collection.peers,
							lookups: this.collection.lookups,
							savedSearches: this.collection.savedSearches,
							thresholdConfigs: this.collection.thresholdConfigs
						}
					});
					this.pageView.$('.main-section-body').html(this.managementConsoleConfigureView.render().el);
				}.bind(this));
			},

			fetchListCollection: function() {
				// Grab everything for the client side
				var data = {
					sort_dir: 'asc',
					sort_key: 'peerName',
					count: 0,
					offset: 0,
					search: 'disabled=0'
				};

				var peersDfd = $.Deferred();
				this.collection.peers.fetch({ data: data }).done(function() {
					this.stateModel.set(
						'changesMade', 
						this.collection.peers.contains(function(peer) { return !peer.isConfigured(); }) ||
						this.stateModel.get('changesMade')
					);
					this.model.localInstance.fetch().done(function() {
						peersDfd.resolve();
					}.bind(this)).fail(function() {
						peersDfd.reject();
					});
				}.bind(this));

				var lookupsDfd = $.Deferred();
				// we have to craft the "search" string because /servicesNS/-/splunk_monitoring_console/data/lookup-table-files will always return global objects, so that we need to use "searc" to manually filter out the global objects.
				this.collection.lookups.fetch({
					data: {
						app: 'splunk_monitoring_console',
						owner: '-',
						search: 'eai:acl.app=splunk_monitoring_console'
					}
				}).done(function() {
					lookupsDfd.resolve();
				}).fail(function() {
					lookupsDfd.reject();
				});

				var savedSearchesDfd = $.Deferred();
				// get all DMC related saved searches
				this.collection.savedSearches.fetch({
					data: {
						app: 'splunk_monitoring_console',
						owner: '-',
						search: 'name="DMC*"'
					}
				}).done(function() {
					savedSearchesDfd.resolve();
				}).fail(function() {
					savedSearchesDfd.reject();
				});

				var thresholdConfigsDfd = $.Deferred();
				this.collection.thresholdConfigs.fetch().done(function() {
					thresholdConfigsDfd.resolve();
				}).fail(function() {
					thresholdConfigsDfd.reject();
				});

				return Promise.all([peersDfd, lookupsDfd, savedSearchesDfd, thresholdConfigsDfd]);
			},
			_updateLocalInstanceStatus: function() {
				var isEnabled;
				if (this.model.appLocal.entry.content.get('configured') == false || this.model.appLocal.entry.content.get('configured') == '0') {
					// in standalone mode, localhost is always enabled
					isEnabled = true;
				} else {
					// in distributed mode, localhost is enabled only if it is in any of the distributed search group
					isEnabled = this.collection.peers.distsearches.some(function(searchGroup) {
						return _.contains(searchGroup.entry.content.get('member'), 'localhost:localhost');
					});
				}
				this.model.localInstance.entry.content.set('status-toggle', isEnabled ? 'Enabled' : 'Disabled');
			}
		});
	}

);
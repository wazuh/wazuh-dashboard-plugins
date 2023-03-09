// Note: Ideally this file would exist in js/views/models/services/distributed/peers
// But I will leave it here until that endpoint is mature enough to support all necessary features

define(
	[
		'jquery',
		'underscore',
		'backbone',
		'@splunk/swc-mc',
		'splunk_monitoring_console/models/Asset',
		'splunk_monitoring_console/models/DistsearchGroup',
		'splunk_monitoring_console/mixins/DistributedSearchGroup'
	],
	function(
		$$$, // Mo' money mo' problems
		_, 
		Backbone,
		SwcMC,
		AssetModel,
		DistsearchGroupModel,
		DistributedSearchGroupMixin
	) {

		var PeerModel = SwcMC.SplunkDBaseModel.extend(
			{
				url: 'search/distributed/peers',
				// If host or host_fqdn are overridden
				_hasHostOverrides: false,
				// If clusters are overridden
				_indexerClusterOverrides: false,
				_searchHeadClusterOverrides: false,

				initialize: function() {
					SwcMC.SplunkDBaseModel.prototype.initialize.apply(this, arguments);

					// check instance against configured list to determine whether instance is 'configured'
                    this.entry.content.set('configured', (function() {
                        var settingsAsset = this.collection.assets.find(function(asset) {
                            return asset.entry.get('name') === 'settings';
                        });
                        var configuredPeers = settingsAsset.entry.content.get('configuredPeers');
                        configuredPeers = $$$.trim(configuredPeers) ? configuredPeers.split(',') : [];
                        return _.contains(configuredPeers, this.entry.get('name')); 
                    }.bind(this))());

                    // check instance against blacklist to determine whether instance is 'blacklisted'
                    this.entry.content.set('blackListed', (function() {
                        var settingsAsset = this.collection.assets.find(function(asset) {
                            return asset.entry.get('name') === 'settings';
                        });
                        var blackList = settingsAsset.entry.content.get('blackList');
                        blackList = $$$.trim(blackList) ? blackList.split(',') : [];
                        return _.contains(blackList, this.entry.get('name'));
                    }.bind(this))());
				
                    if(!this.entry.content.get('configured')) {
                    	this.entry.content.set('state', 'New');
                    } else {
                    	this.entry.content.set('state', 'Configured');
                    }

                    if(!this.entry.content.get('blackListed')) {
                    	this.entry.content.set('status-toggle', 'Enabled');
                    } else {
                    	this.entry.content.set('status-toggle', 'Disabled');
                    }

                    // if instance is not configured, then it must be 'New' and is 'Enabled' by default
                    // if(!this.entry.content.get('configured')) {
                    //     this.entry.content.set('state', 'New');
                    //     this.entry.content.set('status-toggle', 'Enabled');
                    //     this.resetInitialInternalServerRoles();
                    // } else {
                    // 	// else instance has been configured
                    //     this.entry.content.set('state', 'Configured');

                    //     // in instance is 'blackListed' then it should be 'Disabled'
                    //     if(this.entry.content.get('blackListed')) {
                    //         this.entry.content.set('status-toggle', 'Disabled');

                    //     // else it should be 'Enabled'
                    //     } else {
                    //         this.entry.content.set('status-toggle', 'Enabled');
                    //     }
                    // }

                    var asset = this._getAsset();
					if (asset) {
						_.each(['host', 'host_fqdn'], function(attr) {
							if (asset.entry.content.get(attr)) {
								this.entry.content.set(attr, asset.entry.content.get(attr));
								this._hasHostOverrides = true;
							}
						}, this);
						_.each(['indexerClusters', 'searchHeadClusters'], function(attr) {
							var arrAttr = attr + '[]',
								attrValue;
							if (asset.entry.content.has(arrAttr)) {
								attrValue = asset.entry.content.get(arrAttr);
								this.entry.content.set(attr, attrValue.length > 0 ? attrValue.split(',') : []);
								
								if (attr === 'indexerClusters') {
									this._indexerClusterOverrides = true;
								} else if (attr === 'searchHeadClusters') {
									this._searchHeadClusterOverrides = true;
								}
							}
						}, this);
					}

                    // needs to check whether instance is 'Disabled' before initializing
                    DistributedSearchGroupMixin.initializeDistributedSearchGroups.call(
                        this,
                        this.collection.distsearches,
                        function() {
                            return this.entry.get('name');
                        }.bind(this)
                    );

					this.entry.content.on('change:host', this._updateHost, this);
					this.entry.content.on('change:host_fqdn', this._updateHostFqdn, this);
					this.entry.content.on('change:indexerClusters', this._updateIndexerClusters, this);
					this.entry.content.on('change:searchHeadClusters', this._updateSearchHeadClusters, this);

					this.entry.content.set("errorMessages", []);
					this.entry.content.set("warningMessages", []);
                },
				save: function() {
					var deferred = [];
					var asset = this._getAsset();
					if (asset) {
						deferred.push(asset.save());
					}
					// TODO this really needs to be transactional.
					// How do I deal with this?
					var toDestroy = [];
					_.each(this.collection.distsearches.models, function(model) {
						if ((model.isCustomGroup() ||
								model.isIndexerClusterGroup() ||
								model.isSearchHeadClusterGroup())
							&& model.getServers().length === 0) {

							toDestroy.push(model);
						} else {
							deferred.push(model.save());
						}
					});

					_.each(toDestroy, function(model) {
						deferred.push(model.destroy());
					});

					return Promise.all(deferred);
				},

                hasHostOverrides: function(value) {
                	if (!_.isUndefined(value)) {
                		this._hasHostOverrides = !!value;
                	}
					return this._hasHostOverrides;
				},

				hasIndexerClusterOverride: function(value) {
					if (!_.isUndefined(value)) {
						this._indexerClusterOverrides = !!value;
					}
					return this._indexerClusterOverrides;
				},

				hasSearchHeadClusterOverride: function(value) {
					if (!_.isUndefined(value)) {
						this._searchHeadClusterOverrides = !!value;
					}
					return this._searchHeadClusterOverrides;
				},

				isConfigured: function() {
					var settingsAsset = this.collection.assets.find(function(asset) { return asset.entry.get('name') === 'settings'; });

					if (!settingsAsset) {
						return false;
					}

					var configuredPeers = settingsAsset.entry.content.get('configuredPeers');
					configuredPeers = $$$.trim(configuredPeers) ? configuredPeers.split(',') : [];

					return _.contains(configuredPeers, this.entry.get('name'));
				},

				// called when instance is disabled. strips the instance of all its configured and custom groups
                removeAllServerRoles: function() {
                    this.entry.content.set('active_server_roles', []);
                    this.entry.content.set('tags', []);
                    this.entry.content.set('indexerClusters', []);
                    this.entry.content.set('searchHeadClusters', []);
                },

                canEditHosts: function() {
                	return this.hasHostOverrides() || 
                		!this.entry.content.get("host") || 
                		!this.entry.content.get("host_fqdn");
                },

                canEditIndexerClusters: function() {
                	return this._isPreEmberInstance();
                },

                canEditSearchHeadClusters: function() {
                	return this._isPreEmberInstance() ||
                		_.contains(this.entry.content.get('active_server_roles'), 'shc_deployer');
                },

				_updateHost: function() {
					var asset = this._getAsset(true);
					asset.entry.content.set('host', this.entry.content.get('host'));
				},

				_updateHostFqdn: function() {
					var asset = this._getAsset(true);
					asset.entry.content.set('host_fqdn', this.entry.content.get('host_fqdn'));
				},

				_updateIndexerClusters: function() {
					var asset = this._getAsset(true),
						clusters = this.entry.content.get('indexerClusters');

					if (clusters.length < 1) {
						asset.entry.content.set('indexerClusters', ['']);
					} else {
						asset.entry.content.set('indexerClusters', clusters);
					}
				},

				_updateSearchHeadClusters: function() {
					var asset = this._getAsset(true),
						clusters = this.entry.content.get('searchHeadClusters');

					if (clusters.length < 1) {
						asset.entry.content.set('searchHeadClusters', ['']);
					} else {
						asset.entry.content.set('searchHeadClusters', clusters);
					}
				},

				_getAsset: function(create) {
					create = _.isUndefined(create) ? false : true;

					var asset = this.collection.assets.find(function(asset) {
						return asset.entry.get('name') === this.entry.get('name');
					}, this);

					if (!asset && create) {
						asset = new AssetModel();
						asset.entry.set('name', this.entry.get('name'));
						this.collection.assets.add(asset);
					}

					return asset;
				},

				_isPreEmberInstance: function() {
					var version = this.entry.content.get('version');
					return version.indexOf('6.1') === 0 || version.indexOf('6.2') === 0;
				}
			},

			DistributedSearchGroupMixin.staticMembers
		);
		_.extend(PeerModel.prototype, DistributedSearchGroupMixin);

		return PeerModel;
	}
);

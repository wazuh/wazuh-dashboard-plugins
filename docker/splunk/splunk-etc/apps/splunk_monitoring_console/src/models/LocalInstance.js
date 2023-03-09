define(
	[
		'underscore',
		'backbone',
		'@splunk/swc-mc',
		'splunk_monitoring_console/mixins/DistributedSearchGroup'
	],
	function(
		_,
		Backbone,
		SwcMC,
		DistributedSearchGroupMixin
	) {

		var STANDALONE_ROLES = ['indexer', 'search_head', 'license_master'];
		var LOCALHOST_IDENTIFIER = 'localhost:localhost';

		var LocalInstanceModel = SwcMC.ServerInfoModel.extend(
			{

				_distsearchGroups: null,

				initialize: function(attributes, options) {
					SwcMC.ServerInfoModel.prototype.initialize.call(this, attributes, options);

					this._distsearchGroups = options.distsearchGroups;

					if (!this._distsearchGroups) {
						throw Error("LocalInstanceModel requires a distsearchGroups argument");
					}

					this.on('sync', function() {
						this.entry.set('name', '');
						this.populateSearchHeadClustersFromGroups();

						DistributedSearchGroupMixin.initializeDistributedSearchGroups.call(
							this,
							this._distsearchGroups,
							function() {
								return LOCALHOST_IDENTIFIER;
							}
						);
					}, this);

                    // set flags by default
                    this.entry.content.set('type', 'localInstance');
                    this.entry.content.set('state', 'Configured');
                    this.entry.content.set('status-toggle', 'Enabled');

                    this.entry.content.set("errorMessages", []);
					this.entry.content.set("warningMessages", []);
				},

				save: function() {
					return Promise.all(_.map(
						this._distsearchGroups.models,
						function(model) { return model.save(); }
					));
				},

				hasHostOverrides: function(value) {
                	return false;
				},

				hasIndexerClusterOverride: function() {
					return false;
				},

				hasSearchHeadClusterOverride: function() {
					return false;
				},

	            canEditHosts: function() {
	            	return false;
	            },

	            canEditIndexerClusters: function() {
	            	return false;
	            },

	            canEditSearchHeadClusters: function() {
					return _.contains(this.entry.content.get('active_server_roles'), 'shc_deployer') ? true : false;
	            },

				isConfigured: function() {
					return true;
				},

				removeAllServerRoles: function() {
					this.entry.content.set('active_server_roles', []);
					this.entry.content.set('tags', []);
					this.entry.content.set('indexerClusters', []);
					this.entry.content.set('searchHeadClusters', []);
				},

				populateSearchHeadClustersFromGroups: function() {
					this.entry.content.set(
						'searchHeadClusters',
						_.map(
							this._distsearchGroups.filter(
								function(group) {
									return group.isSearchHeadClusterGroup() &&
										_.contains(
											group.getServers(),
											LOCALHOST_IDENTIFIER
										);
								},
								this
							),
							function(group) {
								return group.getDisplayName();
							},
							this
						)
					);
				},

				requiredRoles: STANDALONE_ROLES

			},
			DistributedSearchGroupMixin.staticMembers
		);

		_.extend(LocalInstanceModel.prototype, DistributedSearchGroupMixin);

		return LocalInstanceModel;
	}
);

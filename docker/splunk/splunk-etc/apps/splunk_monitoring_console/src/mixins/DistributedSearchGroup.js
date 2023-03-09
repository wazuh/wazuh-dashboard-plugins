define(
	[
		'underscore',
		'splunk_monitoring_console/models/DistsearchGroup'
	],
	function(
		_,
		DistsearchGroupModel
	) {
		var VALID_PRIMARY_ROLES = [
			'search_head',
			'cluster_master',
			'license_master',
			'indexer',
			'deployment_server',
			'kv_store',
			'shc_deployer'
		];

		var getAllPrimaryRoles = function() {
			return VALID_PRIMARY_ROLES.slice();
		};

		var serverRolesI18n = {
			'Search Head': _('Search Head').t(),
			'Cluster Master': _('Cluster Manager').t(),
			'Cluster Manager': _('Cluster Manager').t(),
			'License Manager': _('License Manager').t(),
			'License Master': _('License Manager').t(),
			'Indexer': _('Indexer').t(),
			'Deployment Server': _('Deployment Server').t(),
			'KV Store': _('KV Store').t(),
      'SHC Deployer': _('SHC Deployer').t()
		};

		return {
			distributedSearchGroupsCollection: null,
			getServerName: null,

			VALID_PRIMARY_ROLES: VALID_PRIMARY_ROLES,

			containsRole: function(partialRole) {
				// joins two group of roles into single array
				var serverRolesArr = this.getActiveServerRolesToString();
				var customRolesArr = this.entry.content.get('tags');
				var allRolesArr = _.union([], serverRolesArr, customRolesArr);

				// if the filter input matches even a single roles, return true
				return _.reduce(allRolesArr, function(memo, role) {
					return memo || role.toLowerCase().indexOf(partialRole.toLowerCase()) !== -1;
				}, false);
			},

			getServerRoleI18n: function(roleId) {
				return serverRolesI18n[this.getServerRoleToString(roleId)];
			},

			getServerRoleToString : function(roleId) {
				if (roleId === 'kv_store') {
					return 'KV Store';
				}
				if (roleId === 'shc_deployer') {
					return 'SHC Deployer';
				}
				return roleId.replace(/_/g, ' ').replace(
					/\b([a-z])/g,
					function(letter) {
						return letter.toUpperCase();
					}
				);
			},

			getRoleGroupName: function(roleId) {
				return DistsearchGroupModel.GROUP_NAME_PREFIX + roleId;
			},
			getRoleFromGroupName: function(groupName) {
				return groupName.substr(DistsearchGroupModel.GROUP_NAME_PREFIX.length);
			},
			getCustomGroupNameFromGroupName: function(groupName) {
				return groupName.substr( DistsearchGroupModel.CUSTOM_GROUP_NAME_PREFIX.length);
			},
			getCustomGroupName: function(tagName) {
				return  DistsearchGroupModel.CUSTOM_GROUP_NAME_PREFIX + tagName;
			},
			getIndexerClusterGroupNameFromGroupName: function(groupName) {
				return groupName.substr(DistsearchGroupModel.INDEXER_CLUSTER_GROUP_NAME_PREFIX.length);
			},
			getIndexerClusterGroupName: function(name) {
				return DistsearchGroupModel.INDEXER_CLUSTER_GROUP_NAME_PREFIX + name;
			},
			getSearchHeadClusterGroupNameFromGroupName: function(groupName) {
				return groupName.substr(DistsearchGroupModel.SEARCH_HEAD_CLUSTER_GROUP_NAME_PREFIX.length);
			},
			getSearchHeadClusterGroupName: function(name) {
				return DistsearchGroupModel.SEARCH_HEAD_CLUSTER_GROUP_NAME_PREFIX + name;
			},

			initializeDistributedSearchGroups: function(
				distributedSearchGroupsCollection,
				getServerName
			) {
				this.distributedSearchGroupsCollection = distributedSearchGroupsCollection || this.distributedSearchGroupsCollection;
				this.getServerName = getServerName || this.getServerName;

				if (!this.distributedSearchGroupsCollection) {
					throw Error('Distributed search groups mixin requires a collection argument');
				}
				if (!this.getServerName) {
					throw Error('Distributed search groups mixin requires a getServerName argument');
				}

				// Setup 'active_server_roles' so it has the following features:
				// 1. It is the same as whatever was read from the stored DistsearchGroups
				var storedRoles = this._serverRolesFromGroups();
				var updateGroups = false;
				if (storedRoles.length === 0 && this.entry.content.get('status-toggle') !== 'Disabled') {
					storedRoles = this._serverRolesFromInternalRoles();
					updateGroups = storedRoles.length > 0;
				}

				this.entry.content.set('active_server_roles', storedRoles);

				if (updateGroups) {
					this._updateDistributedSearchGroups();
				}
				// 2. Whenever active_server_roles is changed on this model, change it on the DistsearchGroups
				// This way, the View API has no idea DistsearchGroups are involved
				// Also, we can always call .save() immediately on the DistsearchGroups since
				// they will be in sync
				this.entry.content.on('change:active_server_roles', this._updateActiveServerRoles, this);
				this._updateClusterLabelsForRoles();


				var storedCustomGroups = this._customGroupsFromGroups();
				this.entry.content.set('tags', storedCustomGroups);
				this.entry.content.on('change:tags', this._updateCustomSearchGroups, this);


				this.entry.content.set(
					'indexerClusters',
					this.entry.content.get('status-toggle') === 'Disabled' ?
						[] :
					    (!_.isUndefined(this.entry.content.get('indexerClusters')) ? // If true, this means it has been overridden by assets.conf
					    	this.entry.content.get('indexerClusters') :
					    	this._indexerClustersFromInternal()
					    )
				);
				this._updateIndexerClusterSearchGroups();
				this.entry.content.on('change:indexerClusters', this._updateIndexerClusterSearchGroups, this);

				this.entry.content.set(
					'searchHeadClusters',
					this.entry.content.get('status-toggle') === 'Disabled' ?
						[] :
					    (!_.isUndefined(this.entry.content.get('searchHeadClusters')) ? // If true, this means it has been overridden by assets.conf
					    	this.entry.content.get('searchHeadClusters') :
					    	this._searchHeadClustersFromInternal()
					    )
				);
				this._updateSearchHeadClusterSearchGroups();
				this.entry.content.on('change:searchHeadClusters', this._updateSearchHeadClusterSearchGroups, this);


				this.entry.content.validate = function(attrs) {
					if (!_.isUndefined(attrs.active_server_roles) &&
						(!_.isArray(attrs.active_server_roles) ||
						 attrs.active_server_roles.length === 0)) {

						return _("You must provide at least one server role.").t();
					}

					var errorMessage = null;
					_.each(
						[
							{
								prop: 'tags',
								message: _("Group names must only contain alphanumeric characters, dashes, or underscores.").t()
							},
							{
								prop: 'indexerClusters',
								message: _("Indexer cluster names must only contain alphanumeric characters, dashes, or underscores.").t()
							},
							{
								prop: 'searchHeadClusters',
								message: _("Search head cluster names must only contain alphanumeric characters, dashes, or underscores.").t()
							}
						],
						function(tuple) {
							if (!_.isUndefined(attrs[tuple.prop])) {
								if (_.find(attrs[tuple.prop], function(name) { return /[^a-zA-Z0-9_\-]/.test(name); })) {
									errorMessage = tuple.message;
								}
							}
						},
						this
					);
					if (errorMessage !== null) {
						return errorMessage;
					}

					if (!_.isUndefined(attrs.host) &&
						(!_.isString(attrs.host) ||
						  $.trim(attrs.host) === '')) {

						return _("Please enter a valid instance name.").t();
					}

					if (!_.isUndefined(attrs.host_fqdn) &&
						(!_.isString(attrs.host_fqdn) ||
						  $.trim(attrs.host_fqdn) === '')) {

						return _("Please enter a valid machine name.").t();
					}
				}.bind(this);

			},

			getActiveServerRolesToString: function() {
				return _.map(
					this.entry.content.get('active_server_roles'),
					this.getServerRoleToString
				);
			},

            // resets the instance's internal server roles
            // called when and instance goes from 'Disabled' -> 'Enabled'
            resetInitialInternalServerRoles: function() {
				var storedRoles = this._serverRolesFromInternalRoles();
				this.entry.content.set('active_server_roles', storedRoles);
				this.entry.content.set('indexerClusters', this._indexerClustersFromInternal());
				this.entry.content.set('searchHeadClusters', this._searchHeadClustersFromInternal());
            },

            canEditInstanceDetails: function() {
            	return this.canEditHosts() ||
            		this.canEditIndexerClusters() ||
            		this.canEditSearchHeadClusters();
            },

			_serverRolesFromGroups: function() {
				return this.distributedSearchGroupsCollection.filter(function(group) {
					return !group.isCustomGroup() &&
						   !group.isIndexerClusterGroup() &&
						   !group.isSearchHeadClusterGroup() &&
						   _.contains(group.getServers(), this.getServerName());
				}, this).map(function(group) {
					return this.getRoleFromGroupName(group.getGroupName());
				}, this);
			},

			_serverRolesFromInternalRoles: function() {
				// In the case of local instance, server_roles is an object
				// Otherwise, it's an array
				var internalRoles = this.entry.content.get('server_roles');

				if (!_.isArray(internalRoles)) {
					internalRoles = _.keys(internalRoles);
				}

				var internalPrimaryRoles = _.intersection(
					internalRoles,
					getAllPrimaryRoles()
				);

				return _.union(internalPrimaryRoles, this.requiredRoles || []);
			},

			_customGroupsFromGroups: function() {
				return this.distributedSearchGroupsCollection.filter(function(group) {
					return group.isCustomGroup() &&
						_.contains(group.getServers(), this.getServerName());
				}, this).map(function(group) {
					return this.getCustomGroupNameFromGroupName(group.getGroupName());
				}, this);

			},

			_indexerClustersFromInternal: function() {
				var internalClusters = this.entry.content.get('cluster_label');

				if (_.isUndefined(internalClusters) || _.isEmpty(internalClusters)) {
					return [];
				}

				if (!_.isArray(internalClusters)) {
					internalClusters = [internalClusters];
				}

				return internalClusters;
			},

			_searchHeadClustersFromInternal: function() {
				var internalClusters = this.entry.content.get('shcluster_label');
				if (_.isUndefined(internalClusters) || _.isEmpty(internalClusters)) {
					return [];
				}
				if (!_.isArray(internalClusters)) {
					internalClusters = [internalClusters];
				}
				return internalClusters;
			},

			_indexerClustersFromGroups: function() {
				return this.distributedSearchGroupsCollection.filter(function(group) {
					return group.isIndexerClusterGroup() &&
						_.contains(group.getServers(), this.getServerName());
				}, this).map(function(group) {
					return this.getIndexerClusterGroupNameFromGroupName(group.getGroupName());
				}, this);
			},

			_searchHeadClustersFromGroups: function() {
				return this.distributedSearchGroupsCollection.filter(function(group) {
					return group.isSearchHeadClusterGroup() &&
						_.contains(group.getServers(), this.getServerName());
				}, this).map(function(group) {
					return this.getSearchHeadClusterGroupNameFromGroupName(group.getGroupName());
				}, this);
			},

			_updateActiveServerRoles: function() {
				this._updateClusterLabelsForRoles();
				this._updateDistributedSearchGroups();
			},

			_updateDistributedSearchGroups: function() {
				_.each(VALID_PRIMARY_ROLES, function(primaryRole) {
					var roleGroup = this.distributedSearchGroupsCollection.find(function(group) {
						return this.getRoleFromGroupName(group.getGroupName()) === primaryRole;
					}, this);

					if (!roleGroup) {
						roleGroup = new DistsearchGroupModel();
						roleGroup.setName(this.getRoleGroupName(primaryRole));
						roleGroup.setServers([]);
						roleGroup.setSearchMode(primaryRole === 'indexer' ? 'default' : 'light');
						roleGroup.setDefault(primaryRole === 'indexer');
						this.distributedSearchGroupsCollection.add(roleGroup);
					}
				}, this);

				// Ensure all the groups are now in sync with the latest change to this model's role
				_(this.distributedSearchGroupsCollection.filter(function(group) {
					return !group.isCustomGroup() && !group.isIndexerClusterGroup() && !group.isSearchHeadClusterGroup();
				}, this)).each(function(distsearch) {
					var groupName = distsearch.getGroupName();
					// The role is encoded in the name.
					var groupRole = groupName.substr(DistsearchGroupModel.GROUP_NAME_PREFIX.length);

					// If this peer is now in this group's role, add it
					if (_.contains(this.entry.content.get('active_server_roles'), groupRole)) {
						distsearch.addServer(this.getServerName());

					// Otherwise, it's not in this group. Remove it.
					} else {
						distsearch.removeServer(this.getServerName());
					}
				}, this);
			},

			_updateCustomSearchGroups: function() {
				// TODO you should really investigate whether you could modify the groups attributes only on the
				// actual peer endpoint
				// Additionally, if you can't, make a "flush" mechanism that tallies up these "dirty" groups
				// and only saves them off

				var customGroups = _(this.distributedSearchGroupsCollection.filter(function(group) {
					return group.isCustomGroup();
				}));

				_.each(this.entry.content.get('tags'), function(tagName) {
					var customGroup = customGroups.find(function(group) {
						return this.getCustomGroupNameFromGroupName(group.getGroupName()) === tagName;
					}, this);

					if (!customGroup) {
						customGroup = new DistsearchGroupModel();
						customGroup.setName(this.getCustomGroupName(tagName));
						customGroup.setServers([]);
						customGroup.setDefault(false);
						this.distributedSearchGroupsCollection.add(customGroup);
					}
				}, this);
				customGroups = _(this.distributedSearchGroupsCollection.filter(function(group) {
					return group.isCustomGroup();
				}));

				customGroups.each(function(group) {
					var groupName = group.getGroupName();
					var customGroupName = this.getCustomGroupNameFromGroupName(groupName);

					if (_.contains(this.entry.content.get('tags'), customGroupName)) {
						group.addServer(this.getServerName());
					} else {
						group.removeServer(this.getServerName());
					}
				}, this);
			},

			_updateIndexerClusterSearchGroups: function() {
				var existingGroups = _(this.distributedSearchGroupsCollection.filter(function(group) {
					return group.isIndexerClusterGroup();
				}));

				_.each(this.entry.content.get('indexerClusters'), function(clusterName) {
					var group = existingGroups.find(function(g) {
						return this.getIndexerClusterGroupNameFromGroupName(g.getGroupName()) === clusterName;
					}, this);

					if (!group) {
						group = new DistsearchGroupModel();
						group.setName(this.getIndexerClusterGroupName(clusterName));
						group.setServers([]);
						group.setDefault(false);
						this.distributedSearchGroupsCollection.add(group);
					}
				}, this);

				existingGroups = _(this.distributedSearchGroupsCollection.filter(function(group) {
					return group.isIndexerClusterGroup();
				}));

				existingGroups.each(function(group) {
					var groupName = group.getGroupName();
					var indexerClusterGroupName = this.getIndexerClusterGroupNameFromGroupName(groupName);

					if (_.contains(this.entry.content.get('indexerClusters'), indexerClusterGroupName)) {
						group.addServer(this.getServerName());
					} else {
						group.removeServer(this.getServerName());
					}
				}, this);
			},

			_updateSearchHeadClusterSearchGroups: function() {
				var existingGroups = _(this.distributedSearchGroupsCollection.filter(function(group) {
					return group.isSearchHeadClusterGroup();
				}));

				_.each(this.entry.content.get('searchHeadClusters'), function(clusterName) {
					var group = existingGroups.find(function(g) {
						return this.getSearchHeadClusterGroupNameFromGroupName(g.getGroupName()) === clusterName;
					}, this);

					if (!group) {
						group = new DistsearchGroupModel();
						group.setName(this.getSearchHeadClusterGroupName(clusterName));
						group.setServers([]);
						group.setDefault(false);
						this.distributedSearchGroupsCollection.add(group);
					}
				}, this);

				existingGroups = _(this.distributedSearchGroupsCollection.filter(function(group) {
					return group.isSearchHeadClusterGroup();
				}));

				existingGroups.each(function(group) {
					var groupName = group.getGroupName();
					var searchHeadClusterGroupName = this.getSearchHeadClusterGroupNameFromGroupName(groupName);

					if (_.contains(this.entry.content.get('searchHeadClusters'), searchHeadClusterGroupName)) {
						group.addServer(this.getServerName());
					} else {
						group.removeServer(this.getServerName());
					}
				}, this);

			},

			_updateClusterLabelsForRoles: function() {
				var activeServerRoles = this.entry.content.get('active_server_roles'),
					currentSearchHeadClusters = this.entry.content.get('searchHeadClusters') || [],
					currentIndexerClusters = this.entry.content.get('indexerClusters') || [];

				// If the instance is no longer a SH / SHC deployer, remove its sh cluster label.
				// Otherwise, if it has no cluster labels but is now a SH / SHC deployer, reload its
				//    internal cluster labels
				if (_.intersection(activeServerRoles, ['search_head', 'shc_deployer']).length === 0) {
					this.entry.content.set('searchHeadClusters', []);
				} else if (currentSearchHeadClusters.length === 0) {
					this.entry.content.set('searchHeadClusters', this._searchHeadClustersFromInternal());
				}

				// If the instance is no longer an Indexer / SH / CM, remove its indexer cluster labels
				// Otherwise, if it has no indexer cluster labels but is now Indexer/SH/CM, reload its
				// 		internal cluster labels
				if (_.intersection(activeServerRoles, ['indexer', 'search_head', 'cluster_master']).length === 0) {
					this.entry.content.set('indexerClusters', []);
				} else if (currentIndexerClusters.length === 0) {
					this.entry.content.set('indexerClusters', this._indexerClustersFromInternal());
				}
			},

			staticMembers: {
				// TODO actual implementation
				getAllPrimaryRoles: getAllPrimaryRoles
			}


		};

	}
);

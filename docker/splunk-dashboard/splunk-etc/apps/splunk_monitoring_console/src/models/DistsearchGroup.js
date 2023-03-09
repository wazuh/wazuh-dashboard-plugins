// Note: ideally this lives in models/services/search/distributed/groups
// but that is not yet implemented
// So we are mocking it for now, against the .conf file

define(
	[
		'jquery',
		'underscore',
		'backbone',
		'@splunk/swc-mc'
	],
	function(
		$,
		_,
		Backbone,
		SwcMC
	) {
		var GROUP_NAME_PREFIX = 'dmc_group_',
			CUSTOM_GROUP_NAME_PREFIX = 'dmc_customgroup_',
			INDEXER_CLUSTER_GROUP_NAME_PREFIX = 'dmc_indexerclustergroup_',
			SEARCH_HEAD_CLUSTER_GROUP_NAME_PREFIX = 'dmc_searchheadclustergroup_';

		var DistsearchModel = SwcMC.SplunkDBaseModel.extend(
			{
				url: '/services/search/distributed/groups',

				save: function() {
					var serializedValues = _.map(this.entry.content.get('member'), function(member) {
						return "member=" + encodeURIComponent(member);
					}, this);
					serializedValues.push("default=" + this.entry.content.get('default')); // TODO format it properly
					if (this.isNew() && !this._isCreated) {
						serializedValues.push("name=" + encodeURIComponent(this.entry.get('name')));
						return $.post(
							{
								'url': SwcMC.SplunkdUtils.fullpath(this.url),
								'data': serializedValues.join('&'),
								'headers': {
									'X-Splunk-Form-Key': SwcMC.SplunkUtil.getFormKey()
								}
							}
						).then(function() {
							this._isCreated = true;
						}.bind(this));
					} else {
						return $.post(
							{
								'url': SwcMC.SplunkdUtils.fullpath(this.url) + '/' + encodeURI(this.entry.get('name')) + '/edit',
								'data': serializedValues.join('&'),
								'headers': {
									'X-Splunk-Form-Key': SwcMC.SplunkUtil.getFormKey()
								}
							}
						);
					}
				},
			
				setDefault: function(isDefault) {
					this.entry.content.set('default', isDefault);
				},
				setSearchMode: function(searchMode) {
					this.entry.content.set('searchMode', searchMode);
				},
				setName: function(name) {
					this.entry.set('name', name);
				},
				getGroupName: function() {
					return this.entry.get('name');
				},
				getServers: function() {
					return this.entry.content.get('member');
				},
				setServers: function(servers) {
					this.entry.content.set('member', servers);
				},
				isRoleGroup: function() {
					return this.entry.get('name').indexOf(DistsearchModel.GROUP_NAME_PREFIX) === 0;
				},
				isCustomGroup: function() {
					return this.entry.get('name').indexOf(DistsearchModel.CUSTOM_GROUP_NAME_PREFIX) === 0;
				},
				isIndexerClusterGroup: function() {
					return this.entry.get('name').indexOf(DistsearchModel.INDEXER_CLUSTER_GROUP_NAME_PREFIX) === 0;
				},
				isSearchHeadClusterGroup: function() {
					return this.entry.get('name').indexOf(DistsearchModel.SEARCH_HEAD_CLUSTER_GROUP_NAME_PREFIX) === 0;
				},
				isDmcGroup: function() {
					return this.isRoleGroup() || this.isCustomGroup() || this.isSearchHeadClusterGroup() || this.isIndexerClusterGroup();
				},
				getDisplayName: function() {
					var prefix = '';
					if (this.isCustomGroup()) {
						prefix = DistsearchModel.CUSTOM_GROUP_NAME_PREFIX;
					} else if (this.isIndexerClusterGroup()) {
						prefix = DistsearchModel.INDEXER_CLUSTER_GROUP_NAME_PREFIX;
					} else if (this.isSearchHeadClusterGroup()) {
						prefix = DistsearchModel.SEARCH_HEAD_CLUSTER_GROUP_NAME_PREFIX;
					} else { // role group
						prefix = DistsearchModel.GROUP_NAME_PREFIX;
					}

					return this.entry.get('name').substr(prefix.length);
				},
				hasServerRole: function(role) {
					return !this.isCustomGroup() && 
						!this.isIndexerClusterGroup() && 
						!this.isSearchHeadClusterGroup() && 
						this.entry.get('name') === (DistsearchModel.GROUP_NAME_PREFIX + role);
				},
				addServer: function(server) {
					if (!_.contains(this.entry.content.get('member'), server)) {
						this.entry.content.set(
							'member',
							(this.entry.content.get('member') || []).concat([server])
						);
					}
				},
				removeServer: function(server) {
					if (_.contains(this.getServers(), server)) {
						this.entry.content.set('member', _.without(this.getServers(), server));
					}
				}
			},
			{
				GROUP_NAME_PREFIX: GROUP_NAME_PREFIX,
				CUSTOM_GROUP_NAME_PREFIX: CUSTOM_GROUP_NAME_PREFIX,
				INDEXER_CLUSTER_GROUP_NAME_PREFIX: INDEXER_CLUSTER_GROUP_NAME_PREFIX,
				SEARCH_HEAD_CLUSTER_GROUP_NAME_PREFIX: SEARCH_HEAD_CLUSTER_GROUP_NAME_PREFIX
			}
		);

		return DistsearchModel;

	}
);
/**
 * Created by ykou on 12/23/14.
 */
define([
    'underscore',
    'backbone',
    'module',
    'splunk_monitoring_console/collections/Instances',
    'splunk_monitoring_console/models/ThresholdConfig',
    'splunk_monitoring_console/models/TopologyInfo',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/overview/distributed_mode/Classic',
    'splunk_monitoring_console/views/overview/Alerts',
    'splunk_monitoring_console/views/overview/distributed_mode/topology/Master',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/Master.html',
    '../Master.pcss',
    '../classic-distributed.pcss',
    '../topology.pcss'
], function(
    _,
    Backbone,
    module,
    InstancesCollection,
    ThresholdConfigModel,
    TopologyInfoModel,
    SwcMC,
    ClassicView,
    AlertsView,
    TopologyView,
    Template,
    css,
    classicDistributedCss,
    topologyCss
) {
    var DEFAULT_GROUP_ITEMS = [
            { label: _('All').t(), value: 'all' }
        ],
        DEFAULT_MAX_INSTANCES = 25,
        DEFAULT_MAX_INSTANCES_AUXILIARY = 10,
        DEFAULT_SORT_DIR = 'desc',
        DEFAULT_SORT_KEY = 'up_down_status',
        DEFAULT_OFFSET = 0, // duh
        SYNC_RELATED_TO = ['state', 'indexerFetchState', 'searchHeadFetchState'];

    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,
        className: 'dmc-distributed-mode-view',
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.collection = this.collection || {};
            this.model = this.model || {};

            // Used only in the topology page
            this.collection.indexers = new InstancesCollection();
            this.collection.searchHeads = new InstancesCollection();
            this.collection.auxiliaries = new InstancesCollection();

            // Used only in the Overview page
            this.collection.overviewIndexers = new InstancesCollection();
            this.collection.overviewSearchHeads = new InstancesCollection();
            this.collection.clusterMasters = new InstancesCollection();
            this.collection.licenseMasters = new InstancesCollection();
            this.collection.deploymentServers = new InstancesCollection();

            this.model.thresholdConfig = new ThresholdConfigModel();
            this.model.indexerFetchState = new SwcMC.BaseModel();
            this.model.searchHeadFetchState = new SwcMC.BaseModel();
            this.model.auxiliaryFetchState = new SwcMC.BaseModel();

            this.model.state = new Backbone.Model({
                showTopology: false,
                selectedGroup: 'all',
                relatedTo: ''
            });
            this.model.topologyInfo = new TopologyInfoModel();

            this.model.indexerFetchState.set({
                count: DEFAULT_MAX_INSTANCES,
                offset: DEFAULT_OFFSET,
                serverNameSearch: '',
                ranges: '*',
                groupSearch: '',
                sortKey: DEFAULT_SORT_KEY,
                sortDir: DEFAULT_SORT_DIR,
                relatedTo: '',
                managementRoles: '',
                fetching: false,
                role: 'indexer'
            });
            this.model.searchHeadFetchState.set({
                count: DEFAULT_MAX_INSTANCES,
                offset: DEFAULT_OFFSET,
                serverNameSearch: '',
                ranges: '*',
                groupSearch: '',
                sortKey: DEFAULT_SORT_KEY,
                sortDir: DEFAULT_SORT_DIR,
                relatedTo: '',
                managementRoles: '',
                fetching: false,
                role: 'search_head'
            });
            this.model.auxiliaryFetchState.set({
                count: DEFAULT_MAX_INSTANCES_AUXILIARY,
                offset: DEFAULT_OFFSET,
                serverNameSearch: '',
                ranges: '*',
                groupSearch: '',
                sortKey: DEFAULT_SORT_KEY,
                sortDir: DEFAULT_SORT_DIR,
                relatedTo: '',
                managementRoles: ['shc_deployer', 'cluster_master', 'license_master', 'deployment_server'],
                fetching: false,
                role: 'auxiliary'
            });

            this.children.topology = new TopologyView({
                collection: {
                    indexers: this.collection.indexers,
                    searchHeads: this.collection.searchHeads,
                    auxiliaries: this.collection.auxiliaries
                },
                model: {
                    state: this.model.state,
                    indexerFetchState: this.model.indexerFetchState,
                    searchHeadFetchState: this.model.searchHeadFetchState,
                    auxiliaryFetchState: this.model.auxiliaryFetchState,
                    topologyInfo: this.model.topologyInfo,
                    thresholdConfig: this.model.thresholdConfig
                }
            });

            this.children.topologySwitcher = new SwcMC.SyntheticRadioControlView({
                model: this.model.state,
                modelAttribute: 'showTopology',
                items: [
                    {label: _('Overview').t(), value: false},
                    {label: _('Topology').t(), value: true}
                ]
            });
            this.children.viewGroupDropdown = new SwcMC.SyntheticSelectControlView({
                label: _('Group:').t(),
                model: this.model.state,
                modelAttribute: 'selectedGroup',
                toggleClassName: 'btn'
            });
            this.children.classicView = new ClassicView({
                searchManager: this.options.searchManager,
                model: {
                    state: this.model.state,
                    indexerFetchState: this.model.indexerFetchState,
                    searchHeadFetchState: this.model.searchHeadFetchState,
                    auxiliaryFetchState: this.model.auxiliaryFetchState,
                    thresholdConfig: this.model.thresholdConfig
                },
                collection: {
                    searchHeads: this.collection.overviewSearchHeads,
                    indexers: this.collection.overviewIndexers,
                    clusterMasters: this.collection.clusterMasters,
                    licenseMasters: this.collection.licenseMasters,
                    deploymentServers: this.collection.deploymentServers
                }
            });
            this.children.alerts = new AlertsView({
                deferreds: this.options.deferreds,
                model: {
                    appLocal: this.model.appLocal,
                    serverInfo: this.model.serverInfo
                },
                collection: {
                    distSearchGroups: this.collection.distSearchGroups
                }
            });


            this._changeGroup();

            this._fetchCollections();
            this.model.thresholdConfig.fetch();
            this.model.topologyInfo.fetch();

            this.listenTo(this.model.state, 'change:showTopology', this.switchVizMode);
            this.listenTo(this.model.topologyInfo.entry.content, 'change sync', this._updateGroupDropdown);
            this.listenTo(
                this.model.indexerFetchState,
                'change:count change:offset change:serverNameSearch change:ranges change:groupSearch change:sortKey change:sortDir change:relatedTo change:managementRoles',
                this._fetchIndexerCollection
            );
            this.listenTo(
                this.model.searchHeadFetchState,
                'change:count change:offset change:serverNameSearch change:ranges change:groupSearch change:sortKey change:sortDir change:relatedTo change:managementRoles',
                this._fetchSearchHeadCollection
            );
            this.listenTo(
                this.model.auxiliaryFetchState,
                'change:count change:offset change:serverNameSearch change:ranges change:groupSearch change:sortKey change:sortDir change:relatedTo change:managementRoles',
                this._fetchAuxiliariesCollection
            );
            this.listenTo(this.model.topologyInfo.entry.content, 'change', this._fetchCollections);
            this.listenTo(this.model.thresholdConfig, 'sync change', this._fetchCollections);
            this.listenTo(this.model.state, 'change:selectedGroup', this._changeGroup);

            // Keep relevant relatedTo's in sync
            _.each(SYNC_RELATED_TO, function(stateModel) {
                this.listenTo(this.model[stateModel], 'change:relatedTo', this._syncRelatedTo);
            }, this);

            // Ensure whenever a filter is altered, the page goes back to the beginning
            _.each(['indexerFetchState', 'searchHeadFetchState', 'auxiliaryFetchState'], function(fetchStateModel) {
                this.listenTo(
                    this.model[fetchStateModel],
                    'change:serverNameSearch change:groupSearch change:managementRoles change:relatedTo change:ranges change:count',
                    this._resetPaging
                );
            }, this);
        },
        render: function() {
            var root = (SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH.indexOf("/") === 0 ?
                SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH.substring(1) :
                SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH
            );

            this.$el.html(this.compiledTemplate({helpLink: SwcMC.URIRoute.docHelp(root, SwcMC.SplunkConfig.LOCALE, "app.splunk_monitoring_console.monitoringconsole_configure")}));
            this.$('.section-header').append(this.children.topologySwitcher.render().$el);
            this.$('.section-header').append(this.children.viewGroupDropdown.render().$el);
            this.$el.append(this.children.topology.render().$el);
            this.$el.append(this.children.classicView.render().$el);
            this.$el.append(this.children.alerts.render().$el);
            this._updateGroupDropdown();
            this.switchVizMode();
            return this;
        },
        switchVizMode: function() {
            if (this.model.state.get('showTopology')) {
                this.children.classicView.$el.hide();
                this.children.alerts.$el.hide();
                this.children.viewGroupDropdown.$el.show();
            } else {
                this.children.classicView.$el.show();
                this.children.alerts.$el.show();
                this.children.viewGroupDropdown.$el.hide();
            }
        },
        _updateGroupDropdown: function() {
            var items = DEFAULT_GROUP_ITEMS.slice();

            _.each(
                [
                    { key: 'indexerClusters', label: _('Indexer Clusters').t() },
                    { key: 'searchHeadClusters', label: _('Search Head Clusters').t() },
                    { key: 'customGroups', label: _('Custom Groups').t() }
                ],
                function(groupType) {
                    var group = this.model.topologyInfo.entry.content.get(groupType.key),
                        innerItems = null;

                    if (group.length > 0) {
                        innerItems = [
                            { label: groupType.label }
                        ];

                        _.each(group, function(member) {
                            innerItems.push({
                                value: [groupType.key, member].join('::::'),
                                label: member
                            });
                        }, this);

                        items.push(innerItems);
                    }
                },
                this
            );

            this.children.viewGroupDropdown.setItems(items);
        },

        _fetchCollections: _.debounce(function() {
            this._fetchIndexerCollection();
            this._fetchSearchHeadCollection();
            this._fetchAuxiliariesCollection();

            this._fetchOverviewIndexerCollection();
            this._fetchOverviewSearchHeadCollection();
            this._fetchClusterMastersCollection();
            this._fetchLicenseMastersCollection();
            this._fetchDeploymentServersCollection();
        }),

        _fetchIndexerCollection: _.debounce(function() {
            var options = {
                role: this.model.indexerFetchState.get('role'),
                count: this.model.indexerFetchState.get('count'),
                search: this._computeSearchQuery(this.model.indexerFetchState),
                offset: this.model.indexerFetchState.get('offset'),
                sortKey: [this.model.indexerFetchState.get('sortKey')],
                sortDir: this.model.indexerFetchState.get('sortDir'),
                relatedTo: this.model.indexerFetchState.get('relatedTo'),
                managementRoles: this._cleanStringSplit(this.model.indexerFetchState.get('managementRoles'))
            };

            options = this._addRangeBuckets(options);

            this.model.indexerFetchState.set('fetching', true);
            this.collection.indexers.fetch(options).always(function() {
                this.model.indexerFetchState.set('fetching', false);
            }.bind(this));
        }),

        _fetchSearchHeadCollection: _.debounce(function() {
            var options = {
                role: this.model.searchHeadFetchState.get('role'),
                count: this.model.searchHeadFetchState.get('count'),
                search: this._computeSearchQuery(this.model.searchHeadFetchState),
                offset: this.model.searchHeadFetchState.get('offset'),
                sortKey: [this.model.searchHeadFetchState.get('sortKey')],
                sortDir: this.model.searchHeadFetchState.get('sortDir'),
                relatedTo: this.model.searchHeadFetchState.get('relatedTo'),
                managementRoles: this._cleanStringSplit(this.model.searchHeadFetchState.get('managementRoles'))
            };

            options = this._addRangeBuckets(options);

            this.model.searchHeadFetchState.set('fetching', true);
            this.collection.searchHeads.fetch(options).always(function() {
                this.model.searchHeadFetchState.set('fetching', false);
            }.bind(this));
        }),

        _fetchAuxiliariesCollection: _.debounce(function() {
            var options = {
                role: this.model.auxiliaryFetchState.get('role'),
                count: this.model.auxiliaryFetchState.get('count'),
                search: this._computeSearchQuery(this.model.auxiliaryFetchState),
                offset: this.model.auxiliaryFetchState.get('offset'),
                sortKey: [this.model.auxiliaryFetchState.get('sortKey')],
                sortDir: this.model.auxiliaryFetchState.get('sortDir'),
                relatedTo: this.model.auxiliaryFetchState.get('relatedTo'),
                managementRoles: this._cleanStringSplit(this.model.auxiliaryFetchState.get('managementRoles'))
            };

            options = this._addRangeBuckets(options);

            this.model.auxiliaryFetchState.set('fetching', true);
            this.collection.auxiliaries.fetch(options).always(function() {
                this.model.auxiliaryFetchState.set('fetching', false);
            }.bind(this));
        }),

        _fetchOverviewIndexerCollection: _.debounce(function() {
            this.collection.overviewIndexers.fetch(this._addRangeBuckets({
                role: 'indexer'
            }));
        }),

        _fetchOverviewSearchHeadCollection: _.debounce(function() {
            this.collection.overviewSearchHeads.fetch(this._addRangeBuckets({
                role: 'search_head'
            }));
        }),

        _fetchClusterMastersCollection: _.debounce(function() {
            this.collection.clusterMasters.fetch(this._addRangeBuckets({
                role: 'auxiliary',
                managementRoles: ['cluster_master']
            }));
        }),

        _fetchLicenseMastersCollection: _.debounce(function() {
            this.collection.licenseMasters.fetch(this._addRangeBuckets({
                role: 'auxiliary',
                managementRoles: ['license_master']
            }));
        }),

        _fetchDeploymentServersCollection: _.debounce(function() {
            this.collection.deploymentServers.fetch(this._addRangeBuckets({
                role: 'auxiliary',
                managementRoles: ['deployment_server']
            }));
        }),

        _changeGroup: function() {
            var currentGroup = this.model.state.get('selectedGroup'),
                split = currentGroup.split('::::'),
                groupType = split[0],
                groupName = split[1],
                search = '';

            switch (groupType) {
                case 'all':
                    search = '';
                    break;
                case 'indexerClusters':
                    search = 'indexerClusters="' + groupName + '"';
                    break;
                case 'searchHeadClusters':
                    search = 'searchHeadClusters="' + groupName + '"';
                    break;
                case 'customGroups':
                    search = 'customGroups="' + groupName + '"';
                    break;
                default:
                    break;
            }

            this.model.indexerFetchState.set('groupSearch', search);
            this.model.searchHeadFetchState.set('groupSearch', search);
            this.model.auxiliaryFetchState.set('groupSearch', search);
        },

        _addRangeBuckets: function(options) {
            var rangeBuckets = [ 'cpu_system_pct', 'mem_used', 'indexing_rate', 'search_concurrency', 'up_down_status' ];
            if (_.reduce(rangeBuckets, function(memo, b) { return memo && this.model.thresholdConfig.get(b); }, true, this)) {
                return $.extend(options, {
                        'meta.rangeBuckets': {
                            'cpu_system_pct': _.keys(this.model.thresholdConfig.get('cpu_system_pct').thresholds),
                            'mem_used': _.keys(this.model.thresholdConfig.get('mem_used').thresholds),
                            'indexing_rate': _.keys(this.model.thresholdConfig.get('indexing_rate').thresholds),
                            'search_concurrency': _.keys(this.model.thresholdConfig.get('search_concurrency').thresholds),
                            'up_down_status': _.keys(this.model.thresholdConfig.get('up_down_status').thresholds)
                        }
                    }
                );
            }
            return options;
        },

        _computeSearchQuery: function(fetchState) {
            var serverNameSearch = fetchState.get('serverNameSearch'),
                rangeSearch = this._computeRangeSearch(fetchState),
                groupSearch = fetchState.get('groupSearch'),
                candidateSearches = [serverNameSearch, rangeSearch, groupSearch],
                activeSearches = [];

            _.each(candidateSearches, function(candidate) {
                if (candidate) {
                    activeSearches.push(candidate);
                }
            }, this);

            if (activeSearches.length === 0) {
                return '';
            }
            if (activeSearches.length === 1) {
                return activeSearches[0];
            }
            return '(' + activeSearches.join(') AND (') + ')';
        },

        _computeRangeSearch: function(fetchState) {
            var ranges = fetchState.get('ranges'),
                sortKey = fetchState.get('sortKey'),
                allRanges = '',
                noRanges = '(__range=__no_range)',
                unknownRangePrefix = '__unknown_range_';

            // Special case: a '*' selects all ranges
            if (_.isString(ranges)) {
                if (ranges === '*') {
                    return allRanges;
                } else {
                    return noRanges;
                }
            } else { // isArray
                if (ranges.length === 0) {
                    return noRanges;
                } else {
                    return '(' + _.map(
                        ranges,
                        function(range) {
                            if (range.indexOf(unknownRangePrefix) === 0) {
                                return '__range=' + range;
                            } else {
                                return this.model.thresholdConfig.getRangeSearch(
                                    range,
                                    sortKey
                                );
                            }
                        },
                        this
                    ).join(' OR ') + ')';
                }
            }
        },

        _syncRelatedTo: function(model, value) {
            _.each(SYNC_RELATED_TO, function(stateModel) {
                if (this.model[stateModel].get('relatedTo') !== value) {
                    this.model[stateModel].set('relatedTo', value);
                }
            }, this);
        },

        _resetPaging: function(model) {
            model.set({
                offset: 0
            });
        },

        _cleanStringSplit: function(str, delim) {
            delim = delim || ',';

            if (!_.isString(str)) {
                return str;
            }
            if ($.trim(str) === '') {
                return [];
            }
            return str.split(delim);
        }
    });
});

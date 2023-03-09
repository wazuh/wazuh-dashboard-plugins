// Total shim around a desired REST endpoint. Implemented as a SPL query for now.
define(
    [
        'jquery',
        'underscore',
        'backbone',
        '@splunk/swc-mc',
        'splunk_monitoring_console/models/Peer', // I wish this file was the this module :(
        'splunk_monitoring_console/helpers/Formatters'
    ],
    function(
        $,
        _,
        Backbone,
        SwcMC,
        PeerModel,
        Formatters
    ) {
        // TODO inherit from SplunkDsCollection when appropriate
        var DEFAULT_INSTANCE_COUNT = 0, // All of them
            SPECIAL_RANGE_BAIL_SEARCH = '__range=__no_range',
            SPECIAL_UNKNOWN_RANGE_SEARCH_PREFIX = '__range=__unknown_range_',

            CASE_INSENSITIVE_PROPERTIES = ['serverName'],
            STRICT_MATCH_PROPERTIES = ['indexerClusters', 'searchHeadClusters', 'customGroups'],

            searchesExecuted = false,
            dfds = [],
            results = {};

        var executeSearches = function() {
            if (!searchesExecuted) {

                var inputlookupDMCAssetsSearch = new SwcMC.SearchManager({
                    search: '| localop | inputlookup dmc_assets'
                });

                var instancesManager = new SwcMC.PostProcessManager({
                    managerid: inputlookupDMCAssetsSearch.id,
                    search: '| eval is_local=if(peerURI=="localhost",1,0) | fields host machine serverName is_local search_group | search search_group=dmc_group_* | dedup serverName search_group | stats values(search_group) as search_groups first(is_local) as is_local first(host) as host first(machine) as machine by serverName'
                });
                results.instances = createDfd(instancesManager);

                var relationshipsManager = new SwcMC.SearchManager({
                    search: '| rest splunk_server_group=dmc_group_search_head /services/search/distributed/peers ' +
                        '| fields peerName splunk_server ' +
                        '| dedup peerName splunk_server ' +
                        '| rename peerName as indexer splunk_server as search_head '
                });
                results.relationships = createDfd(relationshipsManager);

                var customGroupManager = new SwcMC.PostProcessManager({
                    managerid: inputlookupDMCAssetsSearch.id,
                    search: '| stats values(search_group) as groups by serverName ' +
                    '| mvexpand groups ' +
                    '| rename groups as group ' +
                    '| stats values(serverName) as servers by group ' +
                    '| search group="dmc_customgroup_*" '
                });
                results.customGroup = createDfd(customGroupManager);

                var clusterGroupManager = new SwcMC.PostProcessManager({
                    managerid: inputlookupDMCAssetsSearch.id,
                    search: '| stats values(search_group) as groups by serverName ' +
                    '| mvexpand groups ' +
                    '| rename groups as group ' +
                    '| stats values(serverName) as servers by group ' +
                    '| search group="dmc_indexerclustergroup_*" '
                });
                results.clusterGroup = createDfd(clusterGroupManager);

                var shcGroupManager = new SwcMC.PostProcessManager({
                    managerid: inputlookupDMCAssetsSearch.id,
                    search: '| stats values(search_group) as groups by serverName ' +
                    '| mvexpand groups ' +
                    '| rename groups as group ' +
                    '| stats values(serverName) as servers by group ' +
                    '| search group="dmc_searchheadclustergroup_*" '
                });
                results.shcGroup = createDfd(shcGroupManager);

                var hostwideResourceManager = new SwcMC.SearchManager({
                	search: '| rest splunk_server_group=dmc_group_* /services/server/status/resource-usage/hostwide | eval mem_used=round(mem_used/mem*100) | eval cpu_system_pct = cpu_system_pct + cpu_user_pct | fields splunk_server cpu_system_pct mem_used' // the true cpu_usage is the sum of the system_pct and user_pct

                });
                results.hostwideResource = createDfd(hostwideResourceManager);

                var indexerIntrospectionManager = new SwcMC.SearchManager({
                    search: '| rest splunk_server_group=dmc_group_indexer /services/server/introspection/indexer | fields splunk_server average_KBps  | eval indexing_rate=round(average_KBps) | fields splunk_server indexing_rate'
                });
                results.indexerIntrospection = createDfd(indexerIntrospectionManager);

                var searchProcessesManager = new SwcMC.SearchManager({
                    search: '| rest splunk_server_group=dmc_group_search_head /services/server/status/resource-usage/splunk-processes | stats dc(search_props.sid) as search_concurrency by splunk_server | fields splunk_server search_concurrency'
                });
                results.searchProcesses = createDfd(searchProcessesManager);

                var peersEndpointManager = new SwcMC.SearchManager({
                    search: '| rest splunk_server=local /services/search/distributed/peers | eval up_down_status=if(status=="Down",0,1) | rename peerName as splunk_server | fields cpu_arch os_name os_version numberOfCores numberOfVirtualCores physicalMemoryMB version splunk_server up_down_status'
                });
                results.peersEndpoint = createDfd(peersEndpointManager);

                var localInstanceInfoManager = new SwcMC.SearchManager({
                    search: '| rest splunk_server=local /services/server/info | fields cpu_arch os_name os_version numberOfCores numberOfVirtualCores physicalMemoryMB version'
                });
                results.localInstanceInfo = createDfd(localInstanceInfoManager);
            }
            searchesExecuted = true;
        };

        var createDfd = function(searchManager) {
            var dfd = $.Deferred();
            var resultsModel = searchManager.data('results', {
                count: 0,
                offset: 0
            });
            searchManager.on('search:done', function(state) {
                if (state.content.resultCount > 0) {
                    resultsModel.on('data', function() {
                        dfd.resolve();
                    });
                } else {
                    dfd.resolve();
                }
            });
            searchManager.on('search:fail', function() {
                dfd.resolve();
            });

            dfds.push(dfd);
            return resultsModel;
        };

        return Backbone.Collection.extend({
            initialize: function() {
                Backbone.Collection.prototype.initialize.apply(this, arguments);

                this.meta = new Backbone.Model();
                this.paging = new Backbone.Model();
                this.paging.meta = new Backbone.Model();

                executeSearches();
            },

            fetch: function(options) {
                options = _.defaults(options || {}, {
                    'role': '*',
                    'relatedTo': '', //specifically: have a distsearch relationship
                    'managementRoles': [],
                    'search': '',

                    // These are collection-specific metrics
                    'count': DEFAULT_INSTANCE_COUNT,
                    'offset': 0,
                    'sortKey': ['cpu_system_pct'],
                    'sortDir': 'desc',

                    'meta.rangeBuckets': null
                });

                return $.when.apply($, dfds).done(function() {
                    var allInstances = results.instances.data();
                    var allRelationships = results.relationships.data();
                    var allCustomGroupings = results.customGroup.data();
                    var allClusterGroupings = results.clusterGroup.data();
                    var allShcGroupings = results.shcGroup.data();
                    var allHostwideResources = results.hostwideResource.data();
                    var allIndexerInstrospections = results.indexerIntrospection.data();
                    var allSearchProcesses = results.searchProcesses.data();
                    var allPeerEndpointData = results.peersEndpoint.data();
                    var allLocalInstanceInfoData = results.localInstanceInfo.data();

                    var instanceModels = [];


                    if (results.instances.hasData()) {
                        var serverNameIndex = allInstances.fields.indexOf('serverName'),
                            roleIndex = allInstances.fields.indexOf('search_groups'),
                            isLocalIndex = allInstances.fields.indexOf('is_local'),
                            hostIndex = allInstances.fields.indexOf('host'),
                            machineIndex = allInstances.fields.indexOf('machine');

                        _.each(allInstances.rows, function(instanceRow) {
                            var instanceServerName = instanceRow[serverNameIndex],
                                roleCell = instanceRow[roleIndex],
                                isLocalCell = +instanceRow[isLocalIndex],
                                instanceGroups = _.isArray(roleCell) ? roleCell : [roleCell],
                                instanceHost = instanceRow[hostIndex],
                                instanceMachine = instanceRow[machineIndex];

                            // Create the ideal instance models
                            var instanceModel = new Backbone.Model({
                                id: instanceServerName
                            });
                            instanceModel.entry = new Backbone.Model();
                            instanceModel.entry.content = new Backbone.Model({
                                'serverName': instanceServerName,
                                'cpu_system_pct': null,
                                'mem_used': null,
                                'indexing_rate': null,
                                'search_concurrency': null,
                                'up_down_status': null,
                                'role': [],
                                'management_roles': [],
                                'is_local': false,
                                'host': instanceHost,
                                'machine': instanceMachine,

                                // Relations
                                'indexerClusters': [],
                                'searchHeadClusters': [],

                                'distributesSearchesTo': [],
                                'searchedBy': [],

                                'customGroups': []
                            });


                            if (_.contains(instanceGroups, 'dmc_group_indexer')) {
                                instanceModel.entry.content.get('role').push('indexer');
                            }
                            if (_.contains(instanceGroups, 'dmc_group_search_head')) {
                                instanceModel.entry.content.get('role').push('search_head');
                            }
                            if (_.contains(instanceGroups, 'dmc_group_license_master') ||
                                _.contains(instanceGroups, 'dmc_group_cluster_master') ||
                                _.contains(instanceGroups, 'dmc_group_shc_deployer') ||
                                _.contains(instanceGroups, 'dmc_group_deployment_server')) {

                                instanceModel.entry.content.get('role').push('auxiliary');
                            }

                            _.each(
                                _.without(instanceGroups, ['dmc_group_search_head', 'dmc_group_indexer']),
                                function(group) {
                                    instanceModel.entry.content.get('management_roles').push(group.replace(/^dmc_group_/,''));
                                },
                                this
                            );

                            instanceModel.entry.content.set('is_local', isLocalCell === 1);

                            // This is actually useful
                            instanceModel.getContentLabel = function(key, useIcons) {
                                var value = this.entry.content.get(key),
                                    keyFormatter = Formatters[key];

                                if (!_.isUndefined(keyFormatter)) {
                                    return keyFormatter(value, !!useIcons);
                                } else {
                                    return value;
                                }
                            };
                            instanceModel.getServerRoleToString = PeerModel.prototype.getServerRoleToString;
                            instanceModel.getServerRoleI18n = PeerModel.prototype.getServerRoleI18n;

                            if (results.hostwideResource.hasData()) {
                                var cpuIndex = allHostwideResources.fields.indexOf('cpu_system_pct'),
                                    memIndex = allHostwideResources.fields.indexOf('mem_used'),
                                    hostwideResourceServerIndex = allHostwideResources.fields.indexOf('splunk_server'),
                                    hostwideResourceRow = _.find(allHostwideResources.rows, function(row) {
                                        return row[hostwideResourceServerIndex] === instanceServerName;
                                    });

                                if (hostwideResourceRow) {
                                    instanceModel.entry.content.set({
                                        'cpu_system_pct': +hostwideResourceRow[cpuIndex] || 0,
                                        'mem_used': +hostwideResourceRow[memIndex] || 0
                                    });
                                }
                            }

                            if (results.indexerIntrospection.hasData()) {
                                var indexingRateIndex = allIndexerInstrospections.fields.indexOf('indexing_rate'),
                                    indexerIntrospectionServerIndex = allIndexerInstrospections.fields.indexOf('splunk_server'),
                                    indexerIntrospectionRow = _.find(allIndexerInstrospections.rows, function(row) {
                                        return row[indexerIntrospectionServerIndex] === instanceServerName;
                                    });

                                if (indexerIntrospectionRow) {
                                    instanceModel.entry.content.set({
                                        'indexing_rate': +indexerIntrospectionRow[indexingRateIndex] || 0
                                    });
                                }
                            }

                            if (results.searchProcesses.hasData()) {
                                var searchConcurrencyIndex = allSearchProcesses.fields.indexOf('search_concurrency'),
                                    searchProcessesServerIndex = allSearchProcesses.fields.indexOf('splunk_server'),
                                    searchProcessesRow = _.find(allSearchProcesses.rows, function(row) {
                                        return row[searchProcessesServerIndex] === instanceServerName;
                                    });

                                if (searchProcessesRow) {
                                    instanceModel.entry.content.set({
                                        'search_concurrency': +searchProcessesRow[searchConcurrencyIndex] || 0
                                    });
                                }
                            }

                            if (results.peersEndpoint.hasData()) {
                                var peersEndpointUpDownStatusIndex = allPeerEndpointData.fields.indexOf('up_down_status'),
                                    peersEndpointServerIndex = allPeerEndpointData.fields.indexOf('splunk_server'),
                                    peersEndpointOsNameIndex = allPeerEndpointData.fields.indexOf('os_name'),
                                    peersEndpointOsVersionIndex = allPeerEndpointData.fields.indexOf('os_version'),
                                    peersEndpointNumberOfCoresIndex = allPeerEndpointData.fields.indexOf('numberOfCores'),
                                    peersEndpointNumberOfVirtualCoresIndex = allPeerEndpointData.fields.indexOf('numberOfVirtualCores'),
                                    peersEndpointPhysicalMemoryMBIndex = allPeerEndpointData.fields.indexOf('physicalMemoryMB'),
                                    peersEndpointVersionIndex = allPeerEndpointData.fields.indexOf('version'),
                                    peersEndpointCpuArchIndex = allPeerEndpointData.fields.indexOf('cpu_arch'),
                                    peersEndpointRow = _.find(allPeerEndpointData.rows, function(row) {
                                        return row[peersEndpointServerIndex] === instanceServerName;
                                    });

                                if (peersEndpointRow) {
                                    instanceModel.entry.content.set({
                                        'up_down_status': +peersEndpointRow[peersEndpointUpDownStatusIndex] || 0,
                                        'os_name': peersEndpointRow[peersEndpointOsNameIndex] || '',
                                        'os_version': peersEndpointRow[peersEndpointOsVersionIndex] || '',
                                        'numberOfCores': peersEndpointRow[peersEndpointNumberOfCoresIndex] || '',
                                        'numberOfVirtualCores': peersEndpointRow[peersEndpointNumberOfVirtualCoresIndex] || '',
                                        'physicalMemoryMB': peersEndpointRow[peersEndpointPhysicalMemoryMBIndex] || 0,
                                        'version': peersEndpointRow[peersEndpointVersionIndex] || '',
                                        'cpu_arch': peersEndpointRow[peersEndpointCpuArchIndex] || ''
                                    });
                                } else {
                                    // There will be a peersEndpointRow in the case of a "down" instance, however,
                                    // due to poor backend, splunk_server does not return the splunk server name; rather
                                    // the DNS name. So we cannot dereference its true value.
                                    instanceModel.entry.content.set({
                                        'up_down_status': 0
                                    });
                                }

                                // caveat. if it's the local instance, it's up. duh.
                                if (instanceModel.entry.content.get('is_local')) {
                                    instanceModel.entry.content.set('up_down_status', 1);
                                }
                            }

                            if (results.localInstanceInfo.hasData() &&
                                instanceModel.entry.content.get('is_local')) {

                                var localInstanceOsNameIndex = allLocalInstanceInfoData.fields.indexOf('os_name'),
                                    localInstanceOsVersionIndex = allLocalInstanceInfoData.fields.indexOf('os_version'),
                                    localInstanceNumberOfCoresIndex = allLocalInstanceInfoData.fields.indexOf('numberOfCores'),
                                    localInstanceNumberOfVirtualCoresIndex = allLocalInstanceInfoData.fields.indexOf('numberOfVirtualCores'),
                                    localInstancePhysicalMemoryMBIndex = allLocalInstanceInfoData.fields.indexOf('physicalMemoryMB'),
                                    localInstanceVersionIndex = allLocalInstanceInfoData.fields.indexOf('version'),
                                    localInstanceCpuArchIndex = allLocalInstanceInfoData.fields.indexOf('cpu_arch'),
                                    localInstanceRow = allLocalInstanceInfoData.rows[0];

                                if (localInstanceRow) {
                                    instanceModel.entry.content.set({
                                        'os_name': localInstanceRow[localInstanceOsNameIndex],
                                        'os_version': localInstanceRow[localInstanceOsVersionIndex],
                                        'numberOfCores': localInstanceRow[localInstanceNumberOfCoresIndex],
                                        'numberOfVirtualCores': localInstanceRow[localInstanceNumberOfVirtualCoresIndex],
                                        'physicalMemoryMB': localInstanceRow[localInstancePhysicalMemoryMBIndex],
                                        'version': localInstanceRow[localInstanceVersionIndex],
                                        'cpu_arch': localInstanceRow[localInstanceCpuArchIndex]
                                    });
                                }
                            }

                            if (results.clusterGroup.hasData()) {
                                var clusterGroupIndex = allClusterGroupings.fields.indexOf('group');
                                var clusterGroupServersIndex = allClusterGroupings.fields.indexOf('servers');
                                _.each(allClusterGroupings.rows, function(clusterGroup) {
                                    var groupName = clusterGroup[clusterGroupIndex].substr('dmc_indexerclustergroup_'.length);
                                    var servers = clusterGroup[clusterGroupServersIndex];
                                    servers = _.isArray(servers) ? servers : [servers];

                                    if (_.contains(servers, instanceServerName)) {
                                        instanceModel.entry.content.get('indexerClusters').push(groupName);
                                    }
                                });
                            }

                            if (results.shcGroup.hasData()) {
                                var shcGroupIndex = allShcGroupings.fields.indexOf('group');
                                var shcServersIndex = allShcGroupings.fields.indexOf('servers');
                                _.each(allShcGroupings.rows, function(shcGroup) {
                                    var groupName = shcGroup[shcGroupIndex].substr('dmc_searchheadclustergroup_'.length);
                                    var servers = shcGroup[shcServersIndex];
                                    servers = _.isArray(servers) ? servers : [servers];

                                    if (_.contains(servers, instanceServerName)) {
                                        instanceModel.entry.content.get('searchHeadClusters').push(groupName);
                                    }
                                });
                            }

                            // Distributed searches
                            if (results.relationships.hasData()) {
                                var indexerIndex = allRelationships.fields.indexOf('indexer');
                                var searchHeadIndex = allRelationships.fields.indexOf('search_head');
                                _.each(allRelationships.rows, function(distsearchRelationship) {
                                    var indexer = distsearchRelationship[indexerIndex];
                                    var searchHead = distsearchRelationship[searchHeadIndex];
                                    var searchedByList = instanceModel.entry.content.get('searchedBy');
                                    var distributesSearchesToList = instanceModel.entry.content.get('distributesSearchesTo');

                                    if (instanceServerName === indexer &&
                                        !_.contains(searchedByList, searchHead)) {

                                        searchedByList.push(searchHead);
                                    }
                                    if (instanceServerName === searchHead &&
                                        !_.contains(distributesSearchesToList, indexer)) {

                                        distributesSearchesToList.push(indexer);
                                    }
                                });
                            }

                            if (results.customGroup.hasData()) {
                                var groupIndex = allCustomGroupings.fields.indexOf('group');
                                var cgServersIndex = allCustomGroupings.fields.indexOf('servers');
                                _.each(allCustomGroupings.rows, function(customGroup) {
                                    var groupName = customGroup[groupIndex].substr('dmc_customgroup_'.length);
                                    var servers = customGroup[cgServersIndex];
                                    servers = _.isArray(servers) ? servers : [servers];

                                    if (_.contains(servers, instanceServerName)) {
                                        instanceModel.entry.content.get('customGroups').push(groupName);
                                    }
                                });
                            }


                            instanceModels.push(instanceModel);

                        }, this);
                    }


                    // START BLOCK MOCK
                    // // Do some mocking
                    // var mockModels = [];
                    // var mockFactor = 30;
                    // for (var i = 0; i < mockFactor; i++) {
                    //     mockModels = mockModels.concat(_.map(instanceModels, function(model) {
                    //         // Nested clone :(
                    //         var contentClone = model.entry.content.clone();
                    //         var entryClone = model.entry.clone();
                    //         var modelClone = model.clone();
                    //         var newServerName = model.entry.content.get('serverName') + i;

                    //         modelClone.set('id', newServerName);
                    //         modelClone.entry = entryClone;
                    //         modelClone.entry.content = contentClone;

                    //         modelClone.entry.content.set({
                    //             serverName: newServerName,
                    //             indexerClusters: _.clone(model.entry.content.get('indexerClusters')),
                    //             searchHeadClusters: _.clone(model.entry.content.get('searchHeadClusters')),
                    //             distributesSearchesTo: _.map(model.entry.content.get('distributesSearchesTo'), function(indexer) {
                    //                 return indexer + i;
                    //             }),
                    //             searchedBy: _.map(model.entry.content.get('searchedBy'), function(sh) {
                    //                 return sh + i;
                    //             })
                    //         });
                    //         modelClone.getContentLabel = model.getContentLabel;
                    //         return modelClone;
                    //     }));
                    // }
                    // instanceModels = instanceModels.concat(mockModels);

                    // // optional: make them all connected:
                    // var searchHeads = _.filter(instanceModels, function(m) { return m.entry.content.get('role') === 'search_head'; });
                    // var indexers = _.filter(instanceModels, function(m) { return m.entry.content.get('role') === 'indexer'; });
                    // var iCleared = {};
                    // _.each(searchHeads, function(sh) {
                    //     sh.entry.content.set('distributesSearchesTo', []);
                    //     _.each(indexers, function(i) {
                    //         if (!_.has(iCleared, i.get('id'))) {
                    //             i.entry.content.set('searchedBy', []);
                    //             iCleared[i.get('id')] = 1;
                    //         }
                    //         i.entry.content.get('searchedBy').push(sh.get('id'));
                    //         sh.entry.content.get('distributesSearchesTo').push(i.get('id'));
                    //     });
                    // });
                    // END BLOCK MOCK



                    // now apply the filters


                    instanceModels = _.filter(instanceModels, function(model) {
                        if (options.relatedTo !== '') {
                            var pivotServer = options.relatedTo,
                                isDistributer = _.contains(
                                    model.entry.content.get('distributesSearchesTo'),
                                    pivotServer
                                ),
                                isSearchedBy = _.contains(
                                    model.entry.content.get('searchedBy'),
                                    pivotServer
                                ),
                                isPivotServer = model.entry.content.get('serverName') === pivotServer;

                            if (!isDistributer && !isSearchedBy && !isPivotServer) {
                                return false;
                            }
                        }

                        if (options.role && options.role !== '*') {
                            var role = model.entry.content.get('role');
                            if (!_.contains(role, options.role)) {
                                return false;
                            }
                        }

                        if (_.isArray(options.managementRoles) && options.managementRoles.length > 0) {
                            if (_.intersection(model.entry.content.get('management_roles'), options.managementRoles).length === 0) {
                                return false;
                            }
                        }

                        if (_.isString(options.search) && options.search !== '') {
                            // Crappy search implementation:

                            var components = [],
                                searchPassed = true;

                            if (options.search.indexOf(' AND ') !== -1) {
                                components = options.search.split(' AND ');
                            } else {
                                components = [options.search];
                            }

                            _.each(components, function(component) {
                                if (searchPassed) {
                                    component = component.replace(/^\(+/,'').replace(/\)+$/, '');

                                    if (component === SPECIAL_RANGE_BAIL_SEARCH) {
                                        return; // Skip it, deal with it in the range stuff later.
                                    }

                                    if (component.indexOf('>') === -1 &&
                                        component.indexOf('<') === -1 &&
                                        component.indexOf('=') !== -1 &&
                                        component.indexOf(SPECIAL_UNKNOWN_RANGE_SEARCH_PREFIX) !== 0) {

                                        // Only supports one KV pair right now
                                        var searchSplit = component.split('='),
                                            key = searchSplit[0],
                                            value = searchSplit[1].replace(/^['"]/, '').replace(/['"$]/, ''),
                                            // Magical JS regex escape:
                                            valueEscaped = value.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&"),
                                            rex = new RegExp(
                                                valueEscaped.replace(/\*/g,'.*'),
                                                _.contains(CASE_INSENSITIVE_PROPERTIES, key) ? 'i' : ''
                                            ),
                                            modelValue = model.entry.content.get(key),
                                            matchesSearch = function(v) {
                                                if (_.contains(STRICT_MATCH_PROPERTIES, key)) {
                                                    return v === value;
                                                } else {
                                                    return rex.test(v);
                                                }
                                            };

                                        if (_.isArray(modelValue)) {
                                            searchPassed = _.reduce(
                                                modelValue,
                                                function(memo, mv) {
                                                    return memo || matchesSearch(mv);
                                                },
                                                false,
                                                this
                                            );
                                        } else {
                                            if (!matchesSearch(modelValue)) {
                                                searchPassed = false;
                                            }
                                        }
                                    }
                                }
                            }, this);

                            if (!searchPassed) {
                                return false;
                            }
                        }

                        return true;
                    }, this);


                    if (options['meta.rangeBuckets'] !== null) {
                        var rangeCounts = {};
                        _.each(_.pairs(options['meta.rangeBuckets']), function(pair) {
                            var key = pair[0], ranges = pair[1];

                            rangeCounts[key] = _.countBy(instanceModels, function(instance) {
                                var value = instance.entry.content.get(key),
                                    inRange = 'default';

                                if (value === null) {
                                    inRange = 'unknown';
                                } else {
                                    _.each(ranges, function(range) {
                                        if (range !== 'default') {
                                            var rangeSplit = range.split('-'),
                                                lower = +rangeSplit[0],
                                                upper = +rangeSplit[1];

                                            if (value >= lower && value <= upper) {
                                                inRange = range;
                                            }
                                        }
                                    }, this);
                                }

                                return inRange;
                            }, this);
                        }, this);
                        this.meta.set('rangeCounts', rangeCounts);
                    }

                    // Compute some stats
                    _.each(
                        [
                            'cpu_system_pct',
                            'mem_used',
                            'indexing_rate',
                            'search_concurrency'
                        ],
                        function(statsMetric) {
                            var instancesWithDefinedValues = _.filter(instanceModels, function(model) {
                                    return model.entry.content.get(statsMetric) !== null;
                                }),
                                metricSum = _.reduce(
                                    instancesWithDefinedValues,
                                    function(memo, model) {
                                        return memo + model.entry.content.get(statsMetric);
                                    },
                                    0,
                                    this
                                );

                            if (instancesWithDefinedValues.length > 0) {
                                if (statsMetric === 'indexing_rate') {
                                    var totalLabel, averageLabel;
                                    if (metricSum > 1024) {
                                        totalLabel = (metricSum / 1024).toFixed(2) + " MB/s";
                                    } else {
                                        totalLabel = metricSum + " KB/s";
                                    }
                                    var average = (metricSum / instancesWithDefinedValues.length).toFixed(2);
                                    if (average > 1024) {
                                        averageLabel = (average / 1024).toFixed(2) + " MB/s";
                                    } else {
                                        averageLabel = average + " KB/s";
                                    }
                                    this.meta.set('stats.total.' + statsMetric, totalLabel);
                                    this.meta.set('stats.avg.' + statsMetric, averageLabel);
                                } else if (statsMetric === 'search_concurrency') {
                                    this.meta.set('stats.total.' + statsMetric, metricSum);
                                    this.meta.set('stats.avg.' + statsMetric, Math.round(metricSum / instancesWithDefinedValues.length));
                                } else {
                                    this.meta.set('stats.avg.' + statsMetric, metricSum / instancesWithDefinedValues.length);
                                }
                            }
                        },
                        this
                    );

                    // This is a strange special case - because rangeCounts need to be computed on
                    // every filter except this range filter, this filter needs to be deferred to here.
                    instanceModels = _.filter(instanceModels, function(model) {
                        if (_.isString(options.search) && options.search !== '') {
                            // Crappy search implementation:

                            var components = [],
                                searchPassed = false,
                                atLeastOneRange = false,
                                rangeBail = false;

                            if (options.search.indexOf(' AND ') !== -1) {
                                components = options.search.split(' AND ');
                            } else {
                                components = [options.search];
                            }

                            _.each(components, function(component) {
                                var orComponents = [];

                                // Get rid of leading and trailing parens
                                component = component.replace(/^\(+/,'').replace(/\)+$/, '');

                                if (component === SPECIAL_RANGE_BAIL_SEARCH) {
                                    rangeBail = true;
                                    atLeastOneRange = true;
                                }

                                // If it is actually a range command...
                                if (component.indexOf('<=') !== -1 ||
                                    component.indexOf('>=') !== -1 ||
                                    component.indexOf('>') !== -1 ||
                                    component.indexOf(SPECIAL_UNKNOWN_RANGE_SEARCH_PREFIX) === 0) {

                                    atLeastOneRange = true;

                                    // Now, it might be split on ORs
                                    orComponents = component.split(' OR ');

                                    _.each(orComponents, function(orComponent) {
                                        // Get rid of leading and trailing parens
                                        orComponent = orComponent.replace(/^\(+/,'').replace(/\)+$/, '');

                                        if (orComponent.indexOf('<=') !== -1 ||
                                            orComponent.indexOf('>=') !== -1) {

                                            // This really only supports a basic range...
                                            var commandParts = orComponent.split(/\s+/g),
                                                lower = 0,
                                                upper = 0,
                                                rangeKey;

                                            //ASSERT 2 command parts
                                            _.each(commandParts, function(commandPart) {
                                                var split;
                                                if (commandPart.indexOf('<=') !== -1) {
                                                    split = commandPart.split(/<=/);
                                                    rangeKey = split[0];
                                                    upper = +split[1];

                                                } else if (commandPart.indexOf('>=') !== -1) {
                                                    split = commandPart.split(/>=/);
                                                    rangeKey = split[0];
                                                    lower = +split[1];
                                                }
                                            }, this);

                                            var rangeValue = model.entry.content.get(rangeKey);
                                            searchPassed = searchPassed ||
                                                (rangeValue !== null && rangeValue >= lower && rangeValue <= upper);
                                        } else if (orComponent.indexOf('>') !== -1) {
                                            var gtSplit = orComponent.split('>'),
                                                gtKey = gtSplit[0],
                                                gtValue = gtSplit[1],
                                                gtModelValue = model.entry.content.get(gtKey);

                                            searchPassed = searchPassed || (gtModelValue !== null && gtModelValue > gtValue);
                                        } else if (orComponent.indexOf(SPECIAL_UNKNOWN_RANGE_SEARCH_PREFIX) === 0) {
                                            var unknownMetric = orComponent.substr(SPECIAL_UNKNOWN_RANGE_SEARCH_PREFIX.length);

                                            searchPassed = searchPassed || (model.entry.content.get(unknownMetric) === null);
                                        }
                                    }, this);
                                }
                            }, this);

                            if (atLeastOneRange && (rangeBail || !searchPassed)) {
                                return false;
                            }
                        }

                        return true;
                    }, this);

                    if (_.isArray(options.sortKey) && options.sortKey.length > 0) {
                        // Only supporting one sort level for now
                        instanceModels = _.sortBy(instanceModels, function(model) {
                            var value = model.entry.content.get(options.sortKey[0]);
                            if (value === null) {
                                return -Number.MAX_VALUE;
                            } else {
                                return value;
                            }
                        });
                    }
                    if (options.sortDir === 'desc') {
                        instanceModels.reverse();
                    }

                    var totalCount = instanceModels.length,
                        previousInstanceModels = [],
                        nextInstanceModels = [];

                    if (options.count > 0) {
                        previousInstanceModels = instanceModels.slice(0, options.offset);
                        nextInstanceModels = instanceModels.slice(options.offset + options.count);
                        instanceModels = instanceModels.slice(options.offset, options.offset + options.count);
                    } else {
                        instanceModels = instanceModels.slice(options.offset);
                    }

                    this.paging.set({
                        total: totalCount,
                        perPage: options.count,
                        offset: options.offset
                    });
                    this.paging.meta.set({
                        previousServerNames: _.map(previousInstanceModels, function(model) {
                            return model.entry.content.get('serverName');
                        }),
                        nextServerNames: _.map(nextInstanceModels, function(model) {
                            return model.entry.content.get('serverName');
                        }),
                        previousSearchedBy: _.uniq(
                            _.flatten(
                                _.map(previousInstanceModels, function(model) {
                                    return model.entry.content.get('searchedBy');
                                })
                            )
                        ),
                        nextSearchedBy: _.uniq(
                            _.flatten(
                                _.map(nextInstanceModels, function(model) {
                                    return model.entry.content.get('searchedBy');
                                })
                            )
                        ),
                        previousDistributedSearchesTo: _.uniq(
                            _.flatten(
                                _.map(previousInstanceModels, function(model) {
                                    return model.entry.content.get('distributesSearchesTo');
                                })
                            )
                        ),
                        nextDistributesSearchesTo: _.uniq(
                            _.flatten(
                                _.map(nextInstanceModels, function(model) {
                                    return model.entry.content.get('distributesSearchesTo');
                                })
                            )
                        )
                    });

                    this.reset(instanceModels);
                    this.trigger('sync');
                }.bind(this));
            }
        });
    }
);

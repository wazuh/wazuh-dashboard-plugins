define(
    [
        'jquery',
        'underscore',
        '@splunk/swc-mc',
        'splunk_monitoring_console/collections/DistsearchGroups',
        'splunk_monitoring_console/views/overview/distributed_mode/Master',
        'splunk_monitoring_console/views/overview/standalone_mode/Master',
        'module'
    ],
    function(
        $,
        _,
        SwcMC,
        DistsearchGroupsCollection,
        DistributedModeView,
        StandaloneModeView,
        module
    ) {
        return SwcMC.BaseRouter.extend({
            initialize: function() {
                SwcMC.BaseRouter.prototype.initialize.apply(this, arguments);
                this.setPageTitle(_('Overview').t());
                this.loadingMessage = _('Loading...').t();
                this.fetchVisualizations = true;
                this.fetchVisualizationFormatters = false;
                this.collection.distSearchGroups = new DistsearchGroupsCollection();

                this.deferreds.distSearchGroupsDfd = new Promise(function (resolve, reject) {
                    this.collection.distSearchGroups.fetch({
                        data: {
                            search: 'name=dmc_*'
                        }
                    }).done(function() {
                        resolve();
                    }.bind(this));
                }.bind(this));
            },
            page: function(locale, app, page) {
                SwcMC.BaseRouter.prototype.page.apply(this, arguments);
                this.deferreds.pageViewRendered.done(function(){
                    if (this.shouldRender) {
                        $('.preload').replaceWith(this.pageView.el);
                        this._createView();
                    }
                }.bind(this));
            },
            _prepareDistributedModeSearches: function() {
                this.searchManager = this.searchManager || {};
                // Note that setting a splunk_server_group to a dmc_group is equivalent to looking for it in the asset table
                this.searchManager.instanceMachineCountSearch = new SwcMC.SearchManager({
                    search: '| localop ' +
                        '| inputlookup dmc_assets ' +
                        '| stats dc(serverName) as instance_count dc(machine) as machine_count by search_group ' +
                        '| where match(search_group,"dmc_group_") ' +
                        '| eval count = "count" ' +
                        '| chart format=$VAL$_$AGG$ values(instance_count) AS instance_count values(machine_count) AS machine_count over count by search_group'
                });

                // RESOURCE USAGE SEARCHES

                // Note that setting a splunk_server_group to a dmc_group is equivalent to looking for it in the asset table
                this.searchManager.resourceUsageSearch = new SwcMC.SearchManager({
                    search: '| inputlookup dmc_assets ' +
                        '| join type=outer serverName [ ' +
                        '| rest splunk_server_group=dmc_group_* /services/server/status/resource-usage/hostwide ' +
                        '| eval cpu_pct = cpu_system_pct + cpu_user_pct ' +
                        '| eval mem_used_pct = mem_used / mem * 100 ' +
                        '| fields cpu_pct mem_used_pct splunk_server ' +
                        '| rename splunk_server as serverName ' +
                        '] ' +
                        '| join type=outer peerURI [ ' +
                        '| rest splunk_server=local /services/search/distributed/peers ' +
                        '| fields title status ' +
                        '| rename title as peerURI ' +
                        '] ' +
                        '| eval status=if(((status!="Up") OR isnull(status)) AND (peerURI!="localhost"), 1, 0) ' +
                        '| stats dc(serverName) as instances dc(machine) as machines sum(status) as num_down avg(cpu_pct) as cpu avg(mem_used_pct) as mem by search_group ' +
                        '| eval cpu=round(cpu, 2) ' +
                        '| eval mem=round(mem, 2)'
                });

                this.searchManager.indexersPostProcess = new SwcMC.PostProcessManager({
                    search: 'search search_group="dmc_group_indexer"',
                    managerid: this.searchManager.resourceUsageSearch.id
                });

                this.searchManager.searchHeadsPostProcess = new SwcMC.PostProcessManager({
                    search: 'search search_group="dmc_group_search_head"',
                    managerid: this.searchManager.resourceUsageSearch.id
                });

                this.searchManager.clusterMastersPostProcess = new SwcMC.PostProcessManager({
                    search: 'search search_group="dmc_group_cluster_master"',
                    managerid: this.searchManager.resourceUsageSearch.id
                });

                this.searchManager.licenseMastersPostProcess = new SwcMC.PostProcessManager({
                    search: 'search search_group="dmc_group_license_master"',
                    managerid: this.searchManager.resourceUsageSearch.id
                });

                this.searchManager.deploymentServersPostProcess = new SwcMC.PostProcessManager({
                    search: 'search search_group="dmc_group_deployment_server"',
                    managerid: this.searchManager.resourceUsageSearch.id
                });

                // CLUSTER MASTER SEARCHES
                this.searchManager.clusterPeersAndBucketsSearch = new SwcMC.SearchManager({
                    search: '| rest splunk_server_group=dmc_group_cluster_master /services/cluster/master/peers'
                });

                this.searchManager.clusterIndexesAndBucketSizesSearch = new SwcMC.SearchManager({
                    search: '| rest splunk_server_group=dmc_group_cluster_master /services/cluster/master/indexes'
                });

                this.searchManager.peersSearchableSearch = new SwcMC.PostProcessManager({
                    search: 'search is_searchable = 1 | stats count',
                    managerid: this.searchManager.clusterPeersAndBucketsSearch.id
                });

                this.searchManager.bucketsCountSearch = new SwcMC.PostProcessManager({
                    search: 'stats sum(bucket_count) as total_buckets',
                    managerid: this.searchManager.clusterPeersAndBucketsSearch.id
                });

                this.searchManager.indexesSearchableSearch = new SwcMC.PostProcessManager({
                    search: 'search is_searchable = 1 | stats count',
                    managerid: this.searchManager.clusterIndexesAndBucketSizesSearch.id
                });

                this.searchManager.totalBucketSizeSearch = new SwcMC.PostProcessManager({
                    search: ' eval index_size = round(index_size / 1024 / 1024 / 1024, 2) | stats sum(index_size) as total_index_size_gb | eval total_index_size_gb = total_index_size_gb." GB"',
                    managerid: this.searchManager.clusterIndexesAndBucketSizesSearch.id
                });

                // LICENSE MASTER SEARCHES
                this.searchManager.licenseMasterUsageSearch = new SwcMC.SearchManager({
                    search: '| rest splunk_server_group=dmc_group_license_master /services/licenser/pools ' +
                        '| join type=outer stack_id splunk_server [ ' +
                            'rest splunk_server_group=dmc_group_license_master /services/licenser/groups ' +
                            '| mvexpand stack_ids' +
                            '| search is_active=1 ' +
                            '| eval stack_id = stack_ids ' +
                            '| fields splunk_server stack_id is_active] ' +
                        '| search is_active=1 ' +
                        '| stats sum(used_bytes) AS used_bytes by splunk_server, stack_id ' +
                        '| join type=outer stack_id splunk_server [ ' +
                            'rest splunk_server_group=dmc_group_license_master /services/licenser/stacks ' +
                            '| eval stack_id = title ' +
                            '| eval stack_quota = quota ' +
                            '| stats sum(stack_quota) AS stack_quota by splunk_server, stack_id] ' +
                        '| stats sum(used_bytes) as used_bytes sum(stack_quota) as stack_quota ' +
                        '| eval usedMB  = round(used_bytes/1024/1024, 0) ' +
                        '| eval usedGB  = round(used_bytes/1024/1024/1024, 2) ' +
                        '| eval totalMB = round(stack_quota/1024/1024, 0) ' +
                        '| eval totalGB = round(stack_quota/1024/1024/1024, 2) ' +
                        '| eval used  = if(totalMB > 1024, usedGB, usedMB) ' +
                        '| eval total = if(totalMB > 1024, totalGB, totalMB) ' +
                        '| eval unit  = if(totalMB > 1024, "GB", "MB") ' +
                        '| eval usage_pct = round(used / total, 3)*100 ' +
                        '| eval output = used. " / " .total." ".unit ' +
                        '| fields usage_pct, output'
                });

                this.searchManager.licenseMasterWarningSearch = new SwcMC.SearchManager({
                    search: '| rest splunk_server_group=dmc_group_license_master /services/licenser/peers ' +
                    '| mvexpand active_pool_ids ' +
                    '| where warning_count>0 ' +
                    '| eval pool=active_pool_ids ' +
                    '| join type=outer pool [rest splunk_server_group=dmc_group_license_master /services/licenser/pools ' +
                        '| eval pool=title ' +
                        '| fields pool stack_id] ' +
                    '| eval in_violation=if(warning_count>4 OR (warning_count>2 AND stack_id=="free"),"yes","no") ' +
                    '| fields label, title, pool, warning_count, in_violation ' +
                    '| fields - _timediff ' +
                    '| rename label as "Peer" title as "GUID" pool as "Pool" warning_count as "Hard Warnings" in_violation AS "In Violation?" ' +
                    '| stats count'
                });

                // DEPLOYMENT SERVER SEARCHES
                this.searchManager.deploymentServerClientCountSearch = new SwcMC.SearchManager({
                    search: '| rest splunk_server_group=dmc_group_deployment_server /services/deployment/server/clients | stats count'
                });

                this.searchManager.deploymentServerAppCountSearch = new SwcMC.SearchManager({
                    search: '| rest splunk_server_group=dmc_group_deployment_server /services/deployment/server/applications | stats count'
                });
            },
            _prepareStandaloneModeSearches: function() {
                this.searchManager = this.searchManager || {};

                this.searchManager.resourceUsageByProcessSearch = new SwcMC.SearchManager({
                    search: '| rest splunk_server=local /services/server/status/resource-usage/splunk-processes' +
'| eval sid = \'search_props.sid\' ' +
'| `dmc_classify_processes`' +
'| eval x="cpu_usage" | stats sum(pct_memory) as mem_used sum(normalized_pct_cpu) as cpu_used by process_class' +
'| append [' +
'| rest splunk_server=local /services/server/status/resource-usage/hostwide ' +
'| fields cpu_idle_pct mem mem_used ' +
'| eval mem_idle_pct=round((mem-mem_used)/mem,2)*100 ' +
'| fields - mem mem_used ' +
'| eval cpu_system_pct=0 ' +
'| eval mem_system_pct=0 ' +
'| transpose ' +
'| eval process_class=if(column="cpu_idle_pct" OR column="mem_idle_pct","Idle","Non-Splunk processes") ' +
'| rename "row 1" as value ' +
'| eval mem_used=if(column="mem_idle_pct" OR column="mem_system_pct",value,NULL) ' +
'| eval cpu_used=if(column="cpu_idle_pct" OR column="cpu_system_pct",value,NULL) ' +
'| stats first(cpu_used) as cpu_used first(mem_used) as mem_used by process_class' +
'] ' +
'| eventstats sum(mem_used) as sum_mem_used sum(cpu_used) as sum_cpu_used ' +
'| eval mem_used=if(process_class="Non-Splunk processes",100-sum_mem_used,mem_used) ' +
'| eval cpu_used=if(process_class="Non-Splunk processes",100-sum_cpu_used,cpu_used)'
                });

                this.searchManager.totalCpuMemUsageSearch = new SwcMC.PostProcessManager({
                    managerid: this.searchManager.resourceUsageByProcessSearch.id,
                    search: '| search process_class="Idle" | eval total_cpu=(100-cpu_used)."%" | eval total_mem=(100-mem_used)."%" | eval total_splunk_cpu=(sum_cpu_used-cpu_used)."%" | eval total_splunk_mem=(sum_mem_used-mem_used)."%"'
                });

                this.searchManager.cpuResourceUsageSearch = new SwcMC.PostProcessManager({
                    managerid: this.searchManager.resourceUsageByProcessSearch.id,
                    search: '| fields process_class cpu_used'
                });

                this.searchManager.memResourceUsageSearch = new SwcMC.PostProcessManager({
                    managerid: this.searchManager.resourceUsageByProcessSearch.id,
                    search: '| fields process_class mem_used | eval process_class=if(process_class="Idle","Free",process_class)'
                });

                // INDEXING RATE
                this.searchManager.indexingRateSearch = new SwcMC.SearchManager({
                    search: '| rest splunk_server=local /services/server/introspection/indexer | fields average_KBps splunk_server | eval average_KBps=round(average_KBps,2)." KB/s"'
                });

                // DISK USAGE
                this.searchManager.diskUsageManager = new SwcMC.SearchManager({
                    search: '| rest splunk_server=local /services/server/status/partitions-space | eval free = if(isnotnull(available), available, free) | stats sum(capacity) as total_capacity sum(free) as total_free'
                });

                // Searches by type and total concurrent searches
                // TODO some parser error if i break this into multilines
                this.searchManager.searchCountByTypeSearch = new SwcMC.SearchManager({
                    search: '| rest splunk_server=local /services/server/status/resource-usage/splunk-processes | search search_props.sid=* | stats dc(search_props.sid) AS count by search_props.type | eventstats sum(count) as Total'
                });

                // LICENSE USAGE
                // TODO refactor
                this.searchManager.licenseUsageManager = new SwcMC.SearchManager({
                    search: '| rest splunk_server=local /services/licenser/pools | rename title AS Pool | search [rest splunk_server=local /services/licenser/groups | search is_active=1 | eval stack_id=stack_ids | fields stack_id] | join type=outer stack_id [rest splunk_server=local /services/licenser/stacks | eval stack_id=title | eval stack_quota=quota | fields stack_id stack_quota] | stats sum(used_bytes) as used max(stack_quota) as total | eval usedGB=round(used/1024/1024/1024,2) | eval totalGB=round(total/1024/1024/1024,2)'
                });

                // KVSTORE: if there's no kv_store role, just removed the corresponding DOM
                this.searchManager.kvStoreRoleSearch = new SwcMC.SearchManager({
                    id: 'kv-store-role-search',
                    search: '| inputlookup dmc_assets | search search_group = "dmc_group_kv_store"'
                });

                // KVSTORE SEARCHES
                this.searchManager.kvStoreCollectionInfoSearch = new SwcMC.SearchManager({
                    search: '| rest splunk_server=local /services/server/introspection/kvstore/collectionstats ' +
                    '| mvexpand data ' +
                    '| spath input=data ' +
                    '| fields splunk_server, ns, size'
                });

                this.searchManager.kvStoreCollectionSizeSearch = new SwcMC.PostProcessManager({
                    search: ' stats sum(size) as size | eval sizeMB = round(size/1024/1024, 2)',
                    managerid: this.searchManager.kvStoreCollectionInfoSearch.id
                });

                this.searchManager.kvStoreCollectionCountSearch = new SwcMC.PostProcessManager({
                    search: ' stats dc(ns) as collections',
                    managerid: this.searchManager.kvStoreCollectionInfoSearch.id
                });
            },
            _createView: function() {
                if (this.model.appLocal.entry.content.get('configured') == '1') {  // distributed mode
                    this._prepareDistributedModeSearches();
                    this.masterView = new DistributedModeView({
                        searchManager: this.searchManager,
                        deferreds: this.deferreds,
                        model: this.model,
                        collection: this.collection
                    });
                    $('.main-section-body').html(this.masterView.render().$el);
                }
                else {  // standalone mode
                    this.model.serverInfoModel = new SwcMC.ServerInfoModel();
                    this.model.serverInfoModel.fetch().done(function() {
                        this._prepareStandaloneModeSearches();
                        this.masterView = new StandaloneModeView({
                            searchManager: this.searchManager,
                            deferreds: this.deferreds,
                            model: this.model,
                            collection: this.collection
                        });
                        $('.main-section-body').html(this.masterView.render().$el);
                    }.bind(this));
                }
            }
        });
    }
);

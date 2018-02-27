const app        = require('ui/modules').get('app/wazuh', []);
const beautifier = require('plugins/wazuh/utils/json-beautifier');

app.controller('agentsController',
function ($scope, $location, $q, $rootScope, appState, genericReq, apiReq, AgentsAutoComplete, errorHandler) {
    $rootScope.page = 'agents';
    $scope.extensions = appState.getExtensions().extensions;
    $scope.agentsAutoComplete = AgentsAutoComplete;

    // Check the url hash and retrieve the tabView information
    if ($location.search().tabView){
        $scope.tabView = $location.search().tabView;
    } else { // If tabView doesn't exist, default it to 'panels'
        $scope.tabView = "panels";
        $location.search("tabView", "panels");
    }

    // Check the url hash and retrivew the tab information
    if ($location.search().tab){
        $scope.tab = $location.search().tab;
    } else { // If tab doesn't exist, default it to 'general'
        $scope.tab = "general";
        $location.search("tab", "general");

        // Now we initialize the implicitFilter
        $rootScope.currentImplicitFilter = "";
    }


     // Metrics Audit
     let watcher8, watcher9, watcher10, watcher11;

     $scope.auditNewFiles      = '';
     $scope.auditReadFiles     = '';
     $scope.auditModifiedFiles = '';
     $scope.auditRemovedFiles  = '';
 
     const assignWatcher8 = () => {
         watcher8 = $scope.$watch(() => {
             return $('#Wazuh-App-Agents-Audit-New-files-metric > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
         }, (newVal, oldVal) => {
             if (newVal !== oldVal) {
                 $scope.auditNewFiles = newVal;
                 if (!$scope.$$phase) $scope.$digest();
             }
         });
     }
     const assignWatcher9 = () => {
         watcher9 = $scope.$watch(() => {
             return $('#Wazuh-App-Agents-Audit-Read-files-metric > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
         }, (newVal, oldVal) => {
             if (newVal !== oldVal) {
                 $scope.auditReadFiles = newVal;
                 if (!$scope.$$phase) $scope.$digest();
             }
         });
     }
 
     const assignWatcher10 = () => {
         watcher10 = $scope.$watch(() => {
             return $('#Wazuh-App-Agents-Audit-Modified-files-metric > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
         }, (newVal, oldVal) => {
             if (newVal !== oldVal) {
                 $scope.auditModifiedFiles = newVal;
                 if (!$scope.$$phase) $scope.$digest();
             }
         });
     }
 
     const assignWatcher11 = () => {
         watcher11 = $scope.$watch(() => {
             return $('#Wazuh-App-Agents-Audit-Removed-files-metric > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
         }, (newVal, oldVal) => {
             if (newVal !== oldVal) {
                 $scope.auditRemovedFiles = newVal;
                 if (!$scope.$$phase) $scope.$digest();
             }
         });
     }


         // Metrics Vulnerability Detector
    let watcher12, watcher13, watcher14, watcher15;

    $scope.vulnCritical = '';
    $scope.vulnHigh     = '';
    $scope.vulnMedium   = '';
    $scope.vulnLow      = '';

    const assignWatcher12 = () => {
        watcher12 = $scope.$watch(() => {
            return $('#Wazuh-App-Overview-VULS-Metric-Critical-severity > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.vulnCritical = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }
    const assignWatcher13 = () => {
        watcher13 = $scope.$watch(() => {
            return $('#Wazuh-App-Overview-VULS-Metric-High-severity > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.vulnHigh = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    const assignWatcher14 = () => {
        watcher14 = $scope.$watch(() => {
            return $('#Wazuh-App-Overview-VULS-Metric-Medium-severity > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.vulnMedium = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    const assignWatcher15 = () => {
        watcher15 = $scope.$watch(() => {
            return $('#Wazuh-App-Overview-VULS-Metric-Low-severity > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.vulnLow = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }


     const assignAuditMetrics = () => {
        assignWatcher8();
        assignWatcher9();
        assignWatcher10();
        assignWatcher11();
    }

    const destroyAuditMetrics = () => {
        watcher8();
        watcher9();
        watcher10();
        watcher11();
        watcher8 = null;
        watcher9 = null;
        watcher10 = null;
        watcher11 = null;
    }

    const assignVulnMetrics = () => {
        assignWatcher12();
        assignWatcher13();
        assignWatcher14();
        assignWatcher15();
    }

    const destroyVulnMetrics = () => {
        watcher12();
        watcher13();
        watcher14();
        watcher15();
        watcher12 = null;
        watcher13 = null;
        watcher14 = null;
        watcher15 = null;
    }

    if ($scope.tab === 'audit' && $scope.tabView === 'panels' && !watcher8) {
        assignAuditMetrics();
    }

    if ($scope.tab === 'vuls' && $scope.tabView === 'panels' && !watcher12) {
        assignVulnMetrics();
    }

    $rootScope.tabVisualizations = {
        general      : 7,
        fim          : 8,
        pm           : 4,
        vuls         : 7,
        oscap        : 13,
        audit        : 15,
        pci          : 3,
        virustotal   : 6,
        configuration: 0
    };

    // Object for matching nav items and Wazuh groups
    const tabFilters = {
        general   : { group: '' },
        fim       : { group: 'syscheck' },
        pm        : { group: 'rootcheck' },
        vuls      : { group: 'vulnerability-detector' },
        oscap     : { group: 'oscap' },
        audit     : { group: 'audit' },
        pci       : { group: 'pci_dss' },
        virustotal: { group: 'virustotal' }
    };

    // Switch subtab
    $scope.switchSubtab = subtab => {
        $scope.tabView = subtab;
        if($scope.tab === 'audit' && subtab === 'panels' && !watcher8){
            assignAuditMetrics();
        } else if(watcher8) {
            destroyAuditMetrics();
        }

                
        if($scope.tab === 'vuls' && subtab === 'panels' && !watcher12){
            assignVulnMetrics();
        } else if(watcher8) {
            destroyVulnMetrics();
        }
    }
    $scope.switchTab = tab => {

        if($scope.tab === tab) return;
        
        if(tab === 'audit' && $scope.tabView === 'panels' && !watcher8){
            assignAuditMetrics();
        } else if(watcher8) {
            destroyAuditMetrics();
        }

        if(tab === 'vuls' && $scope.tabView === 'panels' && !watcher12){
            assignVulnMetrics();
        } else if(watcher8) {
            destroyVulnMetrics();
        }

        if($rootScope.ownHandlers){
            for(let h of $rootScope.ownHandlers){
                h._scope.$destroy();
            }
        }
        $rootScope.ownHandlers = [];

        // Deleting app state traces in the url
        $location.search('_a', null);
        $scope.tabView = 'panels';

        $rootScope.loadedVisualizations = [];
    };

    // Watchers

    // We watch the resultState provided by the discover
    $scope.$watch('tabView', () => $location.search('tabView', $scope.tabView));
    $scope.$watch('tab', () => {
        $location.search('tab', $scope.tab);

        // Update the implicit filter
        if (typeof tabFilters[$scope.tab] !== 'undefined' && tabFilters[$scope.tab].group === "") $rootScope.currentImplicitFilter = "";
        else $rootScope.currentImplicitFilter = (typeof tabFilters[$scope.tab] !== 'undefined') ? tabFilters[$scope.tab].group : '';

        if($scope.tab === 'configuration'){
            firstLoad();
        }
    });

    // Agent data
    $scope.getAgentStatusClass = (agentStatus) => agentStatus === "Active" ? "green" : "red";

    $scope.formatAgentStatus = (agentStatus) => {
        return ['Active','Disconnected'].includes(agentStatus) ? agentStatus : 'Never connected';
    };

    const calculateMinutes = (start,end) => {
        let time    = new Date(start);
        let endTime = new Date(end);
        let minutes = ((endTime - time) / 1000) / 60;
        return minutes;
    }

    const validateRootCheck = () => {
        $scope.agent.rootcheck.duration = 'Unknown';
        if ($scope.agent.rootcheck.end && $scope.agent.rootcheck.start) {
            $scope.agent.rootcheck.duration = ((new Date($scope.agent.rootcheck.end) - new Date($scope.agent.rootcheck.start))/1000)/60;
            $scope.agent.rootcheck.duration = Math.round($scope.agent.rootcheck.duration * 100) / 100;

            if($scope.agent.rootcheck.duration <= 0){
                $scope.agent.rootcheck.inProgress = true;
            }
        } else {
            if (!$scope.agent.rootcheck.end) {
                $scope.agent.rootcheck.end = 'Unknown';
            }
            if (!$scope.agent.rootcheck.start){
                $scope.agent.rootcheck.start = 'Unknown';
            }
        }
    }

    const validateSysCheck = () => {
        $scope.agent.syscheck.duration = 'Unknown';
        if ($scope.agent.syscheck.end && $scope.agent.syscheck.start) {
            $scope.agent.syscheck.duration = ((new Date($scope.agent.syscheck.end) - new Date($scope.agent.syscheck.start))/1000)/60;
            $scope.agent.syscheck.duration = Math.round($scope.agent.syscheck.duration * 100) / 100;
            if($scope.agent.syscheck.duration <= 0){
                $scope.agent.syscheck.inProgress = true;
            }
        } else {
            if (!$scope.agent.syscheck.end) {
                $scope.agent.syscheck.end = 'Unknown';
            }
            if (!$scope.agent.syscheck.start){
                $scope.agent.syscheck.start = 'Unknown';
            }
        }
    }

    $scope.getAgent = async newAgentId => {
        try {
            if($scope.tab === 'configuration'){
                return $scope.getAgentConfig(newAgentId);
            }
            let id = null;

            // They passed an id
            if (newAgentId) {
                id = newAgentId;
                $location.search('agent', id);
            } else {
                if ($location.search().agent && !$rootScope.globalAgent) { // There's one in the url
                    id = $location.search().agent;
                } else { // We pick the one in the rootScope
                    id = $rootScope.globalAgent;
                    $location.search('agent', id);
                    delete $rootScope.globalAgent;
                }
            }

            if (id === '000' && $scope.tab === 'configuration') {
                $scope.tab = 'general';
                $scope.switchTab('general');
            }

            const data = await Promise.all([
                apiReq.request('GET', `/agents/${id}`, {}),
                apiReq.request('GET', `/syscheck/${id}/last_scan`, {}),
                apiReq.request('GET', `/rootcheck/${id}/last_scan`, {})
            ]);

            // Agent
            $scope.agent = data[0].data.data;

            if ($scope.agent.os) {
                $scope.agentOS = $scope.agent.os.name + ' ' + $scope.agent.os.version;
            }
            else { $scope.agentOS = 'Unkwnown' };

            // Syscheck
            $scope.agent.syscheck = data[1].data.data;
            validateSysCheck();

            // Rootcheck
            $scope.agent.rootcheck = data[2].data.data;
            validateRootCheck();

            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Agents');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    };

    $scope.goGroups = agent => {
        $rootScope.globalAgent = agent;
        $rootScope.comeFrom    = 'agents';
        $location.search('tab', 'groups');
        $location.path('/manager');
    };

    $scope.analizeAgents = async search => {
        try {
            $scope.agentsAutoComplete.filters = [];
            await $scope.agentsAutoComplete.addFilter('search',search);

            if(!$scope.$$phase) $scope.$digest();
            return $scope.agentsAutoComplete.items;
        } catch (error) {
            errorHandler.handle(error,'Agents');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }

    }

    //Load
    try {
        if($scope.tab !== 'configuration'){
            $scope.getAgent();
        }
        $scope.agentsAutoComplete.nextPage('');
    } catch (e) {
        errorHandler.handle('Unexpected exception loading controller','Agents');
        if(!$rootScope.$$phase) $rootScope.$digest();
    }

    //Destroy
    $scope.$on("$destroy", () => {
        $scope.agentsAutoComplete.reset();
        if($rootScope.ownHandlers) {
            for(let h of $rootScope.ownHandlers){
                h._scope.$destroy();
            }
        }
        if(watcher8) destroyAuditMetrics();
        if(watcher12) destroyVulnMetrics();
        $rootScope.ownHandlers = [];
    });

    //PCI tab
    let tabs = [];
    genericReq.request('GET', '/api/wazuh-api/pci/all')
        .then((data) => {
            for(let key in data.data){
                tabs.push({
                    "title": key,
                    "content": data.data[key]
                });
            }
        })
        .catch(error => {
            errorHandler.handle(error,'Agents');
            if(!$rootScope.$$phase) $rootScope.$digest();
        });

    $scope.tabs          = tabs;
    $scope.selectedIndex = 0;

    /** Agent configuration */
    $scope.switchConfigTab = selected => {

    };

    $scope.isArray = angular.isArray;

    const getAgent = newAgentId => {

		// They passed an id
		if (newAgentId) {
            $location.search('agent', newAgentId);
		}

	};

    $scope.getAgentConfig = newAgentId => {
        getAgent(newAgentId);
        firstLoad();
    }

    $scope.goGroup = () => {
		$rootScope.globalAgent = $scope.agent;
		$rootScope.comeFrom    = 'agents';
		$location.search('tab', 'groups');
		$location.path('/manager');
    };

    const firstLoad = async () => {
        try{
            $scope.configurationError = false;
            $scope.load = true;
            let id;
            if ($location.search().agent && !$rootScope.globalAgent) { // There's one in the url
				id = $location.search().agent;
			} else { // We pick the one in the rootScope
				id = $rootScope.globalAgent;
				$location.search('agent', id);
				delete $rootScope.globalAgent;
			}
            let data         = await apiReq.request('GET', `/agents/${id}`, {});
            $scope.agent     = data.data.data;
            $scope.groupName = $scope.agent.group;

            if(!$scope.groupName){

                $scope.configurationError = true;
                $scope.load = false;
                if($scope.agent.id === '000'){
                    $scope.configurationError = false;
                    $scope.tab = 'general';
                    $scope.switchTab('general');
                }
                if(!$scope.$$phase) $scope.$digest();
                return;
            }

            data                      = await apiReq.request('GET', `/agents/groups/${$scope.groupName}/configuration`, {});
            $scope.groupConfiguration = data.data.data.items[0];
            $scope.rawJSON            = beautifier.prettyPrint($scope.groupConfiguration);

            data = await Promise.all([
                apiReq.request('GET', `/agents/groups?search=${$scope.groupName}`, {}),
                apiReq.request('GET', `/agents/groups/${$scope.groupName}`, {})
            ]);


            let filtered          = data[0].data.data.items.filter(item => item.name === $scope.groupName);
            $scope.groupMergedSum = (filtered.length) ? filtered[0].merged_sum : 'Unknown';

            filtered              = data[1].data.data.items.filter(item => item.id === $scope.agent.id);
            $scope.agentMergedSum = (filtered.length) ? filtered[0].merged_sum : 'Unknown';
            $scope.isSynchronized = (($scope.agentMergedSum === $scope.groupMergedSum) && !([$scope.agentMergedSum,$scope.groupMergedSum].includes('Unknown')) ) ? true : false;

            $scope.load = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error){
            errorHandler.handle(error,'Agents');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    }
    /** End of agent configuration */
});

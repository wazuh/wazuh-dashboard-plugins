require('ui/modules').get('app/wazuh', [])
.service('implicitFilters', function ($location, $rootScope, appState) {
    return {
        loadFilters() {
              let implicitFilter = [];
              
              if (appState.getClusterInfo().status == 'enabled') {
                // The cluster filter
                implicitFilter.push(
                  {
                    "meta":{
                      "removable":false,
                      "index": appState.getCurrentPattern(),
                      "negate":false,
                      "disabled":false,
                      "alias":null,
                      "type":"phrase",
                      "key":"cluster.name",
                      "value":appState.getClusterInfo().cluster,
                      "params":{
                        "query":appState.getClusterInfo().cluster,
                        "type":"phrase"}
                    },
                    "query":{
                      "match":{
                        "cluster.name":{
                          "query":appState.getClusterInfo().cluster,
                          "type":"phrase"}
                        }
                    },
                    "$state":{
                      "store":"appState"
                    }
                  }
                );
              } else {
                // Manager name filter
                implicitFilter.push(
                  {
                    "meta":{
                      "removable":false,
                      "index": appState.getCurrentPattern(),
                      "negate":false,
                      "disabled":false,
                      "alias":null,
                      "type":"phrase",
                      "key":"manager.name",
                      "value":appState.getClusterInfo().manager,
                      "params":{
                        "query":appState.getClusterInfo().manager,
                        "type":"phrase"}
                    },
                    "query":{
                      "match":{
                        "manager.name":{
                          "query":appState.getClusterInfo().manager,
                          "type":"phrase"}
                        }
                    },
                    "$state":{
                      "store":"appState"
                    }
                  }
                );
              }

              // Check if we are in the agents page and add the proper agent filter
              if ($rootScope.page === 'agents' && $location.search().agent !== "" && $location.search().agent !== null && angular.isUndefined($location.search().agent) !== true) {
                implicitFilter.push(
                  {
                    "meta":{
                      "removable":false,
                      "index": appState.getCurrentPattern(),
                      "negate":false,
                      "disabled":false,
                      "alias":null,
                      "type":"phrase",
                      "key":"agent.id",
                      "value":$location.search().agent,
                      "params":{
                        "query":$location.search().agent,
                        "type":"phrase"}
                    },
                    "query":{
                      "match":{
                        "agent.id":{
                          "query":$location.search().agent,
                          "type":"phrase"}
                        }
                    },
                    "$state":{
                      "store":"appState"
                    }
                  }
                );
              }

              // Build the full query using the implicit filter
              if ($rootScope.currentImplicitFilter !== "" && $rootScope.currentImplicitFilter !== null && angular.isUndefined($rootScope.currentImplicitFilter) !== true) {
                if ($rootScope.currentImplicitFilter === "pci_dss") {
                  implicitFilter.push(
                    {
                      "meta":{
                        "removable":false,
                        "index": appState.getCurrentPattern(),
                        "negate":false,
                        "disabled":false,
                        "alias":null,
                        "type":"exists",
                        "key":"rule.pci_dss",
                        "value":"exists"
                      },
                      "exists":{
                        "field":"rule.pci_dss"
                      },
                      "$state":{
                        "store":"appState"
                      }
                    }
                  );
                } else {
                  implicitFilter.push(
                    {
                      "meta":{
                        "removable":false,
                        "index": appState.getCurrentPattern(),
                        "negate":false,
                        "disabled":false,
                        "alias":null,
                        "type":"phrase",
                        "key":"rule.groups",
                        "value":$rootScope.currentImplicitFilter,
                        "params":{
                            "query":$rootScope.currentImplicitFilter,
                            "type":"phrase"
                        }
                      },
                      "query":{
                        "match":{
                          "rule.groups":{
                            "query":$rootScope.currentImplicitFilter,
                            "type":"phrase"
                          }
                        }
                      },
                      "$state":{
                        "store":"appState"
                      }
                    }
                  );
                }
              }
            return implicitFilter;
            }
    };
});

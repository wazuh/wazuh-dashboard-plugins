require('ui/modules').get('app/wazuh', [])
.service('appState', function ($cookies) {
    return {
        getDashboardsState: () => {
            return {
                name:   $cookies.getObject('_dashboardsState_name'),
                filter: $cookies.getObject('_dashboardsState_filter')
            };
        },
        setDashboardsState: (name, filter) => {
            if (name) {
                $cookies.putObject('_dashboardsState_name', name);
            }
            if (filter) {
                $cookies.putObject('_dashboardsState_filter', filter);
            }
        },
        getExtensions: () => {
            return {
                extensions: $cookies.getObject('extensions')
            };
        },
        setExtensions: (extensions) => {
            if (extensions) {
                $cookies.putObject('extensions', extensions);
            }
        },
        unsetDashboardsState: () => {
            $cookies.putObject('_dashboardsState_name', "");
            $cookies.putObject('_dashboardsState_filter', "");
        },
        getDiscoverState: () => {
            return {
                name:   $cookies.getObject('_discoverState_name'),
                filter: $cookies.getObject('_discoverState_filter')
            };
        },
        setDiscoverState: (name, filter) => {
            if (name) {
                $cookies.putObject('_discoverState_name', name);
            }
            if (filter) {
                $cookies.putObject('_discoverState_filter', filter);
            }
        },
        unsetDiscoverState: () => {
            $cookies.putObject('_discoverState_name', "");
            $cookies.putObject('_discoverState_filter', "");
        },
        getManagerState: () => {
            return $cookies.getObject('_managerState');
        },
        setManagerState: (subtab) => {
            if (subtab) {
                $cookies.putObject('_managerState', subtab);
            }
        },
        getRulesetState: () => {
            return $cookies.getObject('_rulesetState');
        },
        setRulesetState: (subtab) => {
            if (subtab) {
                $cookies.putObject('_rulesetState', subtab);
            }
        },
        getOverviewState: () => {
            return $cookies.getObject('_overviewState');
        },
        setOverviewState: (subtab) => {
            if (subtab) {
                $cookies.putObject('_overviewState', subtab);
            }
        },
        getClusterInfo: () => {
            return $cookies.getObject('_clusterInfo');
        },
        setClusterInfo: (cluster_info) => {
            if (cluster_info) {
                $cookies.putObject('_clusterInfo', cluster_info);
            }
        }
    };
});
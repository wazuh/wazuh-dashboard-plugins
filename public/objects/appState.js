require('ui/modules').get('app/wazuh', [])
    .service('appState', function ($cookies) {
        return {
            getDashboardsState: function () {
                return { name: $cookies.getObject('_dashboardsState_name'), filter: $cookies.getObject('_dashboardsState_filter') };
            },
            setDashboardsState: function (name, filter) {
                if (name) {
                    $cookies.putObject('_dashboardsState_name', name);
                }
                if (filter) {
                    $cookies.putObject('_dashboardsState_filter', filter);
                }
            },
            getManagerState: function () {
                return $cookies.getObject('_managerState');
            },
            setManagerState: function (subtab) {
                if (subtab) {
                    $cookies.putObject('_managerState', subtab);
                }
            },
            getRulesetState: function () {
                return $cookies.getObject('_rulesetState');
            },
            setRulesetState: function (subtab) {
                if (subtab) {
                    $cookies.putObject('_rulesetState', subtab);
                }
            },
            getOverviewState: function () {
                return $cookies.getObject('_overviewState');
            },
            setOverviewState: function (subtab) {
                if (subtab) {
                    $cookies.putObject('_overviewState', subtab);
                }
            }
        };
    });
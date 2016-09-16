require('ui/modules').get('app/wazuh', [])
    .service('appState', function ($cookies) {
        return {
            getAgentsState: function () {
                    return { subtab: $cookies.getObject('_agentsState_subtab'), data: $cookies.getObject('_agentsState_data') };
            },
            setAgentsState: function (subtab, data) {
                if (subtab) {
                    $cookies.putObject('_agentsState_subtab', subtab);
                }
                if (data) {
                    $cookies.putObject('_agentsState_data', data);
                }
            },
			unsetAgentsState: function () {
                    $cookies.putObject('_agentsState_subtab', "");
                    $cookies.putObject('_agentsState_data', "");
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
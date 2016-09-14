require('ui/modules').get('app/wazuh', [])
    .service('sharedProperties', function () {
        var _property = '';
        var _agentsState = { subtab: null, data: null };
        var _managerState = null;
        var _rulesetState = null;

        return {
            getAgentsState: function () {
                return _agentsState;
            },
            setAgentsState: function (subtab, data) {
                if (subtab) {
                    _agentsState.subtab = subtab;
                }
                if (data) {
                    _agentsState.data = data;
                }
            },
            getManagerState: function () {
                return _managerState;
            },
            setManagerState: function (subtab) {
                if (subtab) {
                    _managerState = subtab;
                }
            },
            getRulesetState: function () {
                return _rulesetState;
            },
            setRulesetState: function (subtab) {
                if (subtab) {
                    _rulesetState = subtab;
                }
            },
            getProperty: function () {
                return _property;
            },
            setProperty: function (value) {
                _property = value;
            }
        };
    });

require('ui/modules').get('app/wazuh', [])
    .service('sharedProperties', function () {
        var _property = '';
        var _dashboard = { name: undefined, filter: undefined};

        return {
            getDashboard: function () {
                return _dashboard;
            },
            setDashboard: function (name, filter) {
                _dashboard.name = name;
                _dashboard.filter = filter;
            },
            getProperty: function () {
                return _property;
            },
            setProperty: function (value) {
                _property = value;
            }
        };
    });

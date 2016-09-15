require('ui/modules').get('app/wazuh', [])
    .service('sharedProperties', function () {
        var _property = '';

        return {
            getProperty: function () {
                return _property;
            },
            setProperty: function (value) {
                _property = value;
            }
        };
    });

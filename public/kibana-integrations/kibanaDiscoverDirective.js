var app = require('ui/modules').get('app/wazuh', [])
    .directive('kbnDis', [function() {
        return {
            restrict: 'E',
            scope: {},
            template: require('../templates/directives/discover-template.html')
        }
    }]);

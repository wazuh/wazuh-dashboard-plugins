import tableHeaderTemplate from './wz-table-header.html'
const app = require('ui/modules').get('app/wazuh', []);

app.directive('wzTableHeader',function(){
    return {
        restrict: 'E',
        scope: {
            data: '=data',
            keys: '=keys'          
        },
        link: function(scope,ele,attrs){

        },
        template: tableHeaderTemplate
    }
});
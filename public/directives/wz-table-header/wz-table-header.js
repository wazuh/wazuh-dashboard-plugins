import tableHeaderTemplate from './wz-table-header.html'
import * as modules        from 'ui/modules'

const app = modules.get('app/wazuh', []);

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
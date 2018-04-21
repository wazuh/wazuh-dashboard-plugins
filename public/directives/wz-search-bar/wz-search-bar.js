import searchBarTemplate from './wz-search-bar.html'
import * as modules      from 'ui/modules'

const app = modules.get('app/wazuh', []);

app.directive('wzSearchBar',function(){
    return {
        restrict: 'E',
        scope: {
            data     : '=data',
            term     : '=term',
            placetext: '=placetext',
            height   : '=height'
        },
        link: function(scope,ele,attrs){

        },
        template: searchBarTemplate
    }
});
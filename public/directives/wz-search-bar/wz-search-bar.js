import searchBarTemplate from './wz-search-bar.html'

const app = require('ui/modules').get('app/wazuh', []);

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
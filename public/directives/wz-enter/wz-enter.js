const app = require('ui/modules').get('app/wazuh', []);
app.directive('wzEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.wzEnter);
                });

                event.preventDefault();
            }
        });
    };
});
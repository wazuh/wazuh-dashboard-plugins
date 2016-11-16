import $ from 'jquery';

require('ui/modules').get('app/wazuh', [])
    .directive('autoSizeContainer', function () {
        return {
            restrict: 'A',
            link: function ($scope, $element) {
                var $window = $(window);

                var winHeight = $window.height();
                var winBottom = winHeight + $window.scrollTop();
                var elTop = $element.offset().top;
                var remaining = winBottom - elTop - 10;

                $scope.autoSizeStyle = {'height': remaining+'px'};
            }
        }
    });

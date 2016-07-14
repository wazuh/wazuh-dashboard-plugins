// Require utils
var kuf = require('plugins/wazuh/utils/kibanaUrlFormatter.js');
// Require config
var app = require('ui/modules').get('app/wazuh', [])
    .directive('dinamicIframe', function ($timeout, $interval) {
        var resize = function (scope, element, attrs) {
            scope.$parent._interval = $interval(function () {
                if ((element.find('iframe')[0].src == '') || (!element.find('iframe')[0].contentWindow.document.scrollingElement)) {
                    $interval.cancel(scope.$parent._interval);
                } else if (element.find('iframe')[0].contentWindow.document.scrollingElement.scrollHeight > 400) {
                    element.find('iframe')[0].height = element.find('iframe')[0].contentWindow.document.scrollingElement.scrollHeight+80;
                    element.find('iframe')[0].style.visibility = 'visible';
                    $interval.cancel(scope.$parent._interval);
                }
            }, 100);
        }
        return {
            restrict: 'E',
            scope: {
                src: '@src'
            },
            template: '<iframe width="100%" scrolling="no" src="{{src}}" style="visibility: hidden;"></iframe>',
            link: resize
        }
    });

app.controller('kibanaIntegrationController', function ($scope, sharedProperties, $route, $interval) {

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    //Functions
    $scope.dashboardSearch = function () {
        $scope.defDashboardFilter = $scope.search;
        sharedProperties.setProperty('ad//'+$scope.defDashboardFilter);
        $route.reload();
    };

    $scope.getDashboard = function (dashboard, filter, time, url) {
        if (!filter) {
            filter = '';
        }
        if (!time) {
            time = '';
        }
        if (url == undefined) {
            url = false;
        }
        return kuf.getDashboard(dashboard, filter, time, url);
    };

    $scope.getAlerts = function (index, filter, time, url) {
        if (!filter) {
            filter = '';
        }
        if (!time) {
            time = '';
        }
        if (url == undefined) {
            url = false;
        }
        return kuf.getAlerts(index, filter, time, url);
    };

    $scope.getVisualization = function (visName, filter, time, url) {
        if (!filter) {
            filter = '';
        }
        if (!time) {
            time = '';
        }
        if (url == undefined) {
            url = false;
        }
        return kuf.getVisualization(visName, filter, time, url);
    };

    //Load
    var initialize = sharedProperties.getProperty();
        if ((initialize != '') && (initialize.substring(0, 4) == 'aa//')) {
            $scope.defAlertFilter = initialize.substring(4);
            sharedProperties.setProperty('');
        } else {
            $scope.defAlertFilter = '';
        }
        if ((initialize != '') && (initialize.substring(0, 4) == 'ad//')) {
            $scope.defDashboardFilter = initialize.substring(4);
            sharedProperties.setProperty('');
            $scope.search = $scope.defDashboardFilter;
        } else {
            $scope.defDashboardFilter = '';
        }
        if ((initialize != '') && (initialize.substring(0, 4) == 'av//')) {
            $scope.defMetricsFilter = initialize.substring(4);
            sharedProperties.setProperty('');
        } else {
            $scope.defMetricsFilter = '';
        }
        if ( ($scope.search == undefined) || ($scope.search == '') ){
            $scope.search = '*';
        }

        //Destroy
        $scope.$on("$destroy", function () {
            if ($scope._interval) {
                $interval.cancel($scope._interval);
            }
        });
});
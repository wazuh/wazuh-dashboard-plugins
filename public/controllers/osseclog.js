// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('osseclogController', function ($scope, alertify, DataFactory) {
    //Initialisation
    $scope.load = true;
    $scope.text = [];

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    //Functions

    //Load
    DataFactory.initialize('get', '/manager/logs', {}, 20, 0)
        .then(function (data) {
            objectsArray['/manager/logs'] = data;
            DataFactory.get(data).then(function (data) {
                $scope.text = data.data.items;
                $scope.load = false;
            }, printError);
        }, printError);

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
    });
});
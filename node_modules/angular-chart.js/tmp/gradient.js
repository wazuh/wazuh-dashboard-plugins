angular.module('gradient', ['chart.js']).controller('LineCtrl', function ($scope) {

  $scope.labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  $scope.series = ['Series A'];

  $scope.data = [
    [1164445, 3444359, 3444380, 444481, 566556, 552255, 466440]
  ];

  var ctx = document.getElementById('line').getContext('2d');

  var gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(243, 103, 101,0.5)');
  gradient.addColorStop(1, 'rgba(0, 89, 179,0.5)');

  $scope.colours = [{
    fillColor : gradient, // Put the gradient here as a fill color
    strokeColor : 'rgba(151,187,205,1)',
    pointColor : '#fff',
    pointStrokeColor : '#fff',
    pointHighlightFill: '#fff',
    pointHighlightStroke: 'rgba(151,187,205,1)'
  }];

  $scope.$on('create', function (evt, chart) {

  })

});

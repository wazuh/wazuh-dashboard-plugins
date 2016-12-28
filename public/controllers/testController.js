// Require App

require('plugins/wazuh/utils/infinite_scroll/infinite-scroll.js');
var app = require('ui/modules').get('app/wazuh');


// Reddit constructor function to encapsulate HTTP and pagination logic
app.factory('Reddit', function($http) {
  var Reddit = function() {
    this.items = [];
    this.busy = false;
    this.after = '';
  };

  Reddit.prototype.nextPage = function() {
    if (this.busy) return;
    this.busy = true; 

    var url = "https://api.reddit.com/hot?after=" + this.after + "&jsonp=JSON_CALLBACK";
    $http.jsonp(url).success(function(data) {
      var items = data.data.children;
      for (var i = 0; i < items.length; i++) {
        this.items.push(items[i].data);
      }
      this.after = "t3_" + this.items[this.items.length - 1].id;
      this.busy = false;
    }.bind(this));
  };

  return Reddit;
});

app.controller('testController', function ($scope, $http, testConnection, appState, $mdToast, $rootScope, Reddit) {

var date = new Date(Date.now()).toISOString();
console.log(date);
$scope.reddit = new Reddit();	
	
});


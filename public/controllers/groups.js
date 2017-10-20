var app = require('ui/modules').get('app/wazuh', []);

// We are using the DataHandler template and customize its path to get information about groups
app.factory('Groups', function(DataHandler) {
  var Groups = new DataHandler();
  Groups.path = '/agents/groups';
  return Groups;
});

app.factory('GroupAgents', function(DataHandler) {
  var GroupAgents = new DataHandler();
  return GroupAgents;
});

app.factory('GroupFiles', function(DataHandler) {
  var GroupFiles = new DataHandler();
  return GroupFiles;
});

// Groups preview controller
app.controller('groupsPreviewController', function($scope, apiReq, Groups, GroupFiles, GroupAgents) {
  $scope.searchTerm = '';
  $scope.load = true;

  $scope.groups = Groups;
  $scope.groupAgents = GroupAgents;
  $scope.groupFiles = GroupFiles;

  // Actual execution in the controller's initialization
  $scope.groups.nextPage('').then (function (data) {
    $scope.loadGroup(0);
  });

  $scope.load = false;

  $scope.showFiles = function (index) {
    $scope.groupFiles.reset();
    $scope.groupFiles.path = '/agents/groups/' + $scope.groups.items[index].name + "/files";
    $scope.groupFiles.nextPage('');
  }

  $scope.showAgents = function (index) {
    $scope.groupAgents.reset();
    $scope.groupAgents.path = '/agents/groups/' + $scope.groups.items[index].name;
    $scope.groupAgents.nextPage('').then(function (data) {
      angular.forEach($scope.groupAgents.items, function(agent) {
        apiReq.request('GET', "/agents/" + agent.id, {}).then (function (data) {
          console.log(data);
        });
      });
    });
  }

  $scope.loadGroup = function (index) {
    $scope.groupAgents.reset();
    $scope.groupFiles.reset();
    $scope.selectedGroup = index;
    $scope.showFiles(index);
    $scope.showAgents(index);
  }

  // Select specific group
  $scope.checkSelected = function(index ) {
    angular.forEach($scope.groups.items, function(group) {
      if (group.selected) group = false;
    });
    $scope.groups.items[index] = true;
  }

  $scope.showFile = function(index) {
    $scope.test = !$scope.test; 
    $scope.file = 'Loading...';
    apiReq.request('GET', "/agents/groups/" + $scope.groups.items[$scope.selectedGroup].name + "/files/" + $scope.groupFiles.items[index].filename, {}).then (function (data) {
      $scope.file=data.data;
    });
  }
  
  // Changing the view to overview a specific group
  $scope.groupOverview = function(group) {
    $scope.$parent.$parent.groupName = group;
    $scope.$parent.$parent.groupsMenu = "overview";
  }

  // Resetting the factory configuration
  $scope.$on("$destroy", function(){
    $scope.groups.reset();
    $scope.groupsFiles.reset();
    $scope.groupsAgents.reset();
  });
});

app.controller('groupsController', function ($scope) {
  $scope.groupsMenu = "preview";
  $scope.groupName = '';
});

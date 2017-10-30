var app = require('ui/modules').get('app/wazuh', []);

// We are using the DataHandler template and customize its path to get information about groups
app.factory('Groups', function (DataHandler) {
    var Groups = new DataHandler();
    Groups.path = '/agents/groups';
    return Groups;
});

app.factory('GroupAgents', function (DataHandler) {
    var GroupAgents = new DataHandler();
    return GroupAgents;
});

app.factory('GroupFiles', function (DataHandler) {
    var GroupFiles = new DataHandler();
    return GroupFiles;
});

// Groups preview controller
app.controller('groupsPreviewController', function ($scope, apiReq, Groups, GroupFiles, GroupAgents) {
    $scope.searchTerm = '';
    $scope.load = true;

    $scope.groups = Groups;
    $scope.groupAgents = GroupAgents;
    $scope.groupFiles = GroupFiles;

    // Actual execution in the controller's initialization
    $scope.groups.nextPage('').then(function (data) {
        $scope.loadGroup(0);
    });

    $scope.load = false;

    $scope.showFiles = function (index) {
        $scope.groupFiles.reset();
        $scope.groupFiles.path = '/agents/groups/' + $scope.groups.items[index].name + "/files";
        $scope.groupFiles.nextPage('');
    }

    $scope.showAgents = (index) => {
        $scope.groupAgents.reset();
        $scope.groupAgents.path = '/agents/groups/' + $scope.groups.items[index].name;
        $scope.groupAgents.nextPage('')
        .then(() => {
            let promises = [];
            for(let agent of $scope.groupAgents.items){
                promises.push(apiReq.request('GET', `/agents/${agent.id}`, {}));
            }
            return Promise.all(promises);
        })
        .then((resolvedArray) => {
            for(let data of resolvedArray){
                console.log(data);
            }
        });
    };

    $scope.loadGroup = (index) => {
        $scope.groupAgents.reset();
        $scope.groupFiles.reset();
        $scope.selectedGroup = index;
        $scope.showFiles(index);
        $scope.showAgents(index);
    };

    // Select specific group
    $scope.checkSelected = (index) => {
        for(let group of $scope.groups.items){
            if (group.selected) {
                group = false;
            }
        }
        $scope.groups.items[index] = true;
    };

    $scope.showFile = (index) => {
        $scope.test = !$scope.test;
        $scope.file = 'Loading...';
        let tmpName = `/agents/groups/${$scope.groups.items[$scope.selectedGroup].name}`+
                      `/files/${$scope.groupFiles.items[index].filename}`;
        apiReq.request('GET', tmpName, {})
        .then((data) => $scope.file = data.data);
    };

    // Changing the view to overview a specific group
    $scope.groupOverview = (group) => {
        $scope.$parent.$parent.groupName  = group;
        $scope.$parent.$parent.groupsMenu = "overview";
    };

    // Resetting the factory configuration
    $scope.$on("$destroy", () => {
        $scope.groups.reset();
        $scope.groupsFiles.reset();
        $scope.groupsAgents.reset();
    });
});

app.controller('groupsController', function ($scope) {
    $scope.groupsMenu = "preview";
    $scope.groupName  = '';
});
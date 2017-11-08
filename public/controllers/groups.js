let app = require('ui/modules').get('app/wazuh', []);
const beautifier = require('plugins/wazuh/utils/json-beautifier');

// Groups preview controller
app.controller('groupsPreviewController', 
function ($scope, $timeout, $rootScope,$mdSidenav, $location, apiReq, Groups, GroupFiles, GroupAgents) {
    $scope.searchTerm      = '';
    $scope.searchTermAgent = '';
    $scope.searchTermFile  = '';
    $scope.load            = true;
    $scope.groups          = Groups;
    $scope.groupAgents     = GroupAgents;
    $scope.groupFiles      = GroupFiles;

    // Actual execution in the controller's initialization
    $scope.groups.nextPage('')
    .then(() => $scope.loadGroup(0));

    $scope.load = false;

    $scope.showFiles = (index) => {
        $scope.fileViewer = false;
        $scope.groupFiles.reset();
        $scope.groupFiles.path = `/agents/groups/${$scope.groups.items[index].name}/files`;
        $scope.groupFiles.nextPage('');
    };

    $scope.showAgents = (index) => {
        $scope.fileViewer = false;
        $scope.groupAgents.reset();
        $scope.groupAgents.path = `/agents/groups/${$scope.groups.items[index].name}`;
        $scope.groupAgents.nextPage('');        
    };

    $scope.showAgent = (agent) => {
        $rootScope.comeFromGroups = agent;
        $location.path('/agents');        
    };

    $scope.loadGroup = (index) => {
        $scope.fileViewer = false;
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
        let filename = $scope.groupFiles.items[index].filename;
        if(filename === '../ar.conf') filename = 'ar.conf';
   
        $scope.fileViewer = true;
        $scope.file = 'Loading...';
        let tmpName = `/agents/groups/${$scope.groups.items[$scope.selectedGroup].name}`+
                      `/files/${filename}`;
   

        apiReq.request('GET', tmpName, {})
        .then((data) => $scope.file = beautifier.prettyPrint(data.data.data))
        .catch((err) => $scope.file = {
            group: $scope.groups.items[$scope.selectedGroup].name,
            file:  $scope.groupFiles.items[index].filename,
            error: err.message || err
        });
    };

    // Changing the view to overview a specific group
    $scope.groupOverview = (group) => {
        $scope.$parent.$parent.groupName  = group;
        $scope.$parent.$parent.groupsMenu = 'overview';
    };

    // Resetting the factory configuration
    $scope.$on("$destroy", () => {
        $scope.groups.reset();
        $scope.groupFiles.reset();
        $scope.groupAgents.reset();
    });
    

});

app.controller('groupsController', function ($scope) {
    $scope.groupsMenu = 'preview';
    $scope.groupName  = '';
});
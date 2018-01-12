let app = require('ui/modules').get('app/wazuh', []);
const beautifier = require('plugins/wazuh/utils/json-beautifier');

// Groups preview controller
app.controller('groupsPreviewController', 
function ($scope, $timeout, $rootScope,$mdSidenav, $location, apiReq, Groups, GroupFiles, GroupAgents, Notifier) {
    const notify = new Notifier({ location: 'Manager - Groups' });
    $scope.searchTerm      = '';
    $scope.searchTermAgent = '';
    $scope.searchTermFile  = '';
    $scope.load            = true;
    $scope.groups          = Groups;
    $scope.groupAgents     = GroupAgents;
    $scope.groupFiles      = GroupFiles;


    // Store a boolean variable to check if come from agents
    const fromAgents = ('comeFrom' in $rootScope) && ('globalAgent' in $rootScope) && $rootScope.comeFrom === 'agents';

    // If come from agents
    if(fromAgents) {
        let len = 0;
        // Get ALL groups
        apiReq.request('GET','/agents/groups/',{limit:99999})
        .then(data => {
            // Obtain an array with 0 or 1 element, in that case is our group
            let filtered = data.data.data.items.filter(group => group.name === $rootScope.globalAgent.group);
            // Store the array length, should be 0 or 1
            len = filtered.length;
            // If len is 1
            if(len){
                // First element is now our group $scope.groups.item is an array with only our group
                $scope.groups.items = filtered;
                // Load that our group
                $scope.loadGroup(0);
                $scope.lookingGroup=true    
            }
            // Clean $rootScope
            delete $rootScope.globalAgent;
            delete $rootScope.comeFrom;
            // Get more groups to fill the md-content with more items
            return $scope.groups.nextPage('')
           
        })
        .then(() => {
            // If our group was not found  we need to call loadGroup after load some groups
            if(!len) {
                $scope.loadGroup(0);
                $scope.lookingGroup=true
            }
            $scope.load = false;
        })
        .catch(error => notify.error(error.message));


    // If not come from agents make as normal
    } else {

        // Actual execution in the controller's initialization
        $scope.groups.nextPage('')
        .then(() => {
            $scope.loadGroup(0);
            $scope.load = false;
        })
        .catch(error => notify.error(error.message));
    }

    $scope.toggle = () => $scope.lookingGroup=true;

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

    $scope.showAgent = agent => {
        $rootScope.globalAgent = agent.id;
        $rootScope.comeFrom    = 'groups';
        $location.search('tab', null);
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


    $scope.goBackToAgents = () => {
        $scope.file     = false;
        $scope.filename = false;
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.goBackFiles = () => {
        $scope.groupsSelectedTab = 'files';
        $scope.file     = false;
        $scope.filename = false;
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.showFile = (index) => {
        if($scope.filename) $scope.filename = '';
        let filename = $scope.groupFiles.items[index].filename;
        if(filename === '../ar.conf') filename = 'ar.conf';
   
        $scope.fileViewer = true;

        let tmpName = `/agents/groups/${$scope.groups.items[$scope.selectedGroup].name}`+
                      `/files/${filename}`;
   

        apiReq.request('GET', tmpName, {})
        .then(data => {
            $scope.file = beautifier.prettyPrint(data.data.data);
            $scope.filename = filename;
        })
        .catch(error => notify.error(error.message));
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
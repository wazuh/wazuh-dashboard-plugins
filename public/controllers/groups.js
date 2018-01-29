let app = require('ui/modules').get('app/wazuh', []);
const beautifier = require('plugins/wazuh/utils/json-beautifier');

// Groups preview controller
app.controller('groupsPreviewController', 
function ($scope, $timeout, $rootScope,$mdSidenav, $location, apiReq, Groups, GroupFiles, GroupAgents, errorHandler) {
    $scope.searchTerm      = '';
    $scope.searchTermAgent = '';
    $scope.searchTermFile  = '';
    $scope.load            = true;
    $scope.groups          = Groups;
    $scope.groupAgents     = GroupAgents;
    $scope.groupFiles      = GroupFiles;

    // Store a boolean variable to check if come from agents
    const fromAgents = ('comeFrom' in $rootScope) && ('globalAgent' in $rootScope) && $rootScope.comeFrom === 'agents';

    const load = async () => {
        try {
            // If come from agents
            if(fromAgents) {
                let len = 0;
                // Get ALL groups
                const data = await apiReq.request('GET','/agents/groups/',{limit:99999})

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
                await $scope.groups.nextPage();
                    
                // If our group was not found  we need to call loadGroup after load some groups
                if(!len) {
                    $scope.loadGroup(0);
                    $scope.lookingGroup=true
                }

            // If not come from agents make as normal
            } else {
                // Actual execution in the controller's initialization
                await $scope.groups.nextPage();
                $scope.loadGroup(0);
            }
            
            $scope.load = false;

            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Groups');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    }

    load();

    $scope.toggle = () => $scope.lookingGroup=true;

    $scope.showFiles = index => {
        $scope.fileViewer = false;
        $scope.groupFiles.reset();
        $scope.groupFiles.path = `/agents/groups/${$scope.groups.items[index].name}/files`;
        $scope.groupFiles.nextPage('');
    };

    $scope.showAgents = index => {
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

    $scope.loadGroup = index => {
        $scope.fileViewer = false;
        $scope.groupAgents.reset();
        $scope.groupFiles.reset();
        $scope.selectedGroup = index;
        $scope.showFiles(index);
        $scope.showAgents(index);
    };

    // Select specific group
    $scope.checkSelected = index => {
        for(let group of $scope.groups.items){
            if (group.selected) {
                group = false;
            }
        }
        $scope.groups.items[index] = true;
    };


    $scope.goBackToAgents = () => {
        $scope.groupsSelectedTab = 'agents';
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

    $scope.goBackGroups = () => {
        $scope.lookingGroup = false;
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.showFile = async index => {
        try {
            if($scope.filename) $scope.filename = '';
            let filename = $scope.groupFiles.items[index].filename;
            if(filename === '../ar.conf') filename = 'ar.conf';
       
            $scope.fileViewer = true;
    
            const tmpName = `/agents/groups/${$scope.groups.items[$scope.selectedGroup].name}`+
                          `/files/${filename}`;
       
    
            const data = await apiReq.request('GET', tmpName, {})

            $scope.file = beautifier.prettyPrint(data.data.data);
            $scope.filename = filename;
            
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Groups');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    };

    // Changing the view to overview a specific group
    $scope.groupOverview = group => {
        $scope.$parent.$parent.groupName  = group;
        $scope.$parent.$parent.groupsMenu = 'overview';
    };

    // Resetting the factory configuration
    $scope.$on("$destroy", () => {
        $scope.groups.reset();
        $scope.groupFiles.reset();
        $scope.groupAgents.reset();
    });
   

    $scope.$watch('lookingGroup',value => {
        if(!value){
            $scope.file     = false;
            $scope.filename = false;
        }
    });
});

app.controller('groupsController', function ($scope) {
    $scope.groupsMenu = 'preview';
    $scope.groupName  = '';
});
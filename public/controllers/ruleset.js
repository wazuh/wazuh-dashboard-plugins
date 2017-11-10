let app = require('ui/modules').get('app/wazuh', []);

app.controller('rulesController', function ($scope,$rootScope, Notifier, Rules) {
    $scope.setRulesTab = (tab) => $rootScope.globalsubmenuNavItem2 = tab;
    //Initialization
    const notify   = new Notifier({ location: 'Manager - Rules' });
    $scope.loading = true;
    $scope.rules   = Rules;
    $scope.setRulesTab('rules');

    $scope.analizeRules = (search) => {
        $scope.autoComplete = [];
        
        if (search !== '') $scope.autoComplete.push({
            name: search,
            type: 'search'
        });
        
        for(let element of $scope.rules.items){
            for(let pci of element.pci){
                $scope.autoComplete.push({
                    name: pci,
                    type: 'pci'
                });
            }
            for(let group of element.groups){
                $scope.autoComplete.push({
                    name: group,
                    type: 'group'
                });
            }
            $scope.autoComplete.push({
                name: element.file,
                type: 'file'
            });
        }

        $scope.autoComplete = new Set($scope.autoComplete.map(e => JSON.stringify(e)));
        $scope.autoComplete = Array.from($scope.autoComplete).map(e => JSON.parse(e));
    };

    //Load
    try {
        $scope.rules.nextPage('')
        .then(() => {
            $scope.loading = false;
            $scope.analizeRules('');
        });
    } catch (e) {
        notify.error('Unexpected exception loading controller');
    }

    //Destroy
    $scope.$on('$destroy', () => $scope.rules.reset());
});

app.controller('decodersController', function ($scope,$rootScope, $sce, Notifier, Decoders) {
    $scope.setRulesTab = (tab) => $rootScope.globalsubmenuNavItem2 = tab;
    //Initialization
    const notify    = new Notifier({ location: 'Manager - Decoders' });
    $scope.loading  = true;
    $scope.decoders = Decoders;
    $scope.setRulesTab('decoders');

    $scope.analizeDecoders = (search) => {
        $scope.autoComplete = [];
        if (search !== '') {
            $scope.autoComplete.push({
                name: search,
                type: 'search'
            });
        }

        for(let element of $scope.decoders.items){
            $scope.autoComplete.push({
                name: element.file,
                type: 'file'
            });
        }

        $scope.autoComplete = new Set($scope.autoComplete.map(e => JSON.stringify(e)));
        $scope.autoComplete = Array.from($scope.autoComplete).map(e => JSON.parse(e));
    };

    $scope.colorRegex = (regex) => {
        regex = regex.toString();
        let colors = [
            '#3F6833', '#967302', '#2F575E', '#99440A', '#58140C', '#052B51', '#511749', '#3F2B5B', //6
            '#508642', '#CCA300', '#447EBC', '#C15C17', '#890F02', '#0A437C', '#6D1F62', '#584477', //2
            '#629E51', '#E5AC0E', '#64B0C8', '#E0752D', '#BF1B00', '#0A50A1', '#962D82', '#614D93', //4
            '#7EB26D', '#EAB839', '#6ED0E0', '#EF843C', '#E24D42', '#1F78C1', '#BA43A9', '#705DA0', // Normal
            '#9AC48A', '#F2C96D', '#65C5DB', '#F9934E', '#EA6460', '#5195CE', '#D683CE', '#806EB7', //5
            '#B7DBAB', '#F4D598', '#70DBED', '#F9BA8F', '#F29191', '#82B5D8', '#E5A8E2', '#AEA2E0', //3
            '#E0F9D7', '#FCEACA', '#CFFAFF', '#F9E2D2', '#FCE2DE', '#BADFF4', '#F9D9F9', '#DEDAF7' //7
        ];
        let valuesArray   = regex.match(/\(((?!<\/span>).)*?\)(?!<\/span>)/gmi);
        let coloredString = regex;
        for (let i = 0, len = valuesArray.length; i < len; i++) {
            coloredString = coloredString.replace(/\(((?!<\/span>).)*?\)(?!<\/span>)/mi, '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
        }
        return $sce.trustAsHtml(coloredString);
    };

    $scope.colorOrder = (order) => {
        order = order.toString();
        let colors = [
            '#3F6833', '#967302', '#2F575E', '#99440A', '#58140C', '#052B51', '#511749', '#3F2B5B', //6
            '#508642', '#CCA300', '#447EBC', '#C15C17', '#890F02', '#0A437C', '#6D1F62', '#584477', //2
            '#629E51', '#E5AC0E', '#64B0C8', '#E0752D', '#BF1B00', '#0A50A1', '#962D82', '#614D93', //4
            '#7EB26D', '#EAB839', '#6ED0E0', '#EF843C', '#E24D42', '#1F78C1', '#BA43A9', '#705DA0', // Normal
            '#9AC48A', '#F2C96D', '#65C5DB', '#F9934E', '#EA6460', '#5195CE', '#D683CE', '#806EB7', //5
            '#B7DBAB', '#F4D598', '#70DBED', '#F9BA8F', '#F29191', '#82B5D8', '#E5A8E2', '#AEA2E0', //3
            '#E0F9D7', '#FCEACA', '#CFFAFF', '#F9E2D2', '#FCE2DE', '#BADFF4', '#F9D9F9', '#DEDAF7' //7
        ];
        let valuesArray   = order.split(',');
        let coloredString = order;
        for (let i = 0, len = valuesArray.length; i < len; i++) {
            coloredString = coloredString.replace(valuesArray[i], '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
        }
        return $sce.trustAsHtml(coloredString);
    };

    //Load
    try {
        $scope.decoders.nextPage('')
        .then(() => {
            $scope.loading = false;
            $scope.analizeDecoders('');
        });
    } catch (e) {
        notify.error('Unexpected exception loading controller');
    }

    //Destroy
    $scope.$on("$destroy", () => $scope.decoders.reset());
});
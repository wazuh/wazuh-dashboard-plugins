// Require config
var config = require('plugins/wazuh/config/config.js');
var app = require('ui/modules').get('app/wazuh', []);

app.controller('rulesController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider, $mdToast) {
    //Initialisation
    $scope.load = true;

    $scope.rules = [];

    $scope.statusFilter = 'enabled';

    $scope.maxLevel = 15;
    $scope.minLevel = 0;

    var _file;
    var _group;
    var _pci;
    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        if ($scope._rules_blocked) {
            $scope._rules_blocked = false;
        }
    };

    //Functions

    $scope.fileSearchFilter = function (search) {
        if (search) {
            DataFactory.filters.set(objectsArray['/rules'], 'search', search);
        } else {
            DataFactory.filters.unset(objectsArray['/rules'], 'search');
        }
    };

    $scope.rulesApplyFilter = function (filterObj) {
        if (!filterObj) {
            return null;
        }
        if (filterObj.type == 'file') {
            _file = filterObj.value;
            DataFactory.filters.set(objectsArray['/rules'], 'file', filterObj.value);
        } else if (filterObj.type == 'group') {
            _group = filterObj.value;
            DataFactory.filters.set(objectsArray['/rules'], 'group', filterObj.value);
        } else if (filterObj.type == 'pci') {
            _pci = filterObj.value;
            DataFactory.filters.set(objectsArray['/rules'], 'pci', filterObj.value);
        }
    };

    $scope.rulesHasFilter = function (type) {
        if (type == 'file') {
            return _file && _file != null;
        } else if (type == 'group') {
            return _group && _group != null;
        } else if (type == 'pci') {
            return _pci && _pci != null;
        }
    };

    $scope.rulesUnset = function (type) {
        if (type == 'file') {
            _file = null;
            DataFactory.filters.unset(objectsArray['/rules'], 'file');
        } else if (type == 'group') {
            _group = null;
            DataFactory.filters.unset(objectsArray['/rules'], 'group');
        } else if (type == 'pci') {
            _pci = null;
            DataFactory.filters.unset(objectsArray['/rules'], 'pci');
        }
    };

    $scope.rulesGetFilter = function (type) {
        if (type == 'file') {
            return _file;
        } else if (type == 'group') {
            return _group;
        } else if (type == 'pci') {
            return _pci;
        }
    };

    $scope.filtersSearch = function (search) {
        var defered = $q.defer();
        var promise = defered.promise;

        var result = [];

        if (!search) {
            search = undefined;
        }

        DataFactory.getAndClean('get', '/rules/files', { 'offset': 0, 'limit': 100, 'search': search })
            .then(function (data) {
                angular.forEach(data.data.items, function (value) {
                    result.push({ 'type': 'file', 'value': value.name });
                });
                DataFactory.getAndClean('get', '/rules/groups', { 'offset': 0, 'limit': 100, 'search': search })
                    .then(function (data) {
                        angular.forEach(data.data.items, function (value) {
                            result.push({ 'type': 'group', 'value': value });
                        });
                        DataFactory.getAndClean('get', '/rules/pci', { 'offset': 0, 'limit': 100, 'search': search })
                            .then(function (data) {
                                angular.forEach(data.data.items, function (value) {
                                    result.push({ 'type': 'pci', 'value': value });
                                });
                                defered.resolve(result);
                            }, function (data) {
                                printError(data);
                                defered.reject();
                            })
                    }, function (data) {
                        printError(data);
                        defered.reject();
                    })
            }, function (data) {
                printError(data);
                defered.reject();
            })

        return promise;
    };

    $scope.rulesLevelFilter = function () {
        if (!$scope.minLevel || !$scope.maxLevel || $scope.minLevel == null || $scope.maxLevel == null) {
            return null;
        }
        if (0 <= parseInt($scope.minLevel) <= parseInt($scope.maxLevel) <= 15) {
            DataFactory.filters.set(objectsArray['/rules'], 'level', $scope.minLevel + '-' + $scope.maxLevel);
        }
    };

    $scope.rulesStatusFilter = function (status) {
        DataFactory.filters.set(objectsArray['/rules'], 'status', status);
    };

    $scope.rulesObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._rules_blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/rules']);
            if (DataFactory.filters.flag(objectsArray['/rules'])) {
                $scope._rules_blocked = true;
                DataFactory.scrollTo(objectsArray['/rules'], 50)
                    .then(function (data) {
                        $scope.rules.length = 0;
                        $scope.rules = data.data.items;
                        DataFactory.filters.unflag(objectsArray['/rules']);
                        $scope._rules_blocked = false;
                    }, printError);
            } else if ((_pos > 70) || (_pos < 0)) {
                $scope._rules_blocked = true;
                DataFactory.scrollTo(objectsArray['/rules'], index)
                    .then(function (data) {
                        $scope.rules.length = 0;
                        $scope.rules = data.data.items;
                        $scope._rules_blocked = false;
                    }, printError);
            } else {
                return $scope.rules[_pos];
            }
        },
        getLength: function () {
            return DataFactory.getTotalItems(objectsArray['/rules']);
        },
    };

    var load = function () {
        DataFactory.initialize('get', '/rules', {}, 100, 0)
            .then(function (data) {
                objectsArray['/rules'] = data;
                DataFactory.get(objectsArray['/rules'])
                    .then(function (data) {
                        $scope.rules = data.data.items;
                        DataFactory.filters.register(objectsArray['/rules'], 'search', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'file', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'group', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'pci', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'level', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'status', 'string');
                        DataFactory.filters.register(objectsArray['/rules'], 'filter-sort', 'string');
                        DataFactory.filters.set(objectsArray['/rules'], 'filter-sort', '-level');
                        $scope.load = false;
                    }, printError);
            }, printError);
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
    });

});

app.controller('decodersController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider, $mdToast) {

    //Initialisation
    $scope.load = true;

    $scope.decoders = [];

    $scope.typeFilter = 'all';

    var _lastFile = undefined;
    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        if ($scope._decoders_blocked) {
            $scope._decoders_blocked = false;
        }
    };

    $scope.colorRegex = function (regex) {
        regex = regex.toString();
        var colors = ['blue', 'cadetblue', 'chocolate', 'darkgoldenrod', 'darkmagenta', 'darkred', 'darksalmon', 'dodgerblue', 'green',
            'indigo', 'orange', 'purple', 'sienna', 'yellowgreen'];
        var valuesArray = regex.match(/\(((?!<\/span>).)*?\)(?!<\/span>)/gmi);
        var coloredString = regex;
        for (var i = 0; i < valuesArray.length; i++) {
            coloredString = coloredString.replace(/\(((?!<\/span>).)*?\)(?!<\/span>)/mi, '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
        }
        return $sce.trustAsHtml(coloredString);
    };

    $scope.colorOrder = function (order) {
        order = order.toString();
        var colors = ['blue', 'cadetblue', 'chocolate', 'darkgoldenrod', 'darkmagenta', 'darkred', 'darksalmon', 'dodgerblue', 'green',
            'indigo', 'orange', 'purple', 'sienna', 'yellowgreen'];
        var valuesArray = order.split(',');
        var coloredString = order;
        for (var i = 0; i < valuesArray.length; i++) {
            coloredString = coloredString.replace(valuesArray[i], '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
        }
        return $sce.trustAsHtml(coloredString);
    };

    $scope.decoderSearchFilter = function (search) {
        if (!search) {
            DataFactory.filters.unset(objectsArray['/decoders'], 'search');
        } else {
            DataFactory.filters.set(objectsArray['/decoders'], 'search', search);
        }
    }

    $scope.decoderFileFilter = function (file) {
        if (!file) {
            DataFactory.filters.unset(objectsArray['/decoders'], 'file');
        } else {
            _lastFile = file;
            DataFactory.filters.set(objectsArray['/decoders'], 'file', file);
        }
    }

    $scope.decoderTypeFilter = function (type) {
        DataFactory.clean(objectsArray['/decoders']);
        DataFactory.initialize('get', (type == 'parents') ? '/decoders/parents' : '/decoders', {}, 100, 0)
            .then(function (data) {
                objectsArray['/decoders'] = data;
                DataFactory.get(objectsArray['/decoders'])
                    .then(function (data) {
                        $scope.decoders = data.data.items;
                        DataFactory.filters.register(objectsArray['/decoders'], 'search', 'string');
                        (type != 'parents') ? DataFactory.filters.register(objectsArray['/decoders'], 'file', 'string') : null;
                        $scope.decoderSearchFilter($scope.decoderSearch);
                        (type != 'parents') ? $scope.decoderFileFilter(_lastFile) : null;
                    }, printError);
            }, printError);
    }

    $scope.fileSearch = function (search) {
        var defered = $q.defer();
        var promise = defered.promise;

        if (!search) {
            search = undefined;
        }

        DataFactory.getAndClean('get', '/decoders/files', { 'offset': 0, 'limit': 100, 'search': search })
            .then(function (data) {
                defered.resolve(data.data.items);
            }, function (data) {
                printError(data);
                defered.reject();
            })

        return promise;
    };

    $scope.decodersObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._decoders_blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/decoders']);
            if (DataFactory.filters.flag(objectsArray['/decoders'])) {
                $scope._decoders_blocked = true;
                DataFactory.scrollTo(objectsArray['/decoders'], 50)
                    .then(function (data) {
                        $scope.decoders.length = 0;
                        $scope.decoders = data.data.items;
                        DataFactory.filters.unflag(objectsArray['/decoders']);
                        $scope._decoders_blocked = false;
                    }, printError);
            } else if ((_pos > 70) || (_pos < 0)) {
                $scope._decoders_blocked = true;
                DataFactory.scrollTo(objectsArray['/decoders'], index)
                    .then(function (data) {
                        $scope.decoders.length = 0;
                        $scope.decoders = data.data.items;
                        $scope._decoders_blocked = false;
                    }, printError);
            } else {
                return $scope.decoders[_pos];
            }
        },
        getLength: function () {
            return DataFactory.getTotalItems(objectsArray['/decoders']);
        },
    };

    var load = function () {
        DataFactory.initialize('get', '/decoders', {}, 100, 0)
            .then(function (data) {
                objectsArray['/decoders'] = data;
                DataFactory.get(objectsArray['/decoders'])
                    .then(function (data) {
                        $scope.decoders = data.data.items;
                        DataFactory.filters.register(objectsArray['/decoders'], 'search', 'string');
                        DataFactory.filters.register(objectsArray['/decoders'], 'file', 'string');
                        $scope.load = false;
                    }, printError);
            }, printError);
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        $scope.decoders.length = 0;
    });
});


app.controller('updateRulesetController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider, $mdDialog, $mdToast) {
    //Initialisation
    $scope.load = true;

    $scope.backups = [];

    $scope.updateType = 'b';
    $scope.updateForce = false;

    $scope.menuNavItem = 'ruleset';
    $scope.submenuNavItem = 'update';

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    }

    //Tabs
    $scope.setTab = function (tab, group) {
        tabProvider.setTab($scope.pageId, tab, group);
    };

    $scope.isSetTab = function (tab, group) {
        return tabProvider.isSetTab($scope.pageId, tab, group);
    };

    //Functions

    //Backups

    $scope.updateRuleset = function (ev) {
        if (!$scope.updateType) {
            $mdToast.show({
                template: '<md-toast>Select an update type</md-toast>',
                position: 'bottom left',
                hideDelay: 5000,
            });
        }
        if ($scope.updateForce) {
            var template = 'Are you sure you want to update the ruleset? The ruleset will be overwritten, except local_rules and local_decoders file. OSSEC manager is going to be restarted. Before the update, backup of the ruleset will be done.';
        }
        else {
            var template = 'Are you sure you want to update the ruleset? The ruleset will be overwritten, except local_rules and local_decoders file. If any rule included in ossec.conf is updated, OSSEC manager will be restarted. Before the update, backup of the ruleset will be done.';
        }
        var confirm = $mdDialog.confirm()
            .title('Update ruleset')
            .textContent(template)
            .targetEvent(ev)
            .ok('Update')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {
            if ($scope.updateForce) {
                if ($scope.updateType == 'r') {
                    var path = '/manager/update-ruleset?force=yes&type=rules';
                } else if ($scope.updateType == 'c') {
                    var path = '/manager/update-ruleset?force=yes&type=rootchecks';
                } else {
                    var path = '/manager/update-ruleset?force=yes';
                }
            } else {
                if ($scope.updateType == 'r') {
                    var path = '/manager/update-ruleset?type=rules';
                } else if ($scope.updateType == 'c') {
                    var path = '/manager/update-ruleset?type=rootchecks';
                } else {
                    var path = '/manager/update-ruleset';
                }
            }
            DataFactory.getAndClean('put', path, {})
                .then(function (data) {
                    var alert = data.data.msg + '. ';
                    if (data.data.need_restart === 'yes' && (data.data.restarted === 'no' || data.data.restart_status === 'fail')) {
                        alert += "The manager needs to be manually restarted.";
                    } else if (data.data.restarted === 'yes') {
                        alert += "The manager has been restarted. ";
                    }
                    if (data.data.manual_steps !== 'no') {
                        alert += "The following manual steps are required: " + data.data.manual_steps_detail;
                    }
                    $mdToast.show({
                        template: '<md-toast>' + alert + '</md-toast>',
                        position: 'bottom left',
                        hideDelay: 5000,
                    });
                    $scope.load_backups();
                }, printError);
        });
    };

    $scope.restoreBackup = function (ev) {
        var template = 'Are you sure you want to restore this backup? This action can not be undone.';
        var confirm = $mdDialog.confirm()
            .title('Restore backup')
            .textContent(template)
            .targetEvent(ev)
            .ok('Restore')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {
            DataFactory.getAndClean('put', '/manager/update-ruleset/backups/' + $scope.selectedBackup, {})
                .then(function (data) {
                    var alert;
                    if (data.data.msg === 'Backup successfully') {
                        alert = 'Backup successfuly restored. ';
                    }
                    if (data.data.need_restart === 'yes' && (data.data.restarted === 'no' || data.data.restart_status === 'fail')) {
                        alert += "The manager needs to be manually restarted.";
                    } else if (data.data.restarted === 'yes') {
                        alert += "The manager has been restarted";
                    }
                    if (data.data.manual_steps !== 'no') {
                        alert += "The following manual steps are required: " + data.data.manual_steps_detail;
                    }
                    $mdToast.show({
                        template: '<md-toast>' + alert + '</md-toast>',
                        position: 'bottom left',
                        hideDelay: 5000,
                    });
                }, printError);
        });
    };

    //Load functions

    $scope.load_backups = function () {
        var defered = $q.defer();
        var promise = defered.promise;

        DataFactory.getAndClean('get', '/manager/update-ruleset/backups', {})
            .then(function (data) {
                defered.resolve();
                $scope.backups.length = 0;
                $scope.backups = data.data;
            }, function (error) {
                printError(error);
                defered.reject();
            });

        return promise;
    };

    var load = function () {
        $scope.load = false;
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        tabProvider.clean($scope.pageId);
    });

});

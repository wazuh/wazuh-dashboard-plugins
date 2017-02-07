require('plugins/wazuh/utils/infinite_scroll/infinite-scroll.js');
var app = require('ui/modules').get('app/wazuh'); 

app.factory('Rules', function($http, DataFactory) {
  var Rules = function(objectsArray, items) {
    this.items = items;
	this.objectsArray = objectsArray;
    this.busy = false;
  };

  Rules.prototype.nextPage = function() {

    if (this.busy) return;
    this.busy = true;
	DataFactory.next(this.objectsArray['/rules']).then(function (data) {
			var items = data.data.items;
			for (var i = 0; i < items.length; i++) {
				this.items.push(items[i]);
			}
			this.busy = false;
        }.bind(this), 
		function (data) {
			this.busy = false;
		}.bind(this));
		
	};
  return Rules;
});

app.factory('Decoders', function($http, DataFactory) {
  var Decoders = function(objectsArray, items) {
    this.items = items;
	this.objectsArray = objectsArray;
    this.busy = false;
  };

  Decoders.prototype.nextPage = function() {

    if (this.busy) return;
    this.busy = true;
	DataFactory.next(this.objectsArray['/decoders']).then(function (data) {
			var items = data.data.items;
			for (var i = 0; i < items.length; i++) {
				this.items.push(items[i]);
			}
			this.busy = false;
        }.bind(this), 
		function (data) {
			this.busy = false;
		}.bind(this));
		
	};
  return Decoders;
});

app.controller('rulesController', function ($scope, $q, DataFactory, $mdToast, errlog, $window, $document, Rules) {
    //Initialization
    $scope.load = true;
	$scope.setRulesTab('rules');
	$scope.ruleActive = false;
	$scope.extraInfo = false;
	
	
    $scope.search = undefined;

    $scope.statusFilter = 'enabled';

    $scope._filter = null;

    var _file;
    var _group;
    var _pci;
    var _search;
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


	$scope.openDiscover = function (template, filter) {
        $scope.state.setDiscoverState(template, filter);
		$window.location.href = '#/discover/';
    }
	
	$scope.loadRule = function (id) {
		$scope.ruleActiveArray = rule;
		$scope.ruleActive = true;
    }
	
    $scope.setSort = function (field) {
		$scope._sort = field;
		$scope._sortOrder = !$scope._sortOrder;
        if ($scope._sortOrder) {
			DataFactory.filters.set(objectsArray['/rules'], 'filter-sort',field);
		} else {
			DataFactory.filters.set(objectsArray['/rules'], 'filter-sort', '-' + field);
		}
		
		DataFactory.setOffset(objectsArray['/rules'],0);
		DataFactory.get(objectsArray['/rules']).then(function (data) { 
			$scope.rules.items = data.data.items;
		});
    }

    $scope.rulesApplyFilter = function (filterObj) {
        if (!filterObj) {
            return null;
        }
		$scope.load = true;
        if (filterObj.type == 'file') {
            _file = filterObj.value;
            DataFactory.filters.set(objectsArray['/rules'], 'file', filterObj.value);
            $scope.ruleActive = false;
        } else if (filterObj.type == 'group') {
            _group = filterObj.value;
            DataFactory.filters.set(objectsArray['/rules'], 'group', filterObj.value);
            $scope.ruleActive = false;
        } else if (filterObj.type == 'pci') {
            _pci = filterObj.value;
            DataFactory.filters.set(objectsArray['/rules'], 'pci', filterObj.value);
            $scope.ruleActive = false;
        } else if (filterObj.type == 'search') {
            _search = filterObj.value;
            DataFactory.filters.set(objectsArray['/rules'], 'search', filterObj.value);
            $scope.ruleActive = false;
        }
		
		DataFactory.setOffset(objectsArray['/rules'],0);
		DataFactory.get(objectsArray['/rules']).then(function (data) { 
			$scope.rules.items = data.data.items;
			$scope.load = false;
		});
    };

    $scope.rulesHasFilter = function (type) {
        if (type == 'file') {
            return _file && _file != null;
        } else if (type == 'group') {
            return _group && _group != null;
        } else if (type == 'pci') {
            return _pci && _pci != null;
        } else if (type == 'search') {
            return _search && _search != null;
        }
    };

    $scope.rulesUnset = function (type) {
		$scope.load = true;
        if (type == 'file') {
            _file = null;
            DataFactory.filters.unset(objectsArray['/rules'], 'file');
            $scope._filter = undefined;
            $scope.search = undefined;
        } else if (type == 'group') {
            _group = null;
            $scope._filter = undefined;
            $scope.search = undefined;
            DataFactory.filters.unset(objectsArray['/rules'], 'group');
        } else if (type == 'pci') {
            _pci = null;
            $scope._filter = undefined;
            $scope.search = undefined;
            DataFactory.filters.unset(objectsArray['/rules'], 'pci');
        } else if (type == 'search') {
            _search = null;
            $scope._filter = undefined;
            $scope.search = undefined;
            DataFactory.filters.unset(objectsArray['/rules'], 'search');
        }
		
		DataFactory.setOffset(objectsArray['/rules'],0);
		DataFactory.get(objectsArray['/rules']).then(function (data) { 
			$scope.rules.items = data.data.items;
			$scope.load = false;
		});
    };

    $scope.rulesGetFilter = function (type) {
        if (type == 'file') {
            return _file;
        } else if (type == 'group') {
            return _group;
        } else if (type == 'pci') {
            return _pci;
        } else if (type == 'search') {
            return _search;
        }
    };

    $scope.filtersSearch = function (search) {
        var defered = $q.defer();
        var promise = defered.promise;
        var result = [];
        if (!search) {
            search = undefined;
        } else {
            result.push({ 'type': 'search', 'value': search });
        }

        DataFactory.getAndClean('get', '/rules/files', { 'offset': 0, 'limit': 5, 'search': search })
            .then(function (data) {
				
                angular.forEach(data.data.items, function (value) {
                    result.push({ 'type': 'file', 'value': value.file });
                });
                DataFactory.getAndClean('get', '/rules/groups', { 'offset': 0, 'limit': 5, 'search': search })
                    .then(function (data) {
                        angular.forEach(data.data.items, function (value) {
                            result.push({ 'type': 'group', 'value': value });
                        });
                        DataFactory.getAndClean('get', '/rules/pci', { 'offset': 0, 'limit': 5, 'search': search })
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

    $scope.rulesStatusFilter = function (status) {
        DataFactory.filters.set(objectsArray['/rules'], 'status', status);
    };


    var load = function () {
        DataFactory.initialize('get', '/rules', {}, 30, 0)
            .then(function (data) {
                objectsArray['/rules'] = data;
				DataFactory.filters.register(objectsArray['/rules'], 'search', 'string');
				DataFactory.filters.register(objectsArray['/rules'], 'file', 'string');
				DataFactory.filters.register(objectsArray['/rules'], 'group', 'string');
				DataFactory.filters.register(objectsArray['/rules'], 'pci', 'string');
				DataFactory.filters.register(objectsArray['/rules'], 'status', 'string');
				DataFactory.filters.register(objectsArray['/rules'], 'filter-sort', 'string');
				DataFactory.filters.set(objectsArray['/rules'], 'filter-sort', '-level');
                DataFactory.get(objectsArray['/rules']).then(function (data) {
						$scope.rules = new Rules(objectsArray, data.data.items);
                        $scope._sort = 'level';
                        $scope.load = false;
                    }, printError);
            }, printError);
    };

    //Load
    try {
        load();
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

	
	
    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
    });

});

app.controller('decodersController', function ($scope, $q, $sce, DataFactory, $mdToast, errlog, Decoders) {
	
    //Initialization
    $scope.load = true;
	$scope.setRulesTab('decoders');

    $scope.typeFilter = 'all';
    var _file;
    var _search;

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
        var colors = [
            '#3F6833', '#967302', '#2F575E', '#99440A', '#58140C', '#052B51', '#511749', '#3F2B5B', //6
            '#508642', '#CCA300', '#447EBC', '#C15C17', '#890F02', '#0A437C', '#6D1F62', '#584477', //2
            '#629E51', '#E5AC0E', '#64B0C8', '#E0752D', '#BF1B00', '#0A50A1', '#962D82', '#614D93', //4
            '#7EB26D', '#EAB839', '#6ED0E0', '#EF843C', '#E24D42', '#1F78C1', '#BA43A9', '#705DA0', // Normal
            '#9AC48A', '#F2C96D', '#65C5DB', '#F9934E', '#EA6460', '#5195CE', '#D683CE', '#806EB7', //5
            '#B7DBAB', '#F4D598', '#70DBED', '#F9BA8F', '#F29191', '#82B5D8', '#E5A8E2', '#AEA2E0', //3
            '#E0F9D7', '#FCEACA', '#CFFAFF', '#F9E2D2', '#FCE2DE', '#BADFF4', '#F9D9F9', '#DEDAF7'  //7
        ];
        var valuesArray = regex.match(/\(((?!<\/span>).)*?\)(?!<\/span>)/gmi);
        var coloredString = regex;
        for (var i = 0; i < valuesArray.length; i++) {
            coloredString = coloredString.replace(/\(((?!<\/span>).)*?\)(?!<\/span>)/mi, '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
        }
        return $sce.trustAsHtml(coloredString);
    };

    $scope.colorOrder = function (order) {
        order = order.toString();
        var colors = [
            '#3F6833', '#967302', '#2F575E', '#99440A', '#58140C', '#052B51', '#511749', '#3F2B5B', //6
            '#508642', '#CCA300', '#447EBC', '#C15C17', '#890F02', '#0A437C', '#6D1F62', '#584477', //2
            '#629E51', '#E5AC0E', '#64B0C8', '#E0752D', '#BF1B00', '#0A50A1', '#962D82', '#614D93', //4
            '#7EB26D', '#EAB839', '#6ED0E0', '#EF843C', '#E24D42', '#1F78C1', '#BA43A9', '#705DA0', // Normal
            '#9AC48A', '#F2C96D', '#65C5DB', '#F9934E', '#EA6460', '#5195CE', '#D683CE', '#806EB7', //5
            '#B7DBAB', '#F4D598', '#70DBED', '#F9BA8F', '#F29191', '#82B5D8', '#E5A8E2', '#AEA2E0', //3
            '#E0F9D7', '#FCEACA', '#CFFAFF', '#F9E2D2', '#FCE2DE', '#BADFF4', '#F9D9F9', '#DEDAF7'  //7
        ];
        var valuesArray = order.split(',');
        var coloredString = order;
        for (var i = 0; i < valuesArray.length; i++) {
            coloredString = coloredString.replace(valuesArray[i], '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>');
        }
        return $sce.trustAsHtml(coloredString);
    };

    $scope.decoderTypeFilter = function (type) {
        $scope.typeFilter = type;
        DataFactory.clean(objectsArray['/decoders']);
        DataFactory.initialize('get', (type == 'parents') ? '/decoders/parents' : '/decoders', {}, 30, 0)
            .then(function (data) {
                objectsArray['/decoders'] = data;
				DataFactory.filters.register(objectsArray['/decoders'], 'search', 'string');
				DataFactory.filters.register(objectsArray['/decoders'], 'file', 'string');
				DataFactory.filters.register(objectsArray['/decoders'], 'name', 'string');
				DataFactory.filters.register(objectsArray['/decoders'], 'filter-sort', 'string');
				DataFactory.filters.set(objectsArray['/decoders'], 'filter-sort', 'name');
				DataFactory.setOffset(objectsArray['/decoders'],0);
                DataFactory.get(objectsArray['/decoders'])
                    .then(function (data) {
						$scope.decoders = new Decoders(objectsArray, data.data.items);
                        $scope.load = false;                        
                    }, printError);
            }, printError);
    };

	$scope.setSort = function (field) {
		$scope._sort = field;
		$scope._sortOrder = !$scope._sortOrder;
        if ($scope._sortOrder) {
			DataFactory.filters.set(objectsArray['/decoders'], 'filter-sort',field);
		} else {
			DataFactory.filters.set(objectsArray['/decoders'], 'filter-sort', '-' + field);
		}
		
		DataFactory.setOffset(objectsArray['/decoders'],0);
		DataFactory.get(objectsArray['/decoders']).then(function (data) { 
			$scope.decoders.items = data.data.items;
		});
    }
	
    $scope.decodersApplyFilter = function (filterObj) {
        if (!filterObj) {
            return null;
        }
        if (filterObj.type == 'file') {
            _file = filterObj.value.split('/').slice(-1)[0];
            DataFactory.filters.set(objectsArray['/decoders'], 'file', filterObj.value.split('/').slice(-1)[0]);
        } else if (filterObj.type == 'search') {
            _search = filterObj.value;
            DataFactory.filters.set(objectsArray['/decoders'], 'search', filterObj.value);
        }
		DataFactory.setOffset(objectsArray['/decoders'],0);
		DataFactory.get(objectsArray['/decoders']).then(function (data) { 
			$scope.decoders.items = data.data.items;
			$scope.load = false;
		});
    };

    $scope.decodersHasFilter = function (type) {
        if (type == 'file') {
            return _file && _file != null;
        } else if (type == 'search') {
            return _search && _search != null;
        }
    };

    $scope.decodersUnset = function (type) {
        if (type == 'file') {
            _file = null;
            DataFactory.filters.unset(objectsArray['/decoders'], 'file');
            $scope._filter = undefined;
            $scope.search = undefined;
        } else if (type == 'search') {
            _search = null;
            $scope._search = undefined;
            DataFactory.filters.unset(objectsArray['/decoders'], 'search');
            $scope._filter = undefined;
            $scope.search = undefined;
        }
		DataFactory.setOffset(objectsArray['/decoders'],0);
		DataFactory.get(objectsArray['/decoders']).then(function (data) { 
			$scope.decoders.items = data.data.items;
			$scope.load = false;
		});
    };

    $scope.decodersGetFilter = function (type) {
        if (type == 'file') {
            return _file;
        } else if (type == 'search') {
            return _search;
        }
    };

    $scope.filtersSearch = function (search) {
        var defered = $q.defer();
        var promise = defered.promise;
        var result = [];

        if (!search) {
            search = undefined;
        } else {
            result.push({ 'type': 'search', 'value': search });
        }

        DataFactory.getAndClean('get', '/decoders/files', { 'offset': 0, 'limit': 14, 'search': search })
            .then(function (data) {
                angular.forEach(data.data.items, function (value) {
                    result.push({ 'type': 'file', 'value': value.file });
                });
                defered.resolve(result);
            }, function (data) {
                printError(data);
                defered.reject();
            })

        return promise;
    };


    var load = function () {
        DataFactory.initialize('get', '/decoders', {}, 30, 0)
            .then(function (data) {
                objectsArray['/decoders'] = data;
				DataFactory.filters.register(objectsArray['/decoders'], 'search', 'string');
				DataFactory.filters.register(objectsArray['/decoders'], 'file', 'string');
				DataFactory.filters.register(objectsArray['/decoders'], 'name', 'string');
				DataFactory.filters.register(objectsArray['/decoders'], 'filter-sort', 'string');
				DataFactory.filters.set(objectsArray['/decoders'], 'filter-sort', 'name');
                DataFactory.get(objectsArray['/decoders'])
                    .then(function (data) {
						$scope._sort = 'name';
						$scope.decoders = new Decoders(objectsArray, data.data.items);
                        $scope.load = false;
                    }, printError);
            }, printError);
    };

    //Load
    try {
        load();
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

	
    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        $scope.decoders.length = 0;
    });
});


app.controller('updateRulesetController', function ($scope, $q, DataFactory, $mdDialog, $mdToast, errlog) {
    //Initialization
    $scope.load = true;
    $scope.$parent.state.setRulesetState('update');

    $scope.backups = [];

    $scope.updateType = 'b';
    $scope.updateForce = false;

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    }

    //Functions

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
    try {
        load();
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

    //Destroy
    $scope.$on("$destroy", function () {
        $scope.backups.length = 0;
    });

});

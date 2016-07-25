// Require config
var config = require('plugins/wazuh/config/config.js');
var app = require('ui/modules').get('app/wazuh', []);

app.controller('rulesController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider) {
    //Initialisation
    $scope.load = true;

    $scope.rules = [];
    $scope.filesRules = [];
    $scope.groupsRules = [];
    $scope.pciGroupsRules = [];

    $scope.rfStatus = 'enabled';
    $scope.rfFiles = '';
    $scope.rfGroups = '';
    $scope.rfPci = '';
    $scope.rfLevel = '';

    $scope.statusFilter = 'enabled';

    $scope.menuNavItem = 'ruleset';
    $scope.submenuNavItem = 'rules';

    $scope.maxLevel = 15;
    $scope.minLevel = 0;

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    //Tabs
    $scope.setTab = function (tab, group) {
        tabProvider.setTab($scope.pageId, tab, group);
    };

    $scope.isSetTab = function (tab, group) {
        return tabProvider.isSetTab($scope.pageId, tab, group);
    };

    //Functions

    //Rules - Filters

    $scope.setRulesFilter = function (type, value) {
        var tmp;
        switch(type) {
            case 'status':
                tmp = $scope.rfStatus;
                $scope.rfStatus = '';
                break;
            case 'file':
                tmp = $scope.rfFiles;
                break;
            case 'group':
                tmp = $scope.rfGroups;
                break;
            case 'pci':
                tmp = $scope.rfPci;
                break;
            case 'level':
                tmp = $scope.rfLevel;
                $scope.rfLevel = '';
                break;
        };

        $scope.rfFiles = $scope.rfGroups = $scope.rfPci = '';

        switch(type) {
            case 'status':
                if (tmp != value) {
                    $scope.rfStatus = value;
                }
                break;
            case 'file':
                if (tmp != value) {
                    $scope.rfFiles = value;
                }
                break;
            case 'group':
                if (tmp != value) {
                    $scope.rfGroups = value;
                }
                break;
            case 'pci':
                if (tmp != value) {
                    $scope.rfPci = value;
                }
                break;
            case 'level':
                if (tmp != value) {
                    $scope.rfLevel = value;
                }
                break;
        };

        _applyRulesFilters();
    };

    $scope.isSetRulesFilter = function (type, value) {
        switch (type) {
            case 'status':
                return $scope.rfStatus === value;
            case 'file':
                return $scope.rfFiles === value;
            case 'group':
                return $scope.rfGroups === value;
            case 'pci':
                return $scope.rfPci === value;
            case 'level':
                return $scope.rfLevel === value;
        };
        return false;
    };

    $scope.setRulesFilter_outside = function (type, value) {
        if (type == 'file') {
            $scope.setTab(1, 2);
        } else if (type == 'group') {
            $scope.setTab(2, 2);
        } else if (type == 'pci') {
            $scope.setTab(3, 2);
        }
        $scope.setRulesFilter(type, value);
    };

    $scope.hasRulesFilter = function (type) {
        switch (type) {
            case 'status':
                return $scope.rfStatus != '';
            case 'file':
                return $scope.rfFiles != '';
            case 'group':
                return $scope.rfGroups != '';
            case 'pci':
                return $scope.rfPci != '';
            case 'level':
                return $scope.rfLevel != '';
        };
        return false;
    };

    $scope.setRulesFilter_level = function () {
        if (($scope.minLevel == undefined) || ($scope.maxLevel == undefined)
            || ($scope.minLevel < 0 || $scope.minLevel > 15 || $scope.maxLevel < 0 || $scope.maxLevel > 15)
            || ($scope.maxLevel < $scope.minLevel)) {
            $scope.minLevel = 0;
            $scope.maxLevel = 15;
            alertify.delay(10000).closeLogOnClick(true).error('Invalid level range');
        } else {
            $scope.setRulesFilter('level', $scope.minLevel + '-' + $scope.maxLevel);
        }
    };

    $scope.setRulesFilter_level_selected = function (level) {
        $scope.minLevel = $scope.maxLevel = level;
        $scope.setRulesFilter_level();
    };

    var _applyRulesFilters = function () {
        var body = {};
        if (($scope.rfStatus != '') && ($scope.rfStatus != 'all')) {
            body.status = $scope.rfStatus;
        }
        if ($scope.rfFiles != '') {
            body.file = $scope.rfFiles;
        } else if ($scope.rfGroups != '') {
            body.group = $scope.rfGroups;
        } else if ($scope.rfPci != '') {
            body.pci = $scope.rfPci;
        }
        if ($scope.rfLevel != '') {
            body.level = $scope.rfLevel;
        }
        $scope.objGet('/rules', 'rules', body);
    };

    //Rules - Aux functions

    $scope.getRuleStatusClass = function (rule) {
        if (rule.details.overwrite) {
            return "overwritten";
        }
        if (rule.status == 'enabled') {
            if (rule.level == 0)
                return "warning";
            else
                return "enabled";
        } else {
            return "disabled";
        }
    };

    $scope.downloadRuleFile = function (fileName) {
        if ($scope.encodedFile != '') {
            (window.URL || window.webkitURL).revokeObjectURL($scope.encodedFile);
        }
        DataFactory.getAndClean('get', '/rules/files', {'download': fileName})
            .then(function (data) {
                var blob = new Blob([data], { type: 'text/xml' });
                $scope.encodedFile = (window.URL || window.webkitURL).createObjectURL(blob);
            }, printError);
    };

    $scope.getStatusTooltip = function (rule) {
        if (rule.details.overwrite) {
            return '<span style="width: 200px; display: inline-block; text-align: left;">The rule is overwriting rules with the same ID.</span>';
        }
        if (rule.status == 'enabled') {
            if (rule.level == 0)
                return '<span style="width: 200px; display: inline-block; text-align: left;">The rule is enabled, but it has alert level 0. Because this, the rule will never be triggered.</span>';
            else
                return '<span style="width: 200px; display: inline-block; text-align: left;">The rule is enabled.</span>';
        } else {
            return '<span style="width: 200px; display: inline-block; text-align: left;">The rule is not enabled.</span>';
        }
    };

    $scope.rulesTooltips = function (key) {
        var tooltip;
        switch (key) {
            case 'maxsize':
                tooltip = 'Specifies the maximum size of the event.';
                break;
            case 'frequency':
                tooltip = 'Specifies the number of times the rule must have matched before firing. The number that triggers the rule is actually 2 more than this setting.';
                break;
            case 'timeframe':
                tooltip = 'The timeframe in seconds';
                break;
            case 'ignore':
                tooltip = 'The time (in seconds) to ignore this rule after firing it (to avoid floods).';
                break;
            case 'overwrite':
                tooltip = 'Used to supercede an OSSEC rule with local changes.';
                break;
            case 'match':
                tooltip = 'Any string to match against the log event.';
                break;
            case 'regex':
                tooltip = 'Any regex to match against the log event.';
                break;
            case 'decoded_as':
                tooltip = 'Any decoder name.';
                break;
            case 'category':
                tooltip = 'The decoded category to match (ids, syslog, firewall, web-log, squid or windows).';
                break;
            case 'srcip':
                tooltip = 'Any IP address or CIDR block to be compared to an IP decoded as srcip.';
                break;
            case 'dstip':
                tooltip = 'Any IP address or CIDR block to be compared to an IP decoded as dstip.';
                break;
            case 'extra_data':
                tooltip = 'Any string that is decoded into the extra_data field.';
                break;
            case 'user':
                tooltip = 'Any username (decoded as the username).';
                break;
            case 'program_name':
                tooltip = 'Program name is decoded from syslog process name.';
                break;
            case 'hostname':
                tooltip = 'Any hostname (decoded as the syslog hostname) or log file.';
                break;
            case 'time':
                tooltip = 'Time that the event was generated.';
                break;
            case 'weekday':
                tooltip = 'Week day that the event was generated.';
                break;
            case 'id':
                tooltip = 'Any ID (decoded as the ID).';
                break;
            case 'url':
                tooltip = 'Any URL (decoded as the URL).';
                break;
            case 'if_sid':
                tooltip = 'Matches if the ID has matched.';
                break;
            case 'if_group':
                tooltip = 'Matches if the group has matched before.';
                break;
            case 'if_level':
                tooltip = 'Matches if the level has matched before.';
                break;
            case 'if_matched_sid':
                tooltip = 'Matches if an alert of the defined ID has been triggered in a set number of seconds.';
                break;
            case 'if_matched_group':
                tooltip = 'Matches if an alert of the defined group has been triggered in a set number of seconds.';
                break;
            case 'same_id':
                tooltip = 'Specifies that the decoded id must be the same.';
                break;
            case 'same_source_ip':
                tooltip = 'Specifies that the decoded source ip must be the same.';
                break;
            case 'same_source_port':
                tooltip = 'Specifies that the decoded source port must be the same.';
                break;
            case 'same_dst_port':
                tooltip = 'Specifies that the decoded destination port must be the same.';
                break;
            case 'same_location':
                tooltip = 'Specifies that the location must be the same.';
                break;
            case 'same_user':
                tooltip = 'Specifies that the decoded user must be the same.';
                break;
            case 'description':
                tooltip = 'Rule description.';
                break;
            case 'list':
                tooltip = 'Preform a CDB lookup using an ossec list. This is a fast on disk database which will always find keys within two seeks of the file.';
                break;
            case 'info':
                tooltip = 'Extra information';
                break;
            case 'options':
                tooltip = 'Additional rule options';
                break;
            case 'check_diff':
                tooltip = 'Used to determine when the output of a command changes.';
                break;
            case 'noalert':
                tooltip = 'Do not trigger this alert.';
                break;
            case 'if_fts':
                tooltip = 'If first time seen.';
                break;
            default:
                tooltip = 'Tooltip not found for this field.';
                break;
        }
        return '<div style="width: 250px;">' + tooltip + '</div>';
    };

    $scope.loadRuleDiscover = function (rule, filters) {
        if (filters && filters != '') {
            var _filter = 'rule.sidid:' + rule + ' AND ' + filters;
        } else {
            var _filter = 'rule.sidid:' + rule;
        }
        sharedProperties.setProperty('aa//' + _filter);
        $location.path('/discover');
    };

    $scope.loadRuleDashboard = function (rule, filters) {
        if (filters && filters != '') {
            var _filter = 'rule.sidid:' + rule + ' AND ' + filters;
        } else {
            var _filter = 'rule.sidid:' + rule;
        }
        sharedProperties.setProperty('ad//' + _filter);
        $location.path('/dashboard');
    };

    //Obj functions

    $scope.objHasNext = function (objName) {
        return DataFactory.hasNext(objectsArray[objName]);
    };
    $scope.objNext = function (objName, containerName) {
        DataFactory.next(objectsArray[objName])
            .then(function (data) {
                _applyContainer(data, containerName);
            }, printError);
    };

    $scope.objHasPrev = function (objName) {
        return DataFactory.hasPrev(objectsArray[objName]);
    };
    $scope.objPrev = function (objName, containerName) {
        DataFactory.prev(objectsArray[objName])
            .then(function (data) {
                _applyContainer(data, containerName);
            }, printError);
    };

    $scope.objGet = function (objName, containerName, body) {
        //Search body modification
        var searchField = _getSearchField(containerName);
        if (!body) {
            var tmpBody = DataFactory.getBody(objectsArray[objName]);
            if (searchField !== tmpBody['search']) {
                tmpBody['search'] = searchField;
                body = tmpBody;
            }
        } else if (searchField !== body['search']) {
            body['search'] = searchField;
        }
        if (body['search'] === '') {
            body['search'] = undefined;
        }

        if (!body) {
            DataFactory.get(objectsArray[objName])
                .then(function (data) {
                    _applyContainer(data, containerName);
                }, printError);
        } else {
            DataFactory.get(objectsArray[objName], body)
                .then(function (data) {
                    _applyContainer(data, containerName);
                }, printError);
        }
    };

    var _getSearchField = function (containerName) {
        switch (containerName) {
            case 'rules':
                return $scope.search;
            case 'groupsRules':
                return $scope.searchGroupsRules;
            case 'pciGroupsRules':
                return $scope.searchFilesPci;
            case 'filesRules':
                return $scope.searchFilesRules;
            default:
                return '';
        }
    };

    var _applyContainer = function (data, containerName) {
        switch(containerName) {
            case 'rules':
                $scope.rules.length = 0;
                $scope.rules = data.data.items;
                break;
            case 'groupsRules':
                $scope.groupsRules.length = 0;
                $scope.groupsRules = data.data.items;
                break;
            case 'pciGroupsRules':
                $scope.pciGroupsRules.length = 0;
                $scope.pciGroupsRules = data.data.items;
                break;
            case 'filesRules':
                $scope.filesRules.length = 0;
                $scope.filesRules = data.data.items;
                break;
            default:
                break;
        }
    };

    //Load functions

    var load_apply_filter = function () {
        var initialize = sharedProperties.getProperty();
        if (initialize != '') {
            if (initialize.substring(0, 3) == 'r//') {
                $scope.setRulesFilter_outside('file', initialize.substring(3));
                sharedProperties.setProperty('');
            }
        }
        $scope.load = false;
    }

    var load_pci_groups = function () {
        DataFactory.initialize('get', '/rules/pci', {}, 12, 0)
            .then(function (data) {
                objectsArray['/rules/pci'] = data;
                DataFactory.get(data).then(function (data) {
                    $scope.pciGroupsRules = data.data.items;
                    load_apply_filter();
                });
            }, printError);
    };

    var load_rules_groups = function () {
        DataFactory.initialize('get', '/rules/groups', {}, 12, 0)
            .then(function (data) {
                objectsArray['/rules/groups'] = data;
                DataFactory.get(data).then(function (data) {
                    $scope.groupsRules = data.data.items;
                    load_pci_groups();
                }, printError);
            }, printError);
    };

    var load_rules_files = function () {
        DataFactory.initialize('get', '/rules/files', {}, 12, 0)
            .then(function (data) {
                objectsArray['/rules/files'] = data;
                DataFactory.get(data).then(function (data) {
                    $scope.filesRules = data.data.items;
                    load_rules_groups();
                }, printError);
            }, printError);
    };

    var load_rules = function () {
        DataFactory.initialize('get', '/rules', {}, 10, 0)
            .then(function (data) {
                objectsArray['/rules'] = data;
                DataFactory.get(data).then(function (data) {
                    $scope.rules = data.data.items;
                    load_rules_files();
                }, printError);
            }, printError);
    };

    var load = function () {
        load_rules();
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

app.controller('decodersController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider) {
    //Initialisation
    $scope.load = true;
    $scope.enableFileSearch = true;

    $scope.decoders = [];
    $scope.filesDecoders = [];

    $scope.dfType = 'all';
    $scope.dfFile = '';
    $scope.dfId = '';

    $scope.menuNavItem = 'ruleset';
    $scope.submenuNavItem = 'decoders';

    $scope.decoderType = 'all';

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    //Tabs
    $scope.setTab = function (tab, group) {
        tabProvider.setTab($scope.pageId, tab, group);
    };

    $scope.isSetTab = function (tab, group) {
        return tabProvider.isSetTab($scope.pageId, tab, group);
    };

    //Functions

    //Decoders - Filters

    $scope.setDecodersFilter = function (type, value) {
        if (type === 'type') {
            if (value !== $scope.dfType) {
                $scope.dfId = '';
                $scope.dfFile = '';
                $scope.dfType = value;
            }
        }

        if (type === 'id') {
            $scope.dfFile = '';
            $scope.dfType = 'all';
            $scope.decoder_search = '';
            if (value === $scope.dfId) {
                $scope.dfId = '';
            } else {
                $scope.dfId = value;
            }
        }

        if (type === 'file') {
            $scope.dfId = '';
            if (value === $scope.dfFile) {
                $scope.dfFile = '';
            } else {
                $scope.dfFile = value;
            }
        }

        _applyDecodersFilters(type);
    };

    $scope.isSetDecodersFilter = function (type, value) {
        if (type === 'type') {
            return $scope.dfType === value;
        } else if (type === 'file') {
            return $scope.dfFile === value;
        } else if (type === 'id') {
            return $scope.dfId === value;
        } else {
            return false;
        }
    };

    $scope.hasDecodersFilter = function (type) {
        if (type === 'type') {
            return $scope.dfType != '';
        } else if (type === 'file') {
            return $scope.dfFile != '';
        } else if (type === 'id') {
            return $scope.dfId != '';
        } else {
            return false;
        }
    };

    var _applyDecodersFilters = function (type) {
        if (type === 'id') {
            var call;
            if ($scope.dfId === '') {
                call = '/decoders';
            } else {
                call = '/decoders/' + $scope.dfId;
            }
            DataFactory.clean(objectsArray['/decoders']);
            DataFactory.initialize('get', call, {}, 10, 0)
                .then(function (data) {
                    objectsArray['/decoders'] = data;
                    DataFactory.get(data).then(function (data) {
                        $scope.decoders = data.data.items;
                    });
                }, printError);
        } else {
            if (type === 'type') {
                var call;
                if ($scope.dfType === 'all') {
                    call = '/decoders';
                    $scope.enableFileSearch = true;
                } else {
                    call = '/decoders/parents';
                    $scope.enableFileSearch = false;
                }
                var body = {};
                if ($scope.decoder_search != '') {
                    body['search'] = $scope.decoder_search;
                }
                DataFactory.clean(objectsArray['/decoders']);
                DataFactory.initialize('get', call, body, 10, 0)
                    .then(function (data) {
                        objectsArray['/decoders'] = data;
                        DataFactory.get(data).then(function (data) {
                            $scope.decoders = data.data.items;
                        });
                    }, printError);
            } else if (type === 'file') {
                if ($scope.dfFile != '') {
                    $scope.objGet('/decoders', 'decoders', {'file': $scope.dfFile});
                } else {
                    $scope.objGet('/decoders', 'decoders', {});
                }
            }
        }
    };

    //Decoders - aux functions

    $scope.formatFile = function (file) {
        return file.split("/").slice(-1)[0];
    };

    $scope.formatTemplate = function (file) {
        return '<span style="width: 200px; display: inline-block; text-align: left;">'+file+'</span>';
    };

    $scope.decoderTooltips = function (key) {
        var tooltip;
        switch (key) {
            case 'prematch':
            case 'regex':
                tooltip = 'OS_Regex type (simple library for regular expressions in C).';
                break;
            case 'program_name':
                tooltip = 'OS_Match type (supports simple string matching and the following special characters).';
                break;
            case 'accumulate':
                tooltip = 'Allow OSSEC to track events over multiple log messages based on a decoded id.';
                break;
            case 'order':
                tooltip = 'Extracted fields by decoder regex.';
                break;
            case 'fts':
                tooltip = 'First time seen';
                break;
            default:
                tooltip = 'Tooltip not found for this field.';
                break;
        }
        return '<div style="width: 250px;">' + tooltip + '</div>';
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

        //Obj functions

    $scope.objHasNext = function (objName) {
        return DataFactory.hasNext(objectsArray[objName]);
    };
    $scope.objNext = function (objName, containerName) {
        DataFactory.next(objectsArray[objName])
            .then(function (data) {
                _applyContainer(data, containerName);
            }, printError);
    };

    $scope.objHasPrev = function (objName) {
        return DataFactory.hasPrev(objectsArray[objName]);
    };
    $scope.objPrev = function (objName, containerName) {
        DataFactory.prev(objectsArray[objName])
            .then(function (data) {
                _applyContainer(data, containerName);
            }, printError);
    };

    $scope.objGet = function (objName, containerName, body) {
        //Search body modification
        var searchField = _getSearchField(containerName);
        if (!body) {
            var tmpBody = DataFactory.getBody(objectsArray[objName]);
            if (searchField !== tmpBody['search']) {
                tmpBody['search'] = searchField;
                body = tmpBody;
            }
        } else if (searchField !== body['search']) {
            body['search'] = searchField;
        }
        if (body['search'] === '') {
            body['search'] = undefined;
        }

        if (!body) {
            DataFactory.get(objectsArray[objName])
                .then(function (data) {
                    _applyContainer(data, containerName);
                }, printError);
        } else {
            DataFactory.get(objectsArray[objName], body)
                .then(function (data) {
                    _applyContainer(data, containerName);
                }, printError);
        }
    };

    var _getSearchField = function (containerName) {
        switch (containerName) {
            case 'decoders':
                return $scope.decoder_search;
            case 'filesDecoders':
                return $scope.searchFilesDecoders;
            default:
                return '';
        }
    };

    var _applyContainer = function (data, containerName) {
        switch(containerName) {
            case 'decoders':
                $scope.decoders.length = 0;
                $scope.decoders = data.data.items;
                break;
            case 'filesDecoders':
                $scope.filesDecoders.length = 0;
                $scope.filesDecoders = data.data.items;
                break;
            default:
                break;
        }
    };

    //Load functions

    var load_decoders_files = function () {
        DataFactory.initialize('get', '/decoders/files', {}, 10, 0)
            .then(function (data) {
                objectsArray['/decoders/files'] = data;
                DataFactory.get(data).then(function (data) {
                    $scope.filesDecoders = data.data.items;
                    $scope.load = false;
                });
            }, printError);
    };

    var load_decoders = function () {
        DataFactory.initialize('get', '/decoders', {}, 10, 0)
            .then(function (data) {
                objectsArray['/decoders'] = data;
                DataFactory.get(data).then(function (data) {
                    $scope.decoders = data.data.items;
                    load_decoders_files();
                });
            }, printError);
    };

    var load = function () {
        load_decoders();
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


app.controller('updateRulesetController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider) {
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
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
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

    $scope.selectUpdateType = function (type) {
        $scope.updateType = type;
    };

    $scope.updateRuleset = function () {
        if (!$scope.updateType) {
            alertify.delay(10000).closeLogOnClick(true).error('Select an update type');
        }
        if ($scope.updateForce) {
            var template = 'Are you sure you want to update the ruleset?<ul style="text-align: left !important;"><li style="text-align: left !important;">The ruleset will be overwritten, except local_rules and local_decoders file.</li><li style="text-align: left !important;">OSSEC manager is going to be restarted.</li><li style="text-align: left !important;">Before the update, backup of the ruleset will be done.</li></ul>';
        }
        else {
            var template = 'Are you sure you want to update the ruleset?<ul style="text-align: left !important;"><li style="text-align: left !important;">The ruleset will be overwritten, except local_rules and local_decoders file.</li><li style="text-align: left !important;">If any rule included in ossec.conf is updated, OSSEC manager will be restarted.</li><li style="text-align: left !important;">Before the update, backup of the ruleset will be done.</li></ul>';
        }
        alertify.confirm(template, function () {
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
                    alertify.delay(10000).closeLogOnClick(true).success(alert);
                    load_backups();
                }, printError);
        });
    };

    $scope.restoreBackup = function () {
        alertify.confirm('Are you sure you want to restore this backup?<ul style="text-align: left !important;"><li style="text-align: left !important;">This action can not be undone.</li></ul>', function () {
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
                    alertify.delay(10000).closeLogOnClick(true).success(alert);
                }, printError);
        });
    };

    //Load functions

    var load_backups = function () {
        DataFactory.getAndClean('get', '/manager/update-ruleset/backups', {})
            .then(function (data) {
                $scope.backups = data.data;
                $scope.load = false;
            }, printError);
    };

    var load = function () {
        load_backups();
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

// Require utils
var kwu = require('plugins/wazuh/utils/kibanaWazuhUtils.js');
var kuf = require('plugins/wazuh/utils/kibanaUrlFormatter.js');
var base64 = require('plugins/wazuh/utils/base64.js');
// Require config
var config = require('plugins/wazuh/config/config.js');
require('ui/notify');
var app = require('ui/modules').get('app/wazuh', [
    'elasticsearch',
    'ngRoute',
    'kibana/courier',
    'kibana/config',
    'kibana/notify',
    'kibana/typeahead'
]);

app.controller('rulesetController', function ($scope, $http, Notifier, $route, $q, alertify, $interval, sharedProperties, $location, apiCall, $sce) {
    $scope.load = true;
    $scope.decoderLoad = false;
    // Load settings
    kwu.getApiCredentials($q, $http).then(function (data) {
        var authdata = data[0];
        var api_url = data[1];
        const notify = new Notifier({
            location: 'Wazuh'
        });

        //RULES

        //Rules - Fetch

        $scope.fetchRulesList = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            apiCall.getApiCall(api_url, '/rules', authdata, $q, $http)
                .then(function (data) {
                    $scope.rules = data.data;
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    $scope.rules.length = 0;
                    defered.resolve(0);
                });
            return promise;
        };

        $scope.fetchFilesList = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            apiCall.getApiCall(api_url, '/rules/files', authdata, $q, $http)
                .then(function (data) {
                    $scope.filesRules = data.data;
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    $scope.filesRules.length = 0;
                    defered.resolve(0);
                });
            return promise;
        };


        $scope.fetchGroupsList = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            apiCall.getApiCall(api_url, '/rules/groups', authdata, $q, $http)
                .then(function (data) {
                    $scope.groupsRules = data.data;
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    $scope.groupsRules.length = 0;
                    defered.resolve(0);
                });
            return promise;
        };


        $scope.fetchPCIGroupsList = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            apiCall.getApiCall(api_url, '/rules/pci', authdata, $q, $http)
                .then(function (data) {
                    $scope.pciGroupsRules = data.data;
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    $scope.pciGroupsRules.length = 0;
                    defered.resolve(0);
                });
            return promise;
        };

        //Rules - Filters

        $scope.filterStatus = function (status) {
            if ($scope.fileFilter && $scope.fileFilter !== '') {
                $scope.fileFilter = '';
            }
            if ($scope.groupFilter && $scope.groupFilter !== '') {
                $scope.groupFilter = '';
            }
            if ($scope.rulesetStatusFilter === status) {
                $scope.rulesetStatusFilter = '';
            } else {
                $scope.rulesetStatusFilter = status;
            }
        };

        $scope.setFileFilter = function (file) {
            if ($scope.groupFilter !== '') {
                $scope.groupFilter = '';
            }
            if ($scope.pciFilter !== '') {
                $scope.pciFilter = '';
            }
            if ($scope.fileFilter === file) {
                $scope.fileFilter = '';
            } else {
                $scope.fileFilter = file;
            }
        };

        $scope.isSetFileFilter = function (file) {
            return $scope.fileFilter === file;
        };

        $scope.setGroupFilter = function (group) {
            if ($scope.fileFilter !== '') {
                $scope.fileFilter = '';
            }
            if ($scope.pciFilter !== '') {
                $scope.pciFilter = '';
            }
            if ($scope.groupFilter === group) {
                $scope.groupFilter = '';
            } else {
                $scope.groupFilter = group;
            }
        };

        $scope.isSetGroupFilter = function (group) {
            return $scope.groupFilter === group;
        };

        $scope.setPciFilter = function (pci) {
            if ($scope.fileFilter !== '') {
                $scope.fileFilter = '';
            }
            if ($scope.groupFilter !== '') {
                $scope.groupFilter = '';
            }
            if ($scope.pciFilter === pci) {
                $scope.pciFilter = '';
            } else {
                $scope.pciFilter = pci;
            }
        };

        $scope.isSetPciFilter = function (pci) {
            return $scope.pciFilter === pci;
        };

        $scope.setFileFilterOutside = function (file) {
            $scope.setFileFilter(file);
            $scope.setTabFilters(1);
        };

        $scope.setGroupFilterOutside = function (group) {
            $scope.setGroupFilter(group);
            $scope.setTabFilters(2);
        };

        $scope.setPciFilterOutside = function (pci) {
            $scope.setPciFilter(pci);
            $scope.setTabFilters(3);
        };

        $scope.filterLevel = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            if (($scope.minLevel == undefined) || ($scope.maxLevel == undefined)
                || ($scope.minLevel < 0 || $scope.minLevel > 15
                    || $scope.maxLevel < 0 || $scope.maxLevel > 15)
                || ($scope.maxLevel < $scope.minLevel)) {

                $scope.minLevel = 0;
                $scope.maxLevel = 15;
                $scope.message = $sce.trustAsHtml('Invalid level filters');
            }

            apiCall.getApiCall(api_url, '/rules?level=' + $scope.minLevel + '-' + $scope.maxLevel, authdata, $q, $http)
                .then(function (data) {
                    $scope.rules = data.data;
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    $scope.rules.length = 0;
                    defered.resolve(0);
                });
            return promise;
        };

        $scope.setFilterLevel = function (ruleLevel) {
            $scope.minLevel = $scope.maxLevel = parseInt(ruleLevel);
            $scope.filterLevel();
        };

        $scope.hasFileFilter = function () {
            return ($scope.fileFilter) && ($scope.fileFilter !== '');
        };

        $scope.hasGroupFilter = function () {
            return ($scope.groupFilter) && ($scope.groupFilter !== '');
        };

        $scope.hasPciFilter = function () {
            return ($scope.pciFilter) && ($scope.pciFilter !== '');
        };

        //Rules - Other functions


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
            apiCall.getApiCall(api_url, '/rules/files?download=' + fileName, authdata, $q, $http)
                .then(function (data) {
                    var blob = new Blob([data], { type: 'text/xml' });
                    $scope.encodedFile = (window.URL || window.webkitURL).createObjectURL(blob);
                }, function (data) {
                    if ((data.status > 299) || (200 > data.status)) {
                        $scope.message = $sce.trustAsHtml('Error creating the download link for ' + fileName + '. Please, check if the file exists.');
                        $scope.encodedFile = '';
                    } else {
                        var blob = new Blob([data], { type: 'text/xml' });
                        $scope.encodedFile = (window.URL || window.webkitURL).createObjectURL(blob);
                    }
                });
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
                default:
                    tooltip = '';
                    break;
            }
            return '<div style="width: 250px;">' + tooltip + '</div>';
        };

        //DECODERS

        //Decoders - Fetch

        $scope.fetchDecodersList = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            apiCall.getApiCall(api_url, '/decoders', authdata, $q, $http)
                .then(function (data) {
                    $scope.decoders = data.data;
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    $scope.decoders.length = 0;
                    defered.resolve(0);
                });
            return promise;
        };

        $scope.fetchParentsDecodersList = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            apiCall.getApiCall(api_url, '/decoders/parents', authdata, $q, $http)
                .then(function (data) {
                    $scope.decoders = data.data;
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    $scope.decoders.length = 0;
                    defered.resolve(0);
                });
            return promise;
        };


        $scope.fetchDecodersFilesList = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            apiCall.getApiCall(api_url, '/decoders/files', authdata, $q, $http)
                .then(function (data) {
                    $scope.filesDecoders = data.data;
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    $scope.filesDecoders.length = 0;
                    defered.resolve(0);
                });
            return promise;
        };


        //Decoders - Filters

        $scope.setDecoderFilterOutside = function (decoder) {
            $scope.setTab(2);
            $scope.setDecoderPathFilter(decoder);
        };

        $scope.setDecoderPathFilter = function (path) {
            if ($scope.pathDecoderFilter === path) {
                $scope.pathDecoderFilter = '';
            } else {
                $scope.pathDecoderFilter = path;
            }
            $scope.parent_filter = '';
        };

        $scope.isSetDecoderPathFilter = function (path) {
            return $scope.pathDecoderFilter === path;
        };

        $scope.hasDecoderFilter = function () {
            return ($scope.pathDecoderFilter) && ($scope.pathDecoderFilter !== '');
        };

        $scope.filterDecoderParent = function (parent) {
            if ($scope.parent_filter !== parent) {
                $scope.parent_filter = parent;
            } else {
                $scope.parent_filter = '';
            }
            if ($scope.pathDecoderFilter !== '') {
                $scope.pathDecoderFilter = '';
            }
        };

        $scope.isSetParentFilter = function (parent) {
            return $scope.parent_filter === parent;
        };

        $scope.hasParentFilter = function () {
            return ($scope.parent_filter) && ($scope.parent_filter !== '');
        };

        $scope.filterDecoderType = function (type) {
            if (type === 'all') {
                $scope.decoderType = 'all';
                $scope.fetchDecodersList();
            } else if (type === 'parents') {
                $scope.decoderType = 'parents';
                $scope.fetchParentsDecodersList();
            }
        };

        //Decoders - Other functions


        $scope.formatFile = function (file) {
            return file.split("/").slice(-1)[0];
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
                    tooltip = '';
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

        //UPDATER

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

                apiCall.putApiCall(api_url, path, {}, authdata, $q, $http)
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
                    }, function (data) {
                        alertify.delay(10000).closeLogOnClick(true).error('Ruleset not updated');
                        $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    });

            }, function () {
                alertify.delay(10000).closeLogOnClick(true).log('Ruleset not updated');
            });
        };

        $scope.fetchBackupsList = function () {
            var defered = $q.defer();
            var promise = defered.promise;
            apiCall.getApiCall(api_url, '/manager/update-ruleset/backups', authdata, $q, $http)
                .then(function (data) {
                    $scope.backups = data.data;
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    $scope.backups.length = 0;
                    defered.resolve(0);
                });
            return promise;
        };

        $scope.restoreBackup = function () {
            alertify.confirm('Are you sure you want to restore this backup?<ul style="text-align: left !important;"><li style="text-align: left !important;">This action can not be undone.</li></ul>', function () {
                apiCall.putApiCall(api_url, '/manager/update-ruleset/backups/' + $scope.selectedBackup, {}, authdata, $q, $http)
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
                    }, function (data) {
                        $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                        alertify.delay(10000).closeLogOnClick(true).error('There was an error trying to restore the backup.');
                    });
            }, function () {
                alertify.delay(10000).closeLogOnClick(true).log('Backup not restored.');
            });
        };

        //TABS

        $scope.setTab = function (newTab) {
            $scope.tab = newTab;
        };

        $scope.isSet = function (tabNum) {
            return $scope.tab === tabNum;
        };

        $scope.setTabFilters = function (newTab, index) {
            $scope.tabFilters[index] = newTab;
        };

        $scope.isSetFilters = function (tabNum, index) {
            return $scope.tabFilters[index] === tabNum;
        };


        //Load the page
        $scope.rules = [];
        $scope.backups = [];
        $scope.decoders = [];
        $scope.groupsRules = [];
        $scope.pciGroupsRules = [];
        $scope.fetchRulesList().then(function (data) {
            $scope.fetchFilesList().then(function (data) {
                $scope.fetchGroupsList().then(function (data) {
                    $scope.fetchPCIGroupsList().then(function (data) {

                        $scope.rulesetStatusFilter = 'enabled';
                        $scope.tab = [];
                        $scope.tabFilters = [];
                        $scope.setTab(1);
                        $scope.setTabFilters(1);

                        $scope.maxLevel = 15;
                        $scope.minLevel = 0;

                        $scope.updateType = 'b';
                        $scope.updateForce = false;

                        $scope.decoderType = 'all';

                        $scope.fetchBackupsList();

                        $scope.fetchDecodersList().then(function (data) {
                            $scope.fetchDecodersFilesList().then(function (data) {
                                $scope.decoderLoad = true;
                                $scope.load = false;
                            });
                        });


                        if (sharedProperties.getRuleFileName() && (sharedProperties.getRuleFileName() != '') && sharedProperties.getIsRule()) {
                            $scope.setFileFilterOutside(sharedProperties.getRuleFileName());
                            sharedProperties.setRuleFileName('');
                        } else if (sharedProperties.getRuleFileName() && (sharedProperties.getRuleFileName() != '')) {
                            $scope.setDecoderFilterOutside(sharedProperties.getRuleFileName());
                            sharedProperties.setRuleFileName('');
                        }
                    });
                });
            });
        });

    }, function (data) {
        $scope.message = $sce.trustAsHtml('Could not get the API credentials. Is elasticsearch working?');
    })
});
// Require routes
var routes = require('ui/routes');

//Installation wizard
var settingsWizard = function ($location, testConnection) {
  testConnection.test()
    .then(function () { }, function () {
      $location.path('/settings');
    });
}

//Routes
routes.enable();
routes
    .when('/agents/', {
        template: require('plugins/wazuh/templates/agents.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/agents/metrics/', {
        template: require('plugins/wazuh/templates/agents-metrics.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/manager/', {
        template: require('plugins/wazuh/templates/manager.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/alerts/', {
        template: require('plugins/wazuh/templates/alerts.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/manager/osseclog/', {
        template: require('plugins/wazuh/templates/manager-osseclog.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/manager/configuration/', {
        template: require('plugins/wazuh/templates/manager-configuration.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/manager/metrics/', {
        template: require('plugins/wazuh/templates/manager-metrics.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/settings/', {
        template: require('plugins/wazuh/templates/settings.html')
    })
    .when('/fim/', {
        template: require('plugins/wazuh/templates/fim.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/fim/dashboard/', {
        template: require('plugins/wazuh/templates/fim-dashboard.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/ruleset/', {
        template: require('plugins/wazuh/templates/ruleset-rules.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/ruleset/decoders/', {
        template: require('plugins/wazuh/templates/ruleset-decoders.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/ruleset/update/', {
        template: require('plugins/wazuh/templates/ruleset-update.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/policy_monitoring/', {
        template: require('plugins/wazuh/templates/policy-monitoring.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/compliance/dashboard/', {
        template: require('plugins/wazuh/templates/compliance-rcdashboard.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/compliance/pci/', {
        template: require('plugins/wazuh/templates/compliance-pci.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/compliance/cis/', {
        template: require('plugins/wazuh/templates/compliance-cis.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/discover/', {
        template: require('plugins/wazuh/templates/discover.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/', {
        redirectTo: '/manager/',
        resolve: {
            "check": settingsWizard
        }
    })
    .when('', {
        redirectTo: '/manager/',
        resolve: {
            "check": settingsWizard
        }
    })
    .otherwise({
        redirectTo: '/settings/'
    });
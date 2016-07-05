// Require config
require('plugins/wazuh/config/config.js');

// Require CSS
require('plugins/wazuh/less/main.less');

// Require routes
var routes = require('ui/routes');

// Set up tabs
require('ui/chrome').setNavBackground('#222222').setTabs([
  { id: 'manager', title: 'Manager' },
  { id: 'agents', title: 'Agents' },
  { id: 'ruleset', title: 'Ruleset' },
  { id: 'FIM', title: 'FIM' },
  { id: 'rootcheck', title: 'Rootcheck' },
  { id: 'settings', title: 'Settings' }
]);

// Set up logo
require('ui/chrome')
  .setBrand({
    logo: 'url(/plugins/wazuh/icon.png) center no-repeat'
  })

// Set up Wazuh app
var app = require('ui/modules').get('app/wazuh', ['angularUtils.directives.dirPagination', 'angular.filter', 'AxelSoft', 'chart.js', 'ngAlertify', '720kb.tooltips'])
  .service('sharedProperties', function () {
    var _property = '';

    return {
      getProperty: function () {
        return _property;
      },
      setProperty: function (value) {
        _property = value;
      }
    };
  })
  .service('testConnection', function ($q, $http) {
    return {
      test: function () {
        var defered = $q.defer();
        var promise = defered.promise;

        $http.get("/api/wazuh-api/test")
          .success(function (data) {
            if (data.error) {
              defered.reject(data);
            } else {
              defered.resolve(data);
            }
          })
          .error(function (data) {
            defered.reject(data);
          })

          return promise;
      }
    };
  })
  .service('apiReq', function ($q, $http) {
    return {
      request: function (method, path, body) {
        var defered = $q.defer();
        var promise = defered.promise;

        if (!method || !path || !body) {
          defered.reject({'error': -1, 'message': 'Missing parameters'});
          return promise;
        }

        var requestData = {
          'method': method,
          'path': path,
          'body': body
        }

        var requestHeaders = {
          headers: {
            "Content-Type": 'application/json'
          }
        }

        $http.post('/api/wazuh-api/request', requestData, requestHeaders)
        .success(function (data) {
          if (data.error) {
            defered.reject(data);
          } else {
            defered.resolve(data);
          }
        })
        .error(function (data) {
          if (data.error) {
            defered.reject(data);
          } else {
            defered.reject({'error': -2, 'message': 'Error doing a request to Kibana API.'});
          }
        });

        return promise;
      }
    };
  })
  .factory('DataFactory', function (apiReq, $q) {
    var dataObj = {};
    var _instances = [];

    dataObj.initialize = function (method, path, body, pageSize, offset) {
      var defered = $q.defer();
      var promise = defered.promise;

      if(!method || !path || !body) {
        defered.reject(prepError({'error': -1, 'message': 'Missing parameters'}));
        return promise;
      }

      var instance = (Math.random().toString(36).substring(3));
      while ((_instances[instance]) && (_instances[instance].length > 0)) {
        instance = (Math.random().toString(36).substring(3));
      }

      var limit;
      if ((method === 'get') && (pageSize)) {
        apiReq.request('get', path+'?offset=0&limit=1', body)
        .then(function (data) {
          limit = data.data.totalItems;
          _instances[instance] = {
            'method': method, 'path': path, 'body': body, 'pageSize': pageSize,
            'offset': offset, 'limit': limit, 'pagination': true
          };
          defered.resolve(instance);
        }, function (data) {
          defered.reject(prepError(data));
        });

      } else {
        _instances[instance] = { 'method': method, 'path': path, 'body': body, 'pageSize': pageSize,
          'offset': offset, 'pagination': false };
        defered.resolve(instance);  
      }

      return promise;
    };

    dataObj.hasNext = function (instanceId) {
      return ((_instances[instanceId]['offset'] + _instances[instanceId]['pageSize']) < _instances[instanceId]['limit']);
    }

    dataObj.next = function (instanceId) {
      var defered = $q.defer();
      var promise = defered.promise;

      if (!instanceId) {
        defered.reject(prepError({ 'error': -1, 'message': 'Missing parameters' }));
        return promise;
      }
      
      if (!_instances[instanceId]['pagination']) {
        defered.reject(prepError({'error': -10, 'message': 'Pagination disabled for this object'}));
        return promise;
      }

      _instances[instanceId]['offset'] += _instances[instanceId]['pageSize'];

      if ((_instances[instanceId]['offset'] < 0) ||
        (_instances[instanceId]['offset'] >= _instances[instanceId]['limit'])) {
        _instances[instanceId]['offset'] -= _instances[instanceId]['pageSize']
        defered.reject(prepError({ 'error': -11, 'message': 'Pagination out of bounds' }));
        return promise;
      }

      dataObj.get(instanceId)
      .then( function (data) {
        defered.resolve(data);
      }, function (data) {
        defered.reject(data);
      });

      return promise;
    };

    dataObj.hasPrev = function (instanceId) {
      return ((_instances[instanceId]['offset'] - _instances[instanceId]['pageSize']) >= 0);
    }

    dataObj.prev = function (instanceId) {
      var defered = $q.defer();
      var promise = defered.promise;

      if (!instanceId) {
        defered.reject(prepError({ 'error': -1, 'message': 'Missing parameters' }));
        return promise;
      }
      
      if (!_instances[instanceId]['pagination']) {
        defered.reject(prepError({'error': -10, 'message': 'Pagination disabled for this object'}));
        return promise;
      }

      _instances[instanceId]['offset'] -= _instances[instanceId]['pageSize'];

      if ((_instances[instanceId]['offset'] < 0) ||
        (_instances[instanceId]['offset'] >= _instances[instanceId]['limit'])) {
          _instances[instanceId]['offset'] += _instances[instanceId]['pageSize']
          defered.reject(prepError({'error': -11, 'message': 'Pagination out of bounds'}));
          return promise;
      }

      dataObj.get(instanceId)
      .then( function (data) {
        defered.resolve(data);
      }, function (data) {
        defered.reject(data);
      });

      return promise;
    }

    dataObj.get = function (instanceId, newBody) {
      var defered = $q.defer();
      var promise = defered.promise;

      if (!instanceId) {
        defered.reject(prepError({ 'error': -1, 'message': 'Missing parameters' }));
        return promise;
      }

      if (newBody) {
        _instances[instanceId]['body'] = newBody;
        _instances[instanceId]['offset'] = 0;
      }

      var preparedBody = _instances[instanceId]['body'];
      if (_instances[instanceId]['pagination']) {
        preparedBody['offset'] = _instances[instanceId]['offset'];
        preparedBody['limit'] = _instances[instanceId]['pageSize'];
      }
      
      apiReq.request(_instances[instanceId]['method'], _instances[instanceId]['path'], preparedBody)
      .then(function (data) {
        if ((_instances[instanceId]['pagination']) && (data.data.totalItems != _instances[instanceId]['limit'])) {
          _instances[instanceId]['limit'] = data.data.totalItems;
        }
        defered.resolve(data);
      }, function (data) {
        defered.reject(prepError(data));
      });

      return promise;
    };

    dataObj.getBody = function (instanceId) {
      return _instances[instanceId]['body'];
    };

    dataObj.clean = function (instanceId) {
      _instances[instanceId].length = 0;
    };

    dataObj.cleanAll = function () {
      _instances = 0;
    };

    dataObj.getAndClean = function (method, path, body) {
      var defered = $q.defer();
      var promise = defered.promise;

      dataObj.initialize(method, path, body)
      .then(function (_instanceId) {
        dataObj.get(_instanceId)
        .then (function (data) {
          defered.resolve(data);
          dataObj.clean(_instanceId);
        }, function (error) {
          defered.reject(error);
          dataObj.clean(_instanceId);
        })
      }, function (error) {
        defered.reject(error);
      })

      return promise;
    };

    var prepError = function (err) {
      if(err.error < 0) {
        err['html'] = "Unexpected error located on AngularJS. Error: <b>"+err.message+" (code "+ err.error +")</b>.";
        err.message = "Unexpected error located on AngularJS. Error: "+err.message+" (code "+ err.error +").";
      } else if (err.error === 1) {
        err['html'] = "<b>Error getting credentials</b> for Wazuh API. Please, check credentials at settings tab.";
        err.message = "Error getting credentials for Wazuh API. Please, check credentials at settings tab.";
      } else if (err.error === 2) {
        err['html'] = "<b>Error getting credentials</b> for Wazuh API. Could not connect with Elasticsearch.";
        err.message = "Error getting credentials for Wazuh API. Could not connect with Elasticsearch.";
      } else if (err.error < 5) {
        err['html'] = "Unexpected error located on Kibana server. Error: <b>"+err.message+" (code "+ err.error +")</b>.";
        err.message = "Unexpected error located on Kibana server. Error: "+err.message+" (code "+ err.error +").";
      } else if (err.error === 5) {
        err['html'] = "Could not connect with Wazuh API. Error: "+err.errorMessage+".</br> Please, check the URL at settings tab.";
        err.message = "Could not connect with Wazuh API. Error: "+err.errorMessage+". Please, check the URL at settings tab.";
      } else if (err.error === 6) {
        err['html'] = "Wazuh API returned an error message. Error: <b>"+err.errorData.message+"</b>";
        err.message = "Wazuh API returned an error message. Error: "+err.errorData.message;
      } else {
        err['html'] = "Unexpected error. Please, report this to Wazuh Team.";
        err.message = "Unexpected error. Please, report this to Wazuh Team.";
      }

      return err;
    };

    return dataObj;
  })
  .service('tabProvider', function() {
    var _tabs = [];

    return {
      register: function (pageId) {
        if (!_tabs[pageId]) {
          _tabs[pageId] = [];
        }
      },
      setTab: function (pageId, tab, tabset) {
        if (!tabset) {
          tabset = 0;
        }
        if (!_tabs[pageId]) {
          return false;
        }
        _tabs[pageId][tabset] = tab;
        return true;
      },
      isSetTab: function (pageId, tab, tabset) {
        if (!tabset) {
          tabset = 0;
        }
        if (!_tabs[pageId]) {
          return false;
        }
        if (!_tabs[pageId][tabset]) {
          return (tab == 1);
        }
        return (_tabs[pageId][tabset] == tab);
      },
      clean: function (pageId) {
        if(_tabs[pageId]) {
          _tabs[pageId].length = 0;
        }
      }

    };
  })
  .config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data|blob):/);
  }]);

//Installation wizard
var settingsWizard = function ($location, testConnection) {
  testConnection.test()
    .then(function () { }, function () {
      $location.path('/settings');
    });
}

routes.enable();
// Set up routes and views
routes
  .when('/agents', {
    template: require('plugins/wazuh/templates/agents.html'),
    resolve: {
      "check": settingsWizard
    }
  })
  .when('/manager', {
    template: require('plugins/wazuh/templates/manager.html'),
    resolve: {
      "check": settingsWizard
    }
  })
  .when('/settings', {
    template: require('plugins/wazuh/templates/settings.html')
  })
  .when('/FIM', {
    template: require('plugins/wazuh/templates/FIM.html'),
    resolve: {
      "check": settingsWizard
    }
  })
  .when('/rootcheck', {
    template: require('plugins/wazuh/templates/rootcheck.html'),
    resolve: {
      "check": settingsWizard
    }
  })
  .when('/ruleset', {
    template: require('plugins/wazuh/templates/ruleset.html'),
    resolve: {
      "check": settingsWizard
    }
  })
  .when('/osseclog', {
    template: require('plugins/wazuh/templates/osseclog.html'),
    resolve: {
      "check": settingsWizard
    }
  })
  .otherwise({
    redirectTo: '/settings'
  });

// Require controllers
require('plugins/wazuh/controllers/agents.js');
require('plugins/wazuh/controllers/settings.js');
require('plugins/wazuh/controllers/manager.js');
require('plugins/wazuh/controllers/FIM.js');
require('plugins/wazuh/controllers/rootcheck.js');
require('plugins/wazuh/controllers/ruleset.js');
require('plugins/wazuh/controllers/osseclog.js');

//External angularjs libs
require('plugins/wazuh/../node_modules/angular-utils-pagination/dirPagination.js');
require('plugins/wazuh/../node_modules/angular-filter/dist/angular-filter.min.js');
require('plugins/wazuh/utils/customSelect/bootstrap.min.js');
require('plugins/wazuh/utils/customSelect/customSelect.js');
require('plugins/wazuh/utils/customSelect/style.css');
require('plugins/wazuh/../node_modules/angular-chart.js/dist/angular-chart.js');
require('plugins/wazuh/../node_modules/angular-chart.js/dist/angular-chart.css');
require('plugins/wazuh/../node_modules/alertify.js/dist/css/alertify.css');
require('plugins/wazuh/../node_modules/alertify.js/dist/js/alertify.js');
require('plugins/wazuh/../node_modules/alertify.js/dist/js/ngAlertify.js');
require('plugins/wazuh/../node_modules/angular-tooltips/dist/angular-tooltips.min.css');
require('plugins/wazuh/../node_modules/angular-tooltips/dist/angular-tooltips.min.js');
var app = require('ui/modules').get('app/wazuh', []);

app.factory('DataHandler', function($q, apiReq) {
  var DataHandler = function() {
    this.items = [];
    this.filters = [];
    this.path = '';
    this.offset = 0;
    this.sortValue = '';
    this.initial = true;
    this.initialBatch = 40;
    this.regularBatch = 15;
  };

  DataHandler.prototype.nextPage = function() {
    if (this.busy) return;
    this.busy = true;
    var requestData;

    if (this.initial) { requestData = { offset: this.offset, limit: this.initialBatch }; this.initial = false; }
    else requestData = { offset: this.offset, limit: this.regularBatch };

    angular.forEach(this.filters, function(filter) {
      if (filter.value != '') requestData[filter.name] = filter.value;
    });

    var deferred = $q.defer();
    apiReq.request('GET', this.path, requestData).then(function(data) {
      if (data.data.data == 0)
        deferred.resolve(false);

      var totalItems = data.data.data.totalItems;
      var items = data.data.data.items;
      for (var i = 0; i < items.length; i++) {
        this.items.push(items[i]); this.items[i].selected = false;
      }
      this.offset += items.length;
      (this.offset >= totalItems) ? this.end = true : this.busy = false
      if (data.data.data != 0)
        deferred.resolve(true);

    }.bind(this));
    
    return deferred.promise;  
  };

  DataHandler.prototype.hasFilter = function(filterName) {
    var filterOrNot = false;
    angular.forEach(this.filters, function(filter) { if (filter.name == filterName) filterOrNot = true; });
    return filterOrNot;
  };

  DataHandler.prototype.addFilter = function(filterName, value) {
    this.removeFilter(filterName, false);
    this.filters.push({ "name": filterName, "value": value });
    this.search();
  };

  DataHandler.prototype.removeFilter = function(filterName, search) {
    angular.forEach(this.filters, function(filter, key) {
      if (filterName == filter.name) { this.filters.splice(key, 1); }
    }, this);
    if (search) this.search();
  };

  DataHandler.prototype.delete = function(name, index) {
    apiReq.request('DELETE', this.path, {}).then(function(data) {
      this.items.splice(index, 1);
    }.bind(this));
  };

  DataHandler.prototype.search = function() {
    var requestData;
    this.end = false; this.busy = false;
    this.sortValue = '';

    requestData = { offset: 0, limit: this.initialBatch }

    angular.forEach(this.filters, function(filter) {
      if (filter.value != '') requestData[filter.name] = filter.value;
    });

    apiReq.request('GET', this.path, requestData).then(function(data) {
      this.items = [];
      var items = data.data.data.items;
      for (var i = 0; i < items.length; i++) {
        this.items.push(items[i]); this.items[i].selected = false;
      }
      this.offset = items.length;
    }.bind(this));
  };

  DataHandler.prototype.sort = function(by) {
    this.sortValue = by;
    this.sortDir = !this.sortDir;
  };

  DataHandler.prototype.reset = function() {
    this.items = [];
    this.filters = [];
    this.offset = 0;
    this.sortValue = '';
    this.initial = true;
    this.end = false;
    this.busy = false;
  };
  return DataHandler;
});

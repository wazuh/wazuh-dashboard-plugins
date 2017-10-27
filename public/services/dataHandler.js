let app = require('ui/modules').get('app/wazuh', []);

app.factory('DataHandler', ($q, apiReq) => {
    class DataHandler {
        constructor() {
            this.items        = [];
            this.filters      = [];
            this.path         = '';
            this.offset       = 0;
            this.sortValue    = '';
            this.initial      = true;
            this.initialBatch = 40;
            this.regularBatch = 15;
        }

        nextPage () {
            if (this.busy) return;
            this.busy = true;
            let requestData;

            if (this.initial) {
                requestData = {
                    offset: this.offset,
                    limit:  this.initialBatch
                };
                this.initial = false;
            } else {
                requestData = {
                    offset: this.offset,
                    limit:  this.regularBatch
                };
            }

            for(let filter of this.filters){
                if (filter.value !== '') requestData[filter.name] = filter.value;
            }

            let deferred = $q.defer();
            apiReq.request('GET', this.path, requestData)
            .then(function (data) {
                if (data.data.data == 0){
                    deferred.resolve(false);
                }
                let totalItems = data.data.data.totalItems;
                let items      = data.data.data.items;
                for (let i = 0,len = items.length; i < len; i++) {
                    this.items.push(items[i]);
                    this.items[i].selected = false;
                }
                this.offset += items.length;
                (this.offset >= totalItems) ? this.end = true: this.busy = false;
                if (data.data.data !== 0){
                    deferred.resolve(true);
                }
            }.bind(this));

            return deferred.promise;
        }

        hasFilter (filterName) {
            let filtered = this.filters.filter((element) => element.name === filterName);
            return filtered.length !== 0;
        }

        addFilter (filterName, value) {
            this.removeFilter(filterName, false);
            this.filters.push({
                "name":  filterName,
                "value": value
            });
            this.search();
        }

        removeFilter (filterName, search) {
            angular.forEach(this.filters, function (filter, key) {
                if (filterName == filter.name) {
                    this.filters.splice(key, 1);
                }
            }, this);
            if (search) this.search();
        }

        delete (name, index) {
            apiReq.request('DELETE', this.path, {})
            .then(function (data) {
                this.items.splice(index, 1);
            }.bind(this));
        }

        search () {
            let requestData;
            this.end       = false;
            this.busy      = false;
            this.sortValue = '';

            requestData = {
                offset: 0,
                limit:  this.initialBatch
            };

            for(let filter of this.filters){
                if (filter.value !== '') requestData[filter.name] = filter.value;
            }

            apiReq.request('GET', this.path, requestData)
            .then(function (data) {
                this.items = [];
                let items  = data.data.data.items;
                for (let i = 0,len = items.length; i < len; i++) {
                    this.items.push(items[i]);
                    this.items[i].selected = false;
                }
                this.offset = items.length;
            }.bind(this));
        }

        sort(by) {
            this.sortValue = by;
            this.sortDir   = !this.sortDir;
        }

        reset() {
            this.items     = [];
            this.filters   = [];
            this.offset    = 0;
            this.sortValue = '';
            this.initial   = true;
            this.end       = false;
            this.busy      = false;
        }
    }

    return DataHandler;
});
let app = require('ui/modules').get('app/wazuh', []);

app.factory('DataHandler', function ($q, apiReq) {
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
            this.busy         = false;
            this.end          = false;
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

            if(this.offset !== 0 && this.offset >= this.totalItems){
                this.end = true;
                this.busy = false;
                return;
            }
            let deferred = $q.defer();
            apiReq.request('GET', this.path, requestData)
            .then(data => {
                if (data.data.data === 0){
                    this.busy = false;
                    deferred.resolve(false);
                }
                this.totalItems = data.data.data.totalItems;
                let items       = data.data.data.items;
                for (let i = 0,len = items.length; i < len; i++) {
                    this.items.push(items[i]);
                    this.items[i].selected = false;
                }
                this.offset += items.length;
                if (this.offset >= this.totalItems) this.end = true; 
                if (data.data.data !== 0){
                    this.busy = false;
                    if(this.path === '/agents/groups'){
                        let filtered = this.items.filter((elem, index, self) => self.findIndex(
                            (t) => {return (t.merged_sum === elem.merged_sum)}) === index);
                        if(filtered.length !== this.items.length) this.items = filtered;
                    }
                    deferred.resolve(true);
                }
            })
            .catch(err => this.busy = false);

            return deferred.promise;
        }

        getFilter (filterName) {
            let filtered = this.filters.filter(element => element.name === filterName);
            return (filtered.length !== 0) ? filtered[0].value : null;           
        }

        hasFilter (filterName) {
            let filtered = this.filters.filter(element => element.name === filterName);
            return filtered.length !== 0;
        }

        addFilter (filterName, value) {
            this.removeFilter(filterName, false);

            this.filters.push({
                name:  filterName,
                value: value
            });
            return this.search();
        }

        ///////////////////////////////////////////////////////////////
        // Only used by agents preview, don't use for any thing more //
        ///////////////////////////////////////////////////////////////
        addMultipleFilters (arrayOfFilters) {
            this.filters = [...arrayOfFilters];
            return this.search();
        }

        removeFilter (filterName, search) {
            if(search) this.filters = this.filters.filter(filter => filterName !== filter.name && filter.value !== search);
            else       this.filters = this.filters.filter(filter => filterName !== filter.name);
            
            if (search) this.search();

        }

        delete (name, index) {
            apiReq.request('DELETE', this.path, {})
            .then(function (data) {
                this.items.splice(index, 1);
            }.bind(this))
            .catch(console.error);
        }

        search () {
            let deferred = $q.defer();
            let requestData;
            this.end       = false;
            this.busy      = false;
            this.sortValue = '';

            requestData = {
                offset: 0,
                limit:  this.initialBatch
            };
            let isUnknown = false;

            for(let filter of this.filters){
                   if (filter.value !== '' && filter.value !== 'Unknown') requestData[filter.name] = filter.value;
                if (filter.value === 'Unknown') isUnknown = true;
            }


            apiReq.request('GET', this.path, requestData)
            .then(data => {
                this.items = [];
                let items  = data.data.data.items;
                this.totalItems = data.data.data.totalItems;
                for (let i = 0,len = items.length; i < len; i++) {
                    this.items.push(items[i]);
                    this.items[i].selected = false;
                }
                if(isUnknown){
                    this.items = this.items.filter(item => typeof item.os === 'undefined');
                }
                this.offset = items.length;
                deferred.resolve(true);
            })
            .catch(console.error);

            return deferred.promise;
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
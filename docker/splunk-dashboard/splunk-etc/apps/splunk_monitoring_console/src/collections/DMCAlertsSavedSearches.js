/**
 * @ author atruong
 * @ date 7/08/15
 *
 * Collection to get only DMC preconfigured alerts from saved searches
 */

define(
    [
        'underscore',
        '@splunk/swc-mc'
    ],
    function(_, SwcMC) {
        return SwcMC.SavedSearchesCollection.extend({
            /**
             * Generates the search string to pass in the EAI Request. This is calculated from the name and
             * description attributes.
             */
            _getCalculatedSearch: function(options) {
                var searchString = 'name="DMC Alert*"';

                if (!_.isUndefined(options.data) && !_.isUndefined(options.data.searchFilter)) {
                    var searchFilter = options.data.searchFilter;
                    searchString += ' AND (name="*' + searchFilter + '*" OR description="*' + searchFilter + '*")';
                    delete options.data.searchFilter;
                }

                return searchString;
            },
            
            sync: function(method, model, options) {
                switch (method) {
                    case 'read' :
                        options = options || {};
                        var search = this._getCalculatedSearch(options);
                        _.extend(options.data, {
                            app: 'splunk_monitoring_console',
                            owner: '-',
                            search: search
                        });
                        _.isUndefined(options.data.count) && model.fetchData.set('count', 25);
                        break;
                }
                return SwcMC.SavedSearchesCollection.prototype.sync.apply(this, arguments);
            }
        });
    }
);

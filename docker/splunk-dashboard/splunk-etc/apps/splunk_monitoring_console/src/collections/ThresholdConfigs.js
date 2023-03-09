define([
	'jquery',
	'underscore',
	'@splunk/swc-mc',
    'splunk_monitoring_console/helpers/ThresholdConfigsClient'
], function(
	$,
	_,
	SwcMC,
    ThresholdConfigsClientHelper
){
	return SwcMC.SplunkDsBaseCollection.extend({
		url: 'configs/conf-macros',
        
        initialize: function() {
            SwcMC.SplunkDsBaseCollection.prototype.initialize.apply(this, arguments);

            this.listenTo(this.paging, 'change', this._updateTotal);
        },

        sync: function(method, model, options) {
            switch (method) {
                case 'read' :
                    options = options || {};
                    var search = this._getCalculatedSearch(options);
                    _.extend(options.data, {
                        app: 'splunk_monitoring_console',
                        owner: 'nobody',
                        f: 'definition',
                        search: search
                    });
                    break;
            }
            return SwcMC.SplunkDsBaseCollection.prototype.sync.apply(this, arguments);
        },

        resetToDefault: function() {
            var map = {};
            // linear time is better than n^2
            this.each(function(model) {
                if(model.entry.get('name').indexOf("dmc_rangemap_default") !== -1) {
                    var thresholdName = model.entry.get('name').split("dmc_rangemap_default_")[1];
                    map[thresholdName] = model;
                }
            });

            // grab the set of rangemap definitions that is not the default range set
            var filtered = this.filter(function(model) {
                return model.entry.get('name').indexOf("dmc_rangemap_default_") === -1;
            });

            if(filtered.length !== _.keys(map).length) {
                throw new Error("The number of thresholds in this collection is not equal to the number of thresholds that have a default defined");
            }

            //logic for resetting to default
            var dfds = [];
            _.each(filtered, function(model) {
                var thresholdName = model.entry.get("name").split("dmc_rangemap_")[1];
                var defaultModel = map[thresholdName];
                var defaultDefinition = defaultModel.entry.content.get('definition');

                model.entry.content.set({definition: defaultDefinition});
                dfds.push(model.save());
            });

            return Promise.all(dfds);
        },

        _updateTotal: function() {
            var total = this.paging.get('total');
            if(total) {
                this.paging.set('total', total/2, {silent: true});
            }
        },
        _getCalculatedSearch: function(options) {
            var searchString = 'name="dmc_rangemap_*"';

            if (!_.isUndefined(options.data) && !_.isUndefined(options.data.searchFilter)) {
                var searchFilter = options.data.searchFilter,
                    matches = ThresholdConfigsClientHelper.thresholdConfigsWithLabelSubstr(searchFilter),
                    searchComponents = [];

                for (var i = 0; i < matches.length; i++) {
                    searchComponents.push('name="dmc_rangemap_' + matches[i] + '"');
                }

                searchString = searchComponents.length > 0 ? searchComponents.join(' OR ') : 'name=""';
                delete options.data.searchFilter;
            }

            return searchString;
        }
	});
});
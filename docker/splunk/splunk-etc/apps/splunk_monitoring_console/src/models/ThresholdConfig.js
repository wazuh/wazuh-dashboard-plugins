define(
    [
        'underscore',
        '@splunk/swc-mc',
        'splunk_monitoring_console/collections/ThresholdConfigs',
        'splunk_monitoring_console/helpers/ThresholdConfigsClient'
    ],
    function(
        _,
        SwcMC,
        ThresholdConfigsCollection,
        ThresholdConfigsClientHelper
    ) {
        return SwcMC.BaseModel.extend({

            initialize: function() {
                SwcMC.BaseModel.prototype.initialize.apply(this, arguments);
                this.thresholdConfigsCollection = new ThresholdConfigsCollection();
            },
            fetch: function(options) {
                options = _.defaults(options || {}, { count: 0 });
                options.data = _.defaults(options.data || {}, {
                    app: 'splunk_monitoring_console',
                    owner: 'nobody',
                    count: -1,
                    search: 'name=dmc_rangemap_*',
                    f: 'definition'
                });

                return this.thresholdConfigsCollection.fetch(options).done(function() {
                    var thresholds = this.thresholdConfigsCollection.map(function(model) {
                        var definition = model.entry.content.get('definition'),
                            name = model.entry.get('name').substr('dmc_rangemap_'.length);
                        return ThresholdConfigsClientHelper.parseDMCRangemapDefinition(name, definition, true);
                    }, this);

                    var toSet = {};
                    _.each(thresholds, function(threshold) {
                        toSet[threshold.name] = {
                            field: threshold.field,
                            thresholds: threshold.thresholds
                        };
                    }, this);

                    this.set(toSet);
                }.bind(this));
            },
            getStatus: function(modelAttribute, value) {
                var thresholdConfig = this.get(modelAttribute),
                    thresholds = {},
                    valueStatus = '';
                if (!thresholdConfig) {
                    return null;
                }

                thresholds = thresholdConfig.thresholds;
                valueStatus = thresholds['defaultRange'];

                _.each(_.pairs(thresholds), function(pair) {
                    var range = pair[0], 
                        status = pair[1],
                        rangeSplit,
                        lower, 
                        upper;

                    if (range !== 'defaultRange') {
                        rangeSplit = range.split('-');
                        lower = +rangeSplit[0];
                        upper = +rangeSplit[1];

                        if (value >= lower && value <= upper) {
                            valueStatus = status;
                        }
                    }
                }, this);

                return valueStatus;
            },
            getRange: function(modelAttribute, value) {
                var thresholdConfig = this.get(modelAttribute),
                    inRange = '';
                if (!thresholdConfig) {
                    return null;
                }

                _.each(_.pairs(thresholdConfig.thresholds), function(pair) {
                    var range = pair[0],
                        status = pair[1],
                        parsedRange = this.parseRange(range, modelAttribute);

                    if (value >= parsedRange[0] && value <= parsedRange[1]) {
                        inRange = range;
                    }

                }, this);

                return inRange;
            },
            getStatusForRange: function(modelAttribute, range) {
                var thresholdConfig = this.get(modelAttribute);
                if (!thresholdConfig) {
                    return null;
                }

                return thresholdConfig.thresholds[range];
            },
            getDefaultLowerBound: function(modelAttribute) {
                var thresholdConfig = this.get(modelAttribute);
                if (!thresholdConfig) {
                    return null;
                }

                return ThresholdConfigsClientHelper.getDefaultLowerBound(thresholdConfig.thresholds);
            },
            getRangeSearch: function(range, key) {
                var bounds;

                if (range === 'defaultRange') {
                    return key + '>' + this.getDefaultLowerBound(key);
                } else {
                    bounds = this.parseRange(range, key);
                    return [
                        key + '>=' + bounds[0], 
                        key + '<=' + bounds[1]
                    ].join(' ');
                }
            },
            parseRange: function(range, key) {
                if (range === 'default') {
                    return [this.getDefaultLowerBound(key), Infinity];
                }
                return _.map(range.split('-'), function(bound) {
                    return +bound;
                });
            }
        });
    }
);
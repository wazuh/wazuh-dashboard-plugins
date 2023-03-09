/**
 * @author atruong
 * Client side logic for dmc_rangemap based status filters
 */

define([
	'jquery',
    'underscore',
    'splunk_monitoring_console/helpers/Formatters',
    '@splunk/swc-mc'
], function (
	$,
	_,
	Formatters,
    SwcMC
) {
	var BINARY_KEYS = { 'up_down_status': 1 },
        RATIONAL_KEYS = { 'search_concurrency': 1},
        STATUS_ITEMS = {
            serverName: { value: 'serverName', label: _('No overlay').t() },
            up_down_status: { value: 'up_down_status', label: _('Status').t() },
            indexing_rate: { value: 'indexing_rate', label: _('Indexing rate - per second').t() },
            search_concurrency: { value: 'search_concurrency', label: _('Search Concurrency').t() },
            cpu_system_pct: { value: 'cpu_system_pct', label: _('CPU usage - percentage').t() },
            mem_used: { value: 'mem_used', label: _('Memory usage - percentage').t() },
            default_serverName: { value: 'default_serverName', label: _('No overlay').t() },
            default_up_down_status: { value: 'default_up_down_status', label: _('Status').t() },
            default_indexing_rate: { value: 'default_indexing_rate', label: _('Indexing rate - per second').t() },
            default_search_concurrency: { value: 'default_search_concurrency', label: _('Search Concurrency').t() },
            default_cpu_system_pct: { value: 'default_cpu_system_pct', label: _('CPU usage - percentage').t() },
            default_mem_used: { value: 'default_mem_used', label: _('Memory usage - percentage').t() }
        },
        GRADIENT_KEYS = {
            'indexing_rate': 1,
            'search_concurrency' : 1
        };

	return {
		isBinary: function (key) {
			return _.has(BINARY_KEYS, key);
		},

        // returns true if the range values for this key require a gradient color scale
        isGradient: function(key) {
            return _.has(GRADIENT_KEYS, key);
        },

		// returns true if the range values for this key must be rational numbers
		isRational: function (key) {
			return _.has(RATIONAL_KEYS, key);
		},

		// expects an object such that
		getDefaultLowerBound: function (thresholds) {
			return _.max(
                _.map(
                    _.keys(thresholds),
                    function(range) {
                        if (range === 'defaultRange') {
                            return 0;
                        }
                        return +range.split('-')[1];
                    }
                )
            );
		},

		getFormattedRange: function (key, range) {
			var formatter = Formatters[key],
                low = parseFloat(range[0]),
                high = parseFloat(range[1]),
                highFloor = Math.floor(high),
                lowLabel = '',
                highLabel = '';

            if (highFloor !== low) {
                high = highFloor;
            }

            lowLabel = formatter(low);
            highLabel = formatter(high);

            if (lowLabel === highLabel) {
                return lowLabel;
            }

            if (!_.isFinite(high)) {
                if (_.has(BINARY_KEYS, key)) {
                    return highLabel;
                } else {
                    return lowLabel + ' ' + _('or more').t();
                }
            }

            return lowLabel + ' - ' + highLabel;
        },

        getStatusItem: function (key) {
        	return STATUS_ITEMS[key];
        },

        thresholdConfigsWithLabelSubstr: function (substr) {
            var caseConvertedSubstr = substr.toLowerCase(),
                matches = [];

            for (var status in STATUS_ITEMS) {
                var caseConvertedLabel = STATUS_ITEMS[status]['label'].toLowerCase();
                if (caseConvertedLabel.indexOf(caseConvertedSubstr) !== -1) {
                    matches.push(status);
                }
            }

            return matches;
        },

        parseDMCRangemapDefinition: function(name, definition, callerIsThresholdConfigModel) {
        	var args = definition.split(/\s+/),
        		displayName = STATUS_ITEMS[name]['label'],
        		field = '',
        		thresholds = {};

        	_.each(args, function(arg) {
        		if (arg !== 'rangemap') {
        			var pair = arg.split('='),
        				key = this._decodeSplArg(pair[0]),
                        value = this._decodeSplArg(pair[1]);

                    if (key === 'field') {
                        field = value;
                    } else if (key === 'default') {
                        value = SwcMC.ColorUtils.replaceSymbols(value, "#");
                        thresholds['defaultRange'] = callerIsThresholdConfigModel ? value : { color: value };
                    } else {
                        key = SwcMC.ColorUtils.replaceSymbols(key, "#");
                    	thresholds[value] = callerIsThresholdConfigModel ? key : { color: key, formattedRange: this.getFormattedRange(name, value.split('-')) };
                    }
        		}
        	}, this);

        	if (callerIsThresholdConfigModel) {
                thresholds['defaultRange'] = thresholds['defaultRange'] || '#7D7D7D';
    		} else {
                thresholds['defaultRange'] = thresholds['defaultRange'] || { color: '#7D7D7D'};
                thresholds['defaultRange'].formattedRange = this.getFormattedRange(name, [this.getDefaultLowerBound(thresholds), Infinity]);            
    		}

    		return {
    			name: name,
    			displayName: displayName,
    			field: field,
    			thresholds: thresholds
    		};

        },

        _decodeSplArg: function(arg) {
            return $.trim(arg).replace('"','').replace("'","");
        }

	};
});
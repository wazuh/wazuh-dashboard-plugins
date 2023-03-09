define(
    [
        'jquery',
        'underscore',
        'backbone',
        '@splunk/swc-mc',
        'contrib/text!./StatusFilter.html',
        'splunk_monitoring_console/helpers/Formatters',
        'splunk_monitoring_console/helpers/ThresholdConfigsClient',
        'bootstrap'
    ],
    function(
        $,
        _,
        Backbone,
        SwcMC,
        Template,
        Formatters,
        ThresholdConfigsClientHelper
        // shhhh tooltip
    ) {
        var UNKNOWN_RANGE_NAME_PREFIX = '__unknown_range_';

        return SwcMC.BaseView.extend({
            tagName: 'ul',
            className: 'dmc-status-filters',
            initialize: function() {
                SwcMC.BaseView.prototype.initialize.apply(this, arguments);

                this.clickHandler = this.options.clickHandler || this._defaultClickHandler;
                this.sortKey = this.options.sortKey;
                this.dataType = this.options.dataType || '';

                // If we are using a static sortKey, shim the fetchState
                if (!_.isUndefined(this.sortKey)) {
                    if (!_.isUndefined(this.model.fetchState)) {
                        throw Error('cannot add both model.fetchState and sortKey');
                    }
                    this.model.fetchState = new SwcMC.BaseModel({
                        ranges: [],
                        sortKey: this.sortKey,
                        fetching: false
                    });
                }

                this.listenTo(this.collection.instances, 'sync', this.debouncedRender);
                this.listenTo(this.model.fetchState, 'change:sortKey change:fetching change:ranges', this.debouncedRender);
                this.listenTo(this.model.thresholdConfig, 'change', this.debouncedRender);
            },
            events: {
                'click li, li *': function(e) {
                    var $li = $(e.target).closest('li'),
                        range = $li.data('range');

                    if ($li.hasClass('dmc-status-zero')) {
                        e.stopPropagation();
                        return;
                    }

                    this.clickHandler(e, range);
                }
            },
            render: function() {
                var currentMetric = this.model.fetchState.get('sortKey'),
                    rangeCounts = this.collection.instances.meta.get('rangeCounts') || {},
                    rangeGroups = rangeCounts[currentMetric],
                    thresholdConfig = this.model.thresholdConfig.get(currentMetric) || {},
                    thresholds = thresholdConfig.thresholds || {},
                    activeRanges = this.model.fetchState.get('ranges'),
                    unknownRangeName = UNKNOWN_RANGE_NAME_PREFIX + currentMetric;

                this.$el.empty();

                if (this.dataType) {
                    this.$el.attr('data-type', 'dmc-status-filters-' + this.dataType);
                }

                if (!this.model.fetchState.get('fetching') && !_.isUndefined(rangeGroups)) {
                    thresholds = _.map(_.pairs(thresholds), function(pairs) {
                        var rangeName = pairs[0] === 'defaultRange' ? 'default' : pairs[0],
                            color = pairs[1],
                            range = this.model.thresholdConfig.parseRange(
                                rangeName,
                                currentMetric
                            );

                        return {
                            rangeName: rangeName,
                            color: color,
                            range: range,
                            rangeLabel: ThresholdConfigsClientHelper.getFormattedRange(currentMetric, range),
                            count: this._formatCount(rangeGroups[rangeName]),
                            active: activeRanges === '*' || _.contains(activeRanges, rangeName),
                            implicitlyActive: activeRanges === '*'
                        };
                    }, this);

                    // If it's a binary threshold, sort with largest first
                    if (thresholds.length === 2) {
                        thresholds = _.sortBy(thresholds, function(threshold) {
                            return -threshold.range[1];
                        });
                    } else {
                        thresholds = _.sortBy(thresholds, function(threshold) {
                            return threshold.range[1];
                        });
                    }

                    // The unknown filter (it always comes last)
                    thresholds.push({
                        rangeName: unknownRangeName,
                        rangeLabel: _('Unknown').t(),
                        count: this._formatCount(rangeGroups.unknown),
                        active: activeRanges === '*' || _.contains(activeRanges, unknownRangeName),
                        implicitlyActive: activeRanges === '*'
                    });

                    // Compute the classes, for convenience
                    _.each(thresholds, function(t) {
                        var classes = [];

                        if (t.count === 0) {
                            classes.push('dmc-status-zero');
                        }
                        if (!t.implicitlyActive && t.active) {
                            classes.push('dmc-active');
                        }

                        t.classes = classes.join(' ');
                    });

                    this.$el.html(this.compiledTemplate({
                        thresholds: thresholds
                    }));

                    this.$('[data-toggle="tooltip"]').tooltip();
                }

                // Without this line, re-rendering does not attach event handlers properly
                this.delegateEvents();
                return this;
            },
            _defaultClickHandler: function(e) {
                e.stopPropagation();
                var $el = $(e.target).closest('li');
                $el.toggleClass('dmc-active');
                this._updateRangeSearch();
            },
            _updateRangeSearch: function() {
                var activeChildren = this.$el.children('.dmc-active');

                // None selected means they are all implicitly active
                if (activeChildren.length === 0) {
                    this.model.fetchState.set('ranges', '*');
                } else {
                    this.model.fetchState.set(
                        'ranges',
                        _.map(activeChildren, function(el) { return $(el).data('range'); })
                    );
                }
            },

            _formatCount: function(count) {
                if (!_.isNumber(count)) {
                    return 0; // right now absence means 0
                }
                if (count > 1000) {
                    return (count / 1000).toFixed(1) + 'K';
                }
                if (count > 1000000) {
                    return (count / 1000000).toFixed(1) + 'M';
                }
                if (count > 1000000000) {
                    return '...';
                }
                return count;
            },
            template: Template
        });
    }
);

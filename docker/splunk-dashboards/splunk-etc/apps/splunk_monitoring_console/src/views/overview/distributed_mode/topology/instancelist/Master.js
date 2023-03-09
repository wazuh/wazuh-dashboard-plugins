define(
    [
        'jquery',
        'underscore',
        'backbone',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/overview/distributed_mode/topology/instancelist/elements/Pagination',
        'splunk_monitoring_console/views/overview/distributed_mode/topology/instancelist/elements/Sorter',
        'splunk_monitoring_console/views/overview/distributed_mode/topology/instancelist/elements/GroupedInstance',
        'splunk_monitoring_console/views/overview/distributed_mode/topology/instancelist/elements/Instance'
    ],
    function(
        $,
        _,
        Backbone,
        SwcMC,
        PaginationElementView,
        SorterElementView,
        GroupedInstanceElementView,
        InstanceElementView
    ) {
        // CONSTANTS
        var MIN_Y = 25;
        var NO_RESULTS_FOUND_FONT_SIZE = 12;

        /*
         * Renders a list view of splunk instances to
         * an SVG. 
         */
        return SwcMC.BaseView.extend({
            _height: 0,

            initialize: function() {
                SwcMC.BaseView.prototype.initialize.apply(this, arguments);
                this.setElement(SwcMC.UtilSVG.createElement('g'));
                this._elements = {};

                this.listViewId = _.isNumber(this.options.listViewId) ?
                    this.options.listViewId :
                    _.uniqueId();
                this.xOffset = this.options.xOffset || 0;
                this.yOffset = Math.max(this.options.yOffset || 0, MIN_Y);
                this.instanceAnchorPosition = this.options.instanceAnchorPosition || 'right';

                this.children.paginationLess = new PaginationElementView({
                    orientation: PaginationElementView.ORIENTATION.LESS,
                    collection: {
                        instances: this.collection.instances
                    },
                    model: {
                        fetchState: this.model.fetchState
                    }
                });
                this.children.paginationMore = new PaginationElementView({
                    orientation: PaginationElementView.ORIENTATION.MORE,
                    collection: {
                        instances: this.collection.instances
                    },
                    model: {
                        fetchState: this.model.fetchState
                    }
                });
                this.children.sorter = new SorterElementView({
                    model: {
                        fetchState: this.model.fetchState
                    }
                });
                this.children.groupedInstanceLess = new GroupedInstanceElementView({
                    type: GroupedInstanceElementView.TYPES.LESS,
                    listViewId: this.listViewId,
                    collection: {
                        instances: this.collection.instances
                    }
                });
                this.children.groupedInstanceMore = new GroupedInstanceElementView({
                    type: GroupedInstanceElementView.TYPES.MORE,
                    listViewId: this.listViewId,
                    collection: {
                        instances: this.collection.instances
                    }
                });

                this._initializeInstanceViews();

                this.listenTo(this.collection.instances, 'add reset remove', this._collectionChanged);
                this.listenTo(this.model.fetchState, 'change:fetching', this._collectionChanged);
            },

            getElements: function(types) {
                var cacheKey = types.join('-');

                // Cache the result of this call over renders
                if (_.isUndefined(this._elements[cacheKey])) {
                    this._elements[cacheKey] = _.filter(
                        _.map(
                            this.$('*'), 
                            function(child) {
                                return $(child);
                            }
                        ), 
                        function($child) {
                            return _.contains(types, $child.data('type'));
                        }
                    );
                }
                return this._elements[cacheKey];
            },

            render: function() {
                var drawCursor = {
                        x: this.xOffset,
                        y: this.yOffset
                    },
                    childrenRendered = 0,
                    childHeight = 0,
                    deficit = 0;

                this.$el.empty();
                this._clearElementsCache();
                
                // If there are instances, render the list now
                if (this.model.fetchState.get('fetching')) {
                    this._renderLoading(drawCursor);
                } else if (this.collection.instances.models.length > 0) {
                    this._initialRender(this.children.paginationLess, drawCursor);
                    drawCursor.y = drawCursor.y + this.children.paginationLess.getHeight();

                    this._initialRender(this.children.sorter, drawCursor);
                    drawCursor.y = drawCursor.y + this.children.sorter.getHeight();

                    this._initialRender(this.children.groupedInstanceLess, drawCursor);
                    drawCursor.y = drawCursor.y + this.children.groupedInstanceLess.getHeight();

                    _.each(_.pairs(this.children), function(pair) {
                        var key = pair[0], child = pair[1];
                        if (key.indexOf('instanceView.') === 0) {
                            this._initialRender(child, drawCursor);
                            // This is janky. Should get a static height instead
                            childHeight = child.getHeight();
                            drawCursor.y = drawCursor.y + childHeight;
                            childrenRendered++;
                        }
                    }, this);

                    // Special case if there is only one page:
                    if (this.collection.instances.paging.get('total') <=
                        this.collection.instances.paging.get('count')) {
                        
                        deficit = this.collection.instances.paging.get('perPage') - childrenRendered;
                        drawCursor.y = drawCursor.y + (deficit * childHeight);
                    }

                    this._initialRender(this.children.groupedInstanceMore, drawCursor);
                    drawCursor.y = drawCursor.y + this.children.groupedInstanceMore.getHeight();

                    this._initialRender(this.children.paginationMore, drawCursor);
                } else {
                    this._renderNoResultsFound(drawCursor);
                }

                this._height = drawCursor.y - this.yOffset;
                this.trigger('render');
                return this;
            },

            getHeight: function() {
                return this._height;
            },

            _initializeInstanceViews: function() {
                _.each(_.pairs(this.children), function(pair) {
                    var key = pair[0], child = pair[1];

                    if (key.indexOf('instanceView.') === 0) {
                        this.stopListening(child);
                        // Otherwise it flickers!
                        child.$el.fadeOut(function() { child.remove(); });
                        delete this.children[key];
                    }
                }, this);

                this.collection.instances.each(function(instanceModel) {
                    this.children['instanceView.' + _.uniqueId()] = new InstanceElementView({
                        listViewId: this.listViewId,
                        anchorPosition: this.instanceAnchorPosition,
                        model: {
                            state: this.model.state,
                            instance: instanceModel,
                            fetchState: this.model.fetchState,
                            thresholdConfig: this.model.thresholdConfig
                        }
                    });
                }, this);

                 // This is a little weird:
                _.each(_.values(this.children), function(child) {
                    _.each(
                        ['boxMouseOver', 'boxMouseOut'],
                        function(ev) {
                            this.listenTo(child, ev, function(arg) {
                                this.trigger(ev, arg);
                            });
                        },
                        this
                    );
                }, this);
            },

            _initialRender: function(child, point) {
                child.model.drawContext.set(point, { silent: true });
                child.render().$el.appendTo(this.$el);
            },

            _collectionChanged: function() {
                this._initializeInstanceViews();
                this.debouncedRender();
            },

            _renderNoResultsFound: function(drawCursor) {
                var $noResults = SwcMC.UtilSVG.createElement('text').attr({
                    x: drawCursor.x,
                    y: drawCursor.y,
                    'font-size': NO_RESULTS_FOUND_FONT_SIZE
                });
                $noResults.text(_("No results found for this group.").t());
                $noResults.appendTo(this.$el);

                return NO_RESULTS_FOUND_FONT_SIZE;
            },

            _renderLoading: function(drawCursor) {
                var $loading = SwcMC.UtilSVG.createElement('text').attr({
                    x: drawCursor.x,
                    y: drawCursor.y,
                    'font-size': NO_RESULTS_FOUND_FONT_SIZE
                });
                $loading.text(_('Loading...').t());
                $loading.appendTo(this.$el);

                return NO_RESULTS_FOUND_FONT_SIZE;
            },

            _clearElementsCache: function() {
                _.each(_.keys(this._elements), function(key) {
                    delete this._elements[key];
                }, this);
            }
        });
    }
);
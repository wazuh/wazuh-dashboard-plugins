define(
    [
        'jquery',
        'underscore',
        'backbone',
        '@splunk/swc-mc'
    ],
    function(
        $,
        _,
        Backbone,
        SwcMC
    ) {
        var DEFAULT_STROKE = '#eaebec';
        var HOVER_STROKE = '#4bbfe4';
        var MARGIN = 1; // how many pixels away from the box to start drawing
        var ELEMENT_TYPES = [
            'instanceBox',
            'paginationBox'
        ];
        var CHUNK_SIZE = 1000;
        var CHUNK_INTERVAL = 10; //ms

        // Class to render links as lines between 2 or more svg list views (InstanceList objects).
        return SwcMC.BaseView.extend({
            initialize: function(options) {
                SwcMC.BaseView.prototype.initialize.apply(this, arguments);
                this.setElement(SwcMC.UtilSVG.createElement('g'));
                this._timeoutId = null;

                // Expected to be InstanceListViews
                this.svgListViews = this.options.svgListViews || [];
                // Key expected to be on an element's data to link on
                this.collections = this.options.collections || [];
                this.relations = this.options.relations || [];
                
                _.each(this.collections, function(collection) {
                    this.listenTo(collection, 'add reset remove', this.render);
                }, this);

                this.startListening();                
            },

            setSvgListViews: function(svgListViews) {
                _.each(this.svgListViews, function(view) {
                    this.stopListening(view);
                }, this);
                this.svgListViews = svgListViews;
                this.startListening();
            },

            startListening: function() {
                // Whenever an underlying list changes, we need to re-render this view
                _.each(this.svgListViews, function(view) {
                    this.listenTo(view, 'render', _.debounce(this.render));
                    this.listenTo(view, 'boxMouseOver', this._onBoxMouseOver);
                    this.listenTo(view, 'boxMouseOut', this._onBoxMouseOut);
                }, this);
            },

            render: function() {
                this.$el.empty();

                if (this._timeoutId !== null) {
                    clearTimeout(this._timeoutId);
                }

                // If there is link data to render:
                if (this.collections.length > 0) {
                    var elementTuples = [],
                        elementsCorrespondence = [],
                        elementTypes = [
                            'instanceBox',
                            'paginationBox'
                        ],
                        bboxCache = {};

                    // Build a correspondence array (svgListView <-> elements)
                    elementsCorrespondence = _.map(
                        this.svgListViews, 
                        function(svgListView) {
                            return svgListView.getElements(ELEMENT_TYPES);
                        }, 
                        this
                    );

                    // Create all possible element tuples
                    _.each(elementsCorrespondence, function(sourceElements, i) {
                        _.each(elementsCorrespondence, function(destElements, j) {
                            if (i !== j) {
                                _.each(sourceElements, function(sourceElement) {
                                    _.each(destElements, function(destElement) {
                                        elementTuples.push([
                                            sourceElement,
                                            destElement
                                        ]);
                                    });
                                });
                            }
                        });
                    });

                    // Now elementTuples contains all possible lines we could draw given
                    // the current visible state of the lists
                    var tuplesRendered = [],
                        tupleChunks = _.chain(elementTuples)
                            .groupBy(function(tuple, i) {
                                return Math.floor(i / CHUNK_SIZE);
                            })
                            .toArray()
                            .value(),
                        currentChunk = 0;

                    var processChunk = function() {
                        var chunkTuples = [];

                        this._timeoutId = null;

                        if (currentChunk < tupleChunks.length) {
                            chunkTuples = tupleChunks[currentChunk];

                            _.each(chunkTuples, function(elementTuple, i) {
                                var sourceElement = elementTuple[0],
                                    destElement = elementTuple[1],
                                    sourceId = sourceElement.data('id'),
                                    destId = destElement.data('id'),
                                    sourceBoxType = sourceElement.data('type'),
                                    destBoxType = destElement.data('type'),
                                    sourceServerName = sourceElement.data('serverName'),
                                    destServerName = destElement.data('serverName'),
                                    sourceServerNames = sourceElement.data('serverNames'),
                                    destServerNames = destElement.data('serverNames'),
                                    rendered = !!_.find(tuplesRendered, function(tuple) {
                                        return tuple[0] === sourceId && 
                                            tuple[1] === destId;
                                    }),
                                    related = false,
                                    hardLink = true;

                                if (!rendered) {

                                    // Whether the box elements are related is dependent on 
                                    // whether the boxes are of the same type (pagination vs. single)
                                    if (destBoxType === 'paginationBox' && sourceBoxType === 'paginationBox') {
                                        _.each(this.relations, function(relation) {
                                            var sourceRelationServers = sourceElement.data(relation),
                                                intersection = _.intersection(sourceRelationServers, destServerNames),
                                                leftovers = _.without(sourceRelationServers, destServerNames);

                                            // Symmetric relation, only check one way
                                            if (intersection.length > 0) {
                                                related = true;
                                            }
                                            // If one is a subset of the other, hard link
                                            if (!_.isUndefined(sourceRelationServers)) {
                                                hardLink = hardLink && (leftovers.length === 0);
                                            }
                                        });
                                    } else if (destBoxType === 'paginationBox' || sourceBoxType === 'paginationBox') {
                                        hardLink = _.without.apply(_, [sourceServerNames].concat(destServerNames)).length === 0;
                                        if (destBoxType === 'paginationBox') {
                                            _.each(this.relations, function(relation) {
                                                var destRelationServers = destElement.data(relation);
                                                if (_.contains(destRelationServers, sourceServerName)) {
                                                    related = true;
                                                }
                                            });
                                        } else { //sourceBoxType === 'paginationBox' 
                                            _.each(this.relations, function(relation) {
                                                var sourceRelationServers = sourceElement.data(relation);
                                                if (_.contains(sourceRelationServers, destServerName)) {
                                                    related = true;
                                                }
                                            });
                                        }
                                    } else {
                                        var allServers = _.flatten(
                                            _.map(this.collections, function(collection) {
                                                return collection.toArray();
                                            })
                                        );
                                        var sourceModel = _.find(allServers, function(server) {
                                            return server.entry.content.get('serverName') === sourceServerName;
                                        });
                                        var destModel = _.find(allServers, function(server) {
                                            return server.entry.content.get('serverName') === destServerName;
                                        });
                                        related = this._isRelated(sourceModel, destModel);
                                    }

                                    // If we've determine there is a relationship, render the lines
                                    if (related) {
                                        // Figure out which is on the left/right so we can begin the lines
                                        // on the middle edges
                                        var leftMostElement = this._fastGetBBox(bboxCache, sourceElement).cx < this._fastGetBBox(bboxCache, destElement).cx ?
                                            sourceElement : 
                                            destElement;
                                        var rightMostElement = leftMostElement === sourceElement ?
                                            destElement :
                                            sourceElement;

                                        // Ensure these elements are the extremes for that server
                                        leftMostElement = this._getExtremes(bboxCache, leftMostElement, { direction: 'right' });
                                        rightMostElement = this._getExtremes(bboxCache, rightMostElement, { direction: 'left' });

                                        var $linkLine = SwcMC.UtilSVG.createElement('path');
                                        $linkLine.attr({
                                            d: 'M' + (this._fastGetBBox(bboxCache, leftMostElement).x2 + MARGIN) + 
                                                    ',' + 
                                                    this._fastGetBBox(bboxCache, leftMostElement).cy +
                                                'L' + (this._fastGetBBox(bboxCache, rightMostElement).x - MARGIN) + 
                                                    ',' + 
                                                    this._fastGetBBox(bboxCache, rightMostElement).cy,
                                            stroke: DEFAULT_STROKE,
                                            fill: 'none'
                                        });
                                        if (!hardLink) {
                                            $linkLine.attr('stroke-dasharray', '5,5');
                                        }
                                        $linkLine.appendTo(this.$el);

                                        $linkLine.data('boxes', [sourceId, destId]);

                                        tuplesRendered.push([sourceId, destId]);
                                        tuplesRendered.push([destId, sourceId]);
                                    }
                                }
                            }, this);

                            currentChunk++;
                            this._timeoutId = setTimeout(processChunk, CHUNK_INTERVAL);
                        }
                    }.bind(this);

                    processChunk();
                }
            },

            // Whenever a instance-hover event is received,
            // show all the related links
            _onBoxMouseOver: function(boxId) {
                var toAppend = [];

                this.$el.children().each(function() {
                    var $el = $(this),
                        boxes = $el.data('boxes');

                    if (_.contains(boxes, boxId)) {
                        $el.attr({
                            stroke: HOVER_STROKE
                        });
                        toAppend.push($el);
                    } 
                });

                // This ensure that the highlighted nodes
                // are 
                _.each(toAppend, function($el) {
                    $el.detach().appendTo(this.$el);
                }, this);
            },

            // Whenever hovering out of an instance,
            // remove all links everywhere.
            _onBoxMouseOut: function() {
                this.$el.children().attr({
                    stroke: DEFAULT_STROKE
                });
            },

            _isRelated: function(modelA, modelB) {
                var related = false;

                if (!_.isUndefined(modelA) && !_.isUndefined(modelB)) {
                    _.each(this.relations, function(relation) {
                        // Relations are symmetric, so only need to check one way
                        if (_.contains(
                            modelA.entry.content.get(relation), 
                            modelB.entry.content.get('serverName'))) {

                            related = true;
                        }
                    });
                }
                return related;
            },

            _getExtremes: function(bboxCache, element, options) {
                var serverName = element.data('serverName'),
                    listViewId = element.data('listViewId'),
                    elements = _.flatten(_.map(this.svgListViews, function(svgListView) {
                        return svgListView.getElements(ELEMENT_TYPES);
                    })),
                    extFunc = options.direction === 'left' ? 'min' : 'max';

                if (!serverName) {
                    return element;
                }

                elements = _.filter(elements, function(el) {
                    return el.data('serverName') === serverName &&
                        el.data('listViewId') === listViewId;
                });

                return _[extFunc].call(_, elements, function(el) {
                    return this._fastGetBBox(bboxCache, el).cx;
                }, this);
            },

            _fastGetBBox: function(bboxCache, $element) {
                var bbox,
                    id = $element.data('svgId');

                if (!_.has(bboxCache, id)) {
                    bboxCache[id] = SwcMC.UtilSVG.getBBox($element);
                }

                return bboxCache[id];
            }
        });
    }
);
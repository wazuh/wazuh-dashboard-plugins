define(
    [
        'jquery',
        'underscore',
        'backbone',
        'splunk_monitoring_console/views/overview/distributed_mode/topology/instancelist/elements/Base',
        '@splunk/swc-mc'
    ],
    function(
        $,
        _,
        Backbone,
        BaseElementView,
        SwcMC
    ) {
        var HEIGHT = 10,
            WIDTH = 300,
            COLOR = '#CCCCCC',
            MARGIN_BOTTOM = 5,
            TYPES = {
                MORE: 0,
                LESS: 1
            };

        return BaseElementView.extend(
            {
                initialize: function() {
                    BaseElementView.prototype.initialize.apply(this, arguments);
                    this.type = this.options.type || TYPES.MORE;

                    this.listenTo(this.collection.instances, 'add reset remove', this.debouncedRender);
                    this.listenTo(this.collection.instances.paging, 'change', this.debouncedRender);
                    this.listenTo(this.collection.instances.paging.meta, 'change', this.debouncedRender);
                },

                render: function() {
                    var pagingMeta = this.collection.instances.paging.meta,
                        pages = this._getPages(this.collection.instances.paging),
                        currentPoint = this.model.drawContext.toJSON();

                    this.$el.empty();

                    if ((this.type === TYPES.MORE && pages.thisPage < pages.lastPage) ||
                        (this.type === TYPES.LESS && pages.thisPage > 1)) {
                        
                        SwcMC.UtilSVG.createElement('rect')
                            .attr({
                                x: currentPoint.x,
                                y: currentPoint.y,
                                width: WIDTH,
                                height: HEIGHT,
                                fill: COLOR,
                                stroke: COLOR
                            })
                            .mouseover(this._mouseover.bind(this))
                            .mouseout(this._mouseout.bind(this))
                            .data({
                                id: '' + _.uniqueId(),
                                svgId: _.uniqueId(),
                                listViewId: this.listViewId,
                                type: 'paginationBox',
                                serverNames:
                                    this.type === TYPES.MORE ?
                                        pagingMeta.get('nextServerNames') :
                                        pagingMeta.get('previousServerNames'),
                                distributesSearchesTo:
                                    this.type === TYPES.MORE ?
                                        pagingMeta.get('nextDistributesSearchesTo') :
                                        pagingMeta.get('previousDistributesSearchesTo'),
                                searchedBy:
                                    this.type === TYPES.MORE ?
                                        pagingMeta.get('nextSearchedBy') :
                                        pagingMeta.get('previousSearchedBy')
                            })
                            .appendTo(this.$el);
                    }

                    this._height = HEIGHT + MARGIN_BOTTOM;
                    return this;
                },

                _mouseover: function(e) {
                    this.trigger('boxMouseOver', $(e.target).data('id'));
                },

                _mouseout: function(e) {
                    this.trigger('boxMouseOut', $(e.target).data('id'));
                }
            },
            {
                TYPES: TYPES
            }
        );
    }
);
define(
    [
        'jquery',
        'underscore',
        'backbone',
        'splunk_monitoring_console/views/overview/distributed_mode/topology/instancelist/elements/Base',
        'splunk_monitoring_console/views/overview/distributed_mode/topology/controls/PerPageMenu',
        '@splunk/swc-mc'
    ],
    function(
        $,
        _,
        Backbone,
        BaseElementView,
        PerPageMenu,
        SwcMC
    ) {
        var PAGES_FONT_SIZE = 12,
            PAGES_MARGIN_BOTTOM = 12,
            PAGES_MARGIN_TOP = 12,
            STEP_TEXT_MARGIN = 5,
            STEP_MARGIN = 20,
            PER_PAGE_MARGIN = 300,
            CURRENT_PAGE_MARGIN = 300,
            TOP_MARGIN = 10,
            BOTTOM_MARGIN = 10,
            HORIZONTAL_RULE_WIDTH = 300,
            ORIENTATION = {
                LESS: 0,
                MORE: 1
            };

        return BaseElementView.extend(
            {
                initialize: function() {
                    // Listens to this.model.drawContext
                    BaseElementView.prototype.initialize.apply(this, arguments);
                    this.orientation = this.options.orientation || ORIENTATION.LESS;

                    this.listenTo(this.model.fetchState, 'change:count', this.debouncedRender);
                    this.listenTo(this.collection.instances, 'add reset remove', this.debouncedRender);
                    this.listenTo(this.collection.instances.paging, 'change', this.debouncedRender);
                },

                render: function() {
                    var drawContext = this.model.drawContext,
                        currentPoint = drawContext.toJSON(),
                        originalX = currentPoint.x;

                    this.$el.empty();

                    if (this.orientation === ORIENTATION.LESS) {
                        this._renderPerPage(currentPoint);
                        this._renderPreviousNext(currentPoint);
                        this._renderFirstLast(currentPoint);
                        // snap it back
                        currentPoint.x = originalX;
                        currentPoint.y = currentPoint.y + BOTTOM_MARGIN;
                        this._renderHorizontalRule(currentPoint);
                        currentPoint.y = currentPoint.y + BOTTOM_MARGIN;
                    } else {
                        currentPoint.y = currentPoint.y + TOP_MARGIN;
                        this._renderCurrentPage(currentPoint);
                        this._renderPreviousNext(currentPoint);
                        this._renderFirstLast(currentPoint);
                    }

                    this._height = currentPoint.y - drawContext.get('y');
                    return this;
                },

                _renderFirstLast: function(currentPoint) {
                    var text = this.orientation === ORIENTATION.LESS ?
                            _('First').t() :
                            _('Last').t(),
                        textWidth = this._guessTextWidth(text),
                        textHeight = PAGES_FONT_SIZE, // a guess
                        $textContainer = SwcMC.UtilSVG.createElement('text')
                            .text(text)
                            .attr({
                                'class': 'link',
                                x: currentPoint.x,
                                y: currentPoint.y,
                                'font-size': PAGES_FONT_SIZE
                            }),
                        $container = SwcMC.UtilSVG.createElement('g');

                    if (this._isActive()) {
                        $container
                            .attr('cursor', 'pointer')
                            .click(this._endClick.bind(this));
                    } else {
                        $container.css('visibility', 'hidden');
                    }

                    $textContainer.appendTo($container);
                    $container.appendTo(this.$el);
                },

                _renderPreviousNext: function(currentPoint) {
                    var text = this.orientation === ORIENTATION.LESS ?
                            _('Previous').t() :
                            _('Next').t(),
                        textWidth = this._guessTextWidth(text),
                        textHeight = PAGES_FONT_SIZE, // a guess, again
                        $textContainer = SwcMC.UtilSVG.createElement('text')
                            .text(text)
                            .attr({
                                'class': 'link',
                                x: currentPoint.x,
                                y: currentPoint.y,
                                'font-size': PAGES_FONT_SIZE
                            }),
                        $container = SwcMC.UtilSVG.createElement('g');

                    currentPoint.x = currentPoint.x + textWidth + STEP_MARGIN;

                    if (this._isActive()) {
                        $container
                            .attr('cursor', 'pointer')
                            .click(this._stepClick.bind(this));
                    } else {
                        $container.css('visibility','hidden');
                    }

                    $textContainer.appendTo($container);
                    $container.appendTo(this.$el);
                },

                _renderCurrentPage: function(currentPoint) {
                    var pages = this._getPages(this.collection.instances.paging),
                        $currentPage = SwcMC.UtilSVG.createElement('text')
                            .text(
                                _('page').t() + 
                                ' ' + 
                                pages.thisPage + 
                                ' ' + 
                                _('of').t() + 
                                ' ' + 
                                pages.lastPage
                            )
                            .attr({
                                'class': 'page',
                                x: currentPoint.x + CURRENT_PAGE_MARGIN,
                                y: currentPoint.y
                            });

                    $currentPage.appendTo(this.$el);
                },

                _renderPerPage: function(currentPoint) {
                    var $perPage = SwcMC.UtilSVG.createElement('text')
                        .text(
                            this.model.fetchState.get('count') + ' ' +
                            _('per page').t()
                        )
                        .attr({
                            'class': 'per-page link',
                            x: currentPoint.x + PER_PAGE_MARGIN,
                            y: currentPoint.y
                        })
                        .click(function(e) {
                            if (this.children.menu && this.children.menu.shown) {
                                this.children.menu.hide();
                                e.preventDefault();
                                return;
                            }

                            this.children.menu = new PerPageMenu({
                                onHiddenRemove: true,
                                model: {
                                    state: this.model.fetchState
                                }
                            });
                            $('body').append(this.children.menu.render().el);
                            this.children.menu.show($perPage);
                        }.bind(this));
                        
                    SwcMC.UtilSVG.createElement('tspan')
                        .text(' \u02C5')
                        .attr({
                            'class': 'icon'
                        })
                        .appendTo($perPage);
                        
                    $perPage.appendTo(this.$el);
                },

                _renderHorizontalRule: function(currentPoint) {
                    var $line = SwcMC.UtilSVG.createElement('line')
                        .attr({
                            'class': 'hr',
                            x1: currentPoint.x,
                            y1: currentPoint.y + 0.5,
                            x2: currentPoint.x + HORIZONTAL_RULE_WIDTH,
                            y2: currentPoint.y + 0.5
                        });

                    $line.appendTo(this.$el);
                },

                _isActive: function() {
                    var pages = this._getPages(this.collection.instances.paging);

                    if (this.orientation === ORIENTATION.LESS && 
                        this.collection.instances.paging.get('offset') > 0) {

                        return true;
                    }
                    if (this.orientation === ORIENTATION.MORE &&
                        pages.thisPage < pages.lastPage) {

                        return true;
                    }

                    return false;
                },

                _endClick: function() {
                    var paging = this.collection.instances.paging;
                    this.model.fetchState.set(
                        'offset',
                        this.orientation === ORIENTATION.MORE ?
                            paging.get('total') - (((paging.get('total') % paging.get('perPage'))) || paging.get('perPage')) :
                            0
                        );
                },

                _stepClick: function() {
                    var paging = this.collection.instances.paging;
                    this.model.fetchState.set(
                        'offset',
                        this.orientation === ORIENTATION.MORE ?
                            paging.get('offset') + paging.get('perPage') :
                            paging.get('offset') - paging.get('perPage')
                    );
                },

                _guessTextWidth: function(text) {
                    return text.length * 6;
                }
            },
            {
                ORIENTATION: ORIENTATION
            }
        );
    }
);
define(
    [
        'jquery',
        'underscore',
        'backbone',
        'splunk_monitoring_console/views/overview/distributed_mode/topology/instancelist/elements/Base',
        'splunk_monitoring_console/views/overview/distributed_mode/topology/controls/InstanceMenu',
        '@splunk/swc-mc'
    ],
    function(
        $,
        _,
        Backbone,
        BaseElementView,
        InstanceMenu,
        SwcMC
    ) {
        var WIDTH = 300,
            HEIGHT = 30,
            MARGIN_BOTTOM = 5,
            STATUS_WIDTH = 50,
            LABEL_MARGIN_LEFT = 16,
            LABEL_MARGIN_TOP = 20,
            METRIC_MARGIN_LEFT = 25,
            TRUNCATION_BUFFER = 2,
            BACKGROUND_TRUNCATION_ADJUSTMENT = 20,
            ELLIPSES = '...',

            // This is used when rendered labels that we've already computed the length of.
            // In SVG, we must render the text *first* before we can determine if it needs to 
            // be truncated, so we render it hidden first. However, once we compute it, we show
            // the label again - this leads to unwanted flashing on each re-render.
            // By caching the labels, we can avoid this flashing after the first compute.
            labelCache = {};

        return BaseElementView.extend({
            initialize: function() {
                BaseElementView.prototype.initialize.apply(this, arguments);

                // left or right
                this.anchorPosition = this.options.anchorPosition || 'right';

                this._boxId = _.uniqueId();

                this.listenTo(this.model.state, 'change:relatedTo', this._updateRelatedTo);
                this.listenTo(this.model.instance, 'change', this.debouncedRender);
                this.listenTo(this.model.fetchState, 'change:sortKey', this.debouncedRender);
                this.listenTo(this.model.thresholdConfig, 'change', this.debouncedRender);
            },

            remove: function() {
                BaseElementView.prototype.remove.apply(this, arguments);
                this._reset();
            },

            render: function() {
                this._reset();

                this._setAttr();
                this._renderBackground();
                this._renderStatus();
                this._renderLabel();
                this._renderMetric();
                this._renderAnchor();

                this._bindEvents();

                this._updateRelatedTo();

                // Have to wait until this is rendered for it to have effect
                if (!this._labelIsCached()) {
                    _.defer(this._truncateLabelText.bind(this));
                }

                this._height = HEIGHT + MARGIN_BOTTOM;
                return this;
            },

            _setAttr: function() {
                var sortKey = this.model.fetchState.get('sortKey'),
                    statusValue = this.model.instance.entry.content.get(sortKey),
                    status = this.model.thresholdConfig.getStatus(sortKey, statusValue);

                SwcMC.UtilSVG.addClass(this.$el, 'instance-group');
                if (statusValue !== null && status) {
                    this.$el.css('fill', status);

                    //SwcMC.UtilSVG.addClass(this.$el, 'instance-color-' + status);
                }
            },

            _renderBackground: function() {
                this.$background = SwcMC.UtilSVG.createElement('rect')
                    .attr({
                        'class':'instance-background',
                        x: this.model.drawContext.get('x') + (this._hasStatus() ? STATUS_WIDTH + 1 : 0),
                        y: this.model.drawContext.get('y'),
                        width: WIDTH - (this._hasStatus() ? STATUS_WIDTH - 1 : 0),
                        height: HEIGHT,
                        'shape-rendering': 'crispEdges'
                    })
                    .data(this._getBoxData())
                    .appendTo(this.$el);
            },

            _renderStatus: function() {
                if (this._hasStatus()) {
                    SwcMC.UtilSVG.createElement('rect')
                        .attr({
                            'class':'instance-status-background ',
                            x: this.model.drawContext.get('x'),
                            y: this.model.drawContext.get('y'),
                            width: STATUS_WIDTH,
                            height: HEIGHT
                        })
                        .data(this._getBoxData())
                        .appendTo(this.$el);
                }
            },

            _renderLabel: function() {
                var labelText = this._getRawLabelText();

                this.$labelText = SwcMC.UtilSVG.createElement('text')
                    .attr({
                        'class':'instance-label',
                        x: this.model.drawContext.get('x') + 
                            (this._hasStatus() ? STATUS_WIDTH : 0) + 
                            LABEL_MARGIN_LEFT,
                        y: this.model.drawContext.get('y') + LABEL_MARGIN_TOP
                    })
                    .text(this._labelIsCached() ? labelCache[labelText] : labelText)
                    .append(
                        SwcMC.UtilSVG.createElement('title')
                            .text(labelText)
                    );

                // Hides the text initially, so we can later show it.
                // We hide it initially so we can add it to the DOM to compute its length.
                // Once we know it's length then later truncate it, we can set this value back to 1 (below).
                if (!this._labelIsCached()) {
                    this._hideLabelTextElement();
                }

                this.$labelText.appendTo(this.$el);
            },

            _renderMetric: function() {
                var sortKey = this.model.fetchState.get('sortKey'),
                    metricLabel = this.model.instance.getContentLabel(sortKey, true),
                    $metricEl;
                    
                if (sortKey !== 'serverName') {
                    $metricEl = SwcMC.UtilSVG.createElement('text')
                        .attr({
                            'class':'instance-status',
                            x: this.model.drawContext.get('x') + METRIC_MARGIN_LEFT,
                            y: this.model.drawContext.get('y') + LABEL_MARGIN_TOP
                        });
                    if (_.isObject(metricLabel)) {
                        $metricEl.text(metricLabel.icon);
                        SwcMC.UtilSVG.addClass($metricEl, 'instance-status-icon');
                        if (_.has(metricLabel, 'cls')) {
                            SwcMC.UtilSVG.addClass($metricEl, metricLabel.cls);
                        }
                    } else {
                        $metricEl.text(metricLabel);
                    }
                    $metricEl.appendTo(this.$el);
                }
            },

            _renderAnchor: function() {
                this.$anchor = SwcMC.UtilSVG.createElement('rect')
                    .attr({
                        x: this.model.drawContext.get('x') + 
                            (this.anchorPosition === 'right' ? WIDTH : WIDTH / 2) + 4,
                        y: this.model.drawContext.get('y') + (this.anchorPosition === 'right' ? HEIGHT / 2 : 0),
                        width: 1,
                        height: (this.anchorPosition === 'right' ? 1 : 30),
                        opacity: 0,
                        'stroke-opacity': 0
                    })
                    .appendTo(this.$el);
            },


            _bindEvents: function() {
                this.$el
                    .mouseover(function() {
                        this.trigger('boxMouseOver', this._boxId);
                    }.bind(this))
                    .mouseout(function() {
                        this.trigger('boxMouseOut', this._boxId);
                    }.bind(this))
                    .click(function(e) {
                        if (this.children.menu && this.children.menu.shown) {
                            this.children.menu.hide();
                            e.preventDefault();
                            return;
                        }

                        this.children.menu = new InstanceMenu({
                            onHiddenRemove: true,
                            direction: this.anchorPosition,
                            model: {
                                state: this.model.state,
                                instance: this.model.instance,
                                fetchState: this.model.fetchState
                            }
                        });
                        $('body').append(this.children.menu.render().el);
                        this.children.menu.show(this.$anchor);
                    }.bind(this));
            },

            _updateRelatedTo: function() {
                if (this.model.state.get('relatedTo') === this.model.instance.entry.content.get('serverName')) {
                    SwcMC.UtilSVG.addClass(this.$el, 'active');
                } else {
                    SwcMC.UtilSVG.removeClass(this.$el, 'active');
                }
            },

            _truncateLabelText: function() {
                var backgroundWidth = SwcMC.UtilSVG.getBBox(this.$background).width - BACKGROUND_TRUNCATION_ADJUSTMENT,
                    labelTextWidth = SwcMC.UtilSVG.getBBox(this.$labelText).width,
                    labelText = this._getRawLabelText(),
                    labelTextTruncated,
                    i = 0;

                if (backgroundWidth > 0 && labelTextWidth > 0) {
                    if (labelTextWidth >= backgroundWidth) {
                        while (backgroundWidth > this.$labelText.get(0).getSubStringLength(0, i++)) {}
                        labelTextTruncated = labelText.substr(0, i - ELLIPSES.length - TRUNCATION_BUFFER) + ELLIPSES;
                        this.$labelText.text(labelTextTruncated);
                        labelCache[labelText] = labelTextTruncated;
                    } else {
                        labelCache[labelText] = labelText;
                    }
                }

                // Now we are sure the text is ready to be shown, and is of correct length.
                this._showLabelTextElement();
            },

            _reset: function() {
                this.$el.empty();
                this.$el.off();
            },

            _hasStatus: function() {
                return !_.isUndefined(this.model.thresholdConfig.get(this.model.fetchState.get('sortKey')));
            },

            _showLabelTextElement: function() {
                this.$labelText.attr('fill-opacity', 1);
            },

            _hideLabelTextElement: function() {
                this.$labelText.attr('fill-opacity', 0);
            },

            _getRawLabelText: function() {
                return this.model.instance.entry.content.get('serverName');
            },

            _labelIsCached: function() {
                return _.has(labelCache, this._getRawLabelText());
            },
            
            _getBoxData: function() {
                return {
                    id: this._boxId,
                    svgId: _.uniqueId(),
                    type: 'instanceBox',
                    listViewId: this.listViewId,
                    serverName: this.model.instance.entry.content.get('serverName'),
                    serverNames: this.model.fetchState.get('role') === 'indexer' ?
                        this.model.instance.entry.content.get('searchedBy') :
                        this.model.instance.entry.content.get('distributesSearchesTo')
                };
            }
        });
    }
);
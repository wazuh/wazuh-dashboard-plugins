define(
    [
        'underscore',
        'backbone',
        'splunk_monitoring_console/views/overview/distributed_mode/topology/instancelist/elements/Base',
        '@splunk/swc-mc'
    ],
    function(
        _,
        Backbone,
        BaseElementView,
        SwcMC
    ) {
        var TRIANGLE_SIZE = 10,
            TRIANGLE_OFFSET = 30,
            EXTRA_TRIANGLE_MARGIN = 1,
            SORT_TEXT_FONT_SIZE = 12,
            MARGIN_BOTTOM = 5,
            MARGIN_TOP = 10,
            MARGIN_LEFT = 200;

        return BaseElementView.extend({
            initialize: function() {
                BaseElementView.prototype.initialize.apply(this, arguments);

                this.listenTo(this.model.fetchState, 'change:sortDir', this.debouncedRender);
            },

            render: function() {
                var $sortText,
                    $sortIcon,
                    sortHeight,
                    upTriangle,
                    downTriangle,
                    currentPoint = this.model.drawContext.toJSON(),
                    sortClick = this._sortClick.bind(this),
                    sortDir = this.model.fetchState.get('sortDir');

                currentPoint.y = currentPoint.y + MARGIN_TOP;

                this.$el.empty();

                $sortText = SwcMC.UtilSVG.createElement('text')
                    .text(_('Sort').t())
                    .attr({
                        'class': 'link',
                        x: currentPoint.x,
                        y: currentPoint.y
                    })
                    .click(sortClick)
                    .appendTo(this.$el);
                    

                $sortIcon = SwcMC.UtilSVG.createElement('tspan')
                    .text(' ' + (sortDir === 'asc' ? '\u21A5' : '\u21A7'))
                    .attr({
                        'class': 'icon'
                    })
                    .appendTo($sortText);



                this._height = SORT_TEXT_FONT_SIZE + MARGIN_BOTTOM;

                return this;
            },

            _sortClick: function() {
                var currentSort = this.model.fetchState.get('sortDir');
                this.model.fetchState.set(
                    'sortDir',
                    (currentSort === 'desc') ? 'asc' : 'desc'
                );
            }
        });
    }
);
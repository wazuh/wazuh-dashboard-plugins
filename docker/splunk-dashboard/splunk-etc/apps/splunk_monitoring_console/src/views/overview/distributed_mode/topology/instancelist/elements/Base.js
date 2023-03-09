define(
    [
        'underscore',
        'backbone',
        '@splunk/swc-mc'
    ],
    function(
        _,
        Backbone,
        SwcMC
    ) {
        var TRIANGLE_SIZE = 10,
            TRIANGLE_LINE_THICKNESS = 2,
            TRIANGLE_MARGIN = 2,
            ACTIVE_COLOR = '#666', 
            INACTIVE_COLOR = '#AAAAAA'; 

        return SwcMC.BaseView.extend({
            initialize: function() {
                SwcMC.BaseView.prototype.initialize.apply(this, arguments);
                this.setElement(SwcMC.UtilSVG.createElement('g'));
                this._height = null;
                this.model = this.model || {};
                this.listViewId = this.options.listViewId || null;

                this.model.drawContext = this.model.drawContext || new SwcMC.BaseModel({
                    x: 0,
                    y: 0
                });

                this.listenTo(this.model.drawContext, 'change', this.debouncedRender);
            },
           
            getHeight: function() {
                return this._height;
            },

            // HELPERS
            _getPages: function(paging) {
                var lastPage = Math.ceil(paging.get('total') / paging.get('perPage')),
                    thisPage = Math.ceil(paging.get('offset') / paging.get('perPage')) + 1;
                
                if (paging.get('perPage') === 0) { // 0 means get all results -> there is 1 page
                    lastPage = 1;
                    thisPage = 1;
                }

                return {
                    thisPage: thisPage,
                    lastPage: lastPage
                };
            },

            _createTriangle: function(point, hasLine, active, isUp) {
                var lower = point.y + (TRIANGLE_SIZE / 2),
                    upper = point.y,
                    left = [
                        point.x,
                        isUp ? lower : upper
                    ],
                    middle = [
                        point.x + (TRIANGLE_SIZE / 2),
                        isUp ? upper : lower
                    ],
                    right = [
                        point.x + TRIANGLE_SIZE,
                        isUp ? lower : upper
                    ],
                    $container = SwcMC.UtilSVG.createElement('g'),
                    color = active ? ACTIVE_COLOR : INACTIVE_COLOR;

                SwcMC.UtilSVG.createElement('polygon')
                    .attr({
                        points: _.map(
                            [left, middle, right], 
                            function(p) { return p.join(','); }
                        ).join(' ')
                    })
                    .appendTo($container);

                if (hasLine) {
                    SwcMC.UtilSVG.createElement('line')
                        .attr({
                            x1: point.x,
                            y1: isUp ? upper : lower,
                            x2: point.x + TRIANGLE_SIZE,
                            y2: isUp ? upper : lower,
                            'stroke-width': TRIANGLE_LINE_THICKNESS
                        })
                        .appendTo($container);
                }

                $container.attr({
                    fill: color,
                    stroke: color
                });

                return {
                    '$container': $container,
                    height: (TRIANGLE_SIZE / 2) + (hasLine ? TRIANGLE_LINE_THICKNESS : 0) + TRIANGLE_MARGIN,
                    width: TRIANGLE_SIZE
                };
            }
        });
    }
);
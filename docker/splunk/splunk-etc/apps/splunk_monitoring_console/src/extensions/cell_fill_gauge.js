define([
    'jquery',
    'underscore',
    'splunkjs/mvc',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/simplexml/ready!'
], function(
    $,
    _,
    mvc,
    TableView
) {
    /**
     * cell.value needs to be in one of the follow form:
     * Single Value:
     *  - "<Number>"
     *  - "<Number>%"
     *  - "<Number>/<Number>"
     *  - "unlimited"
     * Double Value:
     *  -
     */
    var SINGLE_FIELD_NAMES = ['Index Usage (GB)', 'Home Path Usage (GB)', 'Cold Path Usage (GB)', 'Data Age vs Frozen Age (days)', 'Volume Usage (GB)', 'Disk Usage (GB)'];
    var DOUBLE_FIELD_NAMES = [];

    var COLORS = {
        GREEN: '#53a051',
        BLUE: '#006d9c',
        RED: '#dc4e41',
        GRAY: '#c3cbd4'
    };

    var MAX_BAR_WIDTH_PX = '200px';

    var PERC_PATTERN = /^\d+\.?\d*\??$/;    // "<Number>" or "<Number>%"
    var CRT_MAX_PATTERN = /^\d+\.?\d*\s*\w*\s*\/{1}\s*\d+\.?\d*\s*\w*$/;  // "<Number><unit>/<Number><unit>"

    var template_single_bar_with_txt = _.template(
        '<div style="width: <%= current_width_px %>; position: absolute; overflow: hidden;">' +
            '<div style="width: <%= max_width_px %>; background-color: <%= fgColor %>; color: white; border: 1px solid black; text-align: center;"><%= data %></div>' +
        '</div>' +
        '<div style="width: <%= max_width_px %>; background-color: <%= bgColor %>; color: black; border: 1px solid black; text-align: center;"><%= data %></div>');

    var template_double_bar = _.template(
        '<div class="tooltip-link" rel="tooltip" data-title="<%= tooltip_current %>" style="width: 100%; background-color: #ccc; margin-bottom: 2px;">' +
            '<span style="position: absolute; padding-left: 10px; color: white;"><%= tooltip_current %></span>' +
            '<div style="width:<%= width_current %>%; height: 16px; background-color: <%= COLOR %>;"></div>' +
        '</div>' +
        '<div class="tooltip-link" rel="tooltip" data-title="<%= tooltip_max %>" style="height: 16px; width: 100%; background-color: #5379af; color: white; text-align: center;"><%= tooltip_max %></div>');

    var SingleDataBarCellRenderer = TableView.BaseCellRenderer.extend({
        canRender: function(cell) {
            return _.contains(SINGLE_FIELD_NAMES, cell.field);
        },
        render: function($td, cell) {
            //cell.value should be one of the following:
            //  - "<Number>"
            //  - "<Number>%"
            //  - "<Number>/<Number>"
            //  - "<Number><unit>/<Number><unit>"
            //  - "<Number> / unlimited"

            $td.html(template_single_bar_with_txt({
                current_width_px: Math.round(parseInt(MAX_BAR_WIDTH_PX, 10) * this._getPercent(cell.value) / 100 + 2) + 'px',
                max_width_px: MAX_BAR_WIDTH_PX,
                fgColor: this._getPercent(cell.value) >= 100 ? COLORS.BLUE : COLORS.GREEN,
                bgColor: this._isUnlimited(cell.value) ? COLORS.GRAY : 'white',
                data: cell.value
            }));

            $td.find('.tooltip-link').tooltip({container: 'body', delay: {show: 0, hide: 0}});
        },
        _getPercent: function(v) {
            var perc = 0;
            v = v || '';
            if (v.match(PERC_PATTERN)) {
                perc = parseFloat(v);
            }
            else if (v.match(CRT_MAX_PATTERN)) {
                var _crt = v.split('/')[0];
                var _max = v.split('/')[1];
                perc = parseFloat(_max) > 0 ? parseFloat(_crt) / parseFloat(_max) * 100 : 0;  // if _max <= 0 or is a string, will set perc to 0
            }
            else {
                perc = 0; // handle 'unlimited' case
            }
            return Math.min(Math.max(perc, 0), 100); // restrict to [0, 100] range
        },
        _isUnlimited: function(v) {
            v = v || '';
            var limit = parseFloat(v.split('/')[1]);
            return _.isNaN(limit) || limit <= 0;
        }
    });

    // TODO: this is not used for now
    var DoubleDataBarCellRenderer = TableView.BaseCellRenderer.extend({
        canRender: function(cell) {
            return _.contains(DOUBLE_FIELD_NAMES, cell.field);
        },
        render: function($td, cell) {
            /** cell.value needs to be one of the following format:
             *      - "<Number>/<Number>"
             *      - "<Number><unit>/<Number><unit>"
             *      - ["<Number>", "<Number>"]
             *      - ["<Number><unit>, "<Number><unit>"]
             */
            $td.html(template_double_bar({
                tooltip_current: this._getTooltipCurrent(cell.value),
                tooltip_max: this._getTooltipMax(cell.value),
                width_current: this._getWidthCurrent(cell.value),
                width_max: this._getWidthMax(cell.value),
                COLOR: this._getColor(cell.value)
            }));

            $td.find('.tooltip-link').tooltip({container: 'body', delay: {show: 0, hide: 0}});
        },
        _getTooltipCurrent: function(v) {
            v = v || '';
            var tooltip = '0';

            if (_.isArray(v)) {
                tooltip = v[0] || tooltip;
            }
            else if (v.match(CRT_MAX_PATTERN)) {
                tooltip = v.split('/')[0] || tooltip;
            }
            return tooltip;
        },
        _getTooltipMax: function(v) {
            v = v || '';
            var tooltip = '0';

            if (_.isArray(v)) {
                tooltip = v[1] || tooltip;
            }
            else if (v.match(CRT_MAX_PATTERN)) {
                tooltip = v.split('/')[1] || tooltip;
            }
            return tooltip;
        },
        _getWidthCurrent: function(v) {
            v = v || '';
            var width = 0;

            var _crt = 0;
            var _max = 0;

            if (_.isArray(v)) {
                _crt = parseFloat(v[0]);
                _max = parseFloat(v[1]);
            }
            else if (v.match(CRT_MAX_PATTERN)) {
                _crt = parseFloat(v.split('/')[0]);
                _max = parseFloat(v.split('/')[1]);
            }

            if (_max > 0) {
                width = (_crt / _max) * 100 || width;
            }
            else {  // 'unlimited' mode
                width = 100;
            }

            return width;
        },
        _getWidthMax: function(v) { // width would be either 0 or 100;
            v = v || '';
            var width = 0;

            var _max = 0;
            if (_.isArray(v)) {
                _max = parseFloat(v[1]);
            }
            else if(v.match(CRT_MAX_PATTERN)) {
                _max = parseFloat(v.split('/')[1]);
            }

            if (_max > 0) {
                width = 100;
            } else {    // 'unlimited' mode
                width = 0;
            }

            return width;
        },
        _getColor: function(v) {
            var color = COLORS.GREEN;
            var _crtWidth = this._getWidthCurrent(v);
            var _maxWidth = this._getWidthMax(v);
            if (_crtWidth >= _maxWidth && _maxWidth > 0) {
                color = COLORS.RED;
            }
            return color;
        }
    });


    var table1 = mvc.Components.get('table1');
    if (table1) {
        table1.getVisualization(function(tableView) {
            tableView.table.addCellRenderer(new SingleDataBarCellRenderer());
            tableView.table.render();
        });
    }

    var table2 = mvc.Components.get('table2');
    if (table2) {
        table2.getVisualization(function(tableView) {
            tableView.table.addCellRenderer(new SingleDataBarCellRenderer());
            tableView.table.render();
        });
    }
});

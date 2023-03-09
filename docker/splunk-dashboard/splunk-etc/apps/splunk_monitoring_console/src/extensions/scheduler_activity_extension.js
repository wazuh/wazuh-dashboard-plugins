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

    // This is a work around for a bug with simple xml where the tokens do not
    // get submitted in a dashboard ( SPL-105662)
    var submitTokens = function() {
        mvc.Components.get('submitted').set(mvc.Components.get('default').toJSON());
    };
    mvc.Components.get('default').on('all', submitTokens);
    submitTokens();

    var FIELD_NAMES = ['Interval Load Factor'];
    var TABLE_IDS = ['runtime_statistics'];
    var COLORS = {
        inherit: 'inherit',
        white: 'white',
        red: '#d6563c',
        yellow: '#f2b827',
        black: 'black'
    };

    var template = _.template('<div style="background-color: <%= backgroundColor %>; color: <%= textColor %>;"><%= data %></div>');

    var IntervalLoadFactorCellRender = TableView.BaseCellRenderer.extend({
        canRender: function(cell) {
            return _.contains(FIELD_NAMES, cell.field);
        },
        render: function($td, cell) {
            var data = parseFloat(cell.value) || 0;
            var backgroundColor = COLORS.inherit;
            var textColor = COLORS.inherit;
            if (data >= 100) {
                backgroundColor = COLORS.red;
                textColor = COLORS.white;
            } else if (data >= 90) {
                backgroundColor = COLORS.yellow;
                textColor = COLORS.white;
            }
            $td.html(template({
                backgroundColor: backgroundColor,
                textColor: textColor,
                data: cell.value
            }));
        }
    });

    _.forEach(TABLE_IDS, function(id) {
        var table = mvc.Components.get(id);
        if (table) {
            table.getVisualization(function(tableView) {
                tableView.table.addCellRenderer(new IntervalLoadFactorCellRender());
                tableView.table.render();
            });
        }
    });
});
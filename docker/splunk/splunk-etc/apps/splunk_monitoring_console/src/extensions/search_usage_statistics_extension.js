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
    var FIELD_NAMES = ['Report Name/Search String'];
    var TABLE_IDS = ['frequently_run_searches', 'long_running_searches'];

    var SearchStringCellRender = TableView.BaseCellRenderer.extend({
        canRender: function(cell) {
            // the field needs to be a string, and has more than one command
            return _.contains(FIELD_NAMES, cell.field) && _.isString(cell.value) && (cell.value.lastIndexOf('|') > 0);
        },
        render: function($td, cell) {
            _.forEach(cell.value.split('|'), function(cmdAndArgs, idx) {
                // remember to add '|' back since we removed it when splitting
                $td.append($('<div>' + (idx > 0 ? '|' : '') + cmdAndArgs + '</div>'));
            });
        }
    });

    _.forEach(TABLE_IDS, function(id) {
        var table = mvc.Components.get(id);
        if (table) {
            table.getVisualization(function(tableView) {
                tableView.table.addCellRenderer(new SearchStringCellRender());
                tableView.table.render();
            });
        }
    });
});
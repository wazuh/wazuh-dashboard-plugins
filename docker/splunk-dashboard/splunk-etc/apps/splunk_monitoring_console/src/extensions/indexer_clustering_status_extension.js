define([
    'jquery',
    'underscore',
    'splunkjs/mvc',
    'views/shared/results_table/renderers/BaseCellRenderer',
    'views/shared/pcss/bucket-bar.pcss',
    'splunkjs/mvc/simplexml/ready!'
], function($, _, mvc, BaseCellRenderer, bucketbarCss) {
    var TABLE_NAME_WITH_ICON = ['peersTable', 'indexesTable', 'searchHeadsTable'];

    var totalCountTemplate = _.template('<span style="margin-right: 1em;"><%- size %></span>');
    var completeBucketTemplate = _.template('<div class="bucket bucket-tooltip tooltip-link complete" rel="tooltip" data-title="<%= actual %> / <%= expected %> <%= _(\'Buckets\').t() %>"></div>');
    var buildingBucketTemplate = _.template('<div class="bucket bucket-tooltip tooltip-link building" rel="tooltip" data-title="<%= actual %> / <%- expected %> <%= _(\'Buckets\').t() %>"><div class="bucket-progress-bar" style="height: <%= actual / expected * 100 %>%;"></div></a>');

    var BucketCellRenderer = BaseCellRenderer.extend({
        canRender: function(cell) {
            return (cell.field === 'Searchable Data Copies' || cell.field === 'Replicated Data Copies');
        },
        render: function($td, cell) {
            var cellValue = _.isArray(cell.value) ? cell.value : [cell.value];
            $td.append(totalCountTemplate({size: _.size(cellValue)}));
            var $bucketGroup = $('<div />', {'class': 'bucket-group'});
            _.each(cellValue, function(v) {
                var data = v.split('/');
                var actual = parseInt(data[0], 10);
                var expected = parseInt(data[1], 10);
                if (actual === expected) {
                    $bucketGroup.append(completeBucketTemplate({
                        actual: actual,
                        expected: expected
                    }));
                }
                else {
                    $bucketGroup.append(buildingBucketTemplate({
                        actual: actual,
                        expected: expected
                    }));
                }
            });
            $td.append($bucketGroup);
            $td.find('.tooltip-link').tooltip({container: 'body', delay: {show: 0, hide: 0}});
        }
    });

    mvc.Components.get('indexesTable').getVisualization(function(tableView) {
        tableView.table.addCellRenderer(new BucketCellRenderer());
        tableView.table.render();
    });

    var IconCellRender = BaseCellRenderer.extend({
        canRender: function(cell) {
            return cell.field === 'Fully Searchable' || cell.field === 'Status';
        },
        render: function ($td, cell) {
            var icon = (cell.value == "Yes" || cell.value == "Up" || cell.value == "Connected") ? '<i class="icon-check"></i>' : '<i class="icon-alert"></i>';
            $td.append(icon + _.escape(cell.value));
        }
    });

    _.each(TABLE_NAME_WITH_ICON, function(tableName) {
        mvc.Components.get(tableName).getVisualization(function(tableView) {
            tableView.table.addCellRenderer(new IconCellRender());
            tableView.table.render();
        });
    });
});

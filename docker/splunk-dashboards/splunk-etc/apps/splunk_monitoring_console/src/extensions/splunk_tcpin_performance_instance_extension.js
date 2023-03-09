define([
	'underscore',
	'jquery',
	'backbone',
	'splunkjs/mvc/postprocessmanager',
	'splunkjs/mvc/searchmanager',
	'splunkjs/mvc/tableview',
	'splunkjs/mvc',
	'splunkjs/mvc/simplexml/ready!'
], function(
	_,
	$,
	Backbone,
	PostProcessManager,
	SearchManager,
	TableView,
	mvc
	) {
	var HTML_CELL_KPI_PERCENT_FILL_GOOD = _.template("<div class=\kpi-cell\"><span class=\"icon icon-check\"></span> <%= value %></div>");
	var HTML_CELL_KPI_PERCENT_FILL_OK = _.template("<div class=\kpi-cell\"><span class=\"icon icon-minus\"></span> <%= value %></div>");
	var HTML_CELL_KPI_PERCENT_FILL_BAD = _.template("<div class=\kpi-cell\"><span class=\"icon icon-x\"></span> <%= value %></div>");

    // regex to parse numerical float from string
    var parseFillPercAsFloat = function(string) {
        return parseFloat(string.match(/(pset\d+:\s)?(\d+\.\d+)/)[2]);
    };

    var CustomCellRendererKpiFillPerc = TableView.BaseCellRenderer.extend({
        canRender: function(cellData) {
            return cellData.field == "Queue Fill Ratio (Last 1 Minute)" || cellData.field == "Queue Fill Ratio (Last 10 Minutes)";
        },
        render: function($td, cellData) {
            var parsedValues = [], html = '';
            $td.addClass("numeric"); // class to align value right

            if (_.isArray(cellData.value)) {
                _.each(cellData.value, function(cellValue) {
                    parsedValues.push({
                        displayValue: cellValue,
                        fillPerc: parseFillPercAsFloat(cellValue)
                    });
                });
            } else {
                parsedValues.push({
                    displayValue: cellData.value,
                    fillPerc: parseFillPercAsFloat(cellData.value)
                });
            }

            _.each(parsedValues, function(value) {
                if(value.fillPerc < 60) {
                    html += HTML_CELL_KPI_PERCENT_FILL_GOOD({value: value.displayValue});
                } else if (value.fillPerc >= 60 && value.fillPerc < 80) {
                    html += (HTML_CELL_KPI_PERCENT_FILL_OK({value: value.displayValue}));
                } else if (value.fillPerc > 80) {
                    html += (HTML_CELL_KPI_PERCENT_FILL_BAD({value: value.displayValue}));
                }
            });

            $td.html(html);
        }
    });

    mvc.Components.get("snapshotTcpInFillRatioTable").getVisualization(function(tableView) {
        tableView.table.addCellRenderer(new CustomCellRendererKpiFillPerc());
        tableView.table.render();
    });
});

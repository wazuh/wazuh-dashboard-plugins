/**
 * Created by ykou on 11/2/15.
 *
 * In order to use this custom viz, the following options need to be specified in the SimpleXML dashboard:
 *
 * <option name="height">@heightPx</option> for example, 50
 * <option name="field">@fieldName</option>
 * <option name="detail">@fieldName</option>
 * <option name="rangeValues">@arrayOfNumbers</option> for example: [0]
 * <option name="rangeIcons">@arrayOfIconNames</option> refer to the source code below to know the available icon names
 * <option name="rangeLabels">@arrayOfStrings</option> for example: ["All peers are up.", "$count$ peers are down."]
 * <option name="description">@descriptionText</option>
 *
 * Since the design of this viz borrowed a lot from SimpleXML Single Value, please refer to the docs of SimpleXML Single
 * Value for more information.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'vizapi/SplunkVisualizationBase',
    'bootstrap'
], function(
    $,
    _,
    Backbone,
    SplunkVisualizationBase
) {
    var ALERT_LEVEL = {
        success: 'alert-success',
        info: 'alert-info',
        warning: 'alert-warning',
        error: 'alert-error'
    };

    var TOOLTIP_MAX_LINES = 30;

    var findIndex = function(array, predicate) {
        for (var i = 0; i < array.length; i++) {
            if (predicate(array[i])) {
                return i;
            }
        }
        return -1;
    };

    var template = _.template(
        '<div class="alert <%= alertLevel %>">' +
            '<i class="icon-alert"></i>' +
            '<h5 class="dmc-kpi-item-title"><%= title %><% if (tooltip && tooltip.length > 0) { %><a class="tooltip-link"><%- _("?").t() %></a><% } %></h5>' +
            '<% if (description && description.length > 0) { %><div class="dmc-kpi-item-description"><%= description %></div><% } %>' +
        '</div>');

    var SampleViz = SplunkVisualizationBase.extend({
        initialize: function() {
            // mod viz requires to add a class name to not interferer with the core css styles
            $(this.el).addClass('dmc-kpi-item');
        },
        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE
            };
        },
        updateView: function(data, config) {
            // if no data, show a short text and return
            if (data.rows.length === 0) {
                $(this.el).text('waiting for result ...');
                return;
            }

            // parse text config into an object
            var c = this.interpretConfig(config);

            // find the field to use as the main result, if not specified, then just use the first field
            var fieldIdx = findIndex(data.fields, function(field) {
                return field.name === c.field;
            });
            if (fieldIdx < 0) {
                fieldIdx = 0;
            }

            // get the result, the assumption is: search only returns one row
            var value = data.rows[0][fieldIdx];

            // test which range the value falls into, and get the index i
            var i;
            for (i = 0; i < c.rangeValues.length; i++) {
                if (value <= c.rangeValues[i]) {
                    break;
                }
            }

            // find the field that will be used in the tooltip
            var detailIdx = findIndex(data.fields, function(field) {
                return field.name === c.detail;
            });

            // prepare data for the template
            var level = c.rangeIcons[i];
            var alertLevel = ALERT_LEVEL[level];   // icon class name
            var title = c.rangeLabels[i];  // title text
            var description = c.description; // description
            var detail = this.getDetail(detailIdx, data);

            $(this.el).html(template({
                alertLevel: alertLevel,
                title: title,
                description: description,
                tooltip: detail
            }));
            $(this.el).find('.tooltip-link').tooltip({
                // use html to display multi-lines
                html: true,
                animation:false,
                title: detail,
                container: 'body'
            });
        },
        interpretConfig: function(config) {
            return {
                field: config['display.visualizations.custom.splunk_monitoring_console.KpiTrafficLight.field'],
                detail: config['display.visualizations.custom.splunk_monitoring_console.KpiTrafficLight.detail'],
                rangeValues: JSON.parse(config['display.visualizations.custom.splunk_monitoring_console.KpiTrafficLight.rangeValues']),
                rangeLabels: JSON.parse(config['display.visualizations.custom.splunk_monitoring_console.KpiTrafficLight.rangeLabels']),
                rangeIcons: JSON.parse(config['display.visualizations.custom.splunk_monitoring_console.KpiTrafficLight.rangeIcons']),
                description: config['display.visualizations.custom.splunk_monitoring_console.KpiTrafficLight.description']
            };
        },
        getDetail: function(idx, data) {
            if (idx < 0) {
                return null;
            }
            var detail = data.rows[0][idx];

            if (!detail) {
                return null;
            }

            if (_.isString(detail)) {
                detail = [detail];
            }

            if (detail.length > TOOLTIP_MAX_LINES) {
                // don't want the tooltip explode
                detail = detail.slice(0, TOOLTIP_MAX_LINES);
                detail.push(_('... and more ...').t());
            }
            return detail.map(function(row) {
                return '<div>' + row + '</div>';
            });
        }
    });

    return SampleViz;
});
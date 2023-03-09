define([
    'underscore',
    'jquery',
    'backbone',
    'splunk.util',
    'views/shared/controls/SyntheticRadioControl'
], function(
    _,
    $,
    Backbone,
    utils,
    SyntheticRadioControl
) {

    $(".viz").hide();

    this.model = this.model || {};

    this.model.state1 = new Backbone.Model({
        showHeatMap: false,
        selectedGroup: 'all',
        relatedTo: ''
    });

    this.model.state2 = new Backbone.Model({
        showHeatMap: false,
        selectedGroup: 'all',
        relatedTo: ''
    });

    var heat_map_toggle1 = new SyntheticRadioControl({
        model: this.model.state1,
        modelAttribute: 'showHeatMap',
        items: [
            {label: _('Column Chart').t(), value: false},
            {label: _('Heat Map').t(), value: true}
        ]
    });

    var heat_map_toggle2 = new SyntheticRadioControl({
        model: this.model.state2,
        modelAttribute: 'showHeatMap',
        items: [
            {label: _('Column Chart').t(), value: false},
            {label: _('Heat Map').t(), value: true}
        ]
    });

    $("#instances_by_search_concurrency .heatmap_toggle").append(heat_map_toggle1.render().$el);

    $("#instances_by_search_concurrency .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#instances_by_search_concurrency .viz").show();
            $("#instances_by_search_concurrency .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#instances_by_search_concurrency .viz").hide();
            $("#instances_by_search_concurrency .chart").show();
        }
    });

    $("#instances_by_search_usage .heatmap_toggle").append(heat_map_toggle2.render().$el);

    $("#instances_by_search_usage .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#instances_by_search_usage .viz").show();
            $("#instances_by_search_usage .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#instances_by_search_usage .viz").hide();
            $("#instances_by_search_usage .chart").show();
        }
    });
});
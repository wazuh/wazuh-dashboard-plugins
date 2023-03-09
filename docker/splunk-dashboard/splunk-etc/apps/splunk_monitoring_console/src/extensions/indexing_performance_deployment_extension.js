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

    $("#instances_by_indexing_rate .heatmap_toggle").append(heat_map_toggle1.render().$el);

    $("#instances_by_indexing_rate .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#instances_by_indexing_rate .viz").show();
            $("#instances_by_indexing_rate .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#instances_by_indexing_rate .viz").hide();
            $("#instances_by_indexing_rate .chart").show();
        }
    });

    $("#instances_by_queue_fill_ratio .heatmap_toggle").append(heat_map_toggle2.render().$el);

    $("#instances_by_queue_fill_ratio .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#instances_by_queue_fill_ratio .viz").show();
            $("#instances_by_queue_fill_ratio .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#instances_by_queue_fill_ratio .viz").hide();
            $("#instances_by_queue_fill_ratio .chart").show();
        }
    });
});
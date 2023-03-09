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

    this.model.state = new Backbone.Model({
        showHeatMap: false,
        selectedGroup: 'all',
        relatedTo: ''
    });
    
    var heat_map_toggle = new SyntheticRadioControl({
        model: this.model.state,
        modelAttribute: 'showHeatMap',
        items: [
            {label: _('Column Chart').t(), value: false},
            {label: _('Heat Map').t(), value: true}
        ]
    });
    
    $("#instances_by_index_usage .heatmap_toggle").append(heat_map_toggle.render().$el);

    $("#instances_by_index_usage .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#instances_by_index_usage .viz").show();
            $("#instances_by_index_usage .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#instances_by_index_usage .viz").hide();
            $("#instances_by_index_usage .chart").show();
        }
    });
});
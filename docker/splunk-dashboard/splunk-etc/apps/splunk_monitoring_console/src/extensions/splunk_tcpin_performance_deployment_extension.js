define([
    'underscore',
    'jquery',
    'backbone',
    'views/shared/controls/SyntheticRadioControl'
], function(
    _,
    $,
    Backbone,
    SyntheticRadioControl
) {

    // SPL-188381 Specified id in selector to prevent hiding of Health Check
    $("#indexer_count_by_tcp_input_queue_fill_ratio .viz").hide();

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

    $("#indexer_count_by_tcp_input_queue_fill_ratio .heatmap_toggle").append(heat_map_toggle.render().$el);

    $("#indexer_count_by_tcp_input_queue_fill_ratio .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#indexer_count_by_tcp_input_queue_fill_ratio .viz").show();
            $("#indexer_count_by_tcp_input_queue_fill_ratio .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#indexer_count_by_tcp_input_queue_fill_ratio .viz").hide();
            $("#indexer_count_by_tcp_input_queue_fill_ratio .chart").show();
        }
    });
});

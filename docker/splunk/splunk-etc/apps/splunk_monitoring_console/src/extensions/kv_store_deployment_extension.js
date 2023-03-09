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

    this.model.state3 = new Backbone.Model({
        showHeatMap: false,
        selectedGroup: 'all',
        relatedTo: ''
    });

    this.model.state4 = new Backbone.Model({
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

    var heat_map_toggle3 = new SyntheticRadioControl({
        model: this.model.state3,
        modelAttribute: 'showHeatMap',
        items: [
            {label: _('Column Chart').t(), value: false},
            {label: _('Heat Map').t(), value: true}
        ]
    });

    var heat_map_toggle4 = new SyntheticRadioControl({
        model: this.model.state4,
        modelAttribute: 'showHeatMap',
        items: [
            {label: _('Column Chart').t(), value: false},
            {label: _('Heat Map').t(), value: true}
        ]
    });

    $("#instances_by_page_faults_per_operation .heatmap_toggle").append(heat_map_toggle1.render().$el);

    $("#instances_by_page_faults_per_operation .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#instances_by_page_faults_per_operation .viz").show();
            $("#instances_by_page_faults_per_operation .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#instances_by_page_faults_per_operation .viz").hide();
            $("#instances_by_page_faults_per_operation .chart").show();
        }
    });

    $("#instances_by_virtual_to_mapped_memory_ratio .heatmap_toggle").append(heat_map_toggle2.render().$el);

    $("#instances_by_virtual_to_mapped_memory_ratio .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#instances_by_virtual_to_mapped_memory_ratio .viz").show();
            $("#instances_by_virtual_to_mapped_memory_ratio .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#instances_by_virtual_to_mapped_memory_ratio .viz").hide();
            $("#instances_by_virtual_to_mapped_memory_ratio .chart").show();
        }
    });

    $("#instances_by_average_replication_latency .heatmap_toggle").append(heat_map_toggle3.render().$el);

    $("#instances_by_average_replication_latency .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#instances_by_average_replication_latency .viz").show();
            $("#instances_by_average_replication_latency .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#instances_by_average_replication_latency .viz").hide();
            $("#instances_by_average_replication_latency .chart").show();
        }
    });

    $("#instances_by_background_flush .heatmap_toggle").append(heat_map_toggle4.render().$el);

    $("#instances_by_background_flush .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#instances_by_background_flush .viz").show();
            $("#instances_by_background_flush .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#instances_by_background_flush .viz").hide();
            $("#instances_by_background_flush .chart").show();
        }
    });
});
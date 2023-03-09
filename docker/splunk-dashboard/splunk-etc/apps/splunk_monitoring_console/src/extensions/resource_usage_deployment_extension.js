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

    this.model.state5 = new Backbone.Model({
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

    var heat_map_toggle5 = new SyntheticRadioControl({
        model: this.model.state5,
        modelAttribute: 'showHeatMap',
        items: [
            {label: _('Column Chart').t(), value: false},
            {label: _('Heat Map').t(), value: true}
        ]
    });

    $("#load_average .heatmap_toggle").append(heat_map_toggle1.render().$el);

    $("#load_average .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#load_average .viz").show();
            $("#load_average .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#load_average .viz").hide();
            $("#load_average .chart").show();
        }
    });

    $("#cpu_usage .heatmap_toggle").append(heat_map_toggle2.render().$el);

    $("#cpu_usage .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#cpu_usage .viz").show();
            $("#cpu_usage .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#cpu_usage .viz").hide();
            $("#cpu_usage .chart").show();
        }
    });

    $("#physical_memory_usage .heatmap_toggle").append(heat_map_toggle3.render().$el);

    $("#physical_memory_usage .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#physical_memory_usage .viz").show();
            $("#physical_memory_usage .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#physical_memory_usage .viz").hide();
            $("#physical_memory_usage .chart").show();
        }
    });

    $("#io_bandwidth_utilization .heatmap_toggle").append(heat_map_toggle4.render().$el);

    $("#io_bandwidth_utilization .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#io_bandwidth_utilization .viz").show();
            $("#io_bandwidth_utilization .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#io_bandwidth_utilization .viz").hide();
            $("#io_bandwidth_utilization .chart").show();
        }
    });

    $("#disk_usage .heatmap_toggle").append(heat_map_toggle5.render().$el);

    $("#disk_usage .heatmap_toggle .btn-group .btn").click(function() {
        if (this.getAttribute("data-value") == 'true') {
            $("#disk_usage .viz").show();
            $("#disk_usage .chart").hide();
        } else if (this.getAttribute("data-value") == 'false'){
            $("#disk_usage .viz").hide();
            $("#disk_usage .chart").show();
        }
    });
});
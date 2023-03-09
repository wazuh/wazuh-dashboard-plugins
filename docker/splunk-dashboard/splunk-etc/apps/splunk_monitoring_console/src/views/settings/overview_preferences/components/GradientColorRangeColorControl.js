define([
    'underscore',
    'module',
    'backbone',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/settings/overview_preferences/components/GradientColorRangeColorPicker'
],
function(
    _,
    module,
    Backbone,
    SwcMC,
    GradientColorRangeColorPicker
    ) {

    return SwcMC.ColorRangeColorControlView.extend({
        className: 'gradient-color-range-input-control',
        moduleId: module.id,
        
        _createColorPicker: function() {
            return new GradientColorRangeColorPicker({
                ignoreClasses: ["color-picker-container"],
                model: this.model,
                onHiddenRemove: true,
                paletteColors: this.options.paletteColors,
                rangeColors: this.options.rangeColors
            });
        }
        
    });

});
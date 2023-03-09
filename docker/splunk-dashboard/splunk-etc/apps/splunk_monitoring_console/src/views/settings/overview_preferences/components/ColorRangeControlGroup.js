define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/settings/overview_preferences/components/ColorRangeControlMaster',
    '@splunk/swc-mc'
], function(
    _,
    module,
    SwcMC,
    ColorRangeControlMaster,
    SwcMC
) {

    return SwcMC.ColorRangesControlGroupView.extend({
        moduleId: module.id,
        initialize: function() {
            var colorRangesControl = new ColorRangeControlMaster({
                className: SwcMC.ControlView.prototype.className,
                model: this.model,
                modelAttribute: this.options.modelAttribute,
                rangeColorsName: this.options.rangeColorsName,
                inputClassName: this.options.inputClassName,
                defaultColors: this.options.defaultColors,
                defaultRangeValues: this.options.defaultRangeValues,
                displayMinMaxLabels: this.options.displayMinMaxLabels,
                paletteColors: this.options.paletteColors,
                rangesGradient: this.options.rangesGradient,
                rangesEditable: this.options.rangesEditable,
                rangesRational: this.options.rangesRational
            });
            
            this.options.label = _('Mappings').t();
            this.options.controlClass = 'controls-block';
            this.options.controls = [ colorRangesControl ];
            SwcMC.ControlGroupView.prototype.initialize.call(this, this.options);
        }
    });

});

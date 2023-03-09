define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/settings/overview_preferences/components/ColorRangeFromLabelControl',
    'splunk_monitoring_console/views/settings/overview_preferences/components/GradientColorRangeColorControl'
], function(
    _,
    module,
    SwcMC,
    FromLabelControl,
    GradientColorControl
    ) {

    return SwcMC.ColorRangeControlRowView.extend({
        moduleId: module.id,
        className: 'color-range-control-row',

        initialize: function() {
            SwcMC.ControlView.prototype.initialize.apply(this, arguments);
            this.model.to = this.model;
            this.model.from = this.options.fromModel;
            this.displayMinMaxLabels = this.options.displayMinMaxLabels;
            this.rangesGradient = this.options.rangesGradient;
            this.initRowComponents();
        },

        initRowComponents: function() {
            var i = this.collection.indexOf(this.model.to);
            if (this.model.to.get('value') === 'more') {
                // Set row's right control to label 'max'
                this.createFromLabelControl(this.model.from, 'min', 'from');
                this.createLabelControl(this.model.to, 'max', 'to');
                this.createColorControl(this.model.to);
            } else {
                if (i === 1) {
                    // Left control should be an input instead of a label
                    if (isNaN(this.model.to.get('value'))) {
                        this.createLabelControl(this.model.to, 'max', 'to');
                    } else {
                        this.createInputControl(this.model.from, 'min', 'from');
                        this.createInputControl(this.model.to, 'max', 'to');
                    }
                    
                } else {
                    // Most range values get both label and input controls.
                    // Use previous range value to power label.
                    if (isNaN(this.model.to.get('value'))) {
                        this.createLabelControl(this.model.to, 'max', 'to');
                    } else {
                        this.createFromLabelControl(this.model.from, 'min', 'from');
                        this.createInputControl(this.model.to, 'max', 'to', '');
                    }
                }
                this.createColorControl(this.model.to);
            }
        },

        createLabelControl: function(model, id, label, customClass) {
            if (model.get('value') === 'more') {
                model.set('value', _('more').t());
            }
            this.children[id + 'View'] = new SwcMC.ColorRangeLabelControlView({
                model: model,
                label: _(label).t(),
                customClass: customClass
            });
        },

        createFromLabelControl: function(model, id, customClass) {
            this.children[id + 'View'] = new FromLabelControl({
                model: model,
                label: _('from').t(),
                customClass: customClass
            });
        },

        createColorControl: function(model, id) {
            if (model.get('color') && model.get('color').length > 0) {
                if(this.rangesGradient) {
                    this.children.colorView = new GradientColorControl({
                        model: model,
                        paletteColors: this.options.paletteColors,
                        rangeColors: this.options.rangeColors,
                        className: 'color-range-color-control'
                    });
                } else {
                    this.children.colorView = new SwcMC.ColorRangeColorControlView({
                        model: model,
                        paletteColors: this.options.paletteColors,
                        className: 'color-range-color-control'
                    });
                }
            }
        }

    });

});
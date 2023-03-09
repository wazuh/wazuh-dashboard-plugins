define(
    [
        'underscore',
        'jquery',
        'module',
        '@splunk/swc-mc'
    ],
    function(_, $, module, SwcMC){

        return SwcMC.PopTartView.extend({
            moduleId: module.id,
            className: 'popdown-dialog gradient-color-range-dialog',
            initialize: function() {
                SwcMC.PopTartView.prototype.initialize.apply(this, arguments);
                this.rangeColors = this.options.rangeColors;
                var baseColor = this.rangeColors.get("thresholds")['defaultRange'];

                this.baseColorModel = this.model.clone();
                this.baseColorModel.set(baseColor);

                if (!this.options.paletteColors || this.options.paletteColors.length === 0) {
                    throw new Error('Palette Colors must be defined');
                }

                this.listenTo(this.baseColorModel, 'change', this._updatePreviewColors);
            },
            events: {
                'click .base-color-square': function(e) {
                    e.preventDefault();
                    var $target = $(e.currentTarget),
                        color = $target.css('background-color');
                    this.children.colorPicker = new SwcMC.ColorPickerView({
                        model: this.baseColorModel,
                        onHiddenRemove: true,
                        paletteColors: this.options.paletteColors
                    });
                    this.children.colorPicker.render().appendTo(
                        $('body'));
                    this.children.colorPicker.show($target);
                },
                'click .gradient-color-picker-apply': function(e) {
                    e.preventDefault();
                    // Hide first, because that will return focus to the correct popdown activator.
                    // This is necessary so the parent can re-render in place correctly when the color-picker-apply event is triggered.
                    this.hide();
                    this.rangeColors.trigger('gradient-color-picker-apply');
                    e.stopPropagation();
                },
                'click .gradient-color-picker-cancel': function(e) {
                    e.preventDefault();
                    this.hide();
                    e.stopPropagation();
                }
            },
            _updatePreviewColors: function() {
                var minColor = "0xFFFFFF";
                var maxColor = this.baseColorModel.get("color");

                var minColorAsInt = parseInt(minColor, 16);
                var maxColorAsInt = parseInt(maxColor, 16);

                var thresholds = this.rangeColors.get("thresholds");

                var numColors = Object.keys(thresholds).length;
                var counter = 1;

                for(var key in thresholds) {
                    var percent = (1 / numColors) * counter;
                    var newColorAsInt = SwcMC.ColorUtils.interpolateColors(minColorAsInt, maxColorAsInt, percent);
                    thresholds[key].color = "0x" + newColorAsInt.toString(16);
                    counter++;
                }
                this.render();
            },
            render: function() {
                this.$el.html(SwcMC.PopTartView.prototype.template);
                this.$el.append(this._buttonTemplate);
                this.$('.popdown-dialog-body').addClass('color-picker-content');
                var $rangePickerContent = $('<div class="clearfix"></div>').appendTo(this.$('.popdown-dialog-body'));
                $rangePickerContent.append(this.compiledTemplate({
                    rangeColors: this.rangeColors.get('thresholds'),
                    baseColorModel: this.baseColorModel,
                    model: this.model,
                    colorUtil: SwcMC.ColorUtils
                }));
            },
            template: '\
                <div class="gradient-range-control-container">\
                    <div class="row-container gradient-preview">\
                        <div class="row-title">Preview</div>\
                        <% _(rangeColors).each(function(range) { %>\
                            <% if(model.get("color") === range.color) { %>\
                                <span class="preview color-square" data-color="<%= colorUtil.stripSymbols(range.color) %>" style="background-color: <%= colorUtil.replaceSymbols(range.color, "#") %>"></span>\
                            <% } else { %>\
                                <span class="preview color-square" data-color="<%= colorUtil.stripSymbols(range.color) %>" style="background-color: <%= colorUtil.replaceSymbols(range.color, "#") %>"></span>\
                            <% } %>\
                        <% }) %>\
                    </div>\
                    <div class="row-container gradient-color-selector">\
                        <div class="row-title">Base Color</div>\
                        <a class="base-color-square color-square" data-color="<%= colorUtil.stripSymbols(baseColorModel.get("color")) %>" style="background-color: <%= colorUtil.replaceSymbols(baseColorModel.get("color"), "#") %>"></a>\
                    </div>\
                </div>\
            ',
            _buttonTemplate: '\
                <div class="popdown-dialog-footer color-picker-buttons clearfix">\
                    <a href="#" class="gradient-color-picker-apply btn btn-primary pull-right"> '+_("Apply").t()+'</a>\
                    <a href="#" class="gradient-color-picker-cancel btn pull-right">'+_("Cancel").t()+'</a>\
                </div>\
            '
        });
    }
);

define([
    'underscore',
    'module',
    'splunk_monitoring_console/views/settings/overview_preferences/components/ColorRangeControlRow',
    '@splunk/swc-mc',
    'splunk_monitoring_console/helpers/ThresholdConfigsClient'
], function(
    _,
    module,
    ColorRangeControlRow,
    SwcMC,
    ThresholdConfigClientHelper
) {

    return SwcMC.ColorRangeControlMasterView.extend({
        moduleId: module.id,
        initialize: function(options) {
            SwcMC.ControlView.prototype.initialize.apply(this, arguments);
            this.rangeValuesName = this.options.modelAttribute;
            this.rangeColorsName = this.options.rangeColorsName;
            this.displayMinMaxLabels = this.options.displayMinMaxLabels;
            this.paletteColors = this.options.paletteColors;
            this.rangesEditable = this.options.rangesEditable;
            this.rangesGradient = this.options.rangesGradient;
            this.rangesRational = this.options.rangesRational;

            this.children = {};

            this.usedColorMap = {};

            // In-mem collection to keep track of ranges and colours being edited before being written
            this.collection = {};
            this.collection.rows = new SwcMC.BaseCollection();

            this.maxModel = new SwcMC.BaseModel({
                value: 'more',
                color: this.DEFAULT_COLOR
            });

            this.collection.rows.on('change color-picker-apply', function() {
                this.updateInPlace();
            }, this);

            this.listenTo(this.model, 'gradient-color-picker-apply', this._refreshView);

            this.maxModel.on('color-picker-apply', function() {
                this.maxColor = this.maxModel.get('color');
                this.updateInPlace();
            }, this);
            this.initRowsFromModel();
        },

        events: {
            'click .add-color-range': function(e) {
                e.preventDefault();
                var newRowView,
                    i = this.collection.rows.length,
                    model = new SwcMC.BaseModel({
                        value: parseInt(this.collection.rows.last().get('value'), 10) + 10,
                        color: this.getNextColor()
                    });
                this.collection.rows.add(model);
                newRowView = this.createRow(this.collection.rows.at(i - 1), model, model.cid);

                if (this.displayMinMaxLabels) {
                    // Redraw max row as the fromModel has changed
                    this.children.rangeRow_max.remove();
                    this.createRow(model, this.maxModel, 'max', true);
                }

                if (this.rangesGradient) {
                    this._updateColors();
                }

                this.render();
                newRowView.$('input.input-value:first').focus();
            },
            'click .reset-threshold': function(e) {
                e.preventDefault();
                this.model.trigger('resetToDefault');
            }
        },

        _refreshView: function() {
            this.children = {};
            this.stopListening();
            this.initialize();
            this.render();
        },

        _updateColors: function() {
            var numRanges = this.collection.rows.length;

            var minColor = "0xFFFFFF";
            var maxColor = this.maxModel.get("color");

            var minColorAsInt = parseInt(minColor, 16);
            var maxColorAsInt = parseInt(maxColor, 16);

            this.collection.rows.each(function(model, i) {
                if (model.get("color") !== "" ) {
                    var percent = (1 / numRanges) * i;
                    var newColorAsInt = SwcMC.ColorUtils.interpolateColors(minColorAsInt, maxColorAsInt, percent);
                    model.set('color', "0x" + newColorAsInt.toString(16));
                }
            }.bind(this));
        },

        initRowsFromModel: function() {
            this.ranges = this.model.rangesValuesToArray();
            this.colors = this.model.colorValuesToArray();
            var model;

            // First, create a row for all provided ranges
            _(this.ranges).each(function(range, i) {
                var value = this.ranges[i],
                    color;
                // The first range is a 'from' value and does not get its own color
                if (i === 0) {
                    color = '';
                } else {
                    // If there are excess ranges with no matching color, assign default grey color
                    color = this.colors[i - 1] || this.DEFAULT_COLOR;
                }

                // if the ranges are editable then the value must be numerical since
                // editing non numerical ranges is not allowed
                // if the value is numerical, floor it to be consistent with formatted
                // values
                var displayVal = this.rangesEditable ? Math.floor(value) : value;
                model = new SwcMC.BaseModel({
                    value: displayVal,
                    color: color
                });
                this.collection.rows.add(model);
            }, this);

            // Then, if there are any additional colors that were not included into a row
            // by being matched with a range value, create rows for those additional colors too.
            // Additionally, construct a dictionary for all colors that are currently being used
            _(this.colors).each(function(color, i) {
                this.usedColorMap[SwcMC.ColorUtils.replaceSymbols(color, "#")] = true;
                if (i >= this.ranges.length - 1) {
                    if (this.displayMinMaxLabels && i === this.colors.length - 1) {
                        // last color - this will become the max row, so don't add it to the collection as its own row
                        this.maxColor = color;
                    } else {
                        model = new SwcMC.BaseModel({
                            value: '',
                            color: color
                        });
                        this.collection.rows.add(model);
                    }
                }
            }, this);

            this.drawRows();
        },

        drawRows: function() {
            this.collection.rows.each(function(model, i) {
                    if (i === 1) {
                        this.createRow(this.collection.rows.at(i - 1), model, model.cid, true);
                    } else if (i > 0) {
                        this.createRow(this.collection.rows.at(i - 1), model, model.cid, !this.rangesEditable);
                    }
            }, this);

            // Add max row at the end, if necessary
            if (this.displayMinMaxLabels) {
                // There are more colors than ranges, and so we must set the maxModel to the last color
                if (this.maxColor) {
                    this.maxModel.set('color', this.maxColor);
                }
                // Need an additional row for max row
                this.createRow(this.collection.rows.last(), this.maxModel, 'max', true);
            }
        },

        createRow: function(fromModel, toModel, id, hideRemoveButton) {
            var row = this.children['rangeRow_' + id] = new ColorRangeControlRow({
                model: toModel,
                fromModel: fromModel,
                collection: this.collection.rows,
                displayMinMaxLabels: this.displayMinMaxLabels,
                hideRemoveButton: hideRemoveButton,
                paletteColors: this.paletteColors,
                rangesGradient: this.rangesGradient,
                rangeColors: this.model
            });
            this.listenTo(row, 'removeRange', function(model) {
                var rowToRemove = this.children['rangeRow_' + model.cid];
                var removedRowIndex = rowToRemove.$el.index();
                rowToRemove.remove();
                // Remove view from children hash to prevent re-rendering in render()
                delete this.children['rangeRow_' + model.cid];
                if(!_.isUndefined(model.get('color'))) {
                    delete this.usedColorMap[SwcMC.ColorUtils.replaceSymbols(model.get('color'), "#")];
                }
                this.collection.rows.remove(this.collection.rows.get({ cid: model.cid }));
                // Redraw all row views because the fromModels have changed
                if(this.rangesGradient) {
                    this._updateColors();
                }
                this.drawRows();
                this.render();
                // The call to drawRows() will have re-created all child views, so we can't rely on any previous DOM references.
                // If there was a row after the one that was just removed, focus it.  Otherwise, focus the previous row.
                // There is guaranteed to be a previous row, because the first row can't be removed.
                var $rowEls = this.$('.color-range-row-placeholder').children();
                var rowIndexToFocus = ($rowEls.length > removedRowIndex) ? removedRowIndex : removedRowIndex - 1;
                $rowEls.eq(rowIndexToFocus).find('input.input-value:last').focus();
            });
            return row;
        },

        getNextColor: function() {
            var color =  _.find(this.paletteColors, function(color) {
                return _.isUndefined(this.usedColorMap[color]);
            }, this);

            if(_.isUndefined(color)) {
                return this.DEFAULT_COLOR;
            } else {
                this.usedColorMap[color] = true;
                return SwcMC.ColorUtils.replaceSymbols(color, "0x");
            }
        },

        // assumes that the first row is set as a 'from' value and each subsequent row is set as a 'to' value
        syncModel: function() {
            var name = this.model.get('name'),
                thresholds = {},
                currentRange = '',
                // plucks the color from each row in the in-mem collection and returns them as an array
                rangeColorList = this.collection.rows
                    .pluck('color')
                    .filter(function(value){
                        return value !== "";
                    });

            if (this.displayMinMaxLabels) {
                rangeColorList.push(this.maxModel.get('color'));
            }

            this.collection.rows.each(function(model, i) {
                var value;
                // if the model ranges are editable, then they must be numberical
                if (this.rangesEditable) {
                    value = parseInt(model.get('value'), 10);
                    if (i === 0) {
                        currentRange = value.toString();
                    } else {
                        // for values that can be floating point, add .999 to ensure no gaps with preceeding number
                        // follows convention in macros
                        currentRange += '-' + (value + 0.999).toString();
                        thresholds[currentRange] = { color: rangeColorList[i - 1],  formattedRange: ThresholdConfigClientHelper.getFormattedRange(name, currentRange.split('-')) };

                        if (i < rangeColorList.length - 1 ) {
                            currentRange = (value + 1).toString();
                        } else {
                            thresholds['defaultRange'] = { color: rangeColorList[i], formattedRange: ThresholdConfigClientHelper.getFormattedRange(name, [(value + 1), Infinity]) };
                        }
                    }
                } else {
                    // if the range is not editable that means that the values are the formatted ranges
                    // and the true ranges cannot changed
                    value = model.get('value');
                    if (!_.isUndefined(value)) {
                        var range = this.model.getTrueRangeForFormattedRange(value);
                        thresholds[range] = { color: rangeColorList[i - 1], formattedRange: value };
                    }
                }

            }, this);

            var err = this.model.preValidate('thresholds', thresholds);
            if (err === '') {
                this.model.trigger('rangesValidated', true);
                this.model.set('thresholds', thresholds);
            } else {
                this.model.trigger('rangesValidated', false, err);

            }
        },

        render: function() {
            this.syncModel();

            this.el.innerHTML = this.compiledTemplate({rangesEditable: this.rangesEditable});

            var $colorRangePlaceholder = this.$('.color-range-row-placeholder');
            // Detach all children so that their listeners are preserved when we empty their container.
            _(this.children).invoke('detach');
            $colorRangePlaceholder.empty();
            _.each(this.children, function(childRow) {
                childRow.render().appendTo($colorRangePlaceholder);
            }, this);
            // Make sure max row gets rendered at the bottom
            if (this.displayMinMaxLabels) {
                this.children.rangeRow_max.detach();
                this.children.rangeRow_max.appendTo($colorRangePlaceholder);
            }
            return this;
        },

        template: '\
            <div class="color-range-row-placeholder"></div>\
            <div class="color-range-control-container">\
                <% if (rangesEditable) { %>\
                    <a href="#" class="add-color-range btn"> + <%- _("Add Range").t() %></a>\
                <% } %>\
                <a href="#" class="reset-threshold btn"><%- _("Reset to Default").t() %></a>\
            </div>\
        '
    });

});

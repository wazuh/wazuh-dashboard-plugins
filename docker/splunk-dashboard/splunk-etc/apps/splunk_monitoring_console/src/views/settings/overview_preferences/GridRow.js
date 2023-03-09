/**
 * @author atruong
 */

define([
    'jquery',
    'underscore',
    'module',
    '@splunk/swc-mc',
    'contrib/text!./GridRow.html',
    'splunk_monitoring_console/views/settings/overview_preferences/EditThresholdConfigDialog',
    'splunk_monitoring_console/helpers/ThresholdConfigsClient'
], function(
    $,
    _,
    module,
    SwcMC,
    template,
    EditThresholdConfigDialog,
    ThresholdConfigsClientHelper
) {
    /*
     * ColorRangesModel provides temporary storage for the data parsed out of the ThresholdConfig macro definition
     * and any user directed changes before they are converted back into a definition string and updated and saved 
     * on the model.
     * Attributes set on the model consist of:
     * @name:String - the name of the corresponding macro excluding the dmc_rangemap_prefix
     * @displayName:String - the user facing name for the threshold group
     * @thresholds:Object - a object of threshold objects
     *      - the key for a threshold object is either a stringified range (e.g. '0-10.999') or
     *        default, which represents the range for the highest specified number or greater
     *      - the value is an object consisting of the corresponding color and user facing formatted 
     *        range
     *      - Example threshold:
     *        '0-10.999' : {
     *            formattedRange: '0-10%',
     *            color: green
     *        }
     */ 
    var ColorRangesModel = SwcMC.BaseModel.extend({
        // checks that the threshold ranges set are 
        // 1) in ascending order
        // 2) not overlapping
        // 3) not reusing colors
        validation: {
            thresholds: function (thresholds) {
                thresholds = thresholds || this.get('thresholds');
                if (!_.isUndefined(thresholds)) {
                    var usedColors = {},
                        lastUpperBound;

                    // assumes that the ranges are in sorted order
                    // (ColorRangeControl sets ranges on the model, the color range control is initialized 
                    // from a sorted array of range values as per rangeValuesToArray)
                    for (var threshold in thresholds) {
                        var bounds = threshold.split('-'),
                            lowerBound = parseFloat(bounds[0]),
                            upperBound = parseFloat(bounds[1]),
                            color = thresholds[threshold]['color'],
                            floatingPoint = false;

                        if (threshold !== 'defaultRange') {
                            if (isNaN(lowerBound) || isNaN(upperBound)) {
                                return 'Range values must be numerical';
                            }

                            if (!ThresholdConfigsClientHelper.isBinary(this.get('name')) && (Math.floor(lowerBound) >= Math.floor(upperBound) || (!_.isUndefined(lastUpperBound) && Math.floor(lowerBound) <= Math.floor(lastUpperBound)))) {
                                return 'Range values must be in ascending order.';
                            }
                            lastUpperBound = upperBound;
                        } else {
                            lastUpperBound = Infinity;
                        }

                        if (_.has(usedColors, color)) {
                            return 'A color cannot be used more than once.';
                        }
                        usedColors[color] = 1;
                    }
                }
            }
        },

        // parses the thresholds object to return an array of range values
        // the first value is the lower bound of the lowest range and every
        // subsequent value is the upper bound of each range
        // expects that range values are numerical
        rangesValuesToArray: function () {
            var thresholds = this.get('thresholds'),
                isBinary = ThresholdConfigsClientHelper.isBinary(this.get('name')),
                ranges = [],
                lowestLowerBound;

            // for each threshold in the definition, push the upper bound of the range
            // into the range values array
            for (var threshold in thresholds) {
                if (isBinary) {
                    ranges.push(thresholds[threshold].formattedRange);
                } else {
                    if (threshold !== 'defaultRange') {
                        var range = threshold.split('-');
                        ranges.push(parseFloat(range[1]));
                        if (_.isUndefined(lowestLowerBound) || lowestLowerBound > parseFloat(range[0])) {
                            lowestLowerBound = parseFloat(range[0]);
                        }
                    }
                }
            }

            // pushes the lower bound of the lowest range into the rangeValues array
            ranges.splice(0, 0, lowestLowerBound);

            if (!isBinary) {
                // sorts the ranges array in ascending order
                ranges.sort(function (a, b) { return a - b; });
            }
            return ranges;
        },

        colorValuesToArray: function () {
            var thresholds = this.get('thresholds'),
                colorArray = [];

            for (var threshold in thresholds) {
                colorArray.push(thresholds[threshold]['color'].replace('#', '0x'));
            }
            
            return colorArray;
        },

        // creates a rangemap definition string for the macro from the ranges set on 
        // the model by the range color picker
        thresholdsToDefinition: function () {
            var thresholds = this.get('thresholds'),
                definition = 'rangemap field=' + this.get('field') + ' ';

            for (var threshold in thresholds) {
                if (threshold === 'defaultRange') {
                    definition += 'default=' + thresholds[threshold]['color']; 
                } else {
                    definition += thresholds[threshold]['color'] + '=' + threshold + ' ';
                }
            }
            return definition;
        },

        getTrueRangeForFormattedRange: function (formattedRange) {
            var thresholds = this.get('thresholds');

            for (var threshold in thresholds) {
                if (thresholds[threshold]['formattedRange'] === formattedRange) {
                    return threshold;
                }
            }
        }

    });

    return SwcMC.BaseView.extend({
        moduleId: module.id,
        tagName: 'tr',
        className: 'list-item',
        template: template,

        initialize: function (options) {
            this.model.colorRanges = new ColorRangesModel();
            SwcMC.BaseView.prototype.initialize.call(this, options);

            this.originalColorRanges = this.model.colorRanges.clone();  
        },

        events: {

            'click .edit-action': function(e) {
                e.preventDefault();
                this.onEditThresholdConfig();
            },

            'click .thresholdConfig-edit-link': function(e) {
                e.preventDefault();
                this.onEditThresholdConfig();
            }
        },

        onEditThresholdConfig: function () {
            var definition = this.model.thresholdConfig.entry.content.get('definition'),
                name = this.model.thresholdConfig.entry.get('name').substr('dmc_rangemap_'.length),
                parsedDefinition = ThresholdConfigsClientHelper.parseDMCRangemapDefinition(name, definition, false);
            this.model.colorRanges.set(parsedDefinition);
            var options = {model: { thresholdConfig: this.model.thresholdConfig, colorRanges: this.model.colorRanges }};
            options.displayMinMaxLabels = ThresholdConfigsClientHelper.isBinary(this.model.colorRanges.get('name')) ? false : true;
            options.rangesEditable = ThresholdConfigsClientHelper.isBinary(this.model.colorRanges.get('name')) ? false : true;
            options.rangesGradient = ThresholdConfigsClientHelper.isGradient(this.model.colorRanges.get('name')) ? true : false;
            options.rangesRational = ThresholdConfigsClientHelper.isRational(this.model.colorRanges.get('name')) ? true : false;
            options.onHiddenRemove = true;

            this.children.editThresholdConfigDialog = new EditThresholdConfigDialog(options);
            this.children.editThresholdConfigDialog.render().appendTo($('body'));
            this.children.editThresholdConfigDialog.show();
        },

        render: function () {
            var definition = this.model.thresholdConfig.entry.content.get('definition'),
                name = this.model.thresholdConfig.entry.get('name').substr('dmc_rangemap_'.length),
                parsedDefinition = ThresholdConfigsClientHelper.parseDMCRangemapDefinition(name, definition, false),
                html = this.compiledTemplate({
                    _: _,
                    model: this.model.thresholdConfig,
                    name: parsedDefinition.displayName,
                    thresholds: parsedDefinition.thresholds
               });

            this.model.colorRanges.set(parsedDefinition);
            this.$el.html(html);

            return this;
        }
    });
}); 
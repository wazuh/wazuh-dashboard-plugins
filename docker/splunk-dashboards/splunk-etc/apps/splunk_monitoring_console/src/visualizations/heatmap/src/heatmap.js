define([
            'jquery',
            'underscore',
            'vizapi/SplunkVisualizationBase',
            'vizapi/SplunkVisualizationUtils',
            'd3'
        ],
        function(
            $,
            _,
            SplunkVisualizationBase,
            vizUtils,
            d3
        ) {

    var GRID_HEIGHT = 20;
    var LEGEND_TITLE_Y_OFFSET = 65;
    var LEGEND_Y_OFFSET = 70;
    var DEFAULT_BASE_COLOR = "#284774";
    var DEFAULT_COLOR_PALETTE = ["#e6ecf3","#cdd8e7","#b4c5db","#9cb1d0","#839ec4","#6a8ab8","#5177ac","#3863a0", DEFAULT_BASE_COLOR];
    var DEFAULT_WIDTH = 1250;
    var DEFAULT_HEIGHT = 530;
    var ENTER_DURATION = 2000;
    var EXIT_DURATION = 1000;
    var CARD_EXIT_DURATION = 100;

    var showTooltip;
    var baseColor;
    var prevBaseColor;
    var calledByScreenResize;

    var getColors = function(maxNumInstances) {
        var newColorPalette = [];
        if (_.isUndefined(baseColor) || baseColor === DEFAULT_BASE_COLOR) { //default base color and color palette use colors from the original column chart
            if (maxNumInstances >= DEFAULT_COLOR_PALETTE.length-1) {
                return DEFAULT_COLOR_PALETTE;
            } else {
                return DEFAULT_COLOR_PALETTE.slice(0, maxNumInstances+1);
            }
        } else {
            for (var lum = 2; lum >= 0; lum -= 0.25) {
                newColorPalette.push(colorLuminance(baseColor, lum));
            }
            if (maxNumInstances >= newColorPalette.length-1) {
                return newColorPalette;
            } else {
                return newColorPalette.slice(0, maxNumInstances+1);
            }
        }
    };

    var colorLuminance = function(hex, lum) {
        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#", c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i*2,2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00"+c).substr(c.length);
        }

        return rgb;
    };

    var formatDate = function(dTime, interval, totalRange) {

        var dateObj = new Date(dTime);

        var tooltipFormat = d3.time.format("%b %d %Y %H:%M%p");
        var hourMinFormat = d3.time.format("%H:%M%p");
        var monthDateHourMinFormat = d3.time.format("%b %d %H:%M%p");
        var monthDateFormat = d3.time.format("%b %d");
        var monthFormat = d3.time.format("%b");
        var minFormat = d3.time.format("%M");
        var hourFormat = d3.time.format("%H");
        var dayFormat = d3.time.format("%d");
        var secFormat = d3.time.format("%S");

        var seconds = secFormat(dateObj);
        var minutes = minFormat(dateObj);
        var hours = hourFormat(dateObj);
        var day = dayFormat(dateObj);

        if (interval == -1) { // for tooltips
            return tooltipFormat(dateObj);
        } else if (interval > 0 && interval <= 1) { // < 1 minute intervals
            if((minutes == '00' || minutes == '10' || minutes == '20' || minutes == '30' || minutes == '40' || minutes == '50') && seconds == '00') {
                return hourMinFormat(dateObj);
            }
        } else if (interval == 5) { // 5 minute intervals
            if(minutes == '00') {
                return hourMinFormat(dateObj);
            }
        } else if (interval >= 10 && interval <= 30) { // 10-30 minute intervals
            if((hours == '00' || hours == '04' || hours == '08' || hours == '12' || hours == '16' || hours == '20') && minutes == '00') {
                return monthDateHourMinFormat(dateObj);
            }
        } else if (interval == 60) { // 60 minute intervals
            if((hours == '00' || hours == '12') && minutes == '00') {
                return monthDateHourMinFormat(dateObj);
            }
        } else if (interval == 1440) { // 1 day intervals
            if (totalRange > 21600) { //total time frame is greater than 15 days
                if (day == '05' || day == '10' || day == '15' || day == '20' || day == '25' || day == '30') {
                    return monthDateFormat(dateObj);
                }
            } else {
                return monthDateFormat(dateObj);
            }
        } else if (interval >= 40000 && interval <= 50000) { // 1 month intervals
            return monthFormat(dateObj);
        }

        return "";
    };

    var generateDisplayTimeLabel = function(dateObj) {
        var timezoneCorrectedDateObj = vizUtils.parseTimestamp(dateObj.toISOString());
        var array = timezoneCorrectedDateObj.toISOString().split(/[\T.]+/);
        var date = array[0]; // year-month-day
        var time = timezoneCorrectedDateObj.toString().split(/[\s]+/)[4];
        var dateArray = date.split(/[\-]+/);
        var label = dateArray[1] + "/" + dateArray[2] + "/" + dateArray[0] + " " + time;
        return label;
    };

    return SplunkVisualizationBase.extend({
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);
            this.margin = { top: 20, right: 75, bottom: 100, left: 150 };
            this.$el.addClass('splunk-heatmap');
            this.viewSetup = false;
            this.prevTimestampData = [];
            this.numBuckets = -1;
        },    

        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            };
        },

        formatData: function(data, config) {

        	if (!data || !data.rows || !data.fields || data.rows.length == 0) {
                return this;
            }

            var numBuckets = this._getBucketNames(data).length;

            var width = this.$el.width() - this.margin.left - this.margin.right;
            var height = DEFAULT_HEIGHT - this.margin.top - this.margin.bottom;

            if (width <= 0 && this.prevWidthLessThanZero !== false) {
                this.prevWidthLessThanZero = true;
            }

            width = (width <= 0 ? $(window).width() - this.margin.left - this.margin.right : width);

            this.width = width;
            this.height = height;

            var numTimeStamps = data.rows.length;
            var gridWidth = Math.floor(this.width/numTimeStamps);
            var gridHeight = GRID_HEIGHT;

            var colorScale = this._generateColorScale(data);
            var bucketData = this._generateBucketData(data, gridWidth, gridHeight);
            var timestampData = this._generateTimeStampData(data, gridWidth, gridHeight);
            var squareData = this._generateSquareData(data, bucketData, timestampData, colorScale, gridWidth, gridHeight);
            var legendData = this._generateLegendData(colorScale);

            var formattedData = {
                gridWidth: gridWidth,
                gridHeight: gridHeight,
                squareData: squareData,
                timestampData: timestampData,
                bucketData: bucketData,
                legendData: legendData
            };

            if (this.numBuckets == -1) {
                this.numBuckets = formattedData.bucketData.length;
            }

        	return formattedData;
        },

        updateView: function(data, config) {
            if (!data || !data.squareData) {
                return this;
            }

            if (this.viewSetup === false) {
                this.$el.empty();
                this._setupViewCustom(data);
                this.viewSetup = true;
            }

            showTooltip = config[this.getPropertyNamespaceInfo().propertyNamespace + 'showTooltip'];
            baseColor = config[this.getPropertyNamespaceInfo().propertyNamespace + 'baseColor'];

            var legendTitle = "Instance count";
            var showLegend = config[this.getPropertyNamespaceInfo().propertyNamespace + 'showLegend'];
            var showXAxisLabel = config[this.getPropertyNamespaceInfo().propertyNamespace + 'showXAxis'];
            var showYAxisLabel = config[this.getPropertyNamespaceInfo().propertyNamespace + 'showYAxis'];
            var customLegendTitle = config[this.getPropertyNamespaceInfo().propertyNamespace + 'legendTitle'];
            var customXAxisLabel = config[this.getPropertyNamespaceInfo().propertyNamespace + 'xAxis'];
            var customYAxisLabel = config[this.getPropertyNamespaceInfo().propertyNamespace + 'yAxis'];

            var svg = d3.select(this.el).select(".canvas");
            this._updateSquares(svg, data);
            this._updateBuckets(svg, data);
            this._updateTimeStamps(svg, data);
            this._updateLegend(svg, data);

            // If baseColor is not undefined or has changed, call formatData again
            if (!_.isUndefined(baseColor) && baseColor != prevBaseColor) {
                this.invalidateFormatData();
                prevBaseColor = baseColor.slice();
            }

            this._updateLegendTitle(svg, data, customLegendTitle, legendTitle);
            this._updateCustomLabels(svg, data, customXAxisLabel, customYAxisLabel);
            this._updateLegendLableVisability(svg, showLegend, showXAxisLabel, showYAxisLabel);

            calledByScreenResize = false;

            if (this.prevWidthLessThanZero === true) {
                this.prevWidthLessThanZero = false;
                this.invalidateFormatData();
            }
        },

        _setupViewCustom: function(data) {

            var svg = d3.select(this.el).append("svg")
                .attr("width", this.width + this.margin.left + this.margin.right)
                .attr("height", this.height + this.margin.bottom + this.margin.left)
                .append("g")
                .attr("class", "canvas")
                .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

            svg.append('g')
                .attr('class', 'card-group');

            svg.append('g')
                .attr('class', 'time-label-group');

            svg.append('g')
                .attr('class', 'bucket-label-group');

            svg.append('g')
                .attr('class', 'legend-group');

            svg.append("text")
                .attr("class", "mono x-axis-label")
                .text("Time")
                .attr("x", this.width / 2 - 20)
                .attr("y", data.bucketData.length * data.gridHeight + 50);

            svg.append("text")
                .attr("class", "mono y-axis-label")
                .text("")
                .attr("transform", "translate(-130,110)rotate(-90)");

            var tooltip = d3.select("body").append("div")
                .attr("class", "heatmap tooltip")
                .style("opacity", 0);
        },

        _getMaxNumInstances: function(data) {
            var max = 0;
            var buckets = this._getBucketNames(data);
            for(var i=0; i<data.rows.length; i++) {
                for(var j=0; j<buckets.length; j++) {
                    max = parseInt(data.rows[i][j+1], 10) > max ? parseInt(data.rows[i][j+1], 10) : max;
                }
            }
            return max;
        },  

        _getBucketNames: function(data) {
            return _.chain(data.fields)
                    .pluck('name')
                    .filter(function(field) { return field.indexOf('span') === -1; })
                    .value()
                    .splice(1);
        },

        _generateColorScale: function(data) {
            var maxNumInstances = this._getMaxNumInstances(data);
            var colors = getColors(maxNumInstances);
            return d3.scale
                     .quantile()
                     .domain([0, maxNumInstances])
                     .range(colors);
        },

        _generateBucketData: function(data, width, height) {
            var buckets = [];
            var bucketNames = this._getBucketNames(data);
            _.each(bucketNames, function(bucketName) {
                buckets.push({name: bucketName, height: height});
            });

            return buckets;
        },

        _generateTimeStampData: function(data, width, height) {
            var timeStamps = [];
            _.each(data.rows, function(row) {
                timeStamps.push({time: row[0], width: width});
            });
            return timeStamps;
        },

        _generateSquareData: function(data, buckets, timestamps, colorScale, width, height) {
            var indexOfSpan = data.fields.findIndex(function(obj) { return obj.name === "_span"; });
            var squares = [];
            _.each(data.rows, function(row, i) {
                for(var j=0; j<buckets.length; j++) {
                    var numInstances = row[j+1] ? row[j+1] : 0;
                    var square = {
                        x: i,
                        y: j,
                        timestamp: timestamps[i].time,
                        bucket: buckets[j].name,
                        width: width,
                        height: height,
                        numInstances: numInstances,
                        color: colorScale(numInstances),
                        _span: row[indexOfSpan]
                    };
                    squares.push(square);
                }
            });

            return squares;
        },

        _generateLegendData: function(colorScale) {
            var legendData = [];
            var quantiles = [0].concat(colorScale.quantiles());
            _.each(quantiles, function(q) {
                legendData.push({quantile: q, color: colorScale(q)});
            });
            return legendData;
        },

        // Squares
        // =============================
        _updateSquares: function(svg, data) {
            var currentP = this;
            var tooltip = d3.select(".heatmap.tooltip");
            var cards = svg.select('.card-group')
                .selectAll(".time")
                .data(data.squareData, function(d) { return "x:" + d.x + " " + "y:" + d.y; });

            cards.enter().append("rect")
                .attr("x", function(d) { return d.x * d.width; })
                .attr("y", function(d) { return d.y * d.height; })
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("class", "time bordered")
                .attr("width", function(d) { return d.width; })
                .attr("height", function(d) { return d.height; })
                .style("fill", DEFAULT_COLOR_PALETTE[0]) // default color
                .style("opacity", 0)
                .on("mouseout", function () {
                    if (_.isUndefined(showTooltip) || SwcMC.GeneralUtils.normalizeBoolean(showTooltip) === true) {
                        d3.select(this).style("cursor", "default");
                        tooltip.interrupt().transition();
                        tooltip.style("opacity", 0);
                    }
                })
                .on("mouseover", function (d) {
                    if (_.isUndefined(showTooltip) || SwcMC.GeneralUtils.normalizeBoolean(showTooltip) === true) {
                        d3.select(this).style("cursor", "pointer");
                        tooltip.style("opacity", 0.8);

                        tooltip.html(formatDate(d.timestamp, -1, -1) + "<br>" + vizUtils.escapeHtml(d.bucket) + "<br>Number of Instances: " + vizUtils.escapeHtml(d.numInstances))
                            .style("left", (d3.event.pageX-75) + "px")
                            .style("top", (d3.event.pageY-85) + "px");

                        tooltip.transition().delay(300).duration(500).style("opacity", 0.85);
                    }
                })
                .call(function(d) {
                    var timeStampNode = d3.select(this.el).select('.timestampLabel').node();
                    if(timeStampNode) {
                        var legendY = data.bucketData.length * data.gridHeight + LEGEND_Y_OFFSET;
                        var legendElementWidth = data.gridHeight * 2;

                        d3.select(this.el).selectAll('.legend .legend-color')
                          .transition()
                          .duration(ENTER_DURATION)
                          .attr("x", function(d, i) { return legendElementWidth * i; })
                          .attr("y", legendY)
                          .attr("width", legendElementWidth)
                          .attr("height", data.gridHeight / 2);

                        d3.select(this.el).selectAll('.legend .legend-label')
                          .transition()
                          .duration(ENTER_DURATION)
                          .attr("x", function(d, i) { return legendElementWidth * i; })
                          .attr("y", legendY + data.gridHeight + 2);
                    }
                })
                .on('click', function(d) {
                    var earliest = new Date(d.timestamp);
                    var latest = new Date(earliest.getTime() + d._span*1000);

                    var earliestLabel = generateDisplayTimeLabel(earliest);
                    var latestLabel = generateDisplayTimeLabel(latest);

                    var data = {};

                    data['_span'] = true;
                    data['drilldown_indexing_rate_metric'] = d.bucket;
                    data['earliest'] = vizUtils.parseTimestamp(earliest.toISOString()).toISOString();
                    data['latest'] = vizUtils.parseTimestamp(latest.toISOString()).toISOString();
                    data['numInstances'] = d.numInstances;
                    data['earliest_label'] = earliestLabel;
                    data['latest_label'] = latestLabel;

                    currentP.drilldown({
                        action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                        data: data,
                        earliest: vizUtils.parseTimestamp(earliest.toISOString()).toISOString(),
                        latest: vizUtils.parseTimestamp(latest.toISOString()).toISOString()
                    }, d3.event);
                });

            cards.transition().duration(ENTER_DURATION)
                 .attr("x", function(d) { return d.x * d.width; })
                 .attr("y", function(d) { return d.y * d.height; })
                 .attr("rx", 4)
                 .attr("ry", 4)
                 .attr("width", function(d) { return d.width; })
                 .attr("height", function(d) { return d.height; })
                 .style("opacity", 1)
                 .style("fill", function(d) { return d.color; });

            cards.exit().transition().duration(CARD_EXIT_DURATION)
                .style("opacity", 0).remove();
        },
        // Buckets
        // =============================
        _updateBuckets: function(svg, data) {
            var buckets = svg.select('.bucket-label-group')
                .selectAll(".bucketLabel")
                .data(data.bucketData, function(d) { return d.name; });

            buckets.enter()
                .append("text")
                .text(function (d) { return d.name; })
                .attr("x", 0)
                .attr("y", function (d, i) { return i * d.height; })
                .style("text-anchor", "end")
                .style("opacity", 0)
                .attr("transform", function(d) { return "translate(-6," + d.height / 1.5 + ")"; }.bind(this))
                .attr("class", function (d, i) { return "bucketLabel mono axis"; });

            buckets.transition().duration(ENTER_DURATION)
                   .style("opacity", 1)
                   .attr("x", 0)
                   .attr("y", function (d, i) { return i * d.height; });

            buckets.exit().remove();
        },
        // TimeStamps
        // ================================
        _updateTimeStamps: function(svg, data) {
            var dataObj = data.timestampData[0];
            var earliest = new Date(dataObj.time);
            var dataObj2 = data.timestampData[1];
            var latest = new Date(dataObj2.time);
            var diff = (latest - earliest) / 1000 / 60; // in minutes

            var dataObjLast = data.timestampData[data.timestampData.length - 1];
            var endTime = new Date(dataObjLast.time);
            var totalRange = (endTime - earliest) / 1000 / 60; // in minutes

            var curFirst = data.timestampData[0].time;
            var curLast = data.timestampData[data.timestampData.length - 1].time;
            if (this.prevTimestampData.length != 0) {
                var prevFirst = this.prevTimestampData[0].time;
                var prevLast = this.prevTimestampData[this.prevTimestampData.length - 1].time;
            }

            if (this.prevTimestampData.length != 0 && (data.timestampData.length != this.prevTimestampData.length || curFirst != prevFirst || curLast != prevLast)) {
                svg.selectAll(".timestampLabel").remove();
            }
            this.prevTimestampData = data.timestampData.slice();

            var timeLabelHeight = data.bucketData.length * data.gridHeight + 15;
            var timeLabels = svg.select('.time-label-group')
                .selectAll(".timestampLabel")
                .data(data.timestampData);

            timeLabels.enter().append("text")
                .attr("class", "timestampLabel mono axis")
                .text(function(d) { return formatDate(d.time, diff, totalRange); })
                .style("font-size", "11px")
                .style("font-weight", "250")
                .style("text-anchor", "beginning")
                .style("opacity", 0)
                .attr("transform", function(d, i) { return "translate("+parseInt((i*d.width + d.width/2 - 5), 10) +","+timeLabelHeight+")"; }.bind(this));

            timeLabels
                .transition()
                .duration(ENTER_DURATION)
                .attr("transform", function(d, i) { return "translate("+parseInt((i*d.width + d.width/2 - 5), 10) +","+timeLabelHeight+")"; }.bind(this))
                .style("opacity", 1);


            timeLabels.exit().transition().duration(EXIT_DURATION)
                .style("opacity", 0).remove();
        },
        // Legend
        // ============================
        _updateLegend: function(svg, data) {

            if (data.bucketData.length != this.numBuckets) {
                svg.selectAll(".legend").remove();
                this.numBuckets = data.bucketData.length;
            }

            var legendElementWidth = data.gridHeight * 2;

            var legendY = data.bucketData.length * data.gridHeight + LEGEND_Y_OFFSET;

            var legend = svg.select('.legend-group')
                .selectAll(".legend")
                .data(data.legendData, function(d, i) { return d.color; });

            var legendEnter = legend.enter().append("g")
                .attr("class", "legend")
                .style("opacity", 0);

            legendEnter.append("rect")
                .attr("class", "legend-color")
                .attr("x", function(d, i) { return legendElementWidth * i; })
                .attr("y", legendY)
                .attr("width", legendElementWidth)
                .attr("height", data.gridHeight / 2)
                .style("fill", function(d, i) { return d.color; });

            legendEnter.append("text")
                .attr("class", "mono legend-label")
                .text(function(d) { return "≥ " + Math.ceil(d.quantile); })
                .attr("x", function(d, i) { return legendElementWidth * i; })
                .attr("y", legendY + data.gridHeight + 2);

            legend.transition().duration(ENTER_DURATION)
                .style("opacity", 1);

            legend.exit().transition().duration(EXIT_DURATION)
                .style("opacity", 0).remove();
        },
        // Formatter Custom Legend Title
        // ============================
        _updateLegendTitle: function(svg, data, customLegendTitle, legendTitle) {
            // Update Legend Title
            if (!_.isUndefined(customLegendTitle) && customLegendTitle.length > 0) {
                customLegendTitle = vizUtils.escapeHtml(customLegendTitle);
                legendTitle = customLegendTitle;
            }

            svg.selectAll(".legend-title").remove();
            var legendTitleY = data.bucketData.length * data.gridHeight + LEGEND_TITLE_Y_OFFSET;

            svg.append("text")
                .attr("class", "mono legend-title")
                .text(legendTitle)
                .attr("x", 0)
                .attr("y", legendTitleY);
        },
        // Formatter Custom Labels
        // ============================
        _updateCustomLabels: function(svg, data, customXAxisLabel, customYAxisLabel) {
            // Update X / Y Axis Labels
            if (!_.isUndefined(customXAxisLabel)) {
                customXAxisLabel = vizUtils.escapeHtml(customXAxisLabel);
                if (customXAxisLabel.length == 0) {
                    customXAxisLabel = "Time";
                }
                svg.select('.x-axis-label')
                    .text(customXAxisLabel)
                    .attr("x", this.width / 2 - 20 - customXAxisLabel.length * 4);
            } else {
                svg.select('.x-axis-label')
                    .attr("y", data.bucketData.length * data.gridHeight + 50);
            }

            if (!_.isUndefined(customYAxisLabel)) {
                customYAxisLabel = vizUtils.escapeHtml(customYAxisLabel);
                if (customYAxisLabel.length == 0) {
                    customYAxisLabel = "";
                }
                svg.select('.y-axis-label')
                    .text(customYAxisLabel);
            }
        },
        // Formatter Custom Visibility for Legend and Labels
        // ============================
        _updateLegendLableVisability: function(svg, showLegend, showXAxisLabel, showYAxisLabel) {
            // Show / hide legend and labels
            if (showLegend == 'false') {
                svg.select('.legend-group').attr("display", "none");
                svg.select('.legend-title').attr("display", "none");
            } else if (showLegend == 'true') {
                svg.select('.legend-group').attr("display", "block");
                svg.select('.legend-title').attr("display", "block");
            }

            if (showXAxisLabel == 'false') {
                svg.select('.x-axis-label').attr("display", "none");
            } else if (showXAxisLabel == 'true') {
                svg.select('.x-axis-label').attr("display", "block");
            }

            if (showYAxisLabel == 'false') {
                svg.select('.y-axis-label').attr("display", "none");
            } else if (showYAxisLabel == 'true') {
                svg.select('.y-axis-label').attr("display", "block");
            }
        },

        // Override to respond to re-sizing events
        reflow: function() {
            // If size changed, redraw.
            if(this.width !== this.$el.width() - this.margin.left - this.margin.right ||
                this.height !== DEFAULT_HEIGHT - this.margin.top - this.margin.bottom ) {
                calledByScreenResize = true;
                this.invalidateUpdateView();
            }
        }
    });
});
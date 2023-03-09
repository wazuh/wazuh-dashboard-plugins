/**
 * Created by claral on 6/21/16.
 */
define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/splunk_health_check/utils',
    'contrib/text!splunk_monitoring_console/views/splunk_health_check/ReasonCountDistributed.html',
    'splunk_monitoring_console/views/splunk_health_check/ReasonCountDistributed.pcss',
    'splunk_monitoring_console/views/splunk_health_check/pcss/icon-style.pcss'
], function (_, module, SwcMC, utils, Template, css, iconStyleCSS) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,
        render: function () {
            var isDone = this.model.task.isDone();
            var reasonSummary = [];
            var totalCount = 0;
            if (isDone) {
                var reasonSummaryUnsorted = _.map(this.model.task.getReasonSummary(), function (count, severity_level) {
                    return {
                        level: severity_level,
                        count: count,
                    };
                });
                // most severe level first
                reasonSummary = _.sortBy(reasonSummaryUnsorted, function (summary) {
                    return -summary.level;
                });
                totalCount = this.model.task.getResult().raw.rows.length;
            }

            function addRoundedPercent(reasonSummary, totalCount) {
                // This function helps calculate 100% rounded percent
                // based on Largest Remainder Method
                // https://revs.runtime-revolution.com/getting-100-with-rounded-percentages-273ffa70252b

                function addRegularPercent(item) {
                    item['perc'] = (item['count'] / totalCount) * 100;
                    return item;
                }

                function sum(a, b) {
                    return a + b;
                }

                function compareByFloorDiff(a, b) {
                    var percA = a['perc'];
                    var percB = b['perc'];
                    return Math.floor(percA) - percA - (Math.floor(percB) - percB);
                }

                function distributeDifference(item, index) {
                    item['perc'] = index < percDiff ? Math.floor(item['perc']) + 1 : Math.floor(item['perc']);
                    return item;
                }

                function getFloorValues(item) {
                    return Math.floor(item['perc']);
                }

                // Calculate and add percent in dataset using normal method
                reasonSummary = reasonSummary.map(addRegularPercent);

                // Calculate the total percentage difference with 100%
                var percDiff = 100 - reasonSummary.map(getFloorValues).reduce(sum);

                // Sort the dataset with maximum difference first
                var sortedReason = reasonSummary.sort(compareByFloorDiff);

                // Distribute the difference into dataset
                reasonSummary = sortedReason.map(distributeDifference);
                return reasonSummary;
            }

            // SPL-176497 Fixed the sum of health check result percentages to 100%
            if (reasonSummary.length > 0) {
                // Add 100% rounded percentages in reasonSummary
                // Example output reasonSummary:
                // [
                //     {count: 2, level: "-1", perc: 29},
                //     {count: 5, level: "0", perc: 71}
                // ]
                reasonSummary = addRoundedPercent(reasonSummary, totalCount);
            }
            this.$el.html(
                this.compiledTemplate({
                    reasonSummary: reasonSummary,
                    totalCount: totalCount,
                    isDone: isDone,
                    utils: utils,
                    splunkUtils: SwcMC.SplunkUtil,
                })
            );

            this.$('.health-tooltip-link').tooltip();

            return this;
        },
    });
});

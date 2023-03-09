/**
 * Created by cykao on 8/18/16.
 */


define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/components/SingleValueWithResults.html'
], function(
    _,
    module,
    SwcMC,
    Template
) {
    /**
     * This view is specifically designed for Monitoring Console Overview page. This is a basic view for
     * showing a single value when the result is already provided by the collection.
     */

    var DMC_TOOLTIP_OPTIONS = {
        delay: {"show": "750", "hide": "0"}
    };
    
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        tagName: function() {
            return this.options.drilldownHref ? 'a' : 'div';
        },
        className: 'dmc-single-value',
        attributes: function() {
            return {
                href: this.options.drilldownHref || '',
                'data-toggle': 'tooltip',
                title: this.options.TOOLTIP || ''
            };
        },
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.dataToRender = _.extend(this.dataToRender || {}, {
                UNDER_LABEL: this.options.UNDER_LABEL,
                result: this.options.result
            });
        },
        render: function() {
            this.$el.html(this.compiledTemplate(this.dataToRender));
            this.$el.addClass(this.options.additionalClassNames);
            this.$el.tooltip(DMC_TOOLTIP_OPTIONS);
            return this;
        },
        template: Template
    });
});

    
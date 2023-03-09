/**
 * Created by ykou on 1/15/15.
 */

define([
    'underscore',
    'module',
    'splunk_monitoring_console/views/overview/distributed_mode/components/SingleSearchResult',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/components/SingleValue.html'
], function(
    _,
    module,
    SingleSearchResultView,
    Template
) {
    /**
     * This view is specifically designed for Monitoring Console Overview page.
     *
     * @param {SearchManager}   searchManager       - SplunkJS search manager
     * @param {String}          searchResultFieldName
     * @param {String}          UNDER_LABEL
     * @param {String}          drilldownHref       - url for drilldown action
     * @param {String}          TOOLTIP (optional)  - tooltip when hover over
     *
     * NOTE: this view doesn't include beforeLabel or afterLabel, which should be handled by SPL.
     */
    var DMC_TOOLTIP_OPTIONS = {
        delay: {"show": "750", "hide": "0"}
    };

    return SingleSearchResultView.extend({
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
            SingleSearchResultView.prototype.initialize.apply(this, arguments);

            this.dataToRender = _.extend(this.dataToRender || {}, {
                UNDER_LABEL: this.options.UNDER_LABEL
            });
        },
        render: function() {
            SingleSearchResultView.prototype.render.apply(this, arguments);
            this.$el.addClass(this.options.additionalClassNames);
            this.$el.tooltip(DMC_TOOLTIP_OPTIONS);
            return this;
        },
        template: Template
    });
});
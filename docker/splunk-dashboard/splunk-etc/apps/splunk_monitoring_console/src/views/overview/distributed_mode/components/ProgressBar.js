/**
 * Created by ykou on 1/20/15.
 */
define([
    'jquery',
    'underscore',
    'module',
    'splunk_monitoring_console/views/overview/distributed_mode/components/SingleSearchResult',
    'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/components/ProgressBar.html'
], function(
    $,
    _,
    module,
    SingleSearchResultView,
    Template
) {
    /**
     * This view is specifically designed for Monitoring Console Overview page.
     *
     * @param {SearchManager}         searchManager - SplunkJS search manager
     * @param {Array of Strings}      searchResultFieldName - two strings: first is the percentage used in viz
     *                                                                     second is the afterLabel
     * @param {String}                BEFORE_LABEL
     * @param {String}                drilldownHref - url for drilldown action
     * @param {String}                TOOLTIP (optional)  - tooltip when hover over
     *
     */
    var DMC_TOOLTIP_OPTIONS = {
        delay: {"show": "750", "hide": "0"}
    };

    return SingleSearchResultView.extend({
        moduleId: module.id,
        tagName: 'a',
        className: 'dmc-progress-viz',
        attributes: function() {
            return {
                href: this.options.drilldownHref,
                'data-toggle': 'tooltip',
                title: this.options.TOOLTIP || ''
            };
        },
        initialize: function() {
            SingleSearchResultView.prototype.initialize.apply(this, arguments);

            this.clickHandler = this.options.clickHandler;
            this.color = this.options.color;

            this.dataToRender = _.extend(this.dataToRender || {}, {
                BEFORE_LABEL: this.options.BEFORE_LABEL,
                searchResultFieldName: this.options.searchResultFieldName
            });

            this.searchResultDfd.always(this.render.bind(this));
        },
        events: {
            'click *': function(e) {
                if (this.clickHandler) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.clickHandler(e, this._getCurrentValue());
                }   
            }
        },
        render: function() {
            var currentValue = this._getCurrentValue();
            this.$el.html(this.compiledTemplate(this.dataToRender));
            this.$el.tooltip(DMC_TOOLTIP_OPTIONS);
            if (_.isFunction(this.color) && _.isNumber(currentValue) && !_.isNaN(currentValue)) {
                this.$('.dmc-progress-bar').css(
                    'background-color', 
                    this.color(currentValue)
                );
            }
            this.delegateEvents();
            return this;
        },
        _getCurrentValue: function() {
            return +this.dataToRender.result[this.searchResultFieldName[1]];
        },
        template: Template
    });
});
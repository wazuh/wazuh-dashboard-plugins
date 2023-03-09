/**
 * Created by ykou on 1/20/15.
 */
/**
 * Created by ykou on 1/15/15.
 */

define([
    'jquery',
    'underscore',
    'module',
    '@splunk/swc-mc'
], function(
    $,
    _,
    module,
    SwcMC
) {
    /**
     * This view is specifically designed for Monitoring Console Overview page. This is a basic view for
     * showing a single value from a search result.
     *
     * @param {SearchManager}                       searchManager - SplunkJS search manager
     * @param {String || Array of Strings}          searchResultFieldName - the field name of search result
     *
     * NOTE: this view doesn't include beforeLabel or afterLabel, which should be handled by SPL.
     */
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.searchManager = this.options.searchManager;
            this.searchResultFieldName = this.options.searchResultFieldName;
            this.dataToRender = this.dataToRender || {
                result: 'N/A'
            };

            this.searchManagerDfd = $.Deferred();
            this.searchResultDfd = $.Deferred();

            this.listenTo(this.searchManager, 'search:done', function(properties) {
                this.searchManagerDfd.resolve();
                var resultModel = this.searchManager.data('preview');
                this.listenTo(resultModel, 'data', function() {
                    var data = resultModel.collection().models[0];
                    if (_.isString(this.searchResultFieldName)) {   // just want one field value
                        this.dataToRender.result = data.get(this.searchResultFieldName);
                    }
                    else if (_.isArray(this.searchResultFieldName)) {  // a list of field values
                        this.dataToRender.result = _.isObject(this.dataToRender.result) ? this.dataToRender.result : {};
                        _.forEach(this.searchResultFieldName, function(field) {
                            this.dataToRender.result[field] = data.get(field);
                        }, this);
                    }
                    this.searchResultDfd.resolve();
                });
                this.listenTo(resultModel, 'error', function() {
                    SwcMC.Console.log('search result model error:', resultModel, this.searchManager);
                });
            });
            this.listenTo(this.searchManager, 'search:cancelled search:error search:failed', function() {
                SwcMC.Console.log('search not finished! ', this.searchManager);
            });

            // TODO: tooltip
        },
        render: function() {
            this.searchManagerDfd.then(function() {
                this.$el.html(this.compiledTemplate(this.dataToRender));
                this.searchResultDfd.then(function() {
                    this.$el.html(this.compiledTemplate(this.dataToRender));
                }.bind(this));
            }.bind(this));
            return this;
        }
    });
});
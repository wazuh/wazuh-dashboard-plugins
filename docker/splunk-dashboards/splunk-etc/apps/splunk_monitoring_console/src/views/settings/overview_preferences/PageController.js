/*
* @author atruong
* @date 8/05/2015
*/

define([
	'underscore',
	'backbone',
	'module',
	'splunk_monitoring_console/views/settings/overview_preferences/Master',
	'splunk_monitoring_console/collections/ThresholdConfigs',
    '@splunk/swc-mc',
    './PageController.pcss'
], function(
	_,
	Backbone,
	module,
	MasterView,
	ThresholdConfigsCollection,
    SwcMC,
    css
	) {

	return SwcMC.BaseController.extend({
		moduleId: module.id,

		initialize: function(options) {
			SwcMC.BaseController.prototype.initialize.apply(this, arguments);

			this.collection = this.collection || {};
			this.model = this.model || {};
			this.deferreds = this.deferreds || {};

			this.collection.thresholdConfigs = new ThresholdConfigsCollection();
			this.collection.thresholdConfigs.fetchData.set({count: 25});

			this.collection.thresholdConfigs.fetch().done(_(function() {
				this.children.masterView = new MasterView({
					collection: { thresholdConfigs: this.collection.thresholdConfigs }
				});
				this.debouncedRender();
			}).bind(this));
		},

		render: function() {
			if (this.children.masterView) {
				this.children.masterView.detach();
				this.children.masterView.render().appendTo(this.$el);
			}

			return this;
		}
	});
});

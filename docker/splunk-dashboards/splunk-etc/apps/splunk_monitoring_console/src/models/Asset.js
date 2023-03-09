define(
	[
		'underscore',
		'backbone',
		'@splunk/swc-mc'
	], 
	function(
		_,
		Backbone,
		SwcMC
	) {

		// Subclass SplunkDBaseModel's SplunkDWhiteListModel
		// Reason: specify attributes required because I'm not sure how to do it any other way
		// for conf files. via .conf.spec perhaps?
		var AssetWhiteListModel = SwcMC.SplunkDWhiteListModel.extend({
			initialize: function() {
				SwcMC.SplunkDWhiteListModel.prototype.initialize.apply(this, arguments);
			},
			concatOptionalRequired: function() {
				// Save previous state
				var previousOptional = (this.get('optional') || []).slice();

				// Inject optional fields
				this.set('optional', (this.get('optional') || []).concat([
					'configuredPeers',
					'host',
					'host_fqdn',
					'indexerClusters',
					'searchHeadClusters'
				]), { silent: true });

				var whiteListOptAndReq = 
					SwcMC.SplunkDWhiteListModel.prototype.concatOptionalRequired.apply(this, arguments);

				// Revert to previous state
				this.set('optional', previousOptional, { silent: true });

				return whiteListOptAndReq;
			}
		});


		var AssetModel = SwcMC.SplunkDBaseModel.extend(
			{
				url: 'configs/conf-splunk_monitoring_console_assets',

				initialize: function(attributes, options) {
					SwcMC.SplunkDBaseModel.prototype.initialize.call(
						this,
						attributes,
						_.defaults(options || {}, {
							splunkDWhiteList: new AssetWhiteListModel()
						})
					);
				},

				// Need to set the app/owner since this .conf only exists in splunk_monitoring_console
				save: function(attributes, options) {
					if (this.isNew()) {
						options = options || {};
						options.data = _.defaults(options.data || {}, {
							app: 'splunk_monitoring_console',
							owner: 'nobody',
							name: this.entry.get('name')
						});
					}

					return SwcMC.SplunkDBaseModel.prototype.save.call(this, attributes, options);
				}
			}
		);

		return AssetModel;
	}
);

/**
 * @author atruong
 * @date 6/23/15
 *
 * Grid component of listing page for DMC Alerts Setup; modeled off of Sourcetypes
 */

 define([
    'jquery',
 	'underscore',
 	'module',
 	'@splunk/swc-mc',
 	'splunk_monitoring_console/views/settings/dmc_alerts_setup/enterprise/GridRow',
 	'contrib/text!./Grid.html'
 ], function(
    $,
 	_,
 	module,
 	SwcMC,
 	GridRow,
 	template
 ){
 	return SwcMC.BaseView.extend({
 		moduleId: module.id,
 		template: template,

 		initialize: function(options) {
			SwcMC.BaseView.prototype.initialize.call(this, options);
 			this.children.columnSort = new SwcMC.ColumnSortView({
 				el: this.el,
 				model: this.collection.alerts.fetchData,
 				autoUpdate: true
 			});

 			this.children.flashMessages = new SwcMC.FlashMessagesView({
 				className: 'message-single',
 				collection: {
 					dmc_alerts: this.collection.alerts
 				},
 				helperOptions: {
 					removeServerPrefix: true
 				}
 			});

 			this.listenTo(this.collection.alerts, 'change reset', this.debouncedRender);
 		},

 		updateNoAlertsMessage: function() {
	        if (this.collection.alerts.length === 0) {
	            var errMessage = _('No preconfigured alerts found.').t();
	            this.children.flashMessages.flashMsgHelper.addGeneralMessage('no_alerts',
	                {
	                    type: SwcMC.SplunkdUtils.ERROR,
	                    html: errMessage
	                });
	        } else {
	            this.children.flashMessages.flashMsgHelper.removeGeneralMessage('no_alerts');
	        }
	    },

 		render: function() {
 			var rowIterator = new SwcMC.GridRowIteratorHelper();
 			var html = this.compiledTemplate({
 				sortCellClass: SwcMC.ColumnSortView.SORTABLE_ROW,
 				sortKeyAttribute: SwcMC.ColumnSortView.SORT_KEY_ATTR
 			});

 			var $html = $(html);

 			rowIterator.eachRow(this.collection.alerts, function(alertModel, alert, rowNumber, isExpanded) {
 				var alertConfig = this.collection.alertConfigs.find(function(model) { return model.entry.get('name') === alertModel.entry.get('name'); });
 				var gridRow = new GridRow({
 					model: {alert: alertModel, alertConfig: alertConfig, serverInfo: this.model.serverInfo}
  				});

 				var toShow = true;
 				if (this.model.serverInfo.isCloud() && alertConfig && !SwcMC.GeneralUtils.normalizeBoolean(alertConfig.entry.content.get('enabled_for_cloud')) ) {
					toShow = false;
				}

 				if (this.model.serverInfo.isLite() && alertConfig && !SwcMC.GeneralUtils.normalizeBoolean(alertConfig.entry.content.get('enabled_for_light')) ) {
					toShow = false;
				}

 				if (toShow) {
					$html.find('.grid-table-body').append(gridRow.render().el);
				}

 			}, this);

 			this.children.columnSort.update($html);
 			this.$el.html($html);
			this.children.flashMessages.render().appendTo(this.$el);
			this.updateNoAlertsMessage();

 			return this;
 		}

 	});
 });

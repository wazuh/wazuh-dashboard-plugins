/**
 * @author vroy
 * @date 10/25/15
 *
 * DMC alerts manager page
 */
 define([
 	'underscore',
 	'jquery',
 	'module',
 	'@splunk/swc-mc',
    'contrib/text!splunk_monitoring_console/views/settings/dmc_alerts_setup/lite/Master.html',
    'splunk_monitoring_console/views/settings/dmc_alerts_setup/lite/Grid'
 ], function(
 	_,
 	$,
 	module,
 	SwcMC,
 	template,
 	GridView
 ){
 	return SwcMC.BaseView.extend({
 		moduleId: module.id,
 		template: template,

 		initialize: function(options) {
			SwcMC.BaseView.prototype.initialize.call(this, options);

 			this.children.gridView = new GridView({
 				model: { 
 					serverInfo: this.model.serverInfo, 
 					application: this.model.application 
 				},
                collection: { 
                	savedSearches: this.collection.savedSearches, 
                	alertConfigs: this.collection.alertConfigs, 
                	alertActionUIs: this.collection.alertActionUIs,
                	alertActions: this.collection.alertActions 
                }
 			});
 		},

 		render: function() {
 			this.$el.html($(this.compiledTemplate()));

 			if (this.children.gridView) {
 				this.children.gridView.detach();
            }
 			this.children.gridView.render().appendTo(this.$('.grid-placeholder'));
            var numberOfAlertsText = (this.children.gridView.getValidAlertCount() == 1) ? _('Alert').t() : _('Alerts').t();
            this.$('.collection-count').html(_(this.children.gridView.getValidAlertCount().toString()).t() + ' ' + numberOfAlertsText);

 			return this;
 		}
 	});
 });
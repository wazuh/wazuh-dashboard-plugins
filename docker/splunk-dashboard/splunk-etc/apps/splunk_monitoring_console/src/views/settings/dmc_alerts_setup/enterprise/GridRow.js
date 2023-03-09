/**
 * @author atruong
 * @date 4/23/15
 *
 * Row in a table displaying information about and actions for a
 * preconfigured dmc alert.
 */

define([
	'jquery',
    'underscore',
    'backbone',
    'module',
    '@splunk/swc-mc',
    'contrib/text!./GridRow.html',
    'splunk_monitoring_console/views/settings/dmc_alerts_setup/shared/EnableAlertDialog',
    'splunk_monitoring_console/views/settings/dmc_alerts_setup/shared/DisableAlertDialog',
    'splunk_monitoring_console/views/settings/dmc_alerts_setup/shared/EditAlertDialog'
], function(
    $,
    _,
    Backbone,
    module,
    SwcMC,
    template,
    EnableAlertDialog,
    DisableAlertDialog,
    EditAlertDialog
) {
	return SwcMC.BaseView.extend({
		moduleId: module.id,
		tagName: 'tr',
		className: 'list-item',
		template: template,

		events: {
            'click .disable-action': function(e) {
				this.onDisableAlert();
                e.preventDefault();
			},

			'click .enable-action': function(e) {
				this.onEnableAlert();
				e.preventDefault();
			},

			'click .edit-action': function(e) {
                this.onEditAlert();
				e.preventDefault();
			},

			'click .alert-edit-link': function(e) {
                this.onEditAlert();
				e.preventDefault();
			}
		},

        onEnableAlert: function () {
            this.children.enableAlertDialog = new EnableAlertDialog({ 
                onHiddenRemove: true,
                model: { alert: this.model.alert, serverInfo: this.model.serverInfo }
            });
            this.children.enableAlertDialog.render().appendTo($('body'));
            this.children.enableAlertDialog.show();  
        },

        onDisableAlert: function () {
            this.children.disableAlertDialog = new DisableAlertDialog({
                onHiddenRemove: true,
                model: { alert: this.model.alert }
            });
            this.children.disableAlertDialog.render().appendTo($('body'));
            this.children.disableAlertDialog.show();  
        },

		onEditAlert: function () {
            this.children.editAlertDialog = new EditAlertDialog({
                onHiddenRemove: true,
                model: { alert: this.model.alert, alertConfig: this.model.alertConfig, serverInfo: this.model.serverInfo}
            });
            this.children.editAlertDialog.render().appendTo($('body'));
            this.children.editAlertDialog.show();
        },

        advancedEditUrlForAlert: function () {
            var root = (SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH.indexOf('/') === 0 ? SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH.substring(1) : SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH),
                name = this.model.alert.entry.get('name');
            return SwcMC.URIRoute.page(root, SwcMC.SplunkConfig.LOCALE, 'splunk_monitoring_console', 'alert', {'data': {'s': '/servicesNS/nobody/splunk_monitoring_console/saved/searches/' + encodeURI(name)}});
        },

        render: function () {
            var advancedEditUrl = this.advancedEditUrlForAlert(),
        	    status = this.model.alert.entry.content.get('disabled') ? _('Disabled').t() : _('Enabled').t(),
        	    canEdit = this.model.alertConfig && SwcMC.GeneralUtils.normalizeBoolean(this.model.alertConfig.entry.content.get('is_editable'));
                
        	var html = this.compiledTemplate({
        		model: this.model.alert,
                advancedEditUrl: advancedEditUrl,
        		canEdit: canEdit,
        		status: status,
        		description: this.model.alert.entry.content.get('description')
        	});

        	this.$el.html(html);

            return this;
        }

	});
}); 
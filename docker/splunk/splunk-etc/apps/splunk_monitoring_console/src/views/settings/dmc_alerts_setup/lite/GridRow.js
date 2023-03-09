/**
 * @author vroy
 * @date 10/25/15
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
    'splunk_monitoring_console/views/settings/dmc_alerts_setup/lite/EnableAlertDialog',
    'splunk_monitoring_console/views/settings/dmc_alerts_setup/lite/DisableAlertDialog',
    'splunk_monitoring_console/views/settings/dmc_alerts_setup/lite/EditAlertDialog'
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
			}
		},

        onEnableAlert: function () {
            this.children.enableAlertDialog = new EnableAlertDialog({ 
                onHiddenRemove: true,
                model: { alert: this.model.savedSearch, serverInfo: this.model.serverInfo }
            });
            this.children.enableAlertDialog.render().appendTo($('body'));
            this.children.enableAlertDialog.show();
        },

        onDisableAlert: function () {
            this.children.disableAlertDialog = new DisableAlertDialog({
                onHiddenRemove: true,
                model: { alert: this.model.savedSearch }
            });
            this.children.disableAlertDialog.render().appendTo($('body'));
            this.children.disableAlertDialog.show();  
        },

		onEditAlert: function () {
            this.alert = new SwcMC.AlertModel();
            this.alertModelDeferred = $.Deferred();
            this.alert.set('id', '/servicesNS/nobody/splunk_monitoring_console/saved/searches/' + this.model.savedSearch.entry.get('name'));

            this.alert.fetch({
                success: function(model, response) {
                    this.alertModelDeferred.resolve();
                }.bind(this),
                error: function(model, response) {
                    this.alertModelDeferred.resolve();
                }.bind(this)
            });

            this.alertModelDeferred.then(function() {
                this.children.editAlertDialog = new EditAlertDialog({
                    onHiddenRemove: true,
                    model: 
                    {
                        alertModel: this.alert,
                        alert: this.model.savedSearch,
                        alertConfig: this.model.alertConfig,
                        serverInfo: this.model.serverInfo,
                        application: this.model.application
                    },
                    collection:
                    {
                        savedSearches: this.collection.savedSearches,
                        alertActions: this.collection.alertActions,
                        alertActionUIs: this.collection.alertActionUIs
                    }
                });
                this.children.editAlertDialog.render().appendTo($('body'));
                this.children.editAlertDialog.show();
            }.bind(this));
        },

        render: function () {
        	var status = this.model.savedSearch.entry.content.get('disabled') ? _('Disabled').t() : _('Enabled').t();

        	var html = this.compiledTemplate({
        		model: this.model.savedSearch,
        		status: status,
        		description: this.model.savedSearch.entry.content.get('description') || ''
        	});

        	this.$el.html(html);

            return this;
        }

	});
}); 
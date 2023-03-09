define(
[
    'module',
    'splunk_monitoring_console/views/settings/dmc_alerts_setup/shared/DisableAlertDialog'
],
function(
    module,
    DisableAlertDialogShared
){
    return DisableAlertDialogShared.extend({
        moduleId: module.id,

        initialize: function () {
            DisableAlertDialogShared.prototype.initialize.apply(this, arguments);
            this.alertName = this.model.alert.entry.get('name');
        }
    });
});
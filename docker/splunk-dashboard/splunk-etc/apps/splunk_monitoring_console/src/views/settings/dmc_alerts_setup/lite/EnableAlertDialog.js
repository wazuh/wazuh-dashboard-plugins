define(
[
    'jquery',
    'module',
    'underscore',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/settings/dmc_alerts_setup/shared/EnableAlertDialog'
],
function(
    $,
    module,
    _,
    SwcMC,
    EnableAlertDialogShared
){

    var licenseUsageSearchStringForCloud = '| rest splunk_server=local services/licenser/usage/license_usage | \
        fields slaves_usage_bytes, quota | eval usedGB=round(slaves_usage_bytes/1024/1024/1024,3) | \
        eval totalGB=round(quota/1024/1024/1024,3) | eval percentage=round(usedGB / totalGB, 3)*100 | \
        fields percentage, usedGB, totalGB | where percentage > 90';

    return EnableAlertDialogShared.extend({
        moduleId: module.id,

        initialize: function () {
            EnableAlertDialogShared.prototype.initialize.apply(this, arguments);
            this.alertName = this.model.alert.entry.get('name');
        },

        events: $.extend({}, EnableAlertDialogShared.prototype.events, {
            'click .modal-btn-enable': function(e) {
                e.preventDefault();

                //if the underlying search contains a server group qualifier, make sure it is set to local
                var search = this.model.alert.entry.content.get('search');
                if (search) {
                    var placeholder = new RegExp('splunk_server_group=dmc_group_[^\\s\\n]*', 'g');
                    search = search.replace(placeholder, 'splunk_server=local');
                    this.model.alert.entry.content.set({'search': search});
                }

                // Cloud admins (sc_admin) don't have license_edit capabilities so they can't access normal licensing endpoints
                // The /services/licenser/usage endpoint is only available on splunk 6.3+, and so for backward compatibility, we only use this endpoint on the Cloud.
                if ((this.alertName === 'DMC Alert - Total License Usage Near Daily Quota') && (this.model.serverInfo.isCloud())) {
                    this.model.alert.entry.content.set({'search': licenseUsageSearchStringForCloud});
                }

                this.model.alert.entry.content.set({'disabled' : false});
                this.model.alert.save().done(_(function () {
                    this.updateSaveFailedMessage(false);
                    this.hide();
                }).bind(this)).fail(_(function () {
                    this.updateSaveFailedMessage(true);
                }).bind(this));
            }
        }),

        updateSaveFailedMessage: function(failed) {
            if (failed) {
                var errMessage = _('Failed to enable alert.').t();
                this.children.flashMessagesView.flashMsgHelper.addGeneralMessage('enable_failed',
                    {
                        type: SwcMC.SplunkdUtils.ERROR,
                        html: errMessage
                    });
            } else {
                this.children.flashMessagesView.flashMsgHelper.removeGeneralMessage('enable_failed');
            }
        }
    });
});

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
    var DMC_ALERT_PATTERN = /^DMC Alert/;
    var DMC_FORWARDER_PATTERN = /^DMC Forwarder/;
    var DMC_STANDALONE_PATTERN = /^DMC Asset - Build Standalone Asset Table$/;

    var CONFIRM_BUTTON = '<a class="btn btn-primary modal-btn-primary modal-btn-primary-confirm-reset">'+_('Reset').t()+'</a>';
    var REFRESH_BUTTON = '<a class="btn btn-primary modal-btn-primary modal-btn-primary-refresh-page" data-dismiss="modal">' + _('Refresh').t() + '</a>';

    var CONTINUE_BUTTON = '<a class="btn modal-btn-continue" data-dismiss="modal">' + _('Continue').t() + '</a>';

    return SwcMC.ModalView.extend({
        moduleId: module.id,
        initialize: function(options) {
            options || (options = {});
            // make sure the modal doesn't accidentally close, because we want to force user click the refresh button to
            // reload the whole page after reset process is done. SPL-102221
            _.extend(options, {
                keyboard: false,
                backdrop: 'static'
            });
            SwcMC.ModalView.prototype.initialize.call(this, options);
        },
        events: $.extend({}, SwcMC.ModalView.prototype.events, {
            'click .modal-btn-primary-confirm-reset': '_resetToFactoryMode',
            'click .modal-btn-primary-refresh-page': function() {
                location.reload();
            }
        }),
        _resetToFactoryMode: function(e) {
            e.preventDefault();

            this.$(SwcMC.ModalView.BODY_SELECTOR).html(this._progressBarTemplate);
            this.$(SwcMC.ModalView.FOOTER_SELECTOR).empty();
            this.$('button.close').remove();

            var dfds = [];

            // delete all dmc_* search groups (Note that the distsearches collection may contain non-dmc groups.)
            var _dmc_groups = this.collection.peers.distsearches.filter(function(model) {
                return model.isDmcGroup();
            });
            dfds.push.apply(dfds, _.invoke(_dmc_groups, 'destroy'));

            // delete assets.csv and dmc_forwarder_assets.csv
            dfds.push.apply(_.invoke(this.collection.lookups.toArray(), 'destroy'));

            // reset app.conf is_configured = false
            this.model.appLocal.entry.content.set('configured', false);
            dfds.push(this.model.appLocal.save());
            
            /* 
			 * SPL-177995:
			 * Adding Health Config model to control whether we need to turn on the distributed_health_reporter feature
			 * It should map to whether MC is on distributed mode: (distributed_health_reporter = On) or standalone mode:
			 * (distributed_health_reporter = Off)
			 */
            this.model.healthConfig.entry.content.set('disabled', true);
            dfds.push(this.model.healthConfig.save());

            // disable all dmc alerts and forwarder scheduled searches
            // enable [DMC Asset - Build Standalone Asset Table]
            dfds.push.apply(dfds, this.collection.savedSearches.each(function(savedSearch) {
                if (DMC_ALERT_PATTERN.test(savedSearch.entry.get('name')) || DMC_FORWARDER_PATTERN.test(savedSearch.entry.get('name'))) {
                    savedSearch.entry.content.set('disabled', true);
                }
                else if (DMC_STANDALONE_PATTERN.test(savedSearch.entry.get('name'))) {
                    savedSearch.entry.content.set('disabled', false);
                }
                return savedSearch.save();
            }));

            // delete splunk_monitoring_console_assets.conf
            var dmc_instances_with_overrides = this.collection.peers.assets.filter(function(model) {
                // since we cannot delete [settings] stanza in the conf file, we need to clear it.
                if (model.entry.get('name').toLowerCase() == 'settings') {
                    model.entry.content.set({
                        configuredPeers: '',
                        blackList: '',
                        disabled: true
                    });
                    dfds.push(model.save());
                    return false;
                }
                else {
                    return true;
                }
            });
            dfds.push(dfds, _.invoke(dmc_instances_with_overrides, 'destroy'));

            dfds.push(this.collection.thresholdConfigs.resetToDefault());

            // pretend no change was made, so that the "Apply Changes" button won't become green.
            _.defer(function() {
                this.model.state.set('changesMade', false);
            }.bind(this));

            Promise.all(dfds).then(function() {
                this.$(SwcMC.ModalView.BODY_SELECTOR).find('.progress-bar').removeClass('progress-striped active').text(_('done').t());
                this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(REFRESH_BUTTON);
            }.bind(this)).catch(function() {
                this.$(SwcMC.ModalView.BODY_SELECTOR).find('.progress-bar').removeClass('progress-striped active').text(_('error!').t());
                this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(CONTINUE_BUTTON);
            }.bind(this));
        },
        render: function() {
            this.$el.html(SwcMC.ModalView.TEMPLATE);
            this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(_('Reset to Default Settings').t());
            this.$(SwcMC.ModalView.BODY_SELECTOR).html(this._explanationDocTemplate);
            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(CONFIRM_BUTTON);
            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_CANCEL);

            return this;
        },
        _explanationDocTemplate: '<div class="alert alert-warning modal-txt-reset-warning-message"><i class="icon-alert"></i>' + _('Warning: This operation deletes and resets data and cannot be undone.').t() + '</div>' +
            '<div><p>' + _('This operation will do the following:').t() + '</p>' +
            '<ul>' +
                '<li>' + _('Delete all distributed groups created by Monitoring Console.').t() + '</li>' +
                '<li>' + _('Delete all lookup files created by Monitoring Console.').t() + '</li>' +
                '<li>' + _('Reset Monitoring Console to standalone mode.').t() + '</li>' +
                '<li>' + _('Disable all alerts in Monitoring Console.').t() + '</li>' +
                '<li>' + _('Disable forwarder monitoring.').t() + '</li>' +
                '<li>' + _('Reset all instances monitored by Monitoring Console to unconfigured state.').t() +
                '<li>' + _('Reset all thresholds to their default configuration.').t() +
            '</ul></div>' +
        '<div><p>' + _('Are you sure you want to reset to default settings?').t() + '</p>',
        _progressBarTemplate: '<div class="progress"><div class="progress-bar progress-striped active" style="width: 100%">' + _('resetting to default settings').t() + '</div></div>'
    });
});

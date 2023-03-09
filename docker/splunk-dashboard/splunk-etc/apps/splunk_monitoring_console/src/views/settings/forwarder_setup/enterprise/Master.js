/**
 * Created by ykou on 2/17/15.
 */
define([
    'underscore',
    'backbone',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/settings/forwarder_setup/enterprise/BuildAssetsNowDialog',
    'splunk_monitoring_console/views/settings/forwarder_setup/enterprise/RebuildAssetsDialog',
    'contrib/text!splunk_monitoring_console/views/settings/forwarder_setup/enterprise/Master.html',
    '../Master.pcss',
], function (_, Backbone, module, SwcMC, BuildAssetsNowDialog, RebuildAssetsDialog, Template, css) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,
        initialize: function () {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this._saveButtonClicked = false; // need this to decide whether to show the buildNow dialog

            // TODO: handle fetch and save in progress and done.
            this.listenTo(this.model.savedSearch, 'sync', function () {
                this.render();
                if (!this.model.savedSearch.entry.content.get('disabled') && this._saveButtonClicked) {
                    // show the dialog only when the saved search is enabled.
                    this.children.buildAssetsNowDialog.show();
                    this._saveButtonClicked = false;
                }
            });

            this.listenTo(this.model.savedSearch.entry.content, 'change:disabled', this._updateFormStyle);
            this.listenTo(this.model.savedSearch.entry.content, 'change', this._updateSaveButtonStyle);
        },
        events: {
            'click .btn-rebuild-dmc-forwarder-assets:not(.disabled)': '_rebuildForwarderAsset',
            'click .btn-save-forwarder-setup:not(.disabled)': '_saveForwarderSetup',
            'click .btn-restore-forwarder-setup:not(.disabled)': '_restoreForwarderSetup',
        },
        _rebuildForwarderAsset: function () {
            this.children.rebuildAssetsDialog.show();
        },
        _saveForwarderSetup: function () {
            this._saveButtonClicked = true;
            this.model.savedSearch.save();
        },
        _restoreForwarderSetup: function () {
            this.model.savedSearch.fetch(); // it's a bit weird to call fetch here, but I'm not sure if we have better way to restore data.
        },
        _updateSaveButtonStyle: function () {
            if (this.model.savedSearch.entry.content.hasChanged()) {
                this.$('.btn-restore-forwarder-setup').removeClass('disabled');
                this.$('.btn-save-forwarder-setup').removeClass('disabled');
            }
        },
        _updateFormStyle: function () {
            if (!this.model.savedSearch.entry.content.get('disabled')) {
                this.$('.btn-rebuild-dmc-forwarder-assets').removeClass('disabled');
                this.children.dataCollectionInterval.enable();
            } else {
                this.$('.btn-rebuild-dmc-forwarder-assets').addClass('disabled');
                this.children.dataCollectionInterval.disable();
            }
        },
        render: function () {
            this.$el.html(
                this.compiledTemplate({
                    savedSearchLink: SwcMC.URIRoute.manager(
                        this.model.application.get('root'),
                        this.model.application.get('locale'),
                        this.model.application.get('app'),
                        ['saved', 'searches', 'DMC Forwarder - Build Asset Table'],
                        {
                            data: {
                                uri:
                                    '/servicesNS/nobody/splunk_monitoring_console/saved/searches/DMC%20Forwarder%20-%20Build%20Asset%20Table',
                                ns: 'splunk_monitoring_console',
                                action: 'edit',
                            },
                        }
                    ),
                    learnMoreLink: SwcMC.URIRoute.docHelp(
                        this.model.application.get('root'),
                        this.model.application.get('locale'),
                        'dmc_forwarder_monitoring_setup'
                    ),
                })
            );

            this.children.toggleSavedSearch = new SwcMC.ControlGroupView({
                label: _('Forwarder Monitoring').t(),
                controlType: 'SyntheticRadio',
                controlOptions: {
                    model: this.model.savedSearch.entry.content,
                    modelAttribute: 'disabled',
                    items: [
                        { label: _('Disable').t(), value: true },
                        { label: _('Enable').t(), value: false },
                    ],
                },
            });
            this.children.dataCollectionInterval = new SwcMC.ControlGroupView({
                label: _('Data Collection Interval').t(),
                controlType: 'SyntheticSelect',
                controlOptions: {
                    model: this.model.savedSearch.entry.content,
                    modelAttribute: 'cron_schedule',
                    items: [
                        { label: _('15 minutes').t(), value: '3,18,33,48 * * * *' },
                        { label: _('30 minutes').t(), value: '18,48 * * * *' },
                        { label: _('1 hour').t(), value: '18 * * * *' },
                        { label: _('2 hours').t(), value: '18 */2 * * *' },
                        { label: _('4 hours').t(), value: '18 */4 * * *' },
                        { label: _('8 hours').t(), value: '18 */8 * * *' },
                        { label: _('12 hours').t(), value: '18 */12 * * *' },
                        { label: _('24 hours').t(), value: '18 5 * * *' },
                    ],
                    menuWidth: 'narrow',
                    toggleClassName: 'btn',
                },
            });

            this.children.rebuildAssetsDialog = new RebuildAssetsDialog();
            this.children.buildAssetsNowDialog = new BuildAssetsNowDialog();

            this.$('.forwarder-monitoring-settings').append(this.children.toggleSavedSearch.render().$el);
            this.$('.forwarder-monitoring-settings').append(this.children.dataCollectionInterval.render().$el);
            this.$el.append(this.children.rebuildAssetsDialog.render().$el);
            this.$el.append(this.children.buildAssetsNowDialog.render().$el);

            this._updateFormStyle();

            return this;
        },
    });
});

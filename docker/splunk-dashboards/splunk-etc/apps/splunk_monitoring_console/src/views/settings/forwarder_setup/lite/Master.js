/**
 * Created by ykou on 2/17/15.
 */
define([
    'underscore',
    'backbone',
    'module',
    '@splunk/swc-mc',
    'contrib/text!splunk_monitoring_console/views/settings/forwarder_setup/lite/Master.html',
    '../Master.pcss',
], function (_, Backbone, module, SwcMC, Template, css) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        template: Template,
        initialize: function () {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model.savedSearch.entry.content, 'change:disabled', this._enableOrDisableMonitoring);
        },
        events: {
            'click .checkbox-enable-or-disable-forwarder-monitoring': '_enableOrDisableMonitoring',
            'click .btn-start-forwarder-monitoring:not(.disabled)': '_startMonitoring',
        },
        _rebuildForwarderAssets: function () {
            if (!this._rebuildForwarderAssetsSearch) {
                this._rebuildForwarderAssetsSearch = new SwcMC.SearchManager({
                    earliest_time: '-15m@m',
                    latest_time: 'now',
                    search: '`dmc_re_build_forwarder_assets_light(1m)`',
                });
                this._rebuildForwarderAssetsSearch.on(
                    {
                        'search:cancelled': function () {
                            this.$('.btn-start-forwarder-monitoring').removeClass('disabled');
                        },
                        'search:done': function () {
                            document.location.href = SwcMC.URIRoute.page(
                                this.model.application.get('root'),
                                this.model.application.get('locale'),
                                this.model.application.get('app'),
                                'forwarder_overview'
                            );
                        },
                        'search:error': function () {
                            this.$('.btn-start-forwarder-monitoring').removeClass('disabled');
                        },
                        'search:failed': function () {
                            this.$('.btn-start-forwarder-monitoring').removeClass('disabled');
                        },
                        'search:progress': function () {
                            this.$('.btn-start-forwarder-monitoring').addClass('disabled');
                        },
                        'search:start': function () {
                            this.$('.btn-start-forwarder-monitoring').addClass('disabled');
                        },
                    },
                    this
                );
            } else {
                this._rebuildForwarderAssetsSearch.startSearch();
            }
        },
        _enableOrDisableMonitoring: function () {
            if (this.children.enableForwarderMonitoringCheckbox.getValue() == 0) {
                this.$('.btn-start-forwarder-monitoring').addClass('disabled');
                this.$('.data-collection-interval').removeClass('disabled');
                this.$('.dropdown-toggle').addClass('disabled');
            } else {
                this.$('.btn-start-forwarder-monitoring').removeClass('disabled');
                this.children.dataCollectionInterval.enable();
            }
        },
        _startMonitoring: function () {
            this.model.savedSearch.entry.content.set('disabled', 0);
            this.model.savedSearch.save(
                {},
                {
                    success: function () {
                        this._buildAssets();
                    }.bind(this),

                    fail: function () {
                        document.location.href = SwcMC.URIRoute.page(
                            this.model.application.get('root'),
                            this.model.application.get('locale'),
                            this.model.application.get('app'),
                            'forwarder_overview'
                        );
                    },
                }
            );
        },
        _buildAssets: function () {
            this.$('.btn-start-forwarder-monitoring').addClass('disabled');

            if (this.savedSearchManager) {
                this.savedSearchManager.startSearch();
                this.$('.btn-start-forwarder-monitoring').removeClass('disabled');
                return;
            }

            this.savedSearchManager = new SwcMC.SavedSearchManager({
                searchname: 'DMC Forwarder - Build Asset Table',
            });
            this.savedSearchManager.on(
                {
                    'search:cancelled': function () {
                        this.$('.btn-start-forwarder-monitoring').removeClass('disabled');
                    },
                    'search:done': function () {
                        this._rebuildForwarderAssets();
                    },
                    'search:error': function () {
                        this.$('.btn-start-forwarder-monitoring').removeClass('disabled');
                    },
                    'search:failed': function () {
                        this.$('.btn-start-forwarder-monitoring').removeClass('disabled');
                    },
                },
                this
            );

            this.$('.btn-start-forwarder-monitoring').removeClass('disabled');
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
                    isModal: false,
                })
            );

            this.children.enableForwarderMonitoringCheckbox = new SwcMC.SyntheticCheckboxControlView({
                label: _('Enable Forwarder Monitoring').t(),
                defaultValue: !this.model.savedSearch.entry.content.get('disabled') ? true : false,
            });

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
                label: _('Fetch data every').t(),
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

            this.$('.section-description').prepend(this.children.enableForwarderMonitoringCheckbox.render().$el);
            this.children.enableForwarderMonitoringCheckbox.$el.addClass(
                'checkbox-enable-or-disable-forwarder-monitoring'
            );
            this.$('.forwarder-monitoring-settings').append(this.children.dataCollectionInterval.render().$el);
            this.children.dataCollectionInterval.$el.addClass('data-collection-interval');

            this._enableOrDisableMonitoring();

            return this;
        },
    });
});

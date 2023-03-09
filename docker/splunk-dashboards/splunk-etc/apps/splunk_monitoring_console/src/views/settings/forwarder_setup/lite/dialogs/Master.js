/**
 * Created by vroy on 8/20/15.
 */
define([
    'underscore',
    'backbone',
    'module',
    '@splunk/swc-mc',
    'contrib/text!splunk_monitoring_console/views/settings/forwarder_setup/lite/Master.html'
], function(
    _,
    Backbone,
    module,
    SwcMC,
    Template
) {
    return SwcMC.ModalView.extend({
        moduleId: module.id,
        template: Template,
        initialize: function() {
            SwcMC.ModalView.prototype.initialize.apply(this, arguments);
        },
        events: $.extend({}, SwcMC.ModalView.prototype.events,
        {
            'click .btn-apply-setup': '_applySetup',
            'click .checkbox-enable-or-disable-forwarder-monitoring': '_enableOrDisableMonitoring'
        }),
        _enableOrDisableMonitoring: function() {
            if (this.children.enableForwarderMonitoringCheckbox.getValue() == 0) {
                this.$('.data-collection-interval').removeClass('disabled');
                this.$('.dropdown-toggle').addClass('disabled');
            }
            else {
                this.children.dataCollectionInterval.enable();
            }
        },
        _updateFormStyle: function() {
            this.model.savedSearch.fetch({
                success: function() {
                    if (!this.model.savedSearch.entry.content.get('disabled')) {
                        this.children.enableForwarderMonitoringCheckbox.setValue(1);
                        this.children.dataCollectionInterval.enable();
                    }
                    else {
                        this.children.enableForwarderMonitoringCheckbox.setValue(0);
                        this.children.dataCollectionInterval.disable();
                    }
                }.bind(this),
                error: function() {

                }.bind(this)
            });
        },
        _applySetup: function() {
            if (this.children.enableForwarderMonitoringCheckbox.getValue() == 0) {
                this.model.savedSearch.entry.content.set('disabled', 1);
                this.model.savedSearch.save({}, {
                    success: function() {
                        document.location.href = SwcMC.URIRoute.page(
                            this.model.application.get('root'),
                            this.model.application.get('locale'),
                            this.model.application.get('app'),
                            'monitoringconsole_forwarder_setup');
                    }.bind(this)});
            }
            else {
                this.model.savedSearch.entry.content.set('disabled', 0);
                this.model.savedSearch.save({}, {
                    success: function() {

                        this.searchManager = new SwcMC.SavedSearchManager({
                            searchname: 'DMC Forwarder - Build Asset Table'
                        });
                        this.searchManager.on({
                            'search:cancelled': function() {
                                //?
                            },
                            'search:done': function() {
                                document.location.href = SwcMC.URIRoute.page(
                                    this.model.application.get('root'),
                                    this.model.application.get('locale'),
                                    this.model.application.get('app'),
                                    'forwarder_overview');
                            },
                            'search:error': function() {
                                //?
                            },
                            'search:failed': function() {
                                //?
                            }
                        }, this);
                    }.bind(this)});
            }
        },
        render: function() {
            this.$el.html(SwcMC.ModalView.TEMPLATE);
            this.$(SwcMC.ModalView.BODY_SELECTOR).html(this.compiledTemplate({
                serverInfo: this.model.serverInfo,
                isModal: true
            }));

            this.children.enableForwarderMonitoringCheckbox = new SwcMC.SyntheticCheckboxControlView(
            {
                label:_("Enable Forwarder Monitoring").t(),
                defaultValue: !this.model.savedSearch.entry.content.get('disabled') ? true : false
            });

            this.children.toggleSavedSearch = new SwcMC.ControlGroupView({
                label: _('Forwarder Monitoring').t(),
                controlType: 'SyntheticRadio',
                controlOptions: {
                    model: this.model.savedSearch.entry.content,
                    modelAttribute: 'disabled',
                    items: [
                        {label: _('Disable').t(), value: true},
                        {label: _('Enable').t(), value: false}
                    ]
                }
            });
            this.children.dataCollectionInterval = new SwcMC.ControlGroupView({
                label: _('Fetch data every').t(),
                controlType: 'SyntheticSelect',
                controlOptions: {
                    model: this.model.savedSearch.entry.content,
                    modelAttribute: 'cron_schedule',
                    items: [
                        {label: _('15 minutes').t(), value: '3,18,33,48 * * * *'},
                        {label: _('30 minutes').t(), value: '18,48 * * * *'},
                        {label: _('1 hour').t(), value: '18 * * * *'},
                        {label: _('2 hours').t(), value: '18 */2 * * *'},
                        {label: _('4 hours').t(), value: '18 */4 * * *'},
                        {label: _('8 hours').t(), value: '18 */8 * * *'},
                        {label: _('12 hours').t(), value: '18 */12 * * *'},
                        {label: _('24 hours').t(), value: '18 5 * * *'}
                    ],
                    menuWidth: 'narrow',
                    toggleClassName: 'btn'
                }
            });

            this.$(SwcMC.ModalView.BODY_SELECTOR).find('.section-description').prepend(this.children.enableForwarderMonitoringCheckbox.render().$el);
            this.children.enableForwarderMonitoringCheckbox.$el.addClass('checkbox-enable-or-disable-forwarder-monitoring');
            this.children.dataCollectionInterval.$el.addClass('data-collection-interval');
            this.$(SwcMC.ModalView.BODY_SELECTOR).find('.forwarder-monitoring-settings').append(this.children.dataCollectionInterval.render().$el);

            this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(_("Forwarder Monitoring Setup").t());
            this.$(SwcMC.ModalView.FOOTER_SELECTOR).html('<a href="#" class="btn btn-primary modal-btn-primary btn-apply-setup pull-right">' + _('Apply').t() + '</a>');
            this.$(SwcMC.ModalView.FOOTER_SELECTOR).prepend(SwcMC.ModalView.BUTTON_CANCEL);
            this.$(SwcMC.ModalView.BUTTON_CLOSE_SELECTOR).remove();
            this.$(SwcMC.ModalView.BODY_SELECTOR).removeClass(); //avoid double padding and overflow-y

            this._updateFormStyle();

            return this;
        }
    });
});

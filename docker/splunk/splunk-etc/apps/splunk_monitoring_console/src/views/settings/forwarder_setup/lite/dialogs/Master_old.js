/**
 * TODO: This file is copied for short term because we couldn’t use it together
 * with dashboards due to swc-mc bringing in duplicate dependencies which
 * caused errors. Need to rmeove this after the issue is resolved.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'module',
    'views/shared/Modal',
    'views/shared/controls/ControlGroup',
    'views/shared/controls/SyntheticCheckboxControl',
    'splunkjs/mvc/savedsearchmanager',
    'uri/route',
    'contrib/text!splunk_monitoring_console/views/settings/forwarder_setup/lite/Master.html'
], function(
    $,
    _,
    Backbone,
    module,
    Modal,
    ControlGroup,
    SyntheticCheckboxControl,
    SavedSearchManager,
    route,
    Template
) {
    return Modal.extend({
        moduleId: module.id,
        template: Template,
        initialize: function() {
            Modal.prototype.initialize.apply(this, arguments);
        },
        events: $.extend({}, Modal.prototype.events,
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
                        document.location.href = route.page(
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

                        this.searchManager = new SavedSearchManager({
                            searchname: 'DMC Forwarder - Build Asset Table'
                        });
                        this.searchManager.on({
                            'search:cancelled': function() {
                                //?
                            },
                            'search:done': function() {
                                document.location.href = route.page(
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
            this.$el.html(Modal.TEMPLATE);
            this.$(Modal.BODY_SELECTOR).html(this.compiledTemplate({
                serverInfo: this.model.serverInfo,
                isModal: true
            }));

            this.children.enableForwarderMonitoringCheckbox = new SyntheticCheckboxControl(
            {
                label:_("Enable Forwarder Monitoring").t(),
                defaultValue: !this.model.savedSearch.entry.content.get('disabled') ? true : false
            });

            this.children.toggleSavedSearch = new ControlGroup({
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
            this.children.dataCollectionInterval = new ControlGroup({
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

            this.$(Modal.BODY_SELECTOR).find('.section-description').prepend(this.children.enableForwarderMonitoringCheckbox.render().$el);
            this.children.enableForwarderMonitoringCheckbox.$el.addClass('checkbox-enable-or-disable-forwarder-monitoring');
            this.children.dataCollectionInterval.$el.addClass('data-collection-interval');
            this.$(Modal.BODY_SELECTOR).find('.forwarder-monitoring-settings').append(this.children.dataCollectionInterval.render().$el);

            this.$(Modal.HEADER_TITLE_SELECTOR).html(_("Forwarder Monitoring Setup").t());
            this.$(Modal.FOOTER_SELECTOR).html('<a href="#" class="btn btn-primary modal-btn-primary btn-apply-setup pull-right">' + _('Apply').t() + '</a>');
            this.$(Modal.FOOTER_SELECTOR).prepend(Modal.BUTTON_CANCEL);
            this.$(Modal.BUTTON_CLOSE_SELECTOR).remove();
            this.$(Modal.BODY_SELECTOR).removeClass(); //avoid double padding and overflow-y

            this._updateFormStyle();

            return this;
        }
    });
});

define(
[
    'jquery',
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/settings/dmc_alerts_setup/shared/EditAlertDialog',
    './EditAlertDialog.pcss'
],
function(
    $,
    _,
    module,
    SwcMC,
    EditAlertDialogShared,
    css
){

    var licenseUsageSearchStringForCloud = '| rest splunk_server=local services/licenser/usage/license_usage | \
        fields slaves_usage_bytes, quota | eval usedGB=round(slaves_usage_bytes/1024/1024/1024,3) | \
        eval totalGB=round(quota/1024/1024/1024,3) | eval percentage=round(usedGB / totalGB, 3)*100 | \
        fields percentage, usedGB, totalGB | where percentage > 90';

    var defaultActions = ['list', 'email', 'script', 'logevent'];

    return EditAlertDialogShared.extend({
        moduleId: module.id,
        initialize: function () {
            EditAlertDialogShared.prototype.initialize.apply(this, arguments);
            this.alertModel = this.model.alertModel;
            this.populateAlertActionCollections();

            this.children.addAction = new SwcMC.AddActionDropDownView({
                model: {
                    application: this.model.application
                },
                collection: {
                    unSelectedAlertActions: this.collection.unSelectedAlertActions
                },
                canViewAlertActionsManager: this.options.canViewAlertActionsManager,
                ignoreToggleMouseDown: true
            });

            this.children.triggerActions = new SwcMC.TriggerActionsTableMasterView({
                documentType: 'alert',
                pdfAvailable: this.options.pdfAvailable,
                model: {
                    document: this.alertModel,
                    application: this.model.application
                },
                collection: {
                    selectedAlertActions: this.collection.selectedAlertActions,
                    unSelectedAlertActions: this.collection.unSelectedAlertActions,
                    alertActionUIs: this.collection.alertActionUIs
                }
            });

            this.listenTo(this.children.addAction, 'itemClicked', this.handleAddAction);
            this.listenTo(this.collection.alertActions, 'add remove reset', _.debounce(this.populateAlertActionCollections));
            this.listenTo(this.collection.selectedAlertActions, 'remove reset', _.debounce(this.toggleTable));
            this.listenTo(this.collection.selectedAlertActions, 'add', _.debounce(
                function(addedAlertAction) {
                    this.toggleTable();
                    this.children.triggerActions.trigger('addrow', addedAlertAction);
                }
            ));
            this.listenTo(this.collection.unSelectedAlertActions, 'add remove reset', _.debounce(this.toggleAddAction));
        },

        events: $.extend({}, SwcMC.ModalView.prototype.events, {
            'click .modal-btn-save': function (e) {
                e.preventDefault();
                if (this._allInputsValid) {
                    if (this.alertName != 'DMC Alert - Missing forwarders') {
                        var dscrptnToSrchFactors = this.model.alertConfig.entry.content.get('param_to_search_conversion') || [];
                        if (dscrptnToSrchFactors.length > 0) {
                            dscrptnToSrchFactors = dscrptnToSrchFactors.split(',');
                        }
                        var description = this.model.alertConfig.entry.content.get('description_template'),
                            search = this.model.alertConfig.entry.content.get('search_template');

                        for (var i = 0; i < dscrptnToSrchFactors.length; i++) {
                            var val = parseFloat(this.$('#input-' + i).val()),
                                searchVal = this._applySearchConversion(val, dscrptnToSrchFactors[i]),
                                placeholder = new RegExp('\\{' + i + '\\}', 'g');

                            description = description.replace(placeholder, val);
                            search = search.replace(placeholder, searchVal);
                        }

                        //if the underlying search contains a server group qualifier, make sure it is set to local
                        placeholder = new RegExp('splunk_server_group=dmc_group_[^\\s\\n]*', 'g');
                        search = search.replace(placeholder, 'splunk_server=local');


                        // Cloud admins (sc_admin) don't have license_edit capabilities so they can't access normal licensing endpoints
                        // The /services/licenser/usage endpoint is only available on splunk 6.3+, and so for backward compatibility, we only use this endpoint on the Cloud.
                        if ((this.alertName === 'DMC Alert - Total License Usage Near Daily Quota') && (this.model.serverInfo.isCloud())) {
                            search = licenseUsageSearchStringForCloud.replace('90', searchVal.toString());
                        }

                        this.alertModel.entry.content.set({'search': search, 'description': description});
                    }

                    if (this.alertModel.isValid(true)) {
                        this.alertDeferred = this.alertModel.save({}, { validate: false });
                    }
                    else {
                        var anyActionsEnabled = this.collection.alertActions.find(function(model) {
                                var alertActionName = model.entry.get('name');
                                if (_.contains(defaultActions, alertActionName)) {
                                    var attribute;

                                    if (alertActionName === 'list') {
                                        attribute = 'alert.track';
                                    } else {
                                        attribute = 'action.' + alertActionName;
                                    }

                                    if (SwcMC.GeneralUtils.normalizeBoolean(this.alertModel.entry.content.get(attribute))) {
                                        return true;
                                    }
                                }
                            }, this);

                        if (anyActionsEnabled) {
                            this.updateSaveFailedMessage(true);
                        }
                        else {
                            this.updateSaveFailedMessage(true, _('Enable at least one action.').t());
                        }
                        return;
                    }

                    this.savedSearchesDeferred = this.alertDeferred.then(_(function() {
                        return this.collection.savedSearches.fetch({reset: true});
                    }).bind(this));

                    this.savedSearchesDeferred.done(_(function() {
                        this.updateSaveFailedMessage(false);
                        this.hide();
                    }).bind(this));

                    this.savedSearchesDeferred.fail(_(function() {
                        this.updateSaveFailedMessage(true);
                    }).bind(this));
                }
            },

            'click .add-action-btn > a.dropdown-toggle': function(e) {
                e.preventDefault();

                var $target = $(e.currentTarget);
                if (this.children.addAction && this.children.addAction.shown) {
                    this.children.addAction.hide();
                    return;
                }
                if (!this.children.addAction.$el.html()) {
                    this.children.addAction.render().hide();
                }
                if (!this.children.addAction.isAddedToDocument()) {
                    this.children.addAction.appendTo($('.modal:visible'));
                }

                this.children.addAction.show($target);
            }
        }),

        populateAlertActionCollections: function() {
            //alerts/alert_actions
            this.collection.selectedAlertActions = new SwcMC.ModAlertActionsCollection();
            this.collection.unSelectedAlertActions = new SwcMC.ModAlertActionsCollection();
            this.collection.unSelectedAlertActions.comparator = function(unSelectedAlertAction) {
                return unSelectedAlertAction.entry.content.get('label');
            };

            var selected = [],
                unselected = [];

            var isActionEnabled = function(name) {
                var attribute;
                if (name === 'list') {
                    attribute = 'alert.track';
                } else {
                    attribute = 'action.' + name;
                }

                if (SwcMC.GeneralUtils.normalizeBoolean(this.model.alert.entry.content.get(attribute))) {
                    return true;
                }
                else {
                    return false;
                }
            };

            this.collection.alertActions.each(function(model) {
                var alertActionName = model.entry.get('name');
                if (_.contains(defaultActions, alertActionName)) {
                    if (isActionEnabled.call(this, alertActionName)) {
                        selected.push(model);
                    }
                    else {
                        unselected.push(model);
                    }
                }
            }, this);
            this.collection.selectedAlertActions.reset(selected);
            this.collection.unSelectedAlertActions.reset(unselected);
        },

        handleAddAction: function(alertActionModel) {
            var alertActionName = alertActionModel.entry.get('name');
            if (alertActionName === 'list') {
                this.alertModel.entry.content.set('alert.track', true);
            } else {
                this.alertModel.entry.content.set('action.' + alertActionName, true);
            }
            this.collection.selectedAlertActions.add(alertActionModel);
        },

        toggleAddAction: function() {
            if (this.$addActionActivator) {
                if (this.collection.unSelectedAlertActions.length) {
                    this.$addActionActivator.show();
                    this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).find('.trigger-actions-control-heading').show();
                } else {
                    this.$addActionActivator.hide();
                    this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).find('.trigger-actions-control-heading').hide();
                }
            }
        },

        toggleTable: function() {
            if (this.collection.selectedAlertActions.length) {
                this.children.triggerActions.$el.show();
            } else {
                this.children.triggerActions.$el.hide();
            }
        },

        render: function () {
            var BUTTON_SAVE = '<a href="#" id="save-edit-btn" class="btn btn-primary modal-btn-save modal-btn-primary">' + _('Save').t() + '</a>';

            this.$el.html(SwcMC.ModalView.TEMPLATE);
            this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html( _('Edit Alert: ').t() + this.alertName);
            this.$(SwcMC.ModalView.BODY_SELECTOR).show();
            this.$(SwcMC.ModalView.BODY_SELECTOR).append(SwcMC.ModalView.FORM_HORIZONTAL);

            if (this.alertName != 'DMC Alert - Missing forwarders') {
                this._renderContent();
            }
            else {
                this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).html(_(this.dialogFormBodyTemplate).template({
                    name: this.alertName,
                    parameterLabels: [],
                    parameterVals: [],
                    parameterRanges: []
                }));
                this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).find('.header-text').remove();
            }
            this.children.flashMessagesView.render().appendTo(this.$('.flash-messages-view-placeholder'));

            //add trigger actions button and table
            this.$addActionActivator = $('<div class="controls trigger-actions-controls add-action-btn"><a class="dropdown-toggle btn" href="#">' + _('+ Add New Action').t() + '<span class="caret"></span></a></div>');
            this.$actionsDropdown = this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).find('.alert-edit-trigger-actions-dropdown');
            this.$addActionActivator.appendTo(this.$actionsDropdown);
            if (this.collection.unSelectedAlertActions.length == 0) {
                this.$addActionActivator.hide();
            }

            this.$actionsTable = this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).find('.trigger-actions');
            this.children.triggerActions.render().appendTo(this.$actionsTable);

            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(BUTTON_SAVE);
            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_CANCEL);

            return this;
        },

        dialogFormBodyTemplate: '\
        <div class="alert-edit form-complex">\
            <div class="flash-messages-view-placeholder"></div>\
            <div class="header-text"><%- _("Trigger condition").t() %></div>\
            <div class="params-container">\
                <% for (var i = 0; i < parameterLabels.length; i++) { %>\
                    <label class = "label-block"><%= parameterLabels[i] %></label>\
                    <span class="value-block input"><input id="input-<%= i %>" type="text" value="<%= parameterVals[i] %>" />\
                    <div class="help-text-block" id="help-<%= i %>"><%= parameterRanges[i].helpText %></div></span>\
                <% } %>\
            </div>\
            <div class="trigger-actions">\
                <p class="trigger-actions-control-heading control-heading"><%- _("Trigger actions").t() %></p>\
                <div class="alert-edit-trigger-actions-dropdown"></div>\
            </div>\
        </div>\
        '
    });
});

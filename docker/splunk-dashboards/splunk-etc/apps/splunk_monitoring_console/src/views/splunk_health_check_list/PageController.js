define([
    'underscore',
    'module',
    'backbone',
    'splunk_monitoring_console/collections/splunk_health_check/CheckLists',
    'splunk_monitoring_console/controllers/BaseManagerPageController',
    'splunk_monitoring_console/models/splunk_health_check/CheckList',
    'splunk_monitoring_console/views/splunk_health_check_list/ActionCell',
    'splunk_monitoring_console/views/splunk_health_check_list/GridRow',
    'splunk_monitoring_console/views/splunk_health_check_list/AddEditDialog',
    'splunk_monitoring_console/views/splunk_health_check_list/NewButtons',
    'splunk_monitoring_console/views/splunk_health_check_list/PageController.pcss'
], function(
    _,
    module,
    Backbone,
    CheckListsCollection,
    BaseController,
    CheckListModel,
    ActionCell,
    GridRow,
    AddEditDialog,
    NewButtons,
    css
) {
    return BaseController.extend({
        moduleId: module.id,

        initialize: function(options) {
            options.entitiesPlural = _('Health Check Items').t();
            options.entitySingular = _('Health Check Item').t();
            // TODO: fill in page description and learnMore link
            options.header = {
                pageDesc: '',
                learnMoreLink: ''
            };
            options.entitiesCollectionClass = CheckListsCollection;
            options.entityModelClass = CheckListModel;
            options.grid = {
                showAllApps: true,
                showOwnerFilter: false,
                showSharingColumn: false,
                showStatusColumn: false
            };
            options.customViews = options.customViews || {};
            options.customViews.ActionCell = ActionCell;
            options.customViews.GridRow = GridRow;
            options.customViews.AddEditDialog = AddEditDialog;
            options.customViews.NewButtons = NewButtons;

            BaseController.prototype.initialize.call(this, options);
        }
    });
});

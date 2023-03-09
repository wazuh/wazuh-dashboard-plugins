/**
 * @author lbudchenko
 * @date 5/12/2015
 * Page controller for base manager page.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'module',
    '@splunk/swc-mc'
],
    function(
        $,
        _,
        Backbone,
        module,
        SwcMC
        ) {
        return SwcMC.BaseController.extend({
            moduleId: module.id,
            /**
             * Initializes the manager page:
             *  - initializes models, collections
             *  - sets up event listeners
             *  - renders Master page when all deferreds resolved
             * @param options
             *  - entitySingular (string|optional) Name of entity in singular (default: Entities)
             *  - entitiesPlural (string|optional) Name of entities in plural (default: Entity)
             *  - header.pageTitle (string|optional) Title on the Header of the page (default: Entities)
             *  - header.pageDesc (string/html|optional) Title on the Header of the page (default: Description).
             *      Note: this string is put unescaped to support minimal formatting (line breaks, etc).
             *  - header.learnMoreLink (string|optional) Learn more link on the Header of the page (default: '')
             *  - grid.showAppFilter (Boolean|optional) Should display app filter. (default: true)
             *  - grid.showAllApps (Boolean|optional) true: shows all apps (appLocalsUnfilteredAll), false: shows visible apps(appLocals). (default: false)
             *  - grid.appFilterModelAttribute (string|optional) App Filter should set this modelAttribute . (default: true)
             *  - grid.showOwnerFilter (Boolean|optional) Should display users filter. Requires collection.users to be passed in (default: appSearch)
             *  - grid.ownerFilterModelAttribute (string|optional) Users filter should set this modelAttribute. (default: ownerSearch)
             *  - grid.showSharingColumn (Boolean|optional) Should display the sharing column. (default: true)
             *  - grid.sharingColumnSortKey (String|optional) Sort key to be used. (default: 'sharing')
             *  - grid.showStatusColumn (Boolean|optional) Should display the status column. (default: true)
             *  - grid.statusColumnSortKey (String|optional) Sort key to be used. (default: 'status')
             *  - bulkedit.enable (Boolean|optional) Should display the status column. (default: false)
             *  - bulkedit.actions[] (Array|optional) List of user defined actions. (default: [])
             *  - bulkedit.actions[].label (string) The action label to be displayed under the bulkEditMenu. (default: '')
             *  - bulkedit.actions[].fires (string) The trigger action to be triggered when user clicks on the action.
             *  - bulkedit.maxSelections (Integer|optional) To avoid high memory usage, only limited entities can be selected. (default: 100)
             *  - entitiesCollectionClass (BaseCollection) Collection class of the entities
             *  - entityModelClass (BaseModel) Model class of the entity
             *  - fragments (Array|required when url navigation is enabled) Fragments of the page's URL (Example: ['data', 'indexes'])
             *  - showRollingRestartWarning (boolean) flag indicating whether a warning inidicating the possibility of a rolling restart should be displayed
             *  - enableNavigationFromUrl (Boolean|optional) Enable navigation to different views from URL (default: false)
             *  - actions.confirmEnableDisable (bool|optional) Should a confirmation dialog be shown when user requests enable/disable actions (default:false)
             *  - templates (Object|optional) Object containing a mapping of custom templates to their import paths to be used in nested views
             *      Example: templates.gridRow='contrib/text!views/indexes/cloud/Grid.html'
             *  - customViews (Object|optional) Object containing classes of custom views replacing generic views. If provided, view instance
             *      will base on the specified class instead of the original one.
             *          supported views: [
             *              'GridRow',
             *              'MoreInfo',
             *              'Grid',
             *              'EditDialog',
             *              'NewButtons',
             *              'ActionCell',
             *              'BulkEditButton',
             *              'Filters'] (default: none)
             *
             * Standard options accepted:
             * this.model:
             *      .metadata
             *      .controller
             * this.collection:
             *      .flashMessages
             * this.deferreds
             *
             * initialize method: subclassed by controllers/BaseManagerPageControllerFiltered.js
             */
            initialize: function(options) {
                SwcMC.BaseController.prototype.initialize.apply(this, arguments);
                this.options = options;
                // defaults will not default nested objects
                // please default nested objects below.
                _(this.options).defaults({
                    entitiesPlural: _('Entities').t(),
                    entitySingular: _('Entity').t(),
                    grid: {
                        noEntitiesMessage: SwcMC.SplunkUtil.sprintf(_('No %s found. ').t(), this.options.entitiesPlural.toLowerCase())
                    },
                    customViews: {},
                    enableNavigationFromUrl: false,
                    fragments: undefined,
                    templates: {}
                });
                this.options.actions = this.options.actions || {};
                _(this.options.actions).defaults({
                    confirmEnableDisable: false
                });

                this.options.grid = this.options.grid || {};
                _(this.options.grid).defaults({
                    showAppFilter: true,
                    sharingColumnSortKey: 'sharing',
                    noEntitiesMessage: SwcMC.SplunkUtil.sprintf(_('No %s found. ').t(), this.options.entitiesPlural.toLowerCase())
                });

                this.options.bulkedit = this.options.bulkedit || {};
                _(this.options.bulkedit).defaults({
                    enable: false,
                    actions: [],
                    maxSelections: 100
                });

                this.collection = this.collection || {};
                this.model = this.model || {};
                this.deferreds = this.deferreds || options.deferreds || {};
                this.renderDfd = $.Deferred();

                //MODELS
                var _EAIFilterFetchData = this.options.entityFetchDataClass || SwcMC.EAIFilterFetchDataModel;
                this.model.metadata = this.model.metadata || new _EAIFilterFetchData(this.getFetchData());

                // used to show loading sign for the collectionCount control
                this.model.stateModel = this.model.stateModel || new Backbone.Model();
                this.model.controller = this.model.controller || new Backbone.Model();

                // models to track bulkedit selections
                if (this.options.bulkedit.enable) {
                    this.model.selectAllCheckbox = this.model.selectAllCheckbox || new Backbone.Model();
                    this.model.entitySelectCheckbox = this.model.entitySelectCheckbox || new Backbone.Model();
                }

                //COLLECTIONS
                this.collection.flashMessages = this.collection.flashMessages || new SwcMC.FlashMessagesCollection();

                //this entities collection is used for the grid
                var EntitiesCollection = this.options.entitiesCollectionClass;
                if (!this.collection.entities) {
                    this.collection.entities = new EntitiesCollection(null, {fetchData: this.model.metadata});
                    var entitiesDfd = this.fetchEntitiesCollection();
                    this.deferreds.entities = this.deferreds.entities || entitiesDfd;
                }

                if (this.options.bulkedit.enable === true) {
                    this.options.bulkedit.maxSelections = this.options.bulkedit.maxSelections || 100;
                    this.collection.selectedEntities = this.collection.selectedEntities || new EntitiesCollection();
                }


                this.initEventHandlers();

                //VIEWS
                $.when.apply($, _.values(this.deferreds))
                    .always(_(function() {
                        this.children.masterView = new SwcMC.BaseManagerView($.extend(this.options, {
                            model: this.model,
                            collection: this.collection,
                            templates: this.options.templates
                        }));
                        this.renderDfd.resolve();
                    }).bind(this));
            },

            // can override this method
            initEventHandlers: function() {
                this.listenTo(this.model.controller, "editEntity", this.onEditEntity);
                this.listenTo(this.model.controller, "deleteEntity", this.onDeleteEntity);
                this.listenTo(this.model.controller, "cloneEntity", this.onCloneEntity);
                this.listenTo(this.model.controller, "enableEntity", this.onEnableEntity);
                this.listenTo(this.model.controller, "disableEntity", this.onDisableEntity);
                this.listenTo(this.model.controller, "moveEntity", this.onMoveEntity);
                this.listenTo(this.model.controller, "refreshEntities", this.fetchEntitiesCollection);
                if (this.options.enableNavigationFromUrl) {
                    this.listenTo(this.model.controller, "createEntityFromURL", this.onCreateEntityFromURL);
                    this.listenTo(this.model.controller, "editEntityFromURL", this.onEditEntityFromURL);
                }

                // enable/disable loading sign for the collectionCount control
                this.listenTo(this.collection.entities, 'request', this.setFetching);
                this.listenTo(this.collection.entities, 'reset error sync', this.resetFetching);

                if (this.options.bulkedit.enable === true) {
                    this.listenTo(this.model.controller, 'selectAllClicked', this.handleSelectAll);
                    this.listenTo(this.model.controller, 'selectEntityClicked', this.handleSelectEntity);
                    this.listenTo(this.model.controller, 'removeSelectedEntity', this.removeEntityFromSelectedEntities);
                    this.listenTo(this.collection.entities, 'reset', this.handleEntitiesReset);
                    this.listenTo(this.model.selectAllCheckbox, "change:selectedCount", this.handleSelectedCountUpdate);
                    this.listenTo(this.model.controller, 'bulkActionClicked', this.handleBulkActionClick);
                }
            },

            /**
             * To display the loading sign in collectionCount
             * this function will set the fetching flag
             */
            setFetching: function() {
                this.model.stateModel.set('fetching', true);
            },

            /**
             * To hide the loading sign in collectionCount
             * this function will reset the fetching flag
             */
            resetFetching: function() {
                this.model.stateModel.set('fetching', false);
            },

            handleSelectAll: function () {
                var value = this.model.selectAllCheckbox.get('selectall');
                try {
                    if (this.collection.entities.length > 0) {
                        this.collection.entities.each(function (entity) {
                            if (value === 1) {
                                this._addEntityToSelectedEntities(entity, {silent: true});
                                this._checkEntity(entity);
                            } else {
                                this.removeEntityFromSelectedEntities(entity);
                                this._uncheckEntity(entity);
                            }
                        }, this);
                    } else {
                        this._uncheckSelectAll();
                    }
                } catch (e) {
                    this._uncheckSelectAll();
                    this.showMaxSelectionWarningMessage();
                }
            },

            _checkEntity: function (entity) {
                this.model.entitySelectCheckbox.set(entity.id, 1);
            },

            _uncheckEntity: function (entity) {
                this.model.entitySelectCheckbox.set(entity.id, 0);
            },

            _checkSelectAll: function () {
                this.model.selectAllCheckbox.set('selectall', 1);
            },

            _uncheckSelectAll: function () {
                this.model.selectAllCheckbox.set('selectall', 0);
            },

            _addEntityToSelectedEntities: function (entity, options) {
                if (_.isUndefined(this.collection.selectedEntities.get(entity.id))) {
                    if (this.collection.selectedEntities.length < this.options.bulkedit.maxSelections) {
                        this.model.selectAllCheckbox.set('selectedCount', this.model.selectAllCheckbox.get('selectedCount') + 1, options);
                        this.collection.selectedEntities.add(entity.clone());
                    } else {
                        throw new Error('limit reached');
                    }
                }
            },

            removeEntityFromSelectedEntities: function (entity) {
                if (!_.isUndefined(this.collection.selectedEntities.get(entity.id))) {
                    this.model.selectAllCheckbox.set('selectedCount', this.model.selectAllCheckbox.get('selectedCount') - 1);
                    this.collection.selectedEntities.remove(entity.id);
                    this._uncheckEntity(entity);
                }
            },

            handleEntitiesReset: function (collection) {
                var selectedCount = 0;
                collection.each(function (entity) {
                    if (!_.isUndefined(this.collection.selectedEntities.get(entity.id))) {
                        selectedCount++;
                        this._checkEntity(entity);
                    } else {
                        this._uncheckEntity(entity);
                    }
                }, this);

                // Force change event to update the selectAllCheckbox state.
                this.model.selectAllCheckbox.unset('selectedCount', {silent: true});
                this.model.selectAllCheckbox.set('selectedCount', selectedCount);
            },

            handleSelectEntity: function (entity, isChecked) {
                try {
                    if (isChecked === 0) {
                        this.removeEntityFromSelectedEntities(entity);
                    } else {
                        this._addEntityToSelectedEntities(entity);
                    }
                } catch (e) {
                    this._uncheckEntity(entity);
                    this.showMaxSelectionWarningMessage();
                }
            },

            handleSelectedCountUpdate: function (model, selectedCount) {
                var collectionCount = this.collection.entities.length;
                if (collectionCount > 0 && selectedCount === collectionCount) {
                    this._checkSelectAll();
                } else {
                    this._uncheckSelectAll();
                }
            },

            handleBulkActionClick: function (action) {
                this.model.controller.trigger(action);

                // simple helper. Will execute a function on<Action>Click if available
                var fname = 'on' + SwcMC.StringUtils.capitalize(action) + 'Click';
                if (_.isFunction(this[fname])) {
                    this[fname].apply(this, arguments);
                }
            },

            resetBulkSelection: function () {
                this.collection.selectedEntities.reset();
                this.model.entitySelectCheckbox.clear();
                this.model.selectAllCheckbox.set('selectedCount', 0);
            },

            onClearSelectedClick: function () {
                this.resetBulkSelection();
            },

            showMaxSelectionWarningMessage: function () {
                alert(SwcMC.SplunkUtil.sprintf(
                    _('Maximum of %d %s can be selected.').t(),
                    this.options.bulkedit.maxSelections,
                    this.options.entitiesPlural
                ));
            },

            /**
             * Triggers the router to a specific mode (create / edit/ list).
             * @param page: Name of page to direct to: name of entity or _new
             * @param pageOptions: Query Params for the url: uri, ns and action
             */
            navigate: function(page, pageOptions){
                if (this.options.enableNavigationFromUrl) {
                    // pageOptions argument is in second position in the jQuery extend call to allow overrides by user.
                    var nextUrl = SwcMC.URIRoute.manager(
                        this.model.application.get('root'),
                        this.model.application.get('locale'),
                        this.model.application.get('app'),
                        page ? this.options.fragments.concat(page) : this.options.fragments,
                        $.extend(true, this.getPageOptions(), pageOptions));
                    this.options.router.navigate(nextUrl, {replace: true});
                }
            },

            /**
             * Convenience method for subclasses to keep URL parameters when navigating to modals.
             */
            getPageOptions: function() {
                return null;
            },

            /**
             * Triggers the router to the 'Create panel' mode.
             */
            navigateToNew: function(){
                this.navigate('_new');
            },

            /**
             * Triggers the router to edit mode.
             * @param entityModel: The model of the entity to edit.
             */
            navigateToEdit: function(entityModel){
                this.navigate(entityModel.entry.get('name'), {
                    data: {
                        uri: entityModel.id,
                        ns: entityModel.entry.acl.get('app'),
                        action: 'edit'
                    }
                });
            },

            /**
             * Default behavior for onCreateEntity event.
             * Can override this method.
             */
            onCreateEntityFromURL: function() {
                Promise.all(_.values(this.deferreds)).then(_(function() {
                    if (this.collection.entities.links.has('create')){
                        this.showAddEditDialog();
                    }
                }).bind(this));
            },

            /**
             * Shortcut for refreshing entities collection
             * @returns collection fetch promise
             */
            fetchEntitiesCollection: function() {
                return this.collection.entities.fetch();
            },

            /**
             * Callback for standard entity Edit action
             * @param entityModel
             */
            onEditEntity: function(entityModel) {
                this.showAddEditDialog(entityModel);
            },

            /**
             * Callback for standard entity Edit action
             * @param entityModel
             */
            onEditEntityFromURL: function(entityModel) {
                if (entityModel) {
                    this.navigateToEdit(entityModel);
                } else {
                    SwcMC.ClassicURLModel.fetch().done(function() {
                        this.deferreds.entities.then(_(function() {
                            var uri = SwcMC.ClassicURLModel.get('uri');
                            // Check collection if entity model exists
                            entityModel = this.collection.entities._byId[uri];
                            if (!entityModel) { // If entity model doesn't exist in collection, fetch entity.
                                var entity = new this.options.entityModelClass({id: uri});
                                entity.binaryPromiseFetch().then(function(success) {
                                    // If fetch is unsuccessful or entity has no edit link, create new instead.
                                    if (!success || (entity && entity.entry && entity.entry.links && !entity.entry.links.get('edit'))) {
                                        this.navigateToNew();
                                    }
                                    else {
                                        this.showAddEditDialog(entity);
                                    }
                                }.bind(this));
                            }
                            else {
                                this.showAddEditDialog(entityModel);
                            }
                        }).bind(this));
                    }.bind(this));
                }
            },

            /**
             * Fetches selected model and renders a popup for editing selected or creating new entity
             * @param entityModel - if undefined, 'create new' mode is assumed
             * @param isClone - flag for clone action (default: false)
             */
            showAddEditDialog: function(entityModel, isClone) {
                if (entityModel) {
                    // clone to prevent changes in the table as you edit the fields in the popup
                    this.model.entity = entityModel.clone();
                } else {
                    var EntityModel = this.options.entityModelClass;
                    this.model.entity = new EntityModel();
                }
                var dialogOptions = $.extend({}, this.options);
                dialogOptions.isNew = _.isUndefined(entityModel);
                dialogOptions.isClone = isClone;
                dialogOptions.model = this.model;
                dialogOptions.collection = this.collection;
                dialogOptions.deferreds = this.deferreds;

                var _AddEditDialog = this.options.customViews.AddEditDialog || SwcMC.BaseManagerEditDialogView;
                this.children.editDialog = new _AddEditDialog(dialogOptions);
                this.listenTo(this.children.editDialog, "entitySaved", this.onEntitySaved);
                this.listenTo(this.children.editDialog, "hidden", this.onEditDialogHidden);
                this.children.editDialog.render().appendTo($("body"));
                this.children.editDialog.show();
            },

            showEnableDialog: function(entityModel) {
                var targetEntity = entityModel.clone();
                var _EnableDialog = this.options.customViews.EnableDialog || SwcMC.BaseManagerEnableDialogView;
                this.children.enableDialog = new _EnableDialog({
                    targetEntity: targetEntity,
                    entitySingular: this.options.entitySingular,
                    onActionSuccess: function() {
                        this.model.controller.trigger('actionSuccess',
                            {action: 'enable', entity: targetEntity});
                        this.fetchEntitiesCollection();
                    }.bind(this)
                });
                this.listenTo(this.children.enableDialog, "enableEntityConfirmed", this.fetchEntitiesCollection);
                this.listenTo(this.children.enableDialog, "hidden", this.onEnableDialogHidden);
                this.children.enableDialog.render().appendTo($("body"));
                this.children.enableDialog.show();
            },

            showDisableDialog: function(entityModel) {
                var targetEntity = entityModel.clone();
                var _DisableDialog = this.options.customViews.DisableDialog || SwcMC.BaseManagerDisableDialogView;
                this.children.disableDialog = new _DisableDialog({
                    targetEntity: targetEntity,
                    entitySingular: this.options.entitySingular,
                    onActionSuccess: function() {
                        this.model.controller.trigger('actionSuccess',
                            {action: 'disable', entity: targetEntity});
                        this.fetchEntitiesCollection();
                    }.bind(this)
                });
                this.listenTo(this.children.disableDialog, "disableEntityConfirmed", this.fetchEntitiesCollection);
                this.listenTo(this.children.disableDialog, "hidden", this.onDisableDialogHidden);
                this.children.disableDialog.render().appendTo($("body"));
                this.children.disableDialog.show();
            },

            showDeleteDialog: function(entityModel) {
                var targetEntity = entityModel.clone();
                var _DeleteDialog = this.options.customViews.DeleteDialog || SwcMC.BaseManagerDeleteDialogView;
                var confirmDialog = new _DeleteDialog({
                    id: "modal_delete",
                    flashModel: targetEntity,
                    entitySingular: this.options.entitySingular,
                    dialogButtonLabel: this.options.deleteDialogButtonLabel,
                    targetEntity: targetEntity,
                    onActionSuccess: function() {
                        this.model.controller.trigger('actionSuccess',
                            {action: 'delete', entity: targetEntity});
                        this.fetchEntitiesCollection();
                    }.bind(this)
                });
                $("body").append(confirmDialog.render().el);
                confirmDialog.show();
            },

            /**
             * Callback on successful entity save
             */
            onEntitySaved: function() {
                this.model.controller.trigger("actionSuccess",
                    {action: 'edit', entity: this.model.entity});
                this.fetchEntitiesCollection();
            },
            onEditDialogHidden: function() {
                this.stopListening(this.children.editDialog, "entitySaved", this.onEntitySaved);
                this.stopListening(this.children.editDialog, "hidden", this.onEditDialogHidden);
                this.children.editDialog.remove();
                // Navigate back to listing
                this.navigate();
            },

            /**
             * Handler for standard entity Clone action
             * @param entityModel - target entity
             */
            onCloneEntity: function(entityModel) {
                this.showAddEditDialog(entityModel, true); // isClone:true
            },

            /**
             * Handler for standard entity Enable action
             */
            onEnableEntity: function(entityModel) {
                if (this.options.actions.confirmEnableDisable) {
                    this.showEnableDialog(entityModel);
                } else {
                    entityModel
                        .enable()
                        .done(function(){
                            this.fetchEntitiesCollection();
                        }.bind(this));
                }
            },
            onEnableDialogHidden: function() {
                // Stop listening to enableEntityConfirmed and hidden
                this.stopListening(this.children.enableDialog, "enableEntityConfirmed", this.fetchEntitiesCollection);
                this.stopListening(this.children.enableDialog, "hidden", this.onEnableDialogHidden);
                this.children.enableDialog.remove();
            },

            /**
             * Handler for standard entity Disable action
             */
            onDisableEntity: function(entityModel) {
                if (this.options.actions.confirmEnableDisable) {
                    this.showDisableDialog(entityModel);
                } else {
                    entityModel
                        .disable()
                        .done(function () {
                            this.fetchEntitiesCollection();
                        }.bind(this));
                }
            },
            onDisableDialogHidden: function() {
                // Stop listening to disableEntityConfirmed and hidden
                this.stopListening(this.children.disableDialog, "disableEntityConfirmed", this.fetchEntitiesCollection);
                this.stopListening(this.children.disableDialog, "hidden", this.onDisableDialogHidden);
                this.children.disableDialog.remove();
            },

            /**
             * Handler for standard entity Delete action - show confirmation dialog
             * @param entityModel - target entity
             */
            onDeleteEntity: function(entityModel) {
                this.showDeleteDialog(entityModel);
            },

            /**
             * Show the move prebuilt entity dialog
             * @param entityModel - the model to move
             */
            onMoveEntity: function(entityModel) {
                var targetEntity = entityModel.clone();
                this.children.moveDialog = new SwcMC.BaseManagerMoveDialogView({
                    collection: {
                        appLocals: this.collection.appLocals
                    },
                    model: {
                        application: this.model.application,
                        entity: targetEntity
                    },
                    entitySingular: this.options.entitySingular,
                    onHiddenRemove: true
                });
                this.listenTo(this.children.moveDialog, "moveEntityConfirmed", this.fetchEntitiesCollection);
                this.listenTo(this.children.moveDialog, "hidden", this.onMoveDialogHidden);
                this.children.moveDialog.render().appendTo($("body"));
                this.children.moveDialog.show();
            },

            onMoveDialogHidden: function() {
                // Stop listening to moveEntityConfirmed and hidden
                this.stopListening(this.children.moveDialog, "moveEntityConfirmed", this.fetchEntitiesCollection);
                this.stopListening(this.children.moveDialog, "hidden", this.onMoveDialogHidden);
            },

            /**
             * Subclass this method to pass in different parameters to the fetch function.
             */
            getFetchData: function(){
                return {
                    sortKey: 'name',
                    sortDirection: 'asc',
                    count: '20',
                    offset: 0,
                    ownerSearch: "*",
                    visible: false
                };
            },

            render: function() {
                this.renderDfd.then(function() {
                    if (this.children.masterView) {
                        this.children.masterView.detach();
                        this.children.masterView.render().appendTo(this.$el);
                    }
                }.bind(this));

                return this;
            }

        });

    });

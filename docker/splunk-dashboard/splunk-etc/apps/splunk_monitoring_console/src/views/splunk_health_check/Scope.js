/**
 * Created by claral on 9/01/16.
 */
define(
[
    'underscore',
    'module',
    'backbone',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/utils',
    'splunk_monitoring_console/views/controls/Multiselect',
    'splunk_monitoring_console/views/splunk_health_check/Scope.pcss'
], function(
    _,
    module,
    Backbone,
    SwcMC,
    utils,
    MultiSelect,
    css
) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        className: 'scope',

        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            this.children.groupFilter = this.prepareGroupView();

            this.children.appFilter = new SwcMC.SyntheticSelectControlView({
                label:_('App:').t(),
                toggleClassName: 'btn',
                model: this.model.conductor,
                modelAttribute: 'app'
            });

            var items = [{label: _('All').t(), value: '*'}, {label:_('System default').t(), value: 'system'}];
            _.each(this.collection.appLocalsUnfilteredAll.models, function(app) {
                items.push({
                    label: SwcMC.SplunkUtil.sprintf(_('%s (%s)').t(), app.entry.content.get('label'), app.entry.get('name')),
                    value: app.entry.get('name')
                });
            }, this);

            this.children.appFilter.setItems(items);

            var tagsAutoComplete = this.collection.tasks.getTags().map(function(tag) {
                return {
                    value: tag,
                    label: tag,
                    key: tag
                };
            });
            var handleTagsChanged = function(e, value) {
                // sui component passes an array, model is stored as csv
                var values = value.values.join(',');
                this.model.conductor.set('tag', values);
            };

            // sui component accepts an array for default values, model is stored as csv
            var tagValues = this.model.conductor.get('tag') || "";
            var defaultTagValues = tagValues === "" ? undefined : tagValues.split(',');

            this.tagsControl = new MultiSelect({
                children: tagsAutoComplete,
                props: {
                    allowNewValues: true,
                    inline: true,
                    defaultValues: defaultTagValues,
                    onChange: handleTagsChanged.bind(this),
                    style: {
                        width: 'initial',
                        minWidth: '200px'
                    },
                    "data-test-name": "mc-healthcheck-tag"
                },
                stretchToFill: true
            });
            this.children.tagFilter = new SwcMC.ControlGroupView({
                controlClass: 'controls-block',
                controls: [this.tagsControl],
                label: _('Tags:').t(),
                tooltip: _('Leave empty to select all tags').t()
            });

            this.children.tagDisplay = new SwcMC.ControlGroupView({
                controlType: 'Textarea',
                controlOptions: {
                    modelAttribute: 'tag',
                    model: this.model.conductor
                },
                controlClass: 'controls-block',
                label: _('Tags:').t(),
                tooltip: _('Leave empty to select all tags').t(),
                enabled: false
            });

            var categoriesAutoComplete = this.collection.tasks.getCategories().map(function(category) {
                return {
                    value: category,
                    label: category,
                    key: category
                };
            });
            var handleCategoriesChanged = function(e, value) {
                // sui component passes an array, model is stored as csv
                var values = value.values.join(',');
                this.model.conductor.set('category', values);
            };

            // sui component accepts an array for default values, model is stored as csv
            var categoryValues = this.model.conductor.get('category') || "";
            var defaultCategoryValues = categoryValues === "" ? undefined : categoryValues.split(',');

            this.categoriesControl = new MultiSelect({
                children: categoriesAutoComplete,
                props: {
                    allowNewValues: true,
                    inline: true,
                    defaultValues: defaultCategoryValues,
                    onChange: handleCategoriesChanged.bind(this),
                    style: {
                        width: 'initial',
                        minWidth: '200px'
                    },
                    "data-test-name": "mc-healthcheck-category"
                },
                stretchToFill: true
            });

            this.children.categoryFilter = new SwcMC.ControlGroupView({
                controlClass: 'controls-block',
                controls: [this.categoriesControl],
                label: _('Category:').t(),
                tooltip: _('Leave empty to select all categories').t()
            });

            this.children.categoryDisplay = new SwcMC.ControlGroupView({
                controlType: 'Textarea',
                controlOptions: {
                    modelAttribute: 'category',
                    model: this.model.conductor
                },
                controlClass: 'controls-block',
                label: _('Category:').t(),
                tooltip: _('Leave empty to select all categories').t(),
                enabled: false
            });
        },

        enable: function() {
            if (this.model.dmcConfigs.isDistributedMode()) {
                this.children.groupFilter.enable();
            }
            this.children.appFilter.enable();
            this.children.tagFilter.show();
            this.children.categoryFilter.show();
            this.children.tagDisplay.hide();
            this.children.categoryDisplay.hide();
        },

        disable: function() {
            if (this.model.dmcConfigs.isDistributedMode()) {
                this.children.groupFilter.disable();
            }
            this.children.appFilter.disable();
            this.children.tagFilter.hide();
            this.children.categoryFilter.hide();
            this.children.tagDisplay.show();
            this.children.categoryDisplay.show();
        },

        render: function() {

            this.$el.html(this.compiledTemplate());

            this.$('.scope-group').prepend(this.children.appFilter.render().$el);
            this.$('.scope-group').prepend(this.children.groupFilter.render().$el);

            this.$('.scope-filter').append(this.children.tagFilter.render().$el);
            this.$('.scope-filter').append(this.children.categoryFilter.render().$el);

            this.$('.scope-filter').append(this.children.tagDisplay.render().$el);
            this.$('.scope-filter').append(this.children.categoryDisplay.render().$el);
            this.children.tagDisplay.hide();
            this.children.categoryDisplay.hide();

            return this;
        },

        prepareGroupView: function() {
            var isDistributedMode = this.model.dmcConfigs.isDistributedMode();
            if (!isDistributedMode) {
                // single instance mode
                var singleView = new Backbone.View();
                singleView.$el = '<div class="standalone-instance">' + _('Instance: ').t() + this.model.dmcConfigs.getLocalInstanceName() + '</div>';
                return singleView;
            }
            else {
                var groupDropdown = new SwcMC.SyntheticSelectControlView({
                    label:_('Group:').t(),
                    toggleClassName: 'btn',
                    model: this.model.conductor,
                    modelAttribute: 'group'
                });

                var items = [{label: _('All').t(), value: '*'}];

                var indexerClustersInnerItems = null;
                var searchHeadClustersInnerItems = null;

                _.each(this.model.dmcConfigs.getDistsearchGroups(), function(group) {
                    if (group.isIndexerClusterGroup()) {
                        if (indexerClustersInnerItems == null) {
                            indexerClustersInnerItems = [{ label:  _('Indexer Clusters').t() }];
                        }
                        indexerClustersInnerItems.push({
                            value: group.getGroupName(),
                            label: utils.ROLE_LABELS[group.getDisplayName()] || group.getDisplayName()
                        });
                    } else if (group.isSearchHeadClusterGroup()) {
                        if (searchHeadClustersInnerItems == null) {
                            searchHeadClustersInnerItems = [{ label:  _('Search Head Clusters').t() }];
                        }
                        searchHeadClustersInnerItems.push({
                            value: group.getGroupName(),
                            label: utils.ROLE_LABELS[group.getDisplayName()] || group.getDisplayName()
                        });
                    } else {
                        items.push([{ label: utils.ROLE_LABELS[group.getDisplayName()] || group.getDisplayName(), value: group.getGroupName()}]);
                    }
                }, this);

                if (indexerClustersInnerItems != null) {items.push(indexerClustersInnerItems);}
                if (searchHeadClustersInnerItems!= null) {items.push(searchHeadClustersInnerItems);}

                groupDropdown.setItems(items);

                return groupDropdown;
            }
        },

        template: '\
            <div class="scope-group">\
                <div class="scope-filter"></div>\
            </div>\
        '
    });
});

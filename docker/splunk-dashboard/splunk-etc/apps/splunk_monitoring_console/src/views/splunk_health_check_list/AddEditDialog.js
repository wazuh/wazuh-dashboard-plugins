define([
    'underscore',
    'module',
    'splunk_monitoring_console/views/utils',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/controls/Multiselect'
], function (
    _,
    module,
    utils,
    SwcMC,
    MultiSelect
) {
    return SwcMC.BaseManagerEditDialogView.extend({
        moduleId: module.id,
        setFormControls: function() {
            this.children.flashMessagesView = new SwcMC.FlashMessagesView({
                model: this.model.entity,
                helperOptions: {
                    removeServerPrefix: true
                }
            });

            this.children.entryFlashMessagesView = new SwcMC.FlashMessagesView({
                model: this.model.entity.entry,
                helperOptions: {
                    removeServerPrefix: true
                }
            });

            this.children.entryContentFlashMessagesView = new SwcMC.FlashMessagesView({
                model: this.model.entity.entry.content,
                helperOptions: {
                    removeServerPrefix: true
                }
            });

            this.children.title = new SwcMC.ControlGroupView({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'title',
                    model: this.model.entity.entry.content
                },
                controlClass: 'controls-block',
                label: _('Title').t()
            });

            this.children.name = new SwcMC.ControlGroupView({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'name',
                    model: this.model.entity.entry
                },
                controlClass: 'controls-block',
                label: _('ID').t(),
                help: _('The health check ID can only contain letters, numbers, dashes, and underscores. Do not start the health check ID with a period.').t(),
                // allow edit ID only when it is a new entity or a cloned entity
                enabled: !!(this.model.entity.isNew() || this.options.isClone)
            });

            if (this.model.entity.isNew() || this.options.isClone) {
                this.model.entity.entry.acl.set({'app': this.model.application.get('app')});
            }
            this.appChoice = new SwcMC.SyntheticSelectControlView({
                toggleClassName: 'btn',
                model: this.model.entity.entry.acl,
                modelAttribute: 'app'
            });
            var items = [];
            _.each(this.collection.appLocalsUnfilteredAll.models, function(app) {
                if (app.entry.acl.get("can_write") && app.entry.get('name') !== 'launcher') {
                    items.push({
                        label: SwcMC.SplunkUtil.sprintf(_('%s (%s)').t(), app.entry.content.get('label'), app.entry.get("name")),
                        value: app.entry.get('name')
                    });
                }
            }, this);
            this.appChoice.setItems(items);

            this.children.app = new SwcMC.ControlGroupView({
                controlClass: 'controls-block',
                controls: [this.appChoice],
                label: _('App').t(),
                tooltip: ''
            });

            this.children.category = new SwcMC.ControlGroupView({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'category',
                    model: this.model.entity.entry.content
                },
                controlClass: 'controls-block',
                label: _('Category').t()
            });

            this.children.tags = new SwcMC.ControlGroupView({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'tags',
                    model: this.model.entity.entry.content
                },
                controlClass: 'controls-block',
                label: _('Tags').t()
            });

            this.children.description = new SwcMC.ControlGroupView({
                controlType: 'Textarea',
                controlOptions: {
                    modelAttribute: 'description',
                    model: this.model.entity.entry.content,
                    placeholder: _('optional').t()
                },
                controlClass: 'controls-block',
                label: _("Description").t()
            });

            this.children.failureText = new SwcMC.ControlGroupView({
                controlType: 'Text',
                controlOptions: {
                    modelAttribute: 'failure_text',
                    model: this.model.entity.entry.content,
                    placeholder: _('optional').t()
                },
                controlClass: 'controls-block',
                label: _("Message").t()
            });

            this.children.suggestedAction = new SwcMC.ControlGroupView({
                controlType: 'Textarea',
                controlOptions: {
                    modelAttribute: 'suggested_action',
                    model: this.model.entity.entry.content,
                    placeholder: _('optional').t()
                },
                controlClass: 'controls-block',
                label: _("Suggested action").t()
            });

            this.children.search = new SwcMC.ControlGroupView({
                controlType: 'Textarea',
                controlOptions: {
                    modelAttribute: 'search',
                    model: this.model.entity.entry.content
                },
                controlClass: 'controls-block',
                label: _("Search").t()
            });

            if (this.model.dmcConfigs.isDistributedMode()) {
                var applicableGroupsAutoComplete = this.model.dmcConfigs.getDistsearchGroups().map(function(group) {
                    return {
                        text: utils.ROLE_LABELS[group.getDisplayName()] || group.getDisplayName(),
                        id: group.getGroupName()
                    };
                });

                var applicableGroupChildren = applicableGroupsAutoComplete.map(function(group) {
                    return {
                        value: group.text,
                        label: group.text,
                        key: group.id,
                    };
                });
                var handleApplicableGrpChanged = function(e, value) {
                    // sui component passes an array, model is stored as csv
                    var values = value.values.join(',');
                    this.model.entity.entry.content.set('applicable_to_groups', values);
                };

                // sui component accepts an array for default values, model is stored as csv
                var applicableGroups = this.model.entity.entry.content.get('applicable_to_groups') || "";
                var defaultApplicableGroupsValues = applicableGroups === "" ? undefined : applicableGroups.split(',');

                this.applicableGroupsControl = new MultiSelect({
                    children: applicableGroupChildren,
                    props: {
                        inline: true,
                        defaultValues: defaultApplicableGroupsValues,
                        onChange: handleApplicableGrpChanged.bind(this),
                        placeholder: _("optional").t(),
                        style: {
                            width: '100%'
                        }
                    },
                    stretchToFill: true
                });

                this.children.applicableToGroups = new SwcMC.ControlGroupView({
                    controlClass: 'controls-block',
                    controls: [this.applicableGroupsControl],
                    label: _('Applicable to roles').t(),
                    tooltip: _('Leave empty to have this health check apply to all groups.').t()
                });
            }

            var environmentsToExcludeAutoComplete = [
                {text: _('Standalone').t(),
                 id: 'standalone'},
                {text: _('Distributed').t(),
                 id: 'distributed'}
            ];

            var excludedEnvChildren = environmentsToExcludeAutoComplete.map(function(environment) {
                return {
                    value: environment.text,
                    label: environment.text,
                    key: environment.id,
                };
            });

            var handleExcludedEnvChanged = function(e, value) {
                // sui component passes an array, model is stored as csv
                var values = value.values.join(',');
                this.model.entity.entry.content.set('environments_to_exclude', values);
            };

            // sui component accepts an array for default values, model is stored as csv
            var excludedEnvironments = this.model.entity.entry.content.get('environments_to_exclude') || "";
            var defaultExcludedEnvValues = excludedEnvironments === "" ? undefined : excludedEnvironments.split(',');

            this.excludedEnvironmentsControl = new MultiSelect({
                children: excludedEnvChildren,
                props: {
                    inline: true,
                    defaultValues: defaultExcludedEnvValues,
                    onChange: handleExcludedEnvChanged.bind(this),
                    placeholder: _("optional").t(),
                    style: {
                        width: '100%'
                    }
                },
                stretchToFill: true
            });
            this.children.excludedEnvironments = new SwcMC.ControlGroupView({
                controlClass: 'controls-block',
                controls: [this.excludedEnvironmentsControl],
                label: _('Environments to exclude').t(),
                tooltip: _('Leave empty to have this health check apply to all environments.').t()
            });

            this.children.drilldown = new SwcMC.ControlGroupView({
                controlType: 'Textarea',
                controlOptions: {
                    modelAttribute: 'drilldown',
                    model: this.model.entity.entry.content,
                    placeholder: _('optional').t()
                },
                controlClass: 'controls-block',
                label: _('Drilldown').t(),
                tooltip: _('Link to a search or Monitoring Console dashboard for additional information.').t()
            });
        },

        renderFormControls: function($form) {
            this.children.flashMessagesView.render().appendTo($form);
            this.children.entryFlashMessagesView.render().appendTo($form);
            this.children.entryContentFlashMessagesView.render().appendTo($form);
            this.children.title.render().appendTo($form);
            this.children.name.render().appendTo($form);
            this.children.app.render().appendTo($form);
            if (!this.model.entity.isNew() && !this.options.isClone) {
                this.children.app.disable();
            }
            this.children.category.render().appendTo($form);
            this.children.tags.render().appendTo($form);
            this.children.description.render().appendTo($form);
            this.children.failureText.render().appendTo($form);
            this.children.suggestedAction.render().appendTo($form);
            this.children.search.render().appendTo($form);
            if (this.model.dmcConfigs.isDistributedMode()) {
                this.children.applicableToGroups.render().appendTo($form);
            }
            this.children.excludedEnvironments.render().appendTo($form);
            this.children.drilldown.render().appendTo($form);
        },

        saveACL: function() {
            // Always save new health checks with global viewing permissions.
            var data = {
                sharing: 'global',
                owner: this.model.user.entry.get('name'),
                'perms.read':'*',
                'perms.write': 'admin'
            };

            return this.model.entity.acl.save({}, {
                data: data,
                success: function(model, response){
                    this.hide();
                    this.model.controller.trigger('refreshEntities');
                }.bind(this)
            });
        }
    });
});

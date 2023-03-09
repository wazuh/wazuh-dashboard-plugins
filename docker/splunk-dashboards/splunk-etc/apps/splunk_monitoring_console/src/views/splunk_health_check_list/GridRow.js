define([
    'underscore',
    'splunk_monitoring_console/views/utils',
    'contrib/text!splunk_monitoring_console/views/splunk_health_check_list/GridRow.html',
    '@splunk/swc-mc'
], function (
    _,
    utils,
    Template,
    SwcMC
) {
    return SwcMC.BaseManagerGridRowView.extend({
        template: Template,
        prepareTemplate: function() {
            var applicableGroups = this.model.dmcConfigs.getDistsearchGroups().map(function(group) {
                return {
                    label: group.getDisplayName(),
                    value: group.getGroupName()
                };
            });
            var currGroups = this.model.entity.entry.content.get('applicable_to_groups') || '';
            currGroups = currGroups.split(',');
            var groupNames = [];
            for (var i = 0; i < currGroups.length; i++) {
                var curr = currGroups[i].trim();
                if (!_.isEmpty(curr)) {
                    var group = _.find(applicableGroups, function(applicableGroup) {
                        return applicableGroup.value === curr;
                    });
                    groupNames.push(group ? (utils.ROLE_LABELS[group.label] || group.label) : curr);
                }
            }
            var groupColumn = groupNames.join(', ');

            var currTags = this.model.entity.entry.content.get('tags') || '';
            currTags = currTags.split(',').map(function(tag) {
                return tag.trim();
            });
            var allTags = [];
            _.each(currTags, function(tag){
                allTags.push(tag);
            }, this);
            allTags.sort();
            var tagsColumn = allTags.join(', ');

            return {
                entity: this.model.entity,
                name: this.model.entity.entry.content.get('title'),
                description: this.model.entity.entry.content.get('description'),
                editLinkHref: '#',
                isDisabled: SwcMC.GeneralUtils.normalizeBoolean(this.model.entity.entry.content.get('disabled')),
                columns: this.options.columns.filter(function(item) {
                    // need to manually filter this out because we need special handle on 'title' and 'disabled'
                    return item.id !== 'title' && item.id !== 'disabled';
                }),
                hasMoreInfo: this.options.customViews.MoreInfo,
                groupColumn: groupColumn,
                tagsColumn: tagsColumn,
                isDistributed: this.model.dmcConfigs.isDistributedMode()
            };
        }
    }, {
        columns: [
            {
                id: 'title',
                title: _('Title').t()
            },
            {
                id: 'category',
                title: _('Category').t()
            },
            {
                id: 'eai:acl.app',
                title: _('App').t()
            },
            {
                id: 'applicable_to_groups',
                title: _('Applicable to Roles').t(),
                visible: function() {
                    return this.model.dmcConfigs.isDistributedMode();
                }
            },
            {
                id: 'tags',
                title: _('Tags').t()
            },
            {
                id: 'disabled',
                title: _('Status').t()
            }
        ]
    });
});
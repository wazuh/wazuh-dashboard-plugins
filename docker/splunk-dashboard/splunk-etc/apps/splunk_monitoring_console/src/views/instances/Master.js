/**
 * Created by ykou on 7/7/14.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'module',
    'splunk_monitoring_console/views/instances/components/Action',
    'splunk_monitoring_console/views/utils',
    '@splunk/swc-mc',
    'contrib/text!splunk_monitoring_console/views/instances/Master.html',
    './Master.pcss'
],
    function(
        $,
        _,
        Backbone,
        module,
        ActionView,
        dmc_utils,
        SwcMC,
        Template,
        css
        ){
        var SEARCH_SPLUNK_INSTANCES = function(group) {
            return '| `dmc_instances_view_default_search(' + group + ')`';
        };
        var DEFAULT_EARLIEST = "-4h@m";
        var DEFAULT_LATEST = "now";
        var CUSTOM_GROUP_OPTION = {"value": "-----", "label": _("DRILLDOWN").t()};
        var ALL_GROUP_OPTION = {"value": "*", "label": _("All").t()};

        /**
         * this page accept a search string and other parameters from url, and create a SearchManager with a TableView,
         * generates a listing view of splunk instances.
         *
         * @param {String} (required) this.searchString:    a complete search string (from url parameters)
         *        {String} (required) this.earliest:        earliest search time (from url parameters)
         *        {String} (required) this.latest:          latest search time (from url parameters)
         *        {String} (optional) this.description:     a description of the search
         *
         * NOTE:
         * 1. If you need to use $span$ token (which is latest minus earliest), just write a macro and put span as a parameter
         *    in the macro, and this program will compute it and replace it with correct value.
         * 2. If you want to have Action button/link in the table, please create a 'Action' field in the search result.
         * 3. Please do not put time range information in description, because it is automatically added.
         *
         */

        return SwcMC.BaseView.extend({
            moduleId: module.id,
            template: Template,
            initialize: function() {
                SwcMC.BaseView.prototype.initialize.apply(this, arguments);

                var learnMoreLink = SwcMC.URIRoute.docHelp(
                    this.model.application.get('root'),
                    this.model.application.get('locale'),
                    'app.management_console.instances'
                );
                this.$el.html(this.compiledTemplate({
                    'learnMoreLink': learnMoreLink
                }));

                // classicurl will do decodeURIComponent for us automatically.

                this.earliest = this.model.earliestModel.get('value') || DEFAULT_EARLIEST;
                this.latest = this.model.latestModel.get('value') || DEFAULT_LATEST;
                this.description = this._getDescription();
                this.drilldownSearchString = SwcMC.ClassicURLModel.get('search') ? SwcMC.ClassicURLModel.get('search') : undefined;
                this.group = SwcMC.ClassicURLModel.get('group') ? SwcMC.ClassicURLModel.get('group') : undefined;

                // create group options
                this.groupDropdownOptions = [ALL_GROUP_OPTION];
                if (this.drilldownSearchString) {
                    this.groupDropdownOptions.push(CUSTOM_GROUP_OPTION);
                }

                if (this.group) {
                    // 'group' presents in url,
                    // ignor 'search', search that group isntead. And set default dropdown option to that group.
                    this.searchString = SEARCH_SPLUNK_INSTANCES(this.group);
                    this.groupDropdownDefault = this.group;
                }
                else if (this.drilldownSearchString) {
                    // 'group' doesn't present in url, 'search' presents in url,
                    // use the search string and set default dropdown option to DRILLDOWN
                    this.searchString = this.drilldownSearchString;
                    this.groupDropdownDefault = CUSTOM_GROUP_OPTION['value'];
                }
                else {
                    // neither 'group' or 'search' presents
                    // use "All" option as default in the dropdown
                    this.searchString = SEARCH_SPLUNK_INSTANCES(ALL_GROUP_OPTION['value']);
                    this.groupDropdownDefault = ALL_GROUP_OPTION['value'];
                }

                this.groupDropdownView = new SwcMC.DropdownView({
                    "id": "groupDropdown",
                    "choices": this.groupDropdownOptions,
                    "labelField": "label",
                    "value": this.groupDropdownDefault,
                    "selectFirstChoice": true,
                    "valueField": "search_group",
                    "searchWhenChanged": true,
                    'minimumResultsForSearch': 10,
                    "managerid": "smcGetGroups",
                    "showClearButton": false,
                    "el": this.$el.find('#dmc-instances-group-dropdown')
                }, {tokens: true}).render();

                this.groupDropdownView.on("change", function(newValue) {
                    $('.dmc-instances-total-count').text('');
                    if (newValue == CUSTOM_GROUP_OPTION['value']) {
                        SwcMC.ClassicURLModel.unset('group');
                        this.instanceSearchManager.settings.set("search", this.drilldownSearchString);
                    }
                    else {
                        SwcMC.ClassicURLModel.set('group', newValue);
                        this.instanceSearchManager.settings.set("search", SEARCH_SPLUNK_INSTANCES(newValue));
                    }
                    SwcMC.ClassicURLModel.save();
                    this.render();
                }.bind(this));

                // Populating search for field 'field1'
                var smcGetGroups = new SwcMC.SearchManager({
                    "id": "smcGetGroups",
                    "search": "| `dmc_get_groups`",
                    "earliest_time": this.earliest,
                    "status_buckets": 0,
                    "latest_time": this.latest,
                    "cancelOnUnload": true,
                    "app": SwcMC.Utils.getCurrentApp(),
                    "auto_cancel": 90,
                    "preview": true,
                    "runWhenTimeIsUndefined": false
                }, {tokens: true});

                this.instanceSearchManager = new SwcMC.SearchManager({
                    "id": "instanceSearchManager",
                    "latest_time": this.latest,
                    "earliest_time": this.earliest,
                    "search": this.searchString,
                    "status_buckets": 0,
                    "cancelOnUnload": true,
                    "app": SwcMC.Utils.getCurrentApp(),
                    "auto_cancel": 90,
                    "preview": true,
                    "runWhenTimeIsUndefined": false
                }, {tokens: true, tokenNamespace: "submitted"});
                this.instanceSearchManager.on('search:done',function(properties) {
                    var totalCount = properties.content.resultPreviewCount;
                    var unit = totalCount === 1 ? _(' instance').t() : _(' instances').t();
                    $('.dmc-instances-total-count').text(totalCount + unit);
                });

                this.instancesTable = new SwcMC.TableView({
                    "id": "instancesTable",
                    "refresh.time.visible": "false",
                    "managerid": "instanceSearchManager",
                    'drilldown': 'none',
                    'wrap': 'true',
                    'pageSize': '10',
                    "el": this.$el.find('#dmc-instances-listing'),
                    "sortableFieldsExcluded": ['Role']
                }, {tokens: true});

                // Use the BaseCellRenderer class to create a custom table cell renderer
                var CustomIconCellRenderer = SwcMC.TableView.BaseCellRenderer.extend({
                    canRender: function(cellData) {
                        return cellData.field === 'Action' || cellData.field === 'Status' || cellData.field === 'Role';
                    },

                    // This render function only works when canRender returns 'true'
                    render: function($td, cellData) {
                        // TODO: support action dropdown list.
                        if (cellData.field === 'Action') {
                            var actionValues = cellData.value.split(' ');
                            var instance = actionValues[0];
                            var instanceRoles = actionValues.slice(1);
                            var actionCell = new ActionView({
                                instance: instance,
                                earliest: this.earliest,
                                latest: this.latest,
                                roles: instanceRoles
                            });
                            actionCell.render().$el.appendTo($td);
                        }
                        if (cellData.field === 'Status') {
                            var status = null;
                            if (cellData.value === 'Up') {
                                status = '<i class="icon-check"></i>' + cellData.value;
                            }
                            else {
                                status = '<i class="icon-alert"></i>' + cellData.value;
                            }
                            $td.html(status);
                        }
                        if (cellData.field === 'Role') {
                            // workaround for multi-value field not rendered properly
                            var roles = cellData.value.replace(/\n/g, ' ').split(' ');
                            var $roles = _.map(roles, function(role) {
                                role = dmc_utils.ROLE_LABELS[role] || role;
                                return $('<div>').html(role);
                            });
                            _.each($roles, function($role) {
                                $td.append($role);
                            });
                        }
                    }.bind(this)
                });

                // Create an instance of the custom cell renderer
                var myCellRenderer = new CustomIconCellRenderer();

                // Add the custom cell renderer to the table
                this.instancesTable.addCellRenderer(myCellRenderer);

                // Render the table
                this.instancesTable.render();

                this.children.countPerPageDropdownView = new SwcMC.SyntheticSelectControlView({
                    model: this.instancesTable.settings,
                    modelAttribute: 'pageSize',
                    items: [
                        {value: '10', label: _('10 per page').t()},
                        {value: '25', label: _('25 per page').t()},
                        {value: '50', label: _('50 per page').t()},
                        {value: '100', label: _('100 per page').t()}
                    ],
                    toggleClassName: 'btn-pill'
                });

                this.$('.dmc-instances-count-per-page').append(this.children.countPerPageDropdownView.render().$el);
            },

            events: {
                'click .dmc-custom-drilldown-action': function(e) {
                    e.preventDefault();
                    window.open($(e.target).data('target'), '_blank');
                }
            },

            _formatTime: function(time) {
                if (!time) {
                    return '';
                }
                return SwcMC.Splunki18n.format_datetime(SwcMC.TimeUtil.isoToDateObject(time), 'short');
            },

            _escapeDescription: function(description) {
                return SwcMC.SplunkUtil.escapeHtml(description);
            },

            _escapeDescription: function(description) {
                return splunkUtil.escapeHtml(description);
            },

            _getDescription: function() {
                if (SwcMC.ClassicURLModel.get('description')) {
                    var timeRange = _("Time range: ").t() + this._formatTime(this.earliest) + _(" ~ ").t() + this._formatTime(this.latest) + _(". ").t();
                    var escapedDescription = this._escapeDescription(SwcMC.ClassicURLModel.get('description'));
                    return timeRange + _(escapedDescription).t();
                }
                return undefined;
            },

            render: function() {
                if ((this.groupDropdownView.settings.get('value') == CUSTOM_GROUP_OPTION['value']) && this.description) {
                    this.$el.find('.dmc-instances-description').html(this.description).show();
                }
                else {
                    this.$el.find('.dmc-instances-description').hide();
                }

                return this;
            }
        });
    });

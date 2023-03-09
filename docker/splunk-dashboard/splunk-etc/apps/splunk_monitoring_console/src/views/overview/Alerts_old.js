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
    'views/Base',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/utils',
    'splunkjs/mvc/dropdownview',
    'models/search/Job',
    'models/services/search/jobs/Result',
    'collections/services/saved/Searches',
    'views/shared/controls/SyntheticSelectControl',
    'splunk_monitoring_console/views/overview/util_old',
    'splunk.util',
    'splunk.config',
    'splunk.i18n',
    'uri/route',
    'contrib/text!splunk_monitoring_console/views/overview/Alerts.html',
    'contrib/text!splunk_monitoring_console/svg/Alert.svg'
],
function(
    $,
    _,
    Backbone,
    module,
    BaseView,
    SearchManager,
    TableView,
    utils,
    DropdownView,
    SearchJobModel,
    ResultModel,
    SavedSearchesCollection,
    SyntheticSelectControl,
    dmcUtil,
    util,
    config,
    i18n,
    route,
    Template,
    AlertIcon
){
    var root = (config.MRSPARKLE_ROOT_PATH.indexOf("/") === 0 ? config.MRSPARKLE_ROOT_PATH.substring(1) : config.MRSPARKLE_ROOT_PATH);

    return BaseView.extend({
        moduleId: module.id,
        id: 'smc-alerts-view-container',
        template: Template,
        initialize: function() {
            BaseView.prototype.initialize.apply(this, arguments);
            this.$el.html(this.compiledTemplate({
                alerts_setup_link: route.page(root, config.LOCALE, 'splunk_monitoring_console', 'monitoringconsole_alerts_setup'),
                AlertIcon: AlertIcon,
                serverInfo: this.model.serverInfo
            }));

            this.alertsFiredSearch = this._alertsSearchManager();

            this.alertsTableView = this._alertsTableView();

            var customInstanceRenderer = TableView.BaseCellRenderer.extend({
                canRender: function(cellData) {
                    return cellData.field === "Instance";
                },

                render: function($td, cellData) {
                    var sid = cellData.value;
                    var searchJob = new SearchJobModel({id: sid});
                    searchJob.fetch().done(function() {
                        var link_id = searchJob.entry.links.get("results");
                        var result = new ResultModel({id: link_id});
                        result.fetch().done(function() {
                            var instances = _.unique(result.results.map(function(instance) {
                                return instance.get('Instance')[0];
                            }));
                            var truncatedInstances = _.take(instances, 10);
                            var $instanceList = _.reduce(truncatedInstances, function(memo, instance) {
                                return memo + instance + '<br/>';
                            }, '');
                            if (instances.length > truncatedInstances.length) {
                                $instanceList += _('and ').t() + (instances.length - truncatedInstances.length) + _(' more instances ...').t();
                            }
                            $td.html($instanceList);
                        });
                    });
                }
            });

            this.customInstanceCellRenderer = new customInstanceRenderer;
            this.alertsTableView.addCellRenderer(this.customInstanceCellRenderer);
            this.alertsTableView.render();

            this.dropdownFilterByLast = this._dropdownFilterByLast();
            this.dropdownFilterByNumRows = this._dropdownFilterByNumRows();

            this._bindCountListener();
            this._bindFilterListener();
            this._bindFilterByNumRows();

            if(!this.model.serverInfo.isCloud() && !this.model.serverInfo.isLite()) {

                this.options.deferreds.distSearchGroupsDfd.then(function() {
                    if ((this.model.appLocal.entry.content.get('configured') == '0') && (this.collection.distSearchGroups.models.length === 0)) {
                        // standalone mode and not set up yet.
                        this.needsSetup();
                    }
                }.bind(this));
            }
        },

        _alertsSearchManager: function() {
            // search to grab all triggered alerts (defaulted to filter within last hour)
            return new SearchManager({
                id: 'alerts-fired-search',
                search: '| `dmc_get_all_triggered_alerts(1440)`',
                cancelOnUnload: true,
                app: utils.getCurrentApp()
            });
        },

        _alertsTableView: function() {
            // splunkjs table to display alerts
            return new TableView({
                id: "alerts-table",
                managerid: "alerts-fired-search",
                el: this.$("#alerts-fired-table-view"),
                wrap: "true",
                drilldown: "row",
                drilldownRedirect: false,
                // pagerPosition: "top", can move paginator to the top, but decided to just leave it at the bottom because it doesnt look good up there.
                pageSize: 5
            });
        },
        _handleAlertDrilldown: function(e) { // redirect to triggered alerts scoped to the one selected.
            e.preventDefault();

            // navigate DOM to retrieve alert name
            var alert_name = $(e.target).parent().children().first().text().trim();

            // construct the alert_id for the route url. double encoding necessary (lol)
            var alert_id = encodeURI(encodeURI('/servicesNS/nobody/splunk_monitoring_console/alerts/fired_alerts/'+alert_name));

            // monster helper method to construct url
            window.open(route.triggeredAlerts(root, config.LOCALE, 'splunk_monitoring_console', {'data': {'app': 'splunk_monitoring_console', 'owner': '-', 'serverity': '*', 'alerts_id': alert_id}}), "_blank");
        },

        _dropdownFilterByLast: function() {
            return new SyntheticSelectControl({
                model: null,
                modelAttribute: null,
                label: this.model.serverInfo.isLite() ? "" : _('Filter by Last:').t(),
                defaultValue: '1440',
                additionalClassNames: 'overview-alert-time-range-picker',
                items: [
                    { value: '60',  label: _('1 Hour').t()  },
                    { value: '240',  label: _('4 Hours').t()  },
                    { value: '1440',  label: _('24 Hours').t()  },
                    { value: '4320',  label: _('3 days').t()  },
                    { value: '10080',  label: _('7 days').t()  }
                ],
                save: false,
                elastic: true,
                menuWidth: "narrow",
                toggleClassName: 'btn-pill',
                popdownOptions: {attachDialogTo:'body'}
            });
        },
        _dropdownFilterByNumRows: function() {
            return new SyntheticSelectControl({
                model: null,
                modelAttribute: null,
                defaultValue: '5',
                additionalClassNames: 'overview-alert-count-per-page',
                items: [
                    { value: '5',  label: _('5 per page').t()  },
                    { value: '10',  label: _('10 per page').t()  },
                    { value: '15',  label: _('15 per page').t()  },
                    { value: '20',  label: _('20 per page').t()  },
                    { value: '25',  label: _('25 per page').t()  }
                ],
                save: false,
                elastic: true,
                menuWidth: "narrow",
                toggleClassName: 'btn-pill',
                popdownOptions: {attachDialogTo:'body'}
            });
        },

        _bindCountListener: function() {
            // count number of triggered alerts and replace number in DOM
            this.alertsFiredSearch.on("search:done", function(properties) {
                var count = properties.content.resultPreviewCount;
                if(count === 1) {
                    $('#smc-alerts-title').html(_("Triggered Alert").t());
                } else {
                    $('#smc-alerts-title').html(_("Triggered Alerts").t());
                }
                $('#smc-alerts-count').html(count);
            });
        },

        _bindFilterListener: function() {
            // re-render alerts table when filter value is changed
            this.dropdownFilterByLast.on('change', function(value) {
                this.alertsFiredSearch.set('search', '| `dmc_get_all_triggered_alerts('+value+')`');
            }.bind(this));
        },

        _bindFilterByNumRows: function() {
            // re-render alerts table when filter value is changed
            this.dropdownFilterByNumRows.on('change', function(value) {
                this.alertsTableView.settings.set('pageSize', value);
            }.bind(this));
        },

        events: {
            'click .smc-alerts-panel .shared-resultstable-resultstablerow': '_handleAlertDrilldown'
        },

        render: function() {
            this.$('.control-options').append(this.dropdownFilterByLast.render().el);
            this.$('.control-options').append(this.dropdownFilterByNumRows.render().el);
            this.$('#triggered-alerts-link').attr('href', route.triggeredAlerts(root, config.LOCALE, 'splunk_monitoring_console', {'data': {'eai:acl.app': 'splunk_monitoring_console', 'eai:acl.owner': '*', 'serverity': '*'}}));
            this.$('#smc-alerts-count').attr('href', route.triggeredAlerts(root, config.LOCALE, 'splunk_monitoring_console'));

            return this;
        },

        needsSetup: function() {
            this.$('.control-options').remove();
            this.$('#smc-alerts-count').remove();
            this.$('.details-row').html(
                '<h3 class="icon-alert"> ' +
                _("Alerts require setup. Please ").t() +
                ' <a href="' + dmcUtil.getFullPath('/app/splunk_monitoring_console/monitoringconsole_configure') + '">set up</a>' +
                _(" your instance first.").t() +
                '</h3>'
            ).css('text-align', 'center');
        }
    });
}
);

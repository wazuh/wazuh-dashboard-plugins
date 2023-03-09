define(
    [
        'jquery',
        'underscore',
        'backbone',
        '@splunk/swc-mc',
        'splunk_monitoring_console/models/splunk_health_check/Conductor',
        'splunk_monitoring_console/models/splunk_health_check/DmcConfigs',
        'splunk_monitoring_console/collections/splunk_health_check/Tasks',
        'splunk_monitoring_console/collections/services/AppLocals',
        'splunk_monitoring_console/views/splunk_health_check/Master'
    ],
    function(
        $,
        _,
        Backbone,
        SwcMC,
        ConductorModel,
        DmcConfigsModel,
        TasksCollection,
        AppLocalsCollection,
        MasterView
    ) {
        return SwcMC.BaseRouter.extend({
            initialize: function() {
                SwcMC.BaseRouter.prototype.initialize.apply(this, arguments);
                this.setPageTitle(_('Health Check').t());
                this.loadingMessage = _('Loading...').t();
                this.fetchAppLocals = true;
                
                /*
                 *  Collections
                 */
                this.collection.tasks = new TasksCollection();
                this.collection.appLocalsDisabled = new AppLocalsCollection();
                this.appLocalsDisabledFetchData = {
                    sort_key: 'name',
                    sort_dir: 'asc',
                    app: '-' ,
                    owner: this.model.application.get('owner'),
                    search: 'disabled=1',
                    count: -1
                };
                
                /*
                 *  Models
                 */
                this.model.classicurl = SwcMC.ClassicURLModel;
                this.model.dmcConfigs = new DmcConfigsModel({}, {
                    appLocal: this.model.appLocal,
                    serverInfo: this.model.serverInfo
                });
                // conductor serves as a central controller that tracks all kinds of states, also handles all kinds of
                // user actions.
                // conductor needs to know the tasks and dmcConfigs
                this.model.conductor = new ConductorModel({}, {
                    tasks: this.collection.tasks,
                    dmcConfigs: this.model.dmcConfigs
                });
            },
            
            /*
             * Parse tag, category, group, or app from the url.
             */
            parseUrl: function() {
                this.setConductor(
                    this.model.classicurl.get('tag'),
                    this.model.classicurl.get('category'),
                    this.model.classicurl.get('group'),
                    this.model.classicurl.get('app'));
                this.model.classicurl.clear();
                this.model.classicurl.save();
            },
            
            /*
             * Set tag, category, group, or app on the Conductor Model.
             */
            setConductor: function(urlTags, urlCategory, urlGroup, urlApp) {
                if (urlTags) {
                    urlTags = Array.isArray(urlTags) ? urlTags.join(',') : urlTags;
                    this.model.conductor.set('tag', urlTags);
                }
                if (urlCategory) {
                    urlCategory = Array.isArray(urlCategory) ? urlCategory.join(',') : urlCategory;
                    this.model.conductor.set('category', urlCategory);
                }
                if (urlGroup) {
                    urlGroup = Array.isArray(urlGroup) ? '*' : urlGroup;
                    this.model.conductor.set('group', urlGroup);
                }
                if (urlApp) {
                    urlApp = Array.isArray(urlApp) ? '*' : urlApp;
                    this.model.conductor.set('app', urlApp);
                }
            },

            page: function(locale, app, page) {
                SwcMC.BaseRouter.prototype.page.apply(this, arguments);
                Promise.all([
                    this.model.classicurl.fetch(),
                    this.model.dmcConfigs.fetch(),
                    this.collection.tasks.fetch({
                        // cannot move these to the collections default fetch option because that will break the
                        // sorting and pagination of the listing page
                        data: {
                            sort_key: 'category',
                            count: 0
                        }
                    }),
                    this.collection.appLocalsDisabled.fetch({
                        data: this.appLocalsDisabledFetchData,
                    }),
                    this.deferreds.pageViewRendered
                ]).then(function(){
                    if (this.shouldRender) {
                        $('.preload').replaceWith(this.pageView.el);

                        // Parsing URL tag parameter - used for anomalies table Investigate action
                        this.parseUrl();

                        this.masterView = new MasterView({
                            model: {
                                application: this.model.application,
                                conductor: this.model.conductor,
                                dmcConfigs: this.model.dmcConfigs
                            },
                            collection: {
                                tasks: this.collection.tasks,
                                appLocals: this.collection.appLocals,
                                appLocalsUnfilteredAll: this.collection.appLocalsUnfilteredAll,
                                appLocalsDisabled: this.collection.appLocalsDisabled
                            }
                        });
                        $('.main-section-body').html(this.masterView.render().$el);
                    }
                }.bind(this)).catch(function(response){
                    if (response.status === 402) {   // free or forwarder license
                        this.paywallView = new SwcMC.PaywallView({title: _('Alerts').t(), model:this.model});
                        $("#placeholder-main-section-body").html(this.paywallView.render().$el);
                    }
                }.bind(this));
            }
        });
    }
);
define(
    [
        'jquery',
        'underscore',
        '@splunk/swc-mc',
        'splunk_monitoring_console/models/splunk_health_check/DmcConfigs',
        'splunk_monitoring_console/collections/services/AppLocals',
        'splunk_monitoring_console/views/splunk_health_check_list/PageController'
    ],
    function(
        $,
        _,
        SwcMC,
        DmcConfigsModel,
        AppLocalsCollection,
        PageController
    ) {
        return SwcMC.BaseRouter.extend({
            initialize: function() {
                SwcMC.BaseRouter.prototype.initialize.apply(this, arguments);

                // this is needed
                this.fetchAppLocals = true;


                this.model.dmcConfigs = new DmcConfigsModel({}, {
                    appLocal: this.model.appLocal,
                    serverInfo: this.model.serverInfo
                });

                this.collection.appLocalsDisabled = new AppLocalsCollection();
                this.appLocalsDisabledFetchData = {
                    sort_key: 'name',
                    sort_dir: 'asc',
                    app: '-' ,
                    owner: this.model.application.get('owner'),
                    search: 'disabled=1',
                    count: -1
                };
            },
            page: function(locale, app, page) {
                SwcMC.BaseRouter.prototype.page.apply(this, arguments);

                this.setPageTitle(_('Health Check Items').t());

                Promise.all([
                    this.model.dmcConfigs.fetch(),
                    this.collection.appLocalsDisabled.fetch({
                        data: this.appLocalsDisabledFetchData,
                    }),
                    this.deferreds.pageViewRendered
                ]).then(function() {
                    $('.preload').replaceWith(this.pageView.el);

                    if (this.pageController) {
                        this.pageController.detach();
                    }
                    this.pageController = new PageController({
                        model: this.model,
                        collection: this.collection
                    });
                    this.pageView.$('.main-section-body').append(this.pageController.render().el);
                }.bind(this));
            }
        });
    }
);
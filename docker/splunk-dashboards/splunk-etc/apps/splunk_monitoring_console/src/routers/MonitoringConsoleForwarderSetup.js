define([
    'jquery',
    'underscore',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/settings/forwarder_setup/enterprise/Master',
    'splunk_monitoring_console/views/settings/forwarder_setup/lite/Master',
], function ($, _, SwcMC, MasterView, MasterLightView) {
    return SwcMC.BaseRouter.extend({
        initialize: function () {
            SwcMC.BaseRouter.prototype.initialize.apply(this, arguments);
            this.setPageTitle(_('Forwarder Setup').t());
            this.loadingMessage = _('Loading...').t();

            this.collection.searchesCollection = new SwcMC.SavedSearchesCollection();
            this.deferreds.searchesCollectionDfd = new Promise(
                function (resolve, reject) {
                    this.collection.searchesCollection
                        .fetch({
                            data: {
                                app: 'splunk_monitoring_console',
                                owner: '-',
                                search: 'name="DMC Forwarder - Build Asset Table"',
                            },
                        })
                        .done(
                            function () {
                                resolve();
                            }.bind(this)
                        );
                }.bind(this)
            );
        },
        page: function (locale, app, page) {
            SwcMC.BaseRouter.prototype.page.apply(this, arguments);
            this.pagePromise = Promise.all([this.deferreds.searchesCollectionDfd, this.deferreds.pageViewRendered]);
            this.pagePromise.then(
                function () {
                    if (this.shouldRender) {
                        $('.preload').replaceWith(this.pageView.el);
                        if (this.model.serverInfo.isLite()) {
                            if (!this.collection.searchesCollection.models[0].entry.content.get('disabled')) {
                                document.location.href = SwcMC.URIRoute.page(
                                    this.model.application.get('root'),
                                    locale,
                                    app,
                                    'forwarder_overview'
                                );
                            } else {
                                $('.main-section-body').html(
                                    new MasterLightView({
                                        model: {
                                            application: this.model.application,
                                            savedSearch: this.collection.searchesCollection.models[0],
                                        },
                                    }).render().$el
                                );
                            }
                        } else {
                            $('.main-section-body').html(
                                new MasterView({
                                    model: {
                                        application: this.model.application,
                                        savedSearch: this.collection.searchesCollection.models[0],
                                    },
                                }).render().$el
                            );
                        }
                    }
                }.bind(this)
            );
        },
    });
});

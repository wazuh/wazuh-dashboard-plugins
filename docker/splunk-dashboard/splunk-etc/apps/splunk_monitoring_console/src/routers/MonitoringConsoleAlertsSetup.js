define(
    [
        'underscore',
        'jquery',
        'backbone',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/settings/dmc_alerts_setup/enterprise/PageController',
        'splunk_monitoring_console/views/settings/dmc_alerts_setup/lite/PageController'
    ],
    function(
        _,
        $,
        Backbone,
        SwcMC,
        PageControllerEnt,
        PageControllerLight
    ) {
        return SwcMC.BaseRouter.extend({
            initialize: function() {
                SwcMC.BaseRouter.prototype.initialize.apply(this, arguments);
            },

            page: function(locale, app, page) {
                SwcMC.BaseRouter.prototype.page.apply(this, arguments);

                if (this.model.serverInfo.isLite()) {
                    this.setPageTitle(_('Platform Alerts Setup').t());
                }
                else {
                    this.setPageTitle(_('Alerts Setup').t());
                }

                this.deferreds.pageViewRendered.then(_(function() {
                    $('.preload').replaceWith(this.pageView.el);

                     if (this.pageController) {
                         this.pageController.detach();
                     }

                     var pageController = (this.model.serverInfo.isLite()) ? PageControllerLight : PageControllerEnt;
                     this.pageController = new pageController({
                         model: this.model,
                         collection: this.collection
                     });
                     this.pageView.$('.main-section-body').append(this.pageController.render().el);

                 }).bind(this));
            }
        });
    }
);
define(
    [
        'underscore',
        'jquery',
        'backbone',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/settings/overview_preferences/PageController'
    ],
    function(
        _,
        $,
        Backbone,
        SwcMC,
        PageController
    ) {
        return SwcMC.BaseRouter.extend({
            page: function(locale, app, page) {
                SwcMC.BaseRouter.prototype.page.apply(this, arguments);

                this.setPageTitle(_('Overview Preferences').t());
                
                this.deferreds.pageViewRendered.then(function() {
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
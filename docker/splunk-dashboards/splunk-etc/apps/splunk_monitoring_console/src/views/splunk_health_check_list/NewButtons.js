define([
    'underscore',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/Download'
], function (
    _,
    module,
    SwcMC,
    DownloadView
) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,

        events: {
            'click .new-entity-button': function(e) {
                if (!this.options.editLinkHref) {
                    e.preventDefault();
                    this.onNewEntityButton();
                }
            }
        },

        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);

            if (this.model.application.get('app') === 'splunk_monitoring_console') {
                this.children.downloadView = new DownloadView({
                    model: {
                        application: this.model.application
                    },
                    collection: {
                        appLocalsUnfilteredAll: this.collection.appLocalsUnfilteredAll,
                        appLocalsDisabled: this.collection.appLocalsDisabled
                    }
                });
            }
        },

        onNewEntityButton: function() {
            this.model.controller.trigger("editEntity");
        },

        render: function () {
            this.$el.html(this.compiledTemplate({
                entitySingular: this.options.entitySingular,
                editLinkHref: this.options.editLinkHref || '#'
            }));
            if (this.model.application.get('app') === 'splunk_monitoring_console') {
                this.$('.button-group').prepend(this.children.downloadView.render().$el);
            }

            return this;
        },

        template: '\
        <div class="button-group">\
            <a href="<%- editLinkHref %>" class="btn btn-primary new-entity-button"><%- _("New ").t() + entitySingular %></a>\
        </div>\
        '
    });
});


/**
 * TODO: This file is copied for short term because we couldn’t use it together
 * with dashboards due to swc-mc bringing in duplicate dependencies which
 * caused errors. Need to rmeove this after the issue is resolved.
 */
define([
    'jquery',
    'module',
    'views/Base',
    'splunk_monitoring_console/views/instances/components/ViewMenu_old'
], function(
    $,
    module,
    BaseView,
    ViewMenu
) {
    return BaseView.extend({
        moduleId: module.id,
        initialize: function() {
            BaseView.prototype.initialize.apply(this, arguments);
            this.children.viewMenu = new ViewMenu({
                instance: this.options.instance,
                earliest: this.options.earliest,
                latest: this.options.latest,
                roles: this.options.roles
            });
        },
        events: {
            'mousedown .dmc-view-menu': 'toggleViewMenu',
            'mouseup .dmc-view-menu': function(e) {
                e.preventDefault();
            }
        },
        toggleViewMenu: function(e) {
            e.preventDefault();
            this.children.viewMenu.show($(e.target));
        },
        render: function() {
            this.$el.html(this.compiledTemplate());
            this.children.viewMenu.render().$el.appendTo($('body'));
        },
        template:
                '<div class="dmc-action-cell">' + 
                    '<a class="dmc-view-menu" href="#">' +
                        '<%= _("Views").t() %>' +
                        '<span class="caret"></span>' +
                    '</a>' +
                '</div>'
    });
});

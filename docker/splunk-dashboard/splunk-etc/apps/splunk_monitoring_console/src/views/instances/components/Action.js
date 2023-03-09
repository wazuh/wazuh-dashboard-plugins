/**
 * Created by ykou on 8/5/14.
 */
define([
    'jquery',
    'module',
    '@splunk/swc-mc',
    'splunk_monitoring_console/views/instances/components/ViewMenu'
], function(
    $,
    module,
    SwcMC,
    ViewMenu
) {
    return SwcMC.BaseView.extend({
        moduleId: module.id,
        initialize: function() {
            SwcMC.BaseView.prototype.initialize.apply(this, arguments);
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
define([
    'jquery',
    'module',
    '@splunk/swc-mc'
], function (
    $,
    module,
    SwcMC
) {
    /**
     * the reason we have custom ActionCell is because we need the "enable/disable" button. 
     */
    return SwcMC.BaseManagerActionCellView.extend({
        moduleId: module.id,
        events: $.extend({}, SwcMC.BaseManagerActionCellView.prototype.events, {
            'click .disable-action': function(e) {
                e.preventDefault();
                this.model.controller.trigger("disableEntity", this.model.entity);
            },
            'click .enable-action': function(e) {
                e.preventDefault();
                this.model.controller.trigger("enableEntity", this.model.entity);
            }
        }),

        prepareTemplate: function() {
            return {
                isDisabled: SwcMC.GeneralUtils.normalizeBoolean(this.model.entity.entry.content.get('disabled'))
            };
        },

        template: '<a href="#" class="entity-action edit-action"><%- _("Edit").t() %></a>' +
                  '<a href="#" class="entity-action delete-action"><%- _("Delete").t() %></a>' +
                  '<% if (isDisabled) { %>' +
                    '<a href="#" class="entity-action enable-action"><%- _("Enable").t() %></a>' +
                  '<% } else { %>' +
                    '<a href="#" class="entity-action disable-action"><%- _("Disable").t() %></a>' +
                  '<% } %>'
    });
});
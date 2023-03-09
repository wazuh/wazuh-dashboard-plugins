/**
 * This is a abstract model, which serves as a central location to provide all MC configuration information. 
 * 
 * The reason we need this model is because, MC settings are spread into several locations, which is inconvenient to 
 * manage, and we may change the underlining architecture later. This model provides a layer that abstract all these 
 * details. 
 * 
 * Right now this model contains information from the following data sources: 
 * - app.conf   
 *      the is_configured attribute indicates whether MC is in standalone mode or distributed mode. 
 * - /services/search/distributed/groups
 *      the groups with dmc_ prefix are MC groups, which are used to scope "| rest" searches.
 */
define([
    'jquery',
    'backbone',
    'splunk_monitoring_console/collections/DistsearchGroups',
    '@splunk/swc-mc'
], function(
    $,
    Backbone,
    DistsearchGroupsCollection,
    SwcMC
) {
    return Backbone.Model.extend({
        initialize: function(attributes, options) {
            Backbone.Model.prototype.initialize.apply(this, arguments);
            
            // get appLocal from the base router instead of doing fetch by ourselves. The reason is, appLocal is special,
            // base router has some special logic to handle it, refer to bootstrapAppLocal() function in routers/Base.js
            this.appLocal = options.appLocal;
            this.serverInfo = options.serverInfo;
            this.distsearchGroups = new DistsearchGroupsCollection();
        },
        
        fetch: function() {
            return this.distsearchGroups.fetch();
        },

        isDistributedMode: function() {
            return SwcMC.GeneralUtils.normalizeBoolean(this.appLocal.entry.content.get('configured'));
        },

        /**
         * useful only in distributed mode.
         */
        getDistsearchGroups: function() {
            return this.distsearchGroups.models;
        },

        getLocalInstanceName: function() {
            return this.serverInfo.getServerName();
        }
    });
});
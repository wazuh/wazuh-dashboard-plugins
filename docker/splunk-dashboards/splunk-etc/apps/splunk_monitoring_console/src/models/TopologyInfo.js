// This is another shim around an endpoint that should exist to give summary statistics
// of the topology
define(
    [
        'underscore',
        'backbone',
        'splunk_monitoring_console/collections/Instances'
    ],
    function(
        _,
        Backbone,
        InstancesCollection
    ) {
        return Backbone.Model.extend({
            initialize: function() {
                Backbone.Model.prototype.initialize.apply(this, arguments);
                this._instances = new InstancesCollection();
                this.entry = new Backbone.Model();
                this.entry.content = new Backbone.Model();
                this.entry.content.set({
                    'customGroups': [],
                    'indexerClusters': [],
                    'searchHeadClusters': []
                });
            },

            fetch: function(options) {
                return this._instances.fetch({
                    'count': 0,
                    'offset': 0
                }).done(function() {
                    var customGroups,
                        indexerClusters,
                        searchHeadClusters;

                    customGroups = _.uniq(
                        _.flatten(
                            this._instances.map(function(instance) {
                                return instance.entry.content.get('customGroups');
                            })
                        )
                    );
                    indexerClusters = _.uniq(
                        _.flatten(
                            this._instances.map(function(instance) {
                                return instance.entry.content.get('indexerClusters');
                            })
                        )
                    );
                    searchHeadClusters = _.uniq(
                        _.flatten(
                            this._instances.map(function(instance) {
                                return instance.entry.content.get('searchHeadClusters');
                            })
                        )
                    );

                    this.entry.content.set({
                        customGroups: customGroups,
                        indexerClusters: indexerClusters,
                        searchHeadClusters: searchHeadClusters
                    });
                }.bind(this));
            }
        });
    }
);
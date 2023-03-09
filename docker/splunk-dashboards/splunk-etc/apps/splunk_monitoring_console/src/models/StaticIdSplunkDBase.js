define(
    [
        'underscore',
        '@splunk/swc-mc'
    ],
    function(_, SwcMC){
        var Model = SwcMC.SplunkDBaseModel.extend(
            {
                initialize: function() {
                    SwcMC.SplunkDBaseModel.prototype.initialize.apply(this, arguments);
                },
                defaults: function() {
                    // do a dynamic lookup of the current constructor so that this method is inheritance-friendly
                    var RootClass = this.constructor,
                        id = RootClass.id,
                        extendedDefaults = {},
                        defaults;

                    if (!id) {
                        throw new Error('You must set a class level id for this model.');
                    }

                    if (_.isFunction(SwcMC.SplunkDBaseModel.prototype.defaults)){
                        defaults = SwcMC.SplunkDBaseModel.prototype.defaults.apply(this, arguments);
                    } else {
                        defaults = SwcMC.SplunkDBaseModel.prototype.defaults || {};
                    }

                    extendedDefaults = _.extend({}, defaults);
                    extendedDefaults[this.idAttribute] = id;
                    return extendedDefaults;
                },
                clear: function(options) {
                    options = options || {};
                    var RootClass = this.constructor;
                    BaseModel.prototype.clear.call(this, options);

                    //always enforce that the id is set
                    if (!options.setDefaults) {
                        this.set(this.idAttribute, RootClass.id);
                    }

                    return this;
                }
            },
            {
                id: ""
            }
        );

        return Model;
    }
);

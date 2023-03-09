var _ = require('lodash');

/**
 * Merges multiple webpack config objects, concating arrays.
 *
 * @param {...Object} arguments Two or more webpack config objects to be merged.
 * @returns {Object}
 * @type {Function}
 */
module.exports = function mergeConfigs() {
    var args = _.toArray(arguments);
    // Start with a new object to avoid mutating shared assets
    args.unshift({});
    args.push(merger);
    var mergedConfig = _.mergeWith.apply(null, args);

    // dedup loaders
    if (mergedConfig.module && mergedConfig.module.loaders) {
        mergedConfig.module.loaders = _.uniq(mergedConfig.module.loaders, function(loader) {
            return loader.test.source;
        });
    }
    
    return mergedConfig;
};

function merger(a, b) {
    if (_.isArray(a) && _.isArray(b)) {
        return b.concat(a);
    }

    if (_.isArray(b)) {
        return b;
    }
}

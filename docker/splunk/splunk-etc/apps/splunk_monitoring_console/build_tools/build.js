var mergeConfigs = require('./util/mergeConfigs');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var webpack = require('webpack');

var outputOptions = {
    colors: true,
    assets: true,
    hash: false,
    timings: true,
    version: false,
    chunks: false,
    chunkModules: false,
    chached: false,
    reasons: false,
    source: false,
};

if (require.main === module) {
    main();
}

function main() {
    var program = require('commander');
    program
        .version('0.0.1')
        .description(
            'A utility for building splunk apps\n\nconfig file can export a webpack config object or a function that will take config args as params and return a webpack config object'
        )
        .arguments('<path-to-config> [config-args]')
        .option('-w, --watch', 'use watch mode')
        .option('-d, --dev', 'use dev mode')
        .option('-p, --prod', 'build production files')
        .option('-f, --filter <RegExp>', 'only build files matching the supplied regular expression')
        .option('-r, --live-reload', 'use live reload')
        .option('-l, --log', 'log build stats')
        .option('--splunkVersion <n>', 'supply version number')
        .allowUnknownOption(false)
        .parse(process.argv);

    var args = parseArgs(program.args);
    var options = program.opts();
    options.configArgs = args.configArgs;
    run(args.configPath, options);
}

/**
 * run - Starts a webpack build process for the provided config and options
 *
 * @param  {String} configPath
 * @param  {Object} [options] Run command line with --help for supported options
 */
function run(configPath, options) {
    options = options || {};

    var configsToMerge = [];

    if (options.liveReload) {
        configsToMerge.push(require('./profiles/common/liveReload.config'));
    }

    if (options.dev) {
        process.env.NODE_ENV = 'development';
        configsToMerge.push(getDevConfig(configPath));
    } else if (options.prod) {
        process.env.NODE_ENV = 'production';
        configsToMerge.push(getProdConfig(configPath));
    }

    var config;
    var profileConfig = getProfileConfig(configPath, options);
    if (_.isArray(profileConfig)) {
        config = profileConfig.map(c => mergeConfigs.apply(null, configsToMerge.concat(c)));
    } else {
        config = mergeConfigs.apply(null, configsToMerge.concat(profileConfig));
    }

    function handler(err, stats) {
        if (err) throw err;

        if (options.log) {
            logStats(stats, configPath, options);
        }
        console.log('\n' + stats.toString(outputOptions));

        if (!options.watch && stats.hasErrors()) {
            process.exit(1);
        }
    }

    var compiler = webpack(config);

    if (options.watch) {
        compiler.watch({}, handler);
    } else {
        compiler.run(handler);
    }
}

function logStats(stats, configPath, options) {
    var logDir = path.join(__dirname, 'logs');
    fs.mkdir(logDir, function(err) {
        if (err && err.code != 'EEXIST') throw err;

        // Build filePath
        var env = options.dev ? 'dev' : 'prod';
        var configName = path.basename(configPath, '.config.js');
        var buildInfo = [configName, env, Date.now()].join('.');
        var fileName = 'buildStats.' + buildInfo + '.json';
        var filePath = path.join(logDir, fileName);

        // Get file contents
        var jsonStats = JSON.stringify(stats.toJson(), null, 2);

        // Write file
        fs.writeFile(filePath, jsonStats, function(err) {
            if (err) throw err;
        });
    });
}

function getProfileConfig(configPath, options) {
    var config;
    if (path.isAbsolute(configPath)) {
        config = require(configPath);
    } else {
        config = require(path.resolve(configPath));
    }
    if (_.isFunction(config)) {
        return config.apply(null, options.configArgs.concat(options));
    } else {
        return config;
    }
}

/**
 * getFirstResolvedModule - Returns the first module successfully resolved from
 * the given array of paths.
 *
 * @param  {String[]} paths         An array of paths to attempt to resolve.
 * @param  {String} [errorMessage]  An optional error message if none of the
 *                                  paths resolve.
 * @return {Module}
 * @throws {Error}                  If unable to resolve any of the provided
 *                                  paths.
 */
function getFirstResolvedModule(paths, errorMessage) {
    for (var i = 0; i < paths.length; i++) {
        try {
            return require(paths[i]);
        } catch (exception) {
            if (exception.code !== 'MODULE_NOT_FOUND') throw exception;
        }
    }
    throw new Error(errorMessage || 'Module not found');
}

function getProdConfig(configPath) {
    var configDir = path.dirname(configPath);
    var configFile = path.basename(configPath);
    var configName = 'prod.config.js';
    var paths = [
        path.resolve(configDir, 'env', configName),
        path.resolve(configDir, configName),
        path.join(__dirname, 'profiles', 'common', configName),
    ];
    if (_.includes(configFile, 'config')) {
        paths.unshift(path.resolve(configDir, configFile.replace('config', 'prod')));
    }
    return getFirstResolvedModule(paths, 'Production config not found');
}

function getProdDebugConfig(configPath) {
    var paths = [path.join(__dirname, 'profiles', 'common', 'prod_debug.config.js')];
    return getFirstResolvedModule(paths, 'Production debug config not found');
}

function getDevConfig(configPath) {
    var configDir = path.dirname(configPath);
    var configFile = path.basename(configPath);
    var localConfigName = 'dev.local.config.js';
    var defaultConfigName = 'dev.config.js';
    var paths = [
        path.resolve(configDir, 'env', localConfigName),
        path.resolve(configDir, 'env', defaultConfigName),
        path.resolve(configDir, localConfigName),
        path.resolve(configDir, defaultConfigName),
        path.join(__dirname, 'profiles', 'common', localConfigName),
        path.join(__dirname, 'profiles', 'common', defaultConfigName),
    ];
    if (_.includes(configFile, 'config')) {
        paths.unshift(path.resolve(configDir, configFile.replace('config', 'dev')));
    }
    return getFirstResolvedModule(paths, 'Dev config not found');
}

function parseArgs(args) {
    if (args.length === 0) {
        logError('  error: missing required argument <path-to-config>');
    }
    return {
        configPath: args[0],
        configArgs: args.slice(1),
    };
}

function logError(message) {
    console.error();
    console.error(message);
    console.error();
    process.exit(1);
}
module.exports = run;

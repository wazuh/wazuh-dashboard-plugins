/**
 * Changes the initial `define` call of an amd module to a `require` call in the output.
 *
 * Splunk expects dashboard extensions to be self executing, so the initial module
 * should be executed rather than just defined. This is a very naive plugin that
 * simply changes the amd output of the module to a require statement from define.
 *
 * @param {String[]} [whitelist] - A list of entry modules to apply this plugin to.
 * If not provided, plugin is applied to all entries.
 */
function DashboardExtensionOutputPlugin(whitelist) {
    // TODO: Implement support for a RegEx whitelist
    this.whitelist = whitelist;
}

DashboardExtensionOutputPlugin.prototype.apply = function(compiler) {
    var processChunk = this.processChunk.bind(this);
    compiler.hooks.compilation.tap('DashboardExtensionOutputPlugin', compilation => {
        compilation.mainTemplate.hooks.renderWithEntry.tap(
            'DashboardExtensionOutputPlugin',
            processChunk
        );
    });
};

DashboardExtensionOutputPlugin.prototype.processChunk = function(source, chunk, hash) {
    if (!this.whitelist || this.whitelist.indexOf(chunk.name) > -1) {
        // TODO: handle `define(function() { ... })`, convert to `require([], function() { ... })`
        source.children[0] = source.children[0].replace(/^define/, 'require');
    }
    return source;
};

module.exports = DashboardExtensionOutputPlugin;

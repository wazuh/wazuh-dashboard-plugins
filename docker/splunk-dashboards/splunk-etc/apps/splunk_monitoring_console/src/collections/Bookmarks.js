define(
	[
		'underscore',
		'splunk_monitoring_console/models/Bookmark',
		'@splunk/swc-mc'
	],
	function(
		_,
		Model,
		SwcMC
	) {
        return SwcMC.SplunkDsBaseCollection.extend({
            url: 'saved/bookmarks/monitoring_console',
            model: Model,
            initialize: function() {
                SwcMC.SplunkDsBaseCollection.prototype.initialize.apply(this, arguments);
            },
            fetch: function(options) {
                options = _.defaults(options || {}, { count: 0 });
                options.data = _.defaults(options.data || {}, {
                    app: 'splunk_monitoring_console',
                    owner: 'nobody',
                    count: -1,
                });

                return SwcMC.SplunkDsBaseCollection.prototype.fetch.call(this, options);
            },
            getBookmarks: function() {
                var bookmarkArray = [];
                this.map(function(bookmark) {
                    if (!bookmark.entry.content.attributes.disabled) {
                        var item = {
                            id: bookmark.entry.attributes.name,
                            label: bookmark.entry.attributes.name,
                            url: bookmark.entry.content.attributes.url,
                        };
                        bookmarkArray.push(item);
                    }
                });
                return bookmarkArray;
            },
        });

	}
);

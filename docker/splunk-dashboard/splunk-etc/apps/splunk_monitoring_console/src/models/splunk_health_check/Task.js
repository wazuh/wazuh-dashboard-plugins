/**
 * Created by ykou on 9/23/15.
 */
define(
[
    'jquery',
    'underscore',
    'backbone',
    '@splunk/swc-mc'
],
function(
    $,
    _,
    Backbone,
    SwcMC
) {
    /**
     * A Backbone Model that only exists on client-side to aggregate info from checklist.conf and 
     *
     * **************************************************
     * Decided to implement both promise and events:
     *  - promise is for the waterfall flow control and the Conductor (this is more intuitive, but needs to think about how to pause the waterfall)
     *  - events are for views to render (event will just be the change event of 'status' attribute on this model)
     * **************************************************
     *
     */
    var STATUS = {
        READY: 'ready',
        RUNNING: 'running',
        DONE: 'done'
    };

    return Backbone.Model.extend({
        /**
         * @attributes  {Object}    not used for now
         * @options     {Object}
         * @options._checklistItem   {Model}     model fetched from the checklist.conf file
         */

        defaults: {
            status: STATUS.READY
        },

        initialize: function(attributes, options) {
            Backbone.Model.prototype.initialize.call(this, attributes, options);

            if (options && options.checklistItem) {
                this._checklistItem = options.checklistItem;
            }

            this._searchManager = new SwcMC.SearchManager({
                'autostart': false,
                'app': this.getApp()
            });

            // TODO: using native Promise as soon as it becomes available.
            // the basic idea here is to wrap the search manager and search result into
            // Promises, the reason is, the search manager is only expose events as its
            // state, it's hard to track the search manager's current state.
            this._taskDfd = $.Deferred();

            // expose taskPromise so the conductor knows when a task completes. It is a promise so that the outside world cannot resolve/reject it.
            this.taskPromise = this._taskDfd.promise();

            this.taskPromise.then(function() {
                this.set('status', STATUS.DONE);
            }.bind(this));

            // TODO: stop listening when needed.
            this._searchManager.on({
                'search:done': this._handleSearchDone,
                'search:cancelled search:error search:failed': this._handleSearchErrorFailCancel
            }, this);
        },

        _handleSearchDone: function(properties) {
            var managerDataParams = {
                count: 0
            };
            var resultModel = this._searchManager.data('results', managerDataParams);
            if (properties.content.resultCount <= 0) {
                this.fabricateResult({
                    'severity_level': -1,
                    'reason': _('This health check may be invalid for this environment.').t()
                });

                this._taskDfd.resolve();
            }
            else {
                resultModel.on('data', function() {
                    // TODO: validate search result conforming to the format in checklist.conf.spec
                    this._result = resultModel.collection();
                    this._taskDfd.resolve();
                }, this);
            }
        },

        _handleSearchErrorFailCancel: function() {
            // fake search result in the same format of normal search result
            this.fabricateResult({
                'severity_level': 3,
                'reason': _('search job stopped unexpectedly').t()
            });

            this._taskDfd.resolve();
        },

        /**
         * @param {string} group    group is for distributed mode only.
         */
        start: function(group) {
            this._searchManager.settings.set({
                search: this._getSearchString(group)
            });

            this._searchManager.startSearch();

            this.set('status', STATUS.RUNNING);

            return this.taskPromise;
        },

        getResult: function() {
            return this._result;
        },

        /**
         *
         * @param {string} group
         * @returns {string}
         * @private
         */
        _getSearchString: function(group) {
            var search = '';

            if (!group) {
                // single-instance mode
                // NOTE: current design is, if DMC health check is in standalone mode, we only check against local instance,
                // if in distirubted mode, we only check against a group of instances. It does not support checking against
                // a single instance in distributed mode.
                search = this._checklistItem.entry.content.get('search')
                    .replace(/\$rest_scope\$/g, 'splunk_server=local')
                    .replace(/\$hist_scope\$/g, '');
            }
            else {
                // multi-instance mode
                search = this._checklistItem.entry.content.get('search')
                    .replace(/\$rest_scope\$/g, 'splunk_server_group=' + group)
                    .replace(/\$hist_scope\$/g, 'search_group=' + group);
            }

            return search;
        },

        getID: function() {
            return this._checklistItem.get('id');
        },

        getTitle: function() {
            return this._checklistItem.entry.content.get('title');
        },

        getCategory: function() {
            return this._checklistItem.entry.content.get('category');
        },

        getDesc: function() {
            return this._checklistItem.entry.content.get('description');
        },

        getFailText: function() {
            return this._checklistItem.entry.content.get('failure_text');
        },

        getSuggestedAction: function() {
            return this._checklistItem.entry.content.get('suggested_action');
        },

        getDocLink: function() {
            return this._checklistItem.entry.content.get('doc_link');
        },

        getDocTitle: function() {
            return this._checklistItem.entry.content.get('doc_title');
        },

        getDrilldown: function() {
            return this._checklistItem.entry.content.get('drilldown');
        },
        
        getEnvironmentsToExclude: function() {
            return this._checklistItem.entry.content.get('environments_to_exclude');  
        },

        getTags: function() {
            // Sort the list of taks alphabetically before returning it.
            var tags = this._checklistItem.entry.content.get('tags') || '';
            var sortedTags = [];

            tags = tags.split(',').map(function(tag) {
                return tag.trim();
            });

            _.each(tags, function(tag){
                sortedTags.push(tag);
            }, this);

            sortedTags.sort();
            sortedTags = sortedTags.join(', ');

            return sortedTags;
        },

        getApp: function() {
            if (this._checklistItem && this._checklistItem.entry &&
                this._checklistItem.entry.content) {
                var checklistItemAppName = this._checklistItem.entry.content.get('eai:appName');
                if (checklistItemAppName === 'splunk_health_assistant_addon') {
                    // Special exception for splunk_health_assistant_addon to run in the MC context.
                    return 'splunk_monitoring_console';
                }
                return checklistItemAppName;
            }
            return '';
        },

        getSeverityLevel: function() {
            if (this.taskPromise.state() !== 'resolved') {
                return 0;   // task haven't completed yet
            }
            else {
                return this._getSeverityLevel();
            }
        },

        /**
         * this function doesn't check whether this._searchDfd is resolved, so make sure the result is ready.
         * @returns {Number}
         * @private
         */
        _getSeverityLevel: function() {
            // this is to handle there are multiple rows
            var instanceWithHighestSeverity = this._result.max(function(row) {
                var severity_level = -1;
                if (!_.isUndefined(row.get('severity_level')) && !_.isNull(row.get('severity_level'))) {
                    severity_level = row.get('severity_level');
                }
                return parseInt(severity_level, 10);
            });
            var sevLevel = instanceWithHighestSeverity.get('severity_level');
            return parseInt(((!_.isUndefined(sevLevel) && !_.isNull(sevLevel)) ? sevLevel : -1), 10);
        },

        getSearchManagerId: function() {
            return this._searchManager.id;
        },

        getReasonSummary: function() {
            if (this.taskPromise.state() !== 'resolved') {
                return {};
            }

            return this._result.countBy(function(instance) {
                var sevLevel = instance.get('severity_level');
                return parseInt(((!_.isUndefined(sevLevel) && !_.isNull(sevLevel)) ? sevLevel : -1), 10);
            });
        },

        isReady: function() {
            return this.get('status') === STATUS.READY;
        },
        
        isRunning: function() {
            return this.get('status') === STATUS.RUNNING;
        },

        isDone: function() {
            return this.get('status') === STATUS.DONE;
        },

        /**
         * Need to fabricate result when the search failed/error/cancelled whatever, to guarantee the task always has a result
         * The format of search result is, one model per row, each field will be an attribute key in the model
         *
         * @param result {Backbone.Model | Object}   the faked result to be added to this._result
         */
        fabricateResult: function(result) {
            this._result = new Backbone.Collection();
            this._result.add(result);

            /**
             * the search result is row-major based, so it looks like this:
             * {
             *   fields: ['instance', 'severity_level']
             *   rows: [
             *           [spl-serv-01, 3]
             *         ]
             * }
             */
            var fields = _.map(result, function(value, key) {
                return key;
            });
            var rows = [_.map(result, function(value) {
                return value;
            })];
            this._result.raw = {
                fields: fields,
                rows: rows
            };
        }
    });
});
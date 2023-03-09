/**
 * Created by ykou on 9/25/15.
 */
define([
    'jquery',
    'backbone'
], function (
    $,
    Backbone
) {
    /**
     * This conductor should be the actual controller of the MC health check page, it keeps track of all the states,
     * such as total count, checked count, group name, tag name, etc.
     *
     * I chose to use Backbone.Model instead of Backbone.View as controller, because all we need is to track states and
     * perform actions when states change, so I feel Backbone.Model is good for this use case.
     */
     var STATE = {
        RUNNING: 'running',
        STOPPING: 'stopping',
        STOPPED: 'stopped',
        DONE: 'done'
    };

    return Backbone.Model.extend({
        initialize: function(attributes, options) {
            Backbone.Model.prototype.initialize.call(this, attributes, options);

            this._tasks = options.tasks;
            this._dmcConfigs = options.dmcConfigs;

            this._tasks.fetchPromise.done(this.setTotal.bind(this));

            this.on('change:group', this.resetTasks);

            this.on('change:app', this.resetTasks);

            this.on('change:tag', this.resetTasks);

            this.on('change:category', this.resetTasks);

            this.listenTo(this._tasks, 'reset', this.setTotal.bind(this));
        },

        defaults: {
            total: 0,
            checked: 0,
            group: '*',
            app: '*',
            tag: '',
            category: '',
            state: STATE.STOPPED
        },

        getState: function() {
            return this.get('state');
        },

        start: function() {
            //If we are stopping then we need to wait
            if (this.getState() === STATE.STOPPING) {
                this._stopPromise.done(this.start.bind(this));
                return;
            }

            if (this.get('checked') >= this.get('total')) {
                // no more check
                this.set('state', STATE.DONE);
                this._tasks.setCanonicalTasks();
                this._tasks.sortBy('results', 'desc');
                this.trigger('showFilters');
                return;
            }

            this.set('state', STATE.RUNNING);

            var group = this._dmcConfigs.isDistributedMode() ? this.get('group') : null;
            var task = this.getNextTask();

            task.start(group).then(function(deduction) {
                this.set('checked', this.get('checked') + 1);

                // start next check only when the checking hasn't been stopped
                if (this.getState() === STATE.RUNNING) {
                    this.start();
                }

                // make sure to return the original argument, otherwise other then callbacks will not be able to get this value
                return deduction;
            }.bind(this));
        },

        // NOTE 1: this function will not call the pause() function of SearchManager, which means, DMC health check pauses
        // only when a search is finished, it will not pause a running search.
        // NOTE 2: this is async
        stop: function() {
            this.set('state', STATE.STOPPING);

            var task = this.getNextTask();

            this._stopPromise = (task && task.isRunning()) ? task.taskPromise : $.Deferred().resolve();
            this._stopPromise.done(function() {
                this.set('state', STATE.STOPPED);
            }.bind(this));
            return this._stopPromise;
        },

        // name this to avoid confusion of 'unset' function in Backbone.Model and 'reset' function in Backbone.Collection
        resetConductor: function() {
            return this.stop().done(function() {
                this.set({
                    checked: 0
                });
                this.resetTasks();
            }.bind(this));
        },

        restart: function() {
            this.resetConductor();
            this.start();
        },

        exportResults: function() {
            // TODO(claral): export the Health Check results, probably in a pdf doc?
        },

        setTotal: function() {
            this.set('total', this._tasks.length);
        },

        resetTasks: function() {
            var environment = this._dmcConfigs.isDistributedMode() ? 'distributed' : 'standalone';
            this._tasks.resetByFilters(this.get('group'), this.get('app'), this.get('tag'), this.get('category'), environment);
        },

        getNextTask: function() {
            // the good thing about this is, the 'checked' attribute serves double purposes:
            // - it is the count of tasks finished.
            // - it is the index of task to be run next.
            return this._tasks.at(this.get('checked'));
        }
    });
});
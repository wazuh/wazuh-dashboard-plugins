/**
 * Created by ykou on 9/23/15.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'splunk_monitoring_console/models/splunk_health_check/Task',
    'splunk_monitoring_console/collections/splunk_health_check/CheckLists'
], function(
    $,
    _,
    Backbone,
    TaskModel,
    CheckListsCollection
) {
    /**
     * A collection that only exists on client-side, which aggregate info from checklist.conf
     */
    return Backbone.Collection.extend({
        model: TaskModel,
        initialize: function() {
            Backbone.Collection.prototype.initialize.apply(this, arguments);

            // TODO: using native Promise as soon as it becomes available.
            this._checklist = new CheckListsCollection();
            this._canonicalTasks = null;
            this._dfd = $.Deferred();
            this.fetchPromise = this._dfd.promise();
        },
        // fake fetch function, which actually fetches other model/collection
        fetch: function(options) {
            // fetch raw checklist and settings, then assemble them into a tasks list
            this._checklist.fetch(options).then(function() {
                this._convertChecklistToTasks();
                this._dfd.resolve();
            }.bind(this));

            this.sortBy('category', 'desc');
            return this.fetchPromise;
        },

        _convertChecklistToTasks: function(options) {
            var checkItems = this._checklist.filterByEnabled();

            // if user selects a group, we want to make sure the tasks are applicable to that group.
            if (options && (options.group || options.app || options.tag || options.category || options.environment)) {
                checkItems = _.filter(checkItems, function(item) {
                    // Every item must be in the group and in the app, and have either a tag or a category that matches.
                    // If both tag and category are empty then ignor efiltering by tag or category.
                    var matchingTagOrCat = true;
                    if (!_.isEmpty(options.tag) || !_.isEmpty(options.category)) {
                        if (_.isEmpty(options.tag)) {
                            matchingTagOrCat = item.isApplicableToCategory(options.category);
                        } else if (_.isEmpty(options.category)) {
                            matchingTagOrCat = item.isApplicableToTag(options.tag);
                        } else {
                            matchingTagOrCat = item.isApplicableToTag(options.tag) || item.isApplicableToCategory(options.category);
                        }
                    }
                    return item.isApplicableToGroup(options.group) && item.isApplicableToApp(options.app) && matchingTagOrCat && item.isApplicableToEnv(options.environment);
                });
            }

            var tasks = checkItems.map(function(checklistItem) {
                return new TaskModel({}, {
                    checklistItem: checklistItem
                });
            });

            // use reset instead set because we always swap out the entire list of tasks.
            this.reset(tasks);
        },

        resetByFilters: function(group, app, tag, category, environment) {
            this._convertChecklistToTasks({
                group: group,
                tag: tag,
                app: app,
                category: category,
                environment: environment
            });
        },

        // Canonical tasks needs the original models because there are nested models
        setCanonicalTasks: function() {
            this._canonicalTasks = new this.constructor(this.models);
        },
        
        getCanonicalTasks: function() {
            var canonicalTasks = this._canonicalTasks;
            
            if (canonicalTasks) {
                return canonicalTasks;
            } else {
                throw Error('Canonical tasks have not been set.');
            }
        },

        getTags: function() {
            var allTags = [];

            _.each(this.models, function(task) {
                var tags = task.getTags();
                tags = tags.split(',').map(function(tag) {
                    return tag.trim();
                });

                _.each(tags, function(tag){
                    // SPL-151983 remove null|undefined from tags list
                    if(tag != "" && tag != undefined){
                        if (!_.contains(allTags, tag)) {
                            allTags.push(tag);
                        }
                    }
                }, this);
            }, this);

            allTags.sort(function(a,b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            return allTags;
        },

        getCategories: function() {
            var allCategories = [];

            _.each(this.models, function(task) {
                var category = task.getCategory();
                category = category.trim();

                if (!_.contains(allCategories, category)) {
                    allCategories.push(category);
                }
            }, this);

            allCategories.sort(function(a,b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            return allCategories;
        },
        
        sortBy: function(sortKey, sortDir) {
            var sortFunc = {
                name: {
                    asc: function(task1, task2) {
                        var task1Score = task1.getTitle().toLowerCase();
                        var task2Score = task2.getTitle().toLowerCase();
                        
                        if (task1Score > task2Score) {
                            return -1;
                        } else if (task1Score < task2Score) {
                            return 1;
                        } else {
                            return 0;
                        }
                    },
                    desc: function(task1, task2) {
                        var task1Score = task1.getTitle().toLowerCase();
                        var task2Score = task2.getTitle().toLowerCase();

                        if (task1Score < task2Score) {
                            return -1;
                        } else if (task1Score > task2Score) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                },
                category: {
                    asc: function(task1, task2) {
                        var task1Score = task1.getCategory().toLowerCase();
                        var task2Score = task2.getCategory().toLowerCase();

                        if (task1Score > task2Score) {
                            return -1;
                        } else if (task1Score < task2Score) {
                            return 1;
                        } else {
                            return 0;
                        }
                    },
                    desc: function(task1, task2) {
                        var task1Score = task1.getCategory().toLowerCase();
                        var task2Score = task2.getCategory().toLowerCase();

                        if (task1Score < task2Score) {
                            return -1;
                        } else if (task1Score > task2Score) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                },
                tags: {
                    asc: function(task1, task2) {
                        var task1Score = task1.getTags().toLowerCase();
                        var task2Score = task2.getTags().toLowerCase();

                        if (task1Score > task2Score) {
                            return -1;
                        } else if (task1Score < task2Score) {
                            return 1;
                        } else {
                            return 0;
                        }
                    },
                    desc: function(task1, task2) {
                        var task1Score = task1.getTags().toLowerCase();
                        var task2Score = task2.getTags().toLowerCase();

                        if (task1Score < task2Score) {
                            return -1;
                        } else if (task1Score > task2Score) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                },
                results: {
                    asc: function(task1, task2) {
                        var statusCode;
                        var task1Score;
                        var task2Score;
                        var task1Summary = task1.getReasonSummary();
                        var task2Summary = task2.getReasonSummary();

                        for (statusCode = 3; statusCode >= -1; statusCode--) {
                            task1Score = task1Summary[statusCode] || 0;
                            task2Score = task2Summary[statusCode] || 0;

                            if (task1Score !== task2Score) {
                                break;
                            }
                        }

                        if (task1Score < task2Score) {
                            return -1;
                        } else if (task1Score > task2Score) {
                            return 1;
                        } else {
                            return 0;
                        }
                    },
                    desc: function(task1, task2) {
                        var statusCode;
                        var task1Score;
                        var task2Score;
                        var task1Summary = task1.getReasonSummary();
                        var task2Summary = task2.getReasonSummary();

                        for (statusCode = 3; statusCode >= -1; statusCode--) {
                            task1Score = task1Summary[statusCode] || 0;
                            task2Score = task2Summary[statusCode] || 0;

                            if (task1Score !== task2Score) {
                                break;
                            }
                        }

                        if (task1Score > task2Score) {
                            return -1;
                        } else if (task1Score < task2Score) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                }
            }[sortKey][sortDir];
            
            this.comparator = sortFunc;
            this.sort();
        }
    });
});

/**
 * Created by ykou on 3/11/15.
 */
define([
    'jquery',
    'underscore',
    '@splunk/swc-mc'
], function(
    $,
    _,
    SwcMC
) {
    var ChecklistModel = SwcMC.SplunkDBaseModel.extend({
        url: 'configs/conf-checklist',
        initialize: function() {
            SwcMC.SplunkDBaseModel.prototype.initialize.apply(this, arguments);
            this.linkActionModel = new SwcMC.LinkActionModel();
            this.listenTo(this.linkActionModel, "serverValidated", this.onLinkServerValidated);
        },

        isDisabled: function() {
            return SwcMC.GeneralUtils.normalizeBoolean(this.entry.content.get('disabled'));
        },

        isApplicableToEnv: function(environment) {
            var excludedEnvironments = (this.entry.content.get('environments_to_exclude') || '').split(',');
            return !_.contains(excludedEnvironments, environment);
        },

        isApplicableToGroup: function(group) {
            // if group is '*' which means all instances, then this check item can be applied (to at least some of the instances)
            if (group === '*') {
                return true;
            }

            if (!group || _.isEmpty(group)) {
                return false;
            }
            
            var applicableToGroups = this.entry.content.get('applicable_to_groups');
            // if no such attribute, it means this check item can be applied to all groups
            if (!applicableToGroups) {
                return true;
            }

            // NOTE: this assume group value is something like: 'dmc_group_indexer, dmc_group_search_head'
            applicableToGroups = applicableToGroups.split(',').map(function(group) {
                return group.trim();
            });

            return _.contains(applicableToGroups, group);
        },

        isApplicableToApp: function(app) {
            // if app is '*' which means all apps, then this check item can be applied.
            if (app === '*') {
                return true;
            }

            if (!app || _.isEmpty(app)) {
                return false;
            }

            return app === this.entry.content.get('eai:appName');
        },

        isApplicableToTag: function(tag) {
            // If tag is empty or unset, then this check item can be applied.
            if (!tag || _.isEmpty(tag)) {
                return true;
            }

            var applicableToTags = this.entry.content.get('tags');
            // if no tag attribute, this item should not show for tag filtering.
            // (It could still show if it matches a category filter.)
            if (!applicableToTags) {
                return false;
            }

            // NOTE: this assumes tag value is something like: 'best_practices, indexing, forwarding'
            applicableToTags = applicableToTags.split(',').map(function(tag) {
                return tag.trim();
            });

            tag = tag.split(',').map(function(tag) {
                // Replace the additional double quotes wrapped to tag filter value like: '"indexing, licensing"'
                return tag.replace(/["]+/g,'').trim();
            });

            var isApplicable = false;
            _.each(tag, function(tag) {
                if (_.contains(applicableToTags, tag)) {
                    isApplicable = true;
                }
            }, this);

            return isApplicable;
        },

         isApplicableToCategory: function(category) {
            // If category is empty or unset, then this check item can be applied.
            if (!category || _.isEmpty(category)) {
                return true;
            }

            var applicableToCategory = this.entry.content.get('category');
            // if no such attribute, it means this check item can be applied to all groups
            if (!applicableToCategory) {
                return true;
            }

            category = category.split(',').map(function(cat) {
                return cat.replace(/["]+/g,'').trim();
            });

            return _.contains(category, applicableToCategory);
        },

        // needs to re-write this to trigger validation on this.entry and this.entry.content. 
        validate: function() {
            var entryValidateResult = this.entry.validate();
            var entryContentValidateResult = this.entry.content.validate();
            var rootValidateResult = SwcMC.SplunkDBaseModel.prototype.validate.apply(this, arguments);

            // NOTE: this conform the format of Backbone.Validation plugin. If we stopped using this plug in, we need to
            // manually update this logic to generate proper format of validation result.
            if (entryValidateResult || entryContentValidateResult || rootValidateResult) {
                return _.defaults({}, entryValidateResult, entryContentValidateResult, rootValidateResult);
            }

            return undefined;
        },

        /**
         * It is a long story to explain why we need this method. The short version is: for a custom conf file, we always
         * want to set/get all fields because there's no way to gradually control fields.
         *
         * Here's the long version:
         * When saving a new model to a custom conf file (in this case it is saving a new check item which is a stanza
         * with a bunch of key-value pairs), SplunkDBase model will create an associated model called splunkDWhiteList,
         * and fetch that model before saving the main model (in this case it is the CheckList model), refer to the
         * syncCreate() function in SplunkDBase. The splunkDWhiteList is fetched in a special way: it has "/_new" suffix.
         * To my understanding, SplunkDBase needs to do this to get information about what key-value pairs can be accepted
         * by splunkd, refer to the entry.fields hash in any response body of such request. Here's an example:
         *
         * GET http://localhost:8000/en-US/splunkd/__raw/services/data/indexes/_new
         *
         * The response is something like:
         *
         * {
         *      ...,
         *      entry: [
         *        {
         *          ...,
         *          fields: {
         *              optional: [...],
         *              required: [...],
         *              wildcard: [...]
         *          }
         *        }
         *      ]
         * }
         *
         * Then SplunkDBase will use these information to determine which key-value pairs to send to splunkd, that's what
         * this function is doing.
         *
         * The reason we need to override the default behavior is because, the generic conf file CRUD endpoints
         * /servicesNS/<owner>/<app>/configs/conf-<filename>/<stanza_name>
         * /services/configs/conf-<filename>/<stanza_name>
         *
         * these endpoints behavior is inconsistent between /_new and normal stanza fetch. Which means, when we do /_new,
         * it just returns something like:
         *
         * {
         *      ...,
         *      entry: [
         *        {
         *          ...,
         *          fields: {
         *              optional: [],
         *              required: ["name"],
         *              wildcard: []
         *          }
         *        }
         *      ]
         * }
         *
         * which means, only the "name=some_name" key-value pairs is accepted, while it actually accepts EVERYTHING.
         * I believe this is a bug, it leads to the behavior that when we create a new stanza through the generic
         * conf CRUD endpoints, only the stanza name is saved, all other key-value pairs are abandoned (because the
         * SplunkDBase model thought it only accepts "name".
         *
         * However, when we fetch a stanza, it returns something like:
         *
         * {
         *      ...,
         *      entry: [
         *          {
         *              ...,
         *              fields: {
         *                  optional: [],
         *                  required: [],
         *                  wildcard: [".*"]
         *              }
         *          }
         *      ]
         * }
         *
         * That clearly indicates all fields can be accepted. So once a stanza is created, there's no problem editing
         * it through the generic conf CRUD endpoints.
         *
         * What we do here is to simply always return all key-value pairs to pretend that the REST endpoints accept
         * everything.
         *
         * @returns {*}
         */
        whiteListAttributes: function() {
            return this.entry.content.toJSON();
        },

        /**
         * most of the methods below are borrowed from models/services/data/indexes.js, which should be abstracted into a
         * model called SplunkDBaseManager or something similar, because the BaseManager views need these methods.
         */

        /*
         * Helper function to assign the link action url to the linkAction model
         *
         * @param linkKey {string} name of the attribute key to use in the links child model (eg. "delete")
         * @returns {boolean} If true, then the linkKey exists and the model has been updated with a new ID
         */
        assignLinkModelID: function(linkKey) {
            var url = this.entry.links.get(linkKey);
            if (url) {
                this.linkActionModel.id = SwcMC.SplunkdUtils.fullpath(url);
                return true;
            }
            return false;
        },

        /**
         * Makes a REST request to an endpoint in the entry.links object
         * @param actionType (eg. "enable")
         * @returns {Promise} - The Deferred Promise object from the REST request
         */
        performAction: function(actionType) {
            var deferredResponse = $.Deferred();
            var saveDeferred;

            if (this.assignLinkModelID(actionType)) {
                saveDeferred = this.linkActionModel.save();
                saveDeferred.done(function() {
                    deferredResponse.resolve.apply(deferredResponse, arguments);
                });
                saveDeferred.fail(function() {
                    deferredResponse.reject.apply(deferredResponse, arguments);
                });
            } else {
                deferredResponse.reject(_('This item does not allow the action: ').t() + actionType);
            }

            return deferredResponse.promise();
        },

        /**
         * Enables the Index by making a REST request
         * @returns {Promise} - The Deferred Promise object from the REST request
         */
        enable: function() {
            return this.performAction("enable");
        },
        /**
         * Disables the Index by making a REST request
         * @returns {Promise} - The Deferred Promise object from the REST request
         */
        disable: function() {
            return this.performAction("disable");
        },
        /*
         Proxy any serverValidated errors from the linkActionModel to the model itself
         */
        onLinkServerValidated: function() {
            var triggerArgs = ["serverValidated"];
            for (var i = 0; i < arguments.length; i++) {
                triggerArgs.push(arguments[i]);
            }
            this.trigger.apply(this, triggerArgs);
        }
    });

    // break the shared reference to Entry
    ChecklistModel.Entry = ChecklistModel.Entry.extend({
        // the reason we need to do validation here is because the 'name' attribute is special, it exists only on this.entry
        // after model is saved to server, but it exists only on this.entry.content before model is saved to server.
        // We cannot do the validation on this.entry.content because there's no way to refer back to this.entry.
        validation: {
            name: function(value) {
                var isAvailable = !!(this.content.get('name') || this.get('name'));
                var isAlphaNumeric = /^\w+$/.test(value);
                if (!isAvailable) {
                    return _('ID is required!').t();
                }
                if (!isAlphaNumeric) {
                    return _('ID can only contain letters, numbers and underscores!').t();
                }

                return undefined;
            }
        }
    });
    // now we can safely change Entry.Content
    ChecklistModel.Entry.Content = ChecklistModel.Entry.Content.extend({
        validation: {
            title: {
                required: true,
                msg: _('Title is required!').t()
            },
            category: {
                required: true,
                msg: _('Category is required!').t()
            },
            search: {
                required: true,
                msg: _('Search is required!').t()
            }
        }
    });

    return ChecklistModel;
}
);

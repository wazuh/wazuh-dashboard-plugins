define(
    [
        "jquery",
        "underscore",
        "backbone",
        "@splunk/swc-mc",
    ],
    function($, _, Backbone, SwcMC) {
        return SwcMC.SplunkDsBaseCollection.extend({
            model: SwcMC.AppLocalModel,
            url: "apps/local",
            initialize: function() {
                SwcMC.SplunkDsBaseCollection.prototype.initialize.apply(this, arguments);
            },
            /* sort the apps collection based on user preference (appOrderString).
            any app not declared in the indexDictionary, is sorted alphabetically */
            sortWithString: function(appOrderString){
                //FOR SAFETY cast to string
                appOrderString = typeof appOrderString === 'string' ? appOrderString : '';
                var indexDictionary = {};
                var appOrderArray = appOrderString.split(',');
                if(_.isArray(appOrderArray) && appOrderArray.length > 0){
                    for(var i=0, len=appOrderArray.length; i<len; i++){
                        indexDictionary[appOrderArray[i]] = i;
                    }
                }

                this.comparator = function(appA, appB){
                    var nameA = appA.entry.get('name'),
                        nameB = appB.entry.get('name'),
                        labelA = appA.entry.content.get('label'),
                        labelB = appB.entry.content.get('label'),
                        positionA = indexDictionary[nameA],
                        positionB = indexDictionary[nameB],
                        isNumberA = _.isNumber(positionA),
                        isNumberB = _.isNumber(positionB);
                    if(isNumberA && isNumberB){
                        return positionA < positionB ? -1 : 1;
                    }
                    if(!isNumberA && !isNumberB){
                        return SwcMC.GeneralUtils.compareWithDirection(labelA, labelB, true);
                    }
                    if(isNumberA && !isNumberB){
                        return -1;
                    }
                    if(!isNumberA && isNumberB){
                        return 1;
                    }
                };
                this.sort();
            },

            listWithoutInternals: function() {
                var internalApps = ['splunk_datapreview','splunk_monitoring_console','learned','introspection_generator_addon','framework'];
                return this.filter(function(model) {
                    var appName = model.entry.get('name');
                    return (internalApps.indexOf(appName) === -1);
                });
            },

            removeLauncherApp: function() {
                this.remove(this.get('/servicesNS/nobody/system/apps/local/launcher'));
            },

            listVisibleApps: function() {
                return this.filter(function(app) {
                    var visibleFlag = app.entry.content.get("visible"), res = true;
                    if(visibleFlag === false || (_.isString(visibleFlag) && visibleFlag.toLowerCase() === "false")){
                        res = false;
                    }

                    return res;
                });
            },

            /**
             * Checks that both apps are part of the collection.
             * If only one app name  is valid, that app is returned.
             * If both app namess are vaid, appName1 is returned.
             * If neither app name is valid, undefined is returned.
             *
             * @param appName1 {string} - app name to check and preferentially return if valid.
             * @param appName1 {string} - app name  to check and return only if the first app name isn't valid.
             * @return {AppLocalModel} - undefined if neither app name is valid.
             */
            getValidatedApp: function(appName1, appName2) {
                var validatedApp1 = this.findByEntryName(appName1);
                var validatedApp2 = this.findByEntryName(appName2);
                return validatedApp1 ? validatedApp1 : validatedApp2;
            },

            /**
             * Filter out apps that the user can't write to or that are internal and we don't want the user writing to.
             *
             * @returns the collection of filtered apps.
             */
            listOnlyWriteableAndNonInternalApps: function() {
                var appsToHide = ['launcher','learned','introspection_generator_addon','framework'];
                return this.filter(function(model) {
                    var appName = model.entry.get('name');
                    var canWrite = model.entry.acl.get('can_write');
                    return (appsToHide.indexOf(appName) == -1 && canWrite);
                });
            },

            getFilteredNameItems: function() {
                var filteredModels = this.listOnlyWriteableAndNonInternalApps();
                return filteredModels.map(function(model) {
                    return {
                        label: model.getLabel(),
                        value: model.id
                    };
                });
            },

            search: function(rawSearch) {
                var searchFilterString = SwcMC.SplunkdUtils.createSearchFilterString(rawSearch, ['name', 'label']);
                this.fetchData.set({search: searchFilterString, count: 5});
            },

            searchByValues: function(values) {
                var $deferred = $.Deferred();
                if (values === void 0) {
                    $deferred.reject();
                    return $deferred;
                }
                var searchFilterString = _.map(values, function(value) {
                    return '(name='+SwcMC.SplunkdUtils.quoteSearchFilterValue(value)+')';
                }).join(' OR ');

                this.fetchData.set('search', searchFilterString, {silent: true});
                this.fetch()
                    .then(function () {
                        $deferred.resolve(this.models);
                        this.reset(void 0, {silent:true});
                    }.bind(this))
                    .catch(function () {
                        $deferred.reject();
                    });
                return $deferred;
            },
            isArchiverAppInstalled: function() {
                return this.findByEntryName('dynamic-data-self-storage-app');
            },
            archiverAppLabel: function() {
                if (this.isArchiverAppInstalled()) {
                    return this.findByEntryName('dynamic-data-self-storage-app').entry.content.get('label');
                }
                return _('Cloud Archives').t();
            }
        });
    }
);

define(
    [
        'jquery',
        'underscore',
        'backbone',
        'splunk.util',
        'helpers/user_agent'
    ],
    function($, _, Backbone, splunkutil, userAgent) {
        var exports = {},
            routeStripper = /^[#\/]|\s+$/g,
            // create an in-memory dictionary to store URL history when the URL itself would be too long
            inMemoryHistory = {};

        // visible for testing only
        exports.AGENT_HAS_URL_LIMIT = userAgent.hasUrlLimit();
        exports.URL_MAX_LENGTH = userAgent.getUrlLimit();

        var fragmentIsLegal = function(fragment) {
            if(!exports.AGENT_HAS_URL_LIMIT) {
                return true;
            }
            var loc = window.location,
                urlMinusFragment = loc.href.split('#')[0];

            return (urlMinusFragment.length + fragment.length) < exports.URL_MAX_LENGTH;
        };

        var historyIdCounter = 0;
        var nextHistoryId = function() {
            return '_suid_' + (++historyIdCounter);
        };

        var historyIdRegex = /^#?_suid_\d+$/;
        var fragmentIsHistoryId = function(fragment) {
            return historyIdRegex.test(fragment);
        };

        var storeFullFragment = function(fragment) {
            var historyId = nextHistoryId();
            inMemoryHistory[historyId] = fragment;
            return historyId;
        };

        //Introduced in 0.9.9, see https://github.com/documentcloud/backbone/issues/2440
        Backbone.history.getFragment = function(fragment, forcePushState) {
            var trailingSlash = /\/$/;
            if (fragment == null) {
                if (this._hasPushState || !this._wantsHashChange || forcePushState) {
                    fragment = this.location.pathname;
                    var search = window.location.search;
                    if (search) {
                        fragment += search;
                    }
                    var root = this.root.replace(trailingSlash, '');
                    if (!fragment.indexOf(root)) {
                        fragment = fragment.substr(root.length);
                    }
                } else {
                    fragment = this.getHash();
                }
            }
            if(fragmentIsHistoryId(fragment)) {
                fragment = inMemoryHistory[fragment] || '';
            }
            return exports.strip_route(fragment);
        };

        //Introduced in 1.1.0, Backbone is stripping query string and hash before comparing the new route to the old one,
        //meaning that changes to those data structures are ignored
        Backbone.history.navigate = function(fragment, options) {
          var History = Backbone.History;
          // start Backbone code...
          /*jsl:ignore*/
          if (!History.started) return false;
          if (!options || options === true) options = {trigger: !!options};

          var url = this.root + (fragment = this.getFragment(fragment || ''));

          // Here is where we patched...
          // - fragment = fragment.replace(pathStripper, '');

          if (this.fragment === fragment) return;
          this.fragment = fragment;

          // Don't include a trailing slash on the root.
          if (fragment === '' && url !== '/') url = url.slice(0, -1);

          // If pushState is available, we use it to set the fragment as a real URL.
          if (this._hasPushState) {
            this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

          // If hash changes haven't been explicitly disabled, update the hash
          // fragment to store history.
          } else if (this._wantsHashChange) {
            this._updateHash(this.location, fragment, options.replace);
            if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
              // Opening and closing the iframe tricks IE7 and earlier to push a
              // history entry on hash-tag change.  When replace is true, we don't
              // want this.
              if(!options.replace) this.iframe.document.open().close();
              this._updateHash(this.iframe.location, fragment, options.replace);
            }

          // If you've told us that you explicitly don't want fallback hashchange-
          // based history, then `navigate` becomes a page refresh.
          } else {
            return this.location.assign(url);
          }
          if (options.trigger) return this.loadUrl(fragment);
          /*jsl:end*/
        };

        Backbone.history._updateHash = _(Backbone.history._updateHash).wrap(function(originalFn, location, fragment, replace) {
            if(!fragmentIsLegal(fragment)) {
                fragment = storeFullFragment(fragment);
                if(replace) {
                    // if doing replace state operation, we can safely remove the old entry in the inMemoryHistory
                    var currentHash = this.getHash();
                    delete inMemoryHistory[currentHash];
                }
            }
            originalFn.call(Backbone.history, location, fragment, replace);
        });

        exports.strip_route = function(route) {
            return route.replace(routeStripper, '');
        };

        // the options.forceNoPushState argument is FOR TESTING ONLY
        // in production, start_backbone_history should always be called with no arguments
        exports.start_backbone_history = function(options) {
            var hasPushstate = "pushState" in window.history;
            var hash = Backbone.history.getHash();
            // always remove navSkip hash
            if (hash === 'navSkip') {
                window.location.replace(window.location.href.split('#')[0]);
            }
            //Due to the URL length constraint, forcing IE to use fragment identifier for the history management
            if ((options && options.forceNoPushState) || !hasPushstate || userAgent.isIE()) {
                $(document).ready(function() {
                    var hashPath = '',
                        query = '',
                        adjustedHash = '';

                    if (hash) {
                        var splitHash = hash.split('?');
                        hashPath = splitHash[0] || "";
                        query = splitHash[1] || '';
                    } else {
                        query = window.location.search.split('?')[1] || '';
                    }

                    if (hashPath && !fragmentIsHistoryId(hashPath)) {
                        adjustedHash = hashPath;
                    } else {
                        adjustedHash = exports.strip_route(window.location.pathname);
                    }
                    if (query) {
                        adjustedHash += ("?" + query);
                    }

                    if(!fragmentIsLegal(adjustedHash)) {
                        adjustedHash = storeFullFragment(adjustedHash);
                    }

                    window.location.replace(window.location.href.split('#')[0] + '#' + adjustedHash);

                    //SPL-96431
                    //when ignoreFragment is true, the fragment part of the URL will be ignored for routing. Note: the fragment will not be removed from the URL.
                    if(options && options.ignoreFragment) {
                        //when hashChange is false, it will prevent hasChange event from triggering and hence this event will be ignored while dispatching the route.
                        Backbone.history.start({ hashChange:false });
                    } else {
                        Backbone.history.start();
                    }

                });
            } else {
                Backbone.history.start({pushState: true});
            }
        };
        return exports;
    }
);

define([
    'jquery',
    'underscore',
    '@splunk/swc-mc',
    'splunk_monitoring_console/collections/splunk_health_check/CheckLists'
  ], function(
      $,
      _,
      SwcMc,
      CheckListsCollection
  ) {
    suite('setup', function() {
      setup(function() {
        this.collection = new CheckListsCollection();

        assert.ok(this.collection, 'collection should be created');

        sinon.stub(SwcMc.SplunkDsBaseCollection.prototype, 'fetch').returns($.Deferred());

        assert.ok(true, 'setup succeeded');
      });

      teardown(function() {
        this.collection = null;
        SwcMc.SplunkDsBaseCollection.prototype.fetch.restore();
        assert.ok(true, 'teardown succeeded');
      });

      test('fetch', function() {
        var defaultOptions = {
          'data': {
            'app': '-',
            'owner': '-'
          }
        };

        this.collection.fetch();
        assert.ok(SwcMc.SplunkDsBaseCollection.prototype.fetch.calledOnce, 'SwcMc.SplunkDsBaseCollection.prototype.fetch should be called once');
        assert.ok(SwcMc.SplunkDsBaseCollection.prototype.fetch.calledWithExactly(defaultOptions), 'SwcMc.SplunkDsBaseCollection.prototype.fetch should be called with defaultOptions');
        assert.ok(SwcMc.SplunkDsBaseCollection.prototype.fetch.alwaysCalledOn(this.collection), 'SwcMc.SplunkDsBaseCollection.prototype.fetch should be called on this collection');

        SwcMc.SplunkDsBaseCollection.prototype.fetch.reset();
        var customOptions = {
          'count': 100,
          'sort_key': 'category'
        };
        var concatOptions = _.defaults({}, customOptions, defaultOptions);
        this.collection.fetch(customOptions);
        assert.ok(SwcMc.SplunkDsBaseCollection.prototype.fetch.calledOnce, 'SwcMc.SplunkDsBaseCollection.prototype.fetch should be called once');
        assert.ok(SwcMc.SplunkDsBaseCollection.prototype.fetch.calledWithExactly(concatOptions), 'SwcMc.SplunkDsBaseCollection.prototype.fetch. should be called with concatOptions');
      });
    });
  });

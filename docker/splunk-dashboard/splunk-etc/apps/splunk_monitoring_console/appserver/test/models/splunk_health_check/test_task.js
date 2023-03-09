define([
  'jquery',
  'backbone',
  'splunk_monitoring_console/models/splunk_health_check/Task',
  'splunk_monitoring_console/models/splunk_health_check/CheckList'
], function(
  $,
  Backbone,
  TaskModel,
  CheckListModel
) {
  suite('TaskModel', function() {
    setup(function() {
      this.model = new TaskModel({}, {
        checklistItem: new CheckListModel()
      });

      sinon.stub(this.model.taskPromise, 'state').returns('pending');

      assert.ok(this.model, 'setup succeeded');
    });

    teardown(function() {
      this.model = null;

      assert.ok(true, 'teardown succeeded');
    });

    test('initialize', function() {
      this.model.taskPromise.then(function() {
        assert.equal(this.model.get('status'), 'done', 'task status should be done when _taskDfd is resolved');
        done();
      });
    });

    test('_handleSearchDone', function() {
      var resultModel = new Backbone.Model({}, {
        collection: function() {
          return new Backbone.Collection();
        }
      });
      sinon.spy(resultModel, 'on');
      sinon.stub(this.model._searchManager, 'data').returns(resultModel);
      sinon.stub(this.model, 'fabricateResult');
      sinon.stub(this.model._taskDfd, 'resolve');

      this.model._handleSearchDone({
        content: {
          resultCount: 0
        }
      });

      assert.ok(this.model.fabricateResult.calledOnce, 'should fabricate result when search returns no result');
      assert.ok(this.model._taskDfd.resolve.calledOnce, 'should resolve _taskDfd');

      this.model._taskDfd.resolve.reset();
      // pretend there's no result
      this.model._result = null;

      this.model._handleSearchDone({
        content: {
          resultCount: 1
        }
      });

      assert.ok(resultModel.on.calledOnce, 'resultModel should set up data event listener');
      resultModel.trigger('data');
      assert.ok(this.model._result, 'should have result after data event fires');
      assert.ok(this.model._taskDfd.resolve.calledOnce, 'should resolve _taskDfd');
    });

    test('_handleSearchErrorFailCancel', function() {
      sinon.stub(this.model, 'fabricateResult');
      sinon.stub(this.model._taskDfd, 'resolve');

      this.model._handleSearchErrorFailCancel();

      assert.ok(this.model.fabricateResult.calledOnce, 'fabricateResult should be called once');
      assert.ok(this.model._taskDfd.resolve.calledOnce, '_taskDfd.resolve should be called once');
    });

    test('_handleSearchProgress', function() {
      assert.ok(true, '_handleSearchProgress is not implemented');
    });

    test('_handleSearchStart', function() {
      assert.ok(true, '_handleSearchStart is not implemented');
    });

    test('start', function() {
      sinon.stub(this.model._searchManager, 'startSearch');
      sinon.stub(this.model, '_getSearchString');

      var searchPromise = this.model.start();
      assert.ok(this.model._getSearchString.calledOnce, 'search string should be set');
      assert.ok(this.model._getSearchString.firstCall.calledWithExactly(undefined), 'since no group is passed to start, no group should be passed to _getSearchString');
      assert.ok(this.model._searchManager.startSearch.calledOnce, 'startSearch should be called once');
      assert.equal(this.model.get('status'), 'running', 'status should be set to running');
      assert.equal(searchPromise.state(), 'pending', 'call to start should return a jQuery promise');

      this.model._getSearchString.reset();
      var FAKE_GROUP = 'fake_group';
      this.model.start(FAKE_GROUP);
      assert.ok(this.model._getSearchString.firstCall.calledWithExactly(FAKE_GROUP), '_getSearchString should receive argument FAKE_GROUP');
    });

    test('getResult', function() {
      assert.strictEqual(this.model.getResult(), this.model._result, 'should be a simple get method');
    });

    test('_getSearchString', function() {
      var GROUP = 'dmc_group_indexer';
      var REST_SEARCH_TEMPLATE = '| rest $rest_scope$ /services/server/info';
      var REST_SEARCH_STRING_STANDALONE = '| rest splunk_server=local /services/server/info';
      var REST_SEARCH_STRING_DISTRIBUTED = '| rest splunk_server_group=' + GROUP + ' /services/server/info';

      var HIST_SEARCH_TEMPLATE = 'index=_internal $hist_scope$ | stats count';
      var HIST_SEARCH_STRING_STANDALONE = 'index=_internal  | stats count';
      var HIST_SEARCH_STRING_DISTRIBUTED = 'index=_internal search_group=' + GROUP + ' | stats count';

      this.model._checklistItem.entry.content.set('search', REST_SEARCH_TEMPLATE);
      assert.strictEqual(this.model._getSearchString(), REST_SEARCH_STRING_STANDALONE, 'should work for | rest search in standalone mode');
      assert.strictEqual(this.model._getSearchString(GROUP), REST_SEARCH_STRING_DISTRIBUTED, 'should work for | rest search in distributed mode');

      this.model._checklistItem.entry.content.set('search', HIST_SEARCH_TEMPLATE);
      assert.strictEqual(this.model._getSearchString(), HIST_SEARCH_STRING_STANDALONE, 'should work for | rest search in standalone mode');
      assert.strictEqual(this.model._getSearchString(GROUP), HIST_SEARCH_STRING_DISTRIBUTED, 'should work for | rest search in distributed mode');
    });

    test('getTitle', function() {
      assert.strictEqual(this.model.getTitle(), this.model._checklistItem.entry.content.get('title'), 'should be a simple get method');
    });

    test('getCategory', function() {
      assert.strictEqual(this.model.getCategory(), this.model._checklistItem.entry.content.get('category'), 'should be a simple get method');
    });

    test('getFailText', function() {
      assert.strictEqual(this.model.getFailText(), this.model._checklistItem.entry.content.get('failure_text'));
    });

    test('getDesc', function() {
      assert.strictEqual(this.model.getDesc(), this.model._checklistItem.entry.content.get('description'));
    });

    test('getSuggestedAction', function() {
      assert.strictEqual(this.model.getSuggestedAction(), this.model._checklistItem.entry.content.get('suggested_action'));
    });

    test('getDocLink', function() {
      assert.strictEqual(this.model.getDocLink(), this.model._checklistItem.entry.content.get('doc_link'));
    });

    test('getDocTitle', function() {
      assert.strictEqual(this.model.getDocTitle(), this.model._checklistItem.entry.content.get('doc_title'));
    });

    test('getTags', function() {
      assert.strictEqual(this.model.getTags(), '');
    });

    test('getDrilldown', function() {
      assert.strictEqual(this.model.getDrilldown(), this.model._checklistItem.entry.content.get('drilldown'));
    });

    test('getEnvironmentsToExclude', function() {
      assert.strictEqual(this.model.getEnvironmentsToExclude(), this.model._checklistItem.entry.content.get('environments_to_exclude'));
    });

    test('getApp', function() {
      assert.strictEqual(this.model.getApp(), this.model._checklistItem.entry.content.get('eai:appName'));
      this.model._checklistItem.entry.content.set('eai:appName', 'splunk_health_assistant_addon')
      assert.strictEqual(this.model.getApp(), 'splunk_monitoring_console');
    });

    test('getSeverityLevel', function() {

      assert.strictEqual(this.model.getSeverityLevel(), 0, 'should return severity_level 0 because task is not completed yet');

      this.model.taskPromise.state.returns('resolved');
      var FAKE_SEV_LEVEL = 1000;
      sinon.stub(this.model, '_getSeverityLevel').returns(FAKE_SEV_LEVEL);

      this.model.getSeverityLevel();
      assert.ok(this.model._getSeverityLevel.calledOnce, '_getSeverityLevel should be called to get severity_level');
      assert.strictEqual(this.model.getSeverityLevel(), this.model._getSeverityLevel(), 'should return whatever _getSeverityLevel returns');
    });

    test('_getSeverityLevel', function() {
      this.model._result = new Backbone.Collection([
        {severity_level: '3'},
        {severity_level: '2'},
        {severity_level: '1'}
      ]);

      assert.strictEqual(this.model._getSeverityLevel(), 3, 'should return the max severity_level if there are multiple rows');

      this.model._result = new Backbone.Collection([
        {severity_level: '0'},
        {severity_level: '0'}
      ]);

      assert.strictEqual(this.model._getSeverityLevel(), 0, 'should return the success severity_level');

      this.model._result = new Backbone.Collection([
        {},
        {}
      ]);

      assert.strictEqual(this.model._getSeverityLevel(), -1, 'should return inapplicable severity_level if severity_level is not defined');

      this.model._result = new Backbone.Collection([
        {severity_level: null}
      ]);

      assert.strictEqual(this.model._getSeverityLevel(), -1, 'should return inapplicable severity_level if severity_level is null');
    });

    test('getSearchManagerId', function() {
      assert.strictEqual(this.model.getSearchManagerId(), this.model._searchManager.id, 'should be a simple get method');
    });

    test('getReasonSummary', function() {
      var emptySummary = this.model.getReasonSummary();
      assert.ok(Object.keys(emptySummary).length === 0 && emptySummary.constructor === Object, 'should return an empty object');

      this.model.taskPromise.state.returns('resolved');
      this.model._result = new Backbone.Collection([
        {severity_level: 0},
        {severity_level: 1},
        {severity_level: 2},
        {severity_level: 3},
        {severity_level: 2},
        {severity_level: 3},
        {severity_level: 3},
        {severity_level: -1},
        {severity_level: -1},
        {severity_level: -1},
        {severity_level: -1}
      ]);

      assert.deepEqual(this.model.getReasonSummary(), {
        0: 1,
        1: 1,
        2: 2,
        3: 3,
        '-1': 4
      }, 'should return count by severity_level');
    });

    test('isReady', function() {
      this.model.set('status', 'running');
      assert.strictEqual(this.model.isReady(), false, 'should not be ready when running');
      this.model.set('status', 'done');
      assert.strictEqual(this.model.isReady(), false, 'should not be ready when done');
      this.model.set('status', 'ready');
      assert.ok(this.model.isReady(), 'should be ready when ready');
    });

    test('isRunning', function() {
      this.model.set('status', 'running');
      assert.ok(this.model.isRunning(), 'should be running when running');
      this.model.set('status', 'done');
      assert.strictEqual(this.model.isRunning(), false, 'should not be running when done');
      this.model.set('status', 'ready');
      assert.strictEqual(this.model.isRunning(), false, 'should not be running when ready');
    });

    test('isDone', function() {
      this.model.set('status', 'running');
      assert.strictEqual(this.model.isDone(), false, 'should not be done when running');
      this.model.set('status', 'done');
      assert.ok(this.model.isDone(), 'should done when done');
      this.model.set('status', 'ready');
      assert.strictEqual(this.model.isDone(), false, 'should not be done when ready');
    });

    test('fabricateResult', function() {
      this.model.fabricateResult({
        'severity_level': 3,
        'reason': 'invalid'
      });

      assert.ok(this.model._result, 'should have result');
      assert.equal(this.model._result.models.length, 1, 'result should be a Backbone.Collection and should have 1 model');
      assert.ok(this.model._result.raw, 'result should have raw data');
      assert.ok(this.model._result.raw.fields && this.model._result.raw.rows, 'raw data should have fields and rows');
      assert.equal(this.model._result.raw.fields.length, 2, 'raw should have the input fields');
      assert.equal(this.model._result.raw.rows.length, 1, 'raw should have 1 row of result');
      assert.equal(this.model._result.raw.rows[0].length, 2, 'row should have the same amount of columns as fields attribute');
    });
  });
});

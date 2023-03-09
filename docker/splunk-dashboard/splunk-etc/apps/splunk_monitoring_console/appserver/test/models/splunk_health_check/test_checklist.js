define([
      'jquery',
      'splunk_monitoring_console/models/splunk_health_check/CheckList'
  ], function(
      $,
      CheckListModel
  ) {
    suite('setup', function() {
      setup(function() {
        this.model = new CheckListModel();

        assert.ok(this.model, 'We should get no exceptions');

        var linkKeys = {
          'enable': 'path/to/enable',
          'disable': 'path/to/disable',
          'remove': 'path/to/remove'
        };

        this.model.entry.links.set(linkKeys);

        assert.ok(true, 'Setup successfull');
      });

      teardown(function() {
        this.model = null;

        assert.ok(true, 'Teardown successful');
      });

      test('isDisabled', function() {
        assert.strictEqual(this.model.isDisabled(), false, 'should return false when disabled attribute is not set');
        this.model.entry.content.set('disabled', false);
        assert.strictEqual(this.model.isDisabled(), false, 'should return false when disabled attribute is set to false');
        this.model.entry.content.set('disabled', true);
        assert.strictEqual(this.model.isDisabled(), true, 'should return true when disabled attribute is set to false');
      });

      test('isApplicableToEnv', function() {
        assert.strictEqual(this.model.isApplicableToEnv('standalone'), true, 'should return true for standalone when environments_to_exclude is not set');
        assert.strictEqual(this.model.isApplicableToEnv('distributed'), true, 'should return true for distributed when environments_to_exclude is not set');

        var STANDALONE = 'standalone';
        this.model.entry.content.set('environments_to_exclude', STANDALONE);
        assert.strictEqual(this.model.isApplicableToEnv('standalone'), false, 'should return false for standalone when environments_to_exclude is standlone');
        assert.strictEqual(this.model.isApplicableToEnv('distributed'), true, 'should return true for distributed when environments_to_exclude is standalone');


        var DISTRIBUTED = 'distributed';
        this.model.entry.content.set('environments_to_exclude', DISTRIBUTED);
        assert.strictEqual(this.model.isApplicableToEnv('standalone'), true, 'should return true for standalone when environments_to_exclude is distributed');
        assert.strictEqual(this.model.isApplicableToEnv('distributed'), false, 'should return false for distributed when environments_to_exclude is distributed');

        var BOTH = 'standalone,distributed';
        this.model.entry.content.set('environments_to_exclude', BOTH);
        assert.strictEqual(this.model.isApplicableToEnv('standalone'), false, 'should return false for standalone when environments_to_exclude is standalone and distributed');
        assert.strictEqual(this.model.isApplicableToEnv('distributed'), false, 'should return false for distributed when environments_to_exclude is standalone and distributed');
      });

      test('isApplicableToGroup', function() {
        assert.strictEqual(this.model.isApplicableToGroup('whatevergroupthatdoesntmakesense'), true, 'should return true when applicable_to_groups is not set');
        assert.strictEqual(this.model.isApplicableToGroup('*'), true, 'should return true since * is a special group');

        var INDEXER_GROUP = 'dmc_group_indexer';
        this.model.entry.content.set('applicable_to_groups', INDEXER_GROUP);
        assert.strictEqual(this.model.isApplicableToGroup(), false, 'should return false when group argument is undefined');
        assert.strictEqual(this.model.isApplicableToGroup('someweirdgroup'), false, 'should return false when group does not match');
        assert.strictEqual(this.model.isApplicableToGroup(INDEXER_GROUP), true, 'should return true when group matches');

        var MULTIPLE_GROUPS = 'dmc_group_indexer, dmc_group_search_head';
        this.model.entry.content.set('applicable_to_groups', MULTIPLE_GROUPS);
        assert.strictEqual(this.model.isApplicableToGroup('someweirdgroup'), false, 'should return false when group is not included');
        assert.strictEqual(this.model.isApplicableToGroup('dmc_group_indexer'), true, 'should return true when group matches');
      });

      test('isApplicableToApp', function() {
        assert.strictEqual(this.model.isApplicableToApp('*'), true, 'Should match all apps');
        assert.strictEqual(this.model.isApplicableToApp(), false, 'Should not match empty app');

        var APP = 'Starlord';
        this.model.entry.content.set('eai:appName', APP);
        assert.strictEqual(this.model.isApplicableToApp('Yondu'), false, 'Should return false when apps do not match.');
        assert.strictEqual(this.model.isApplicableToApp(APP), true, 'Should return true when the apps match.');
      });

      test('isApplicableToTag', function() {
        assert.strictEqual(this.model.isApplicableToTag(), true, 'Unset tag matches all checks.');
        assert.strictEqual(this.model.isApplicableToTag('Awesome Mix'), false, 'No tag matches when no tags are set.');

        var TAG = 'Gamora';
        this.model.entry.content.set('tags', TAG);
        assert.strictEqual(this.model.isApplicableToTag(TAG), true, 'Should return true when tags match.');
        assert.strictEqual(this.model.isApplicableToTag('Ronan'), false, 'Should return false when tags do not match.');

        var MULTIPLE_TAGS = 'Gamora, Drax';
        this.model.entry.content.set('tags', MULTIPLE_TAGS);
        assert.strictEqual(this.model.isApplicableToTag(TAG), true, 'Should return true if one tag matches out of multiple tags.');
        assert.strictEqual(this.model.isApplicableToTag('Drax, Ronan'), true, 'Should return true when a tag matches out of multiple tags.');
        assert.strictEqual(this.model.isApplicableToTag('Ronan, Drax'), true, 'Should return true when a tag matches out of multiple tags, regardless of order.');
        assert.strictEqual(this.model.isApplicableToTag(MULTIPLE_TAGS), true, 'Should return true if all tags match.');
        assert.strictEqual(this.model.isApplicableToTag('Ronan, Thanos'), false, 'Should return false if no tags match.');
        assert.strictEqual(this.model.isApplicableToTag('"Drax, Ronan"'), true, 'Should return true when a tag matches out of multiple tags wrapped with double-quotes.');
        assert.strictEqual(this.model.isApplicableToTag('"Thanos, Drax, Ronan"'), true, 'Should return true when a tag matches out of multiple tags wrapped with double-quotes.');
        assert.strictEqual(this.model.isApplicableToTag('"Thanos", "Drax", "Ronan"'), true, 'Should return true when a tag matches out of multiple tags wrapped with double-quotes.');
      });

      test('isApplicableToCategory', function() {
        assert.strictEqual(this.model.isApplicableToCategory(), true, 'Unset category matches all checks.');
        assert.strictEqual(this.model.isApplicableToCategory('The Collector'), true, 'Any category matches when no category set on the check.');

        var CATEGORY = 'I am Groot!';
        this.model.entry.content.set('category', CATEGORY);
        assert.strictEqual(this.model.isApplicableToCategory(CATEGORY), true, 'True when categories match.');
        assert.strictEqual(this.model.isApplicableToCategory('Rocket Raccoon'), false, 'False when categories do not match.');

        var MULTIPLE_CATEGORIES = 'I am Groot!, Rocket Raccoon';
        this.model.entry.content.set('category', CATEGORY);
        assert.strictEqual(this.model.isApplicableToCategory(MULTIPLE_CATEGORIES), true, 'Should match when category is in list of categories');
        assert.strictEqual(this.model.isApplicableToCategory('"I am Groot!, Rocket Raccoon"'), true, 'Should match when categories wrapped with double-quotes are in list of categories');
        assert.strictEqual(this.model.isApplicableToCategory('"I am Groot!", "Rocket Raccoon"'), true, 'Should match when categories wrapped with double-quotes are in list of categories');
        this.model.entry.content.set('category', 'Thanos');
        assert.strictEqual(this.model.isApplicableToCategory(MULTIPLE_CATEGORIES), false, 'Should not match when category is not in list of categories');
      });

      test('validate', function() {
        assert.ok(this.model.validate(), 'validate should fail since some fields do not satisfy the requirements');

        this.model.entry.set('name', 'new_check_item_with_invalid_char_like_*!@##$%#@@#$@#');
        this.model.entry.content.set({
          title: 'A New Check Item',
          category: 'Cool',
          search: 'index=_internal | stats count by sourcetype'
        });

        assert.ok(this.model.validate(), 'validate should fail since name field contains invalid characters');

        this.model.entry.set('name', 'good_check_item_name');
        assert.strictEqual(this.model.validate(), undefined, 'validate should pass since all requirements are satisfied');
      });

      test('whiteListAttributes', function() {
        assert.deepEqual(this.model.whiteListAttributes(), {}, 'should return empty object');

        var testCase = {
          'title': 'hello',
          'description': 'world',
          'disabled': 1
        };

        this.model.entry.content.set(testCase);

        assert.deepEqual(this.model.whiteListAttributes(), testCase, 'should return what has been set');
      });

      test('assignLinkModelID', function() {
        var oldId = this.model.linkActionModel.id;

        assert.ok(!this.model.assignLinkModelID('hello'), 'invalid linkKey should return false');
        assert.ok(this.model.assignLinkModelID('enable'), 'valid linkKey should return true');
        assert.notEqual(oldId, this.model.linkActionModel.id, 'linkActionModel.id should change after a valid call of assignLinkModelID');
      });

      test('performAction', function() {
        sinon.spy(this.model, 'assignLinkModelID');

        sinon.stub(this.model.linkActionModel, 'save').returns($.Deferred().resolve());
        var resolvedResult = this.model.performAction('enable');
        assert.ok(this.model.assignLinkModelID.calledOnce, 'assignLinkModelID should be called once');
        assert.ok(this.model.assignLinkModelID.calledWithExactly('enable'), 'assignLinkModelID should be called with args "enable"');
        assert.ok(this.model.linkActionModel.save.calledOnce, 'linkActionModel.save() should be called once');
        assert.ok(this.model.linkActionModel.save.calledWithExactly(), 'linkActionModel.save() should be called with no args');
        assert.ok(resolvedResult.state() === 'resolved', 'valid action should result to resolved promise');

        var invalidActionResult = this.model.performAction('hello');
        assert.ok(invalidActionResult.state() === 'rejected', 'invalid action should result to rejected promise');

        this.model.linkActionModel.save.returns($.Deferred().reject());
        var rejectedResult = this.model.performAction('enable');
        assert.ok(rejectedResult.state() === 'rejected', 'if linkActionModel.save() fails, this methods should return rejected promise');
      });

      test('enable', function() {
        sinon.stub(this.model, 'performAction').returns($.Deferred().resolve());
        var resolvedResult = this.model.enable();

        assert.ok(this.model.performAction.calledOnce, 'performAction should be called once');
        assert.ok(this.model.performAction.calledWithExactly('enable'), 'performAction should be called with args "enable"');
        assert.ok(resolvedResult.state() === 'resolved', 'enable() should be resolved if performAction is resolved');

        this.model.performAction.returns($.Deferred().reject());
        var rejectedResult = this.model.enable();
        assert.ok(rejectedResult.state() === 'rejected', 'enable() should be rejected if performAction is rejected');
      });

      test('disable', function() {
        sinon.stub(this.model, 'performAction').returns($.Deferred().resolve());
        var resolvedResult = this.model.disable();

        assert.ok(this.model.performAction.calledOnce, 'performAction should be called once');
        assert.ok(this.model.performAction.calledWithExactly('disable'), 'performAction should be called with args "disable"');
        assert.ok(resolvedResult.state() === 'resolved', 'disable() should be resolved if performAction is resolved');

        this.model.performAction.returns($.Deferred().reject());
        var rejectedResult = this.model.disable();
        assert.ok(rejectedResult.state() === 'rejected', 'disable() should be rejected if performAction is rejected');
      });

      test('onLinkServerValidated', function() {
        sinon.stub(this.model, 'trigger');

        this.model.onLinkServerValidated();
        assert.ok(this.model.trigger.calledOnce, 'trigger should be called once');
        assert.ok(this.model.trigger.calledWithExactly('serverValidated'), 'trigger should be called with "serverValidated"');
        assert.ok(this.model.trigger.alwaysCalledOn(this.model), 'trigger should be called on the main model');

        this.model.trigger.reset();
        this.model.onLinkServerValidated('a', 'b', 'c');
        assert.ok(this.model.trigger.calledOnce, 'trigger should be called once');
        assert.ok(this.model.trigger.calledWithExactly('serverValidated', 'a', 'b', 'c'), 'trigger should be called with "serverValidated", "a", "b", "c"');
      });
    });
  });

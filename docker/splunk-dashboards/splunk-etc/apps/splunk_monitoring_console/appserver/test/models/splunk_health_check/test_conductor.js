define([
    'jquery',
    'splunk_monitoring_console/models/splunk_health_check/Conductor',
    'splunk_monitoring_console/models/splunk_health_check/DmcConfigs',
    'splunk_monitoring_console/models/splunk_health_check/Task',
    'splunk_monitoring_console/collections/splunk_health_check/Tasks',
], function ($, Conductor, DmcConfigs, TaskModel, TasksCollection) {
    suite('setup', function () {
        setup(function () {
            this.model = new Conductor(
                {},
                {
                    tasks: new TasksCollection(),
                    dmcConfigs: new DmcConfigs({}, {}),
                }
            );

            assert.ok(this.model, 'model should be created');

            this.task = new TaskModel();

            function fakeResolved(value) {
                return {
                    then: function (callback) {
                        callback('success');
                    },
                };
            }
            sinon.stub(this.task, 'start').returns(fakeResolved('success'));

            assert.ok(this.task, 'task should be created');

            assert.ok(true, 'Setup successfull');
        });

        teardown(function () {
            this.model = null;

            assert.ok(true, 'Teardown successful');
        });

        test('start', function () {
            var TOTAL_COUNT = 3;

            sinon.stub(this.model, 'getNextTask').returns(this.task);
            sinon.spy(this.model, 'start');
            sinon.stub(this.model._dmcConfigs, 'isDistributedMode').returns(true);

            this.model.set({
                checked: 0,
                total: TOTAL_COUNT,
            });

            assert.strictEqual(this.model.get('state'), 'stopped', 'state should be stopped before start');

            this.model.start();

            assert.strictEqual(this.model.get('checked'), TOTAL_COUNT, 'all tasks should be completed');
            assert.strictEqual(
                this.task.start.callCount,
                TOTAL_COUNT,
                'the start method of all tasks should be called'
            );
            assert.ok(
                this.task.start.getCall(0).calledWithExactly(this.model.get('group')),
                'every call to task start method should receive group name in distributed mode'
            );
            assert.strictEqual(this.model.start.callCount, TOTAL_COUNT + 1, 'recursive calls should happen');

            // pretend the model has finished all checks
            this.model.set('checked', this.model.get('total'));
        });

        test('stop', function () {
            sinon.stub(this.model, 'getNextTask').returns(this.task);
            sinon.stub(this.task, 'isRunning').returns(true);
            var dfd = $.Deferred();
            this.task.taskPromise = dfd.promise();
            this.model.set('state', 'running');

            //Test that running stop results in stopping state.
            var taskPromise = this.model.stop();
            assert.strictEqual(this.model.get('state'), 'stopping', 'state should be set to stopping');
            assert.strictEqual(taskPromise, this.task.taskPromise, 'should return running task');
            //once the task is complete we should have a stopped state
            dfd.resolve();
            assert.strictEqual(this.model.get('state'), 'stopped', 'state should be set to stopped');

            var dfd = $.Deferred();
            this.task.taskPromise = dfd.promise();
            this.model.set('state', 'running');

            var taskPromise = this.model.stop();
            assert.strictEqual(this.model.get('state'), 'stopping', 'state should be set to stopping');
            assert.strictEqual(taskPromise, this.task.taskPromise, 'should return running task');
            // if we start the tests while stopping it should queue the start until we are in the stopped state.
            this.model.start();
            assert.strictEqual(this.model.get('state'), 'stopping', 'state should be set to stopping');
            //once the task is complete we should have a done state since the next tasks will say they are complete
            dfd.resolve();
            assert.strictEqual(this.model.get('state'), 'done', 'state should be set to done');

            this.model.set('state', 'running');
            this.task.isRunning.returns(false);
            var resolvedFakeTask = this.model.stop();
            assert.strictEqual(resolvedFakeTask.state(), 'resolved', 'should return a resolved promise');
            assert.strictEqual(this.model.get('state'), 'stopped', 'state should be set to stopped');
        });

        test('resetConductor', function () {
            sinon.stub(this.model, 'stop').returns($.Deferred().resolve());
            sinon.stub(this.model, 'resetTasks');

            // pretend the check is stopped in the middle.
            this.model.set({
                checked: 3,
            });

            this.model.resetConductor();

            assert.equal(this.model.get('checked'), 0, 'checked should be reset to 0');
            assert.equal(this.model.resetTasks.callCount, 1, 'resetTasks should be called');
        });

        test('restart', function () {
            sinon.stub(this.model, 'resetConductor');
            sinon.stub(this.model, 'start');

            this.model.restart();

            assert.ok(this.model.resetConductor.calledOnce, 'resetConductor should be called once');
            assert.ok(this.model.start.calledOnce, 'start should be called once');
        });

        test('setTotal', function () {
            this.model._tasks = [new TaskModel(), new TaskModel()];

            this.model.setTotal();

            assert.equal(this.model.get('total'), this.model._tasks.length, 'total should eqaul to tasks length');
        });

        test('resetTasks distributed', function () {
            var FAKE_GROUP = 'whatevergroup';
            var FAKE_APP = 'starlord';
            var FAKE_TAG = 'yourit';
            var FAKE_CATEGORY = 'pikichu';
            var DISTRIBUTED = 'distributed';

            sinon.stub(this.model._dmcConfigs, 'isDistributedMode').returns(true);

            this.model.set('group', FAKE_GROUP);
            this.model.set('app', FAKE_APP);
            this.model.set('tag', FAKE_TAG);
            this.model.set('category', FAKE_CATEGORY);

            sinon.stub(this.model._tasks, 'resetByFilters');

            this.model.resetTasks();
            assert.ok(this.model._tasks.resetByFilters.calledOnce, 'resetByFilters should be called once');
            assert.ok(
                this.model._tasks.resetByFilters
                    .getCall(0)
                    .calledWithExactly(FAKE_GROUP, FAKE_APP, FAKE_TAG, FAKE_CATEGORY, DISTRIBUTED),
                'resetByFilters should be called with arguments FAKE_GROUP, FAKE_APP, FAKE_TAG, FAKE_CATEGORY, and distributed'
            );
        });

        test('resetTasks standalone', function () {
            var FAKE_GROUP = 'whatevergroup';
            var FAKE_APP = 'starlord';
            var FAKE_TAG = 'yourit';
            var FAKE_CATEGORY = 'pikichu';
            var STANDALONE = 'standalone';

            sinon.stub(this.model._dmcConfigs, 'isDistributedMode').returns(false);

            this.model.set('group', FAKE_GROUP);
            this.model.set('app', FAKE_APP);
            this.model.set('tag', FAKE_TAG);
            this.model.set('category', FAKE_CATEGORY);

            sinon.stub(this.model._tasks, 'resetByFilters');

            this.model.resetTasks();
            assert.ok(this.model._tasks.resetByFilters.calledOnce, 'resetByFilters should be called once');
            assert.ok(
                this.model._tasks.resetByFilters
                    .getCall(0)
                    .calledWithExactly(FAKE_GROUP, FAKE_APP, FAKE_TAG, FAKE_CATEGORY, STANDALONE),
                'resetByFilters should be called with arguments FAKE_GROUP, FAKE_APP, FAKE_TAG, FAKE_CATEGORY, and standalone'
            );
        });

        test('getNextTask', function () {
            sinon.stub(this.model._tasks, 'at');

            var RANDOM_CHECKED_COUNT = 15;
            this.model.set('checked', RANDOM_CHECKED_COUNT);

            this.model.getNextTask();
            assert.ok(this.model._tasks.at.calledOnce, '_tasks.at should be called once');
            assert.ok(
                this.model._tasks.at.getCall(0).calledWithExactly(RANDOM_CHECKED_COUNT),
                '_tasks.at should be called with argument RANDOM_CHECKED_COUNT'
            );
        });
    });
});

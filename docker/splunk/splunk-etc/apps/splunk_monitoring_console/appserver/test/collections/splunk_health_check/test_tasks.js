define([
    'jquery',
    'splunk_monitoring_console/models/splunk_health_check/CheckList',
    'splunk_monitoring_console/collections/splunk_health_check/Tasks',
    'splunk_monitoring_console/fixtures/Tasks.json',
], function ($, ChecklistModel, TasksCollection, TasksFixture) {
    suite('setup', function () {
        setup(function () {
            this.xhr = sinon.useFakeXMLHttpRequest();
            this.requests = [];
            this.xhr.onCreate = function (xhr) {
                this.requests.push(xhr);
            }.bind(this);

            this.collection = new TasksCollection();

            assert.ok(this.collection, 'setup succeeded');
        });

        teardown(function () {
            this.xhr.restore();
            this.collection = null;

            assert.ok(true, 'teardown succeeded');
        });

        test('fetch', function () {
            function fakeResolved(value) {
                return {
                    then: function (callback) {
                        callback('success');
                    },
                };
            }
            sinon.stub(this.collection._checklist, 'fetch').returns(fakeResolved('success'));
            // sinon.stub(this.collection._checklist, 'fetch').returns($.Deferred().resolve());
            sinon.stub(this.collection, '_convertChecklistToTasks');
            sinon.stub(this.collection._dfd, 'resolve');

            var options = { k: 'v' };
            var response = this.collection.fetch(options);
            assert.ok(this.collection._checklist.fetch.calledOnce, '_checklist.fetch should be called once');
            assert.ok(
                this.collection._checklist.fetch.firstCall.calledWithExactly(options),
                '_checklist.fetch should get the argument of fetch'
            );
            assert.ok(
                this.collection._convertChecklistToTasks.calledOnce,
                '_convertChecklistToTasks should be called once'
            );
            assert.ok(
                this.collection._dfd.resolve.calledOnce,
                '_dfd.resolve should be called when _checklist.fetch is resolved'
            );
            assert.equal(response.state(), 'pending', 'fetch should return a promise');
        });

        test('_convertChecklistToTasks', function () {
            var checkItem = new ChecklistModel();
            var options = { group: 'hi', app: 'starlord', tag: 'yourit', category: 'pikachu' };
            sinon.stub(checkItem, 'isApplicableToGroup').returns(true);
            sinon.stub(checkItem, 'isApplicableToApp').returns(true);
            sinon.stub(checkItem, 'isApplicableToTag').returns(true);
            sinon.stub(checkItem, 'isApplicableToCategory').returns(true);
            sinon.stub(this.collection._checklist, 'filterByEnabled').returns([checkItem]);
            sinon.spy(this.collection, 'reset');
            this.collection._convertChecklistToTasks(options);
            assert.ok(this.collection._checklist.filterByEnabled.calledOnce, 'filterByEnabled should be called once');
            assert.ok(
                checkItem.isApplicableToGroup.firstCall.calledWithExactly(options.group),
                'checkItem should return group info'
            );
            assert.ok(
                checkItem.isApplicableToApp.firstCall.calledWithExactly(options.app),
                'checkItem should return app info'
            );
            assert.ok(
                checkItem.isApplicableToTag.firstCall.calledWithExactly(options.tag),
                'checkItem should return tag info'
            );
            assert.ok(this.collection.reset.calledOnce, 'reset should be called to complete the conversion');
        });

        test('resetByFilters', function () {
            sinon.stub(this.collection, '_convertChecklistToTasks');
            var group = 'a_group';
            var app = 'starlord';
            var tag = 'yourit';
            var category = 'pikachu';
            this.collection.resetByFilters(group, app, tag, category);
            assert.ok(
                this.collection._convertChecklistToTasks.calledOnce,
                'should call _convertChecklistToTasks to do the reset'
            );
            assert.equal(
                this.collection._convertChecklistToTasks.firstCall.args[0].group,
                group,
                '_convertChecklistToTasks should receive group argument'
            );
            assert.equal(
                this.collection._convertChecklistToTasks.firstCall.args[0].app,
                app,
                '_convertChecklistToTasks should receive app argument'
            );
            assert.equal(
                this.collection._convertChecklistToTasks.firstCall.args[0].tag,
                tag,
                '_convertChecklistToTasks should receive tag argument'
            );
            assert.equal(
                this.collection._convertChecklistToTasks.firstCall.args[0].category,
                category,
                '_convertChecklistToTasks should receive category argument'
            );
        });

        test('Test getTags', function (done) {
            var tags = this.collection.getTags();
            assert.equal(tags.length, 0, 'There should be 0 tags');

            var deferred = this.collection.fetch();
            assert.notStrictEqual(deferred.state(), 'rejected', 'request should not be rejected');
            assert.notStrictEqual(deferred.state(), 'resolved', 'request should not be resolved');

            var request = this.requests[0];
            request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(TasksFixture));
            var that = this;
            this.collection.fetchPromise.then( function() {
                assert.notStrictEqual(deferred.state(), 'rejected', 'request should not be rejected');
                assert.strictEqual(deferred.state(), 'resolved', 'request should be resolved');
                tags = that.collection.getTags();
                var expectedTags =
                    'best_practices,capacity,configuration,distributed_search,event_breaking,forwarding,indexing,installation,licensing,Monkey,operating_system,queues,resource_usage,scalability,scheduler,search,storage,timestamp_extraction';
                assert.equal(tags.length, 18, 'should contain 18 tags');
                assert.strictEqual(tags.toString(), expectedTags, 'Order of the tags should match');
                done();
            });
        });

        test('Test getCategories', function (done) {
            var categories = this.collection.getCategories();
            assert.equal(categories.length, 0, 'There should be 0 categories');

            var deferred = this.collection.fetch();
            assert.notStrictEqual(deferred.state(), 'rejected', 'request should not be rejected');
            assert.notStrictEqual(deferred.state(), 'resolved', 'request should not be resolved');

            var request = this.requests[0];
            request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(TasksFixture));
            var that = this;
            this.collection.fetchPromise.then( function() {
                assert.notStrictEqual(deferred.state(), 'rejected', 'request should not be rejected');
                assert.strictEqual(deferred.state(), 'resolved', 'request should be resolved');

                categories = that.collection.getCategories();
                var expectedCategories =
                    'Data Collection,Data Indexing,Data Search,monkey,Splunk Miscellaneous,System and Environment';
                assert.equal(categories.length, 6, 'should contain 6 categories');
                assert.strictEqual(categories.toString(), expectedCategories, 'Order of the categories should match');

                done();
            });
        });
    });
});

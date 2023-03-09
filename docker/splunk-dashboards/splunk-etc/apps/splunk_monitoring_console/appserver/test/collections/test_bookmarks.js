define([
    'underscore',
    'splunk_monitoring_console/collections/Bookmarks',
    'splunk_monitoring_console/fixtures/Bookmarks.json',
    '@splunk/swc-mc/dist/test-dependencies',
], function (_, BookmarksCollection, BookmarksFixture, SwcMcTest) {
    suite('Setup', function () {
        util(SwcMcTest.QunitUtils.FakeXhrModule, {
            setup: function () {
                SwcMcTest.QunitUtils.FakeXhrModule.setup.call(this);

                this.bookmarks = new BookmarksCollection();
                assert.ok(this.bookmarks, 'We should get no exceptions');
                assert.ok(true, 'module setup successful');
            },
            teardown: function () {
                SwcMcTest.QunitUtils.FakeXhrModule.teardown.call(this);
                this.bookmarks.reset();
                assert.ok(true, 'module teardown successful');
            },
        });

        test('test fetch', function () {
            this.bookmarks.fetch();
            var request = this.requests[0];
            var requestArgs = this.getRequestArgs(request);
            assert.notEqual(requestArgs.output_mode, undefined, 'output_mode should exist');
            assert.strictEqual(requestArgs.output_mode, 'json', 'output_mode should be json');

            assert.notEqual(requestArgs.count, undefined, 'count should exist');
            assert.equal(requestArgs.count, -1, 'count should be -1');
        });

        test('test getBookmarks', function () {
            var bookmarks = this.bookmarks.getBookmarks();
            assert.equal(Object.keys(bookmarks).length, 0, 'There should be 0 bookmarks');

            var deferred = this.bookmarks.fetch();
            assert.notStrictEqual(deferred.state(), 'rejected', 'request should not be rejected');
            assert.notStrictEqual(deferred.state(), 'resolved', 'request should not be resolved');

            var request = this.requests[0];
            this.respondTo(request, JSON.stringify(BookmarksFixture));
            assert.notStrictEqual(deferred.state(), 'rejected', 'request should not be rejected');
            assert.strictEqual(deferred.state(), 'resolved', 'request should be resolved');

            bookmarks = this.bookmarks.getBookmarks();
            assert.equal(Object.keys(bookmarks).length, 2, 'should contain 2 bookmarks');
        });
    });
});

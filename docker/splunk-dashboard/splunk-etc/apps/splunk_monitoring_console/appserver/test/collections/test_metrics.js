define([
    'underscore',
    'splunk_monitoring_console/collections/Metrics',
    'splunk_monitoring_console/fixtures/Metrics.json',
    '@splunk/swc-mc/dist/test-dependencies',
], function (_, MetricsCollection, MetricsFixture, SwcMcTest) {
    suite('Setup', function () {
        util(SwcMcTest.QunitUtils.FakeXhrModule, {
            setup: function () {
                SwcMcTest.QunitUtils.FakeXhrModule.setup.call(this);
                this.metrics = new MetricsCollection();
                assert.ok(this.metrics, 'We should get no exceptions');
                assert.ok(true, 'Setup was successful');
            },
            teardown: function () {
                SwcMcTest.QunitUtils.FakeXhrModule.teardown.call(this);
                this.metrics.reset();
                assert.ok(true, 'Teardown was successful');
            },
        });

        test('Test fetch', function () {
            this.metrics.fetch();
            var request = this.requests[0];
            var requestArgs = this.getRequestArgs(request);
            assert.notEqual(requestArgs.output_mode, undefined, 'output_mode should exist');
            assert.strictEqual(requestArgs.output_mode, 'json', 'output_mode should be json');

            assert.notEqual(requestArgs.count, undefined, 'count should exist');
            assert.equal(requestArgs.count, -1, 'count should be -1');

            assert.notEqual(requestArgs.search, undefined, 'search should exist');
            assert.equal(requestArgs.search, 'name=metric:*', 'search should be name=metric:*');
        });

        test('test getMetrics', function () {
            var metrics = this.metrics.getMetrics();
            assert.equal(Object.keys(metrics).length, 0, 'There should be 0 metrics');

            var deferred = this.metrics.fetch();
            assert.notStrictEqual(deferred.state(), 'rejected', 'request should not be rejected');
            assert.notStrictEqual(deferred.state(), 'resolved', 'request should not be resolved');

            var request = this.requests[0];
            this.respondTo(request, JSON.stringify(MetricsFixture));
            assert.notStrictEqual(deferred.state(), 'rejected', 'request should not be rejected');
            assert.strictEqual(deferred.state(), 'resolved', 'request should be resolved');

            metrics = this.metrics.getMetrics();
            assert.equal(Object.keys(metrics).length, 9, 'should contain 9 metrics');
        });

        test('test getEnabledMetrics', function () {
            var metrics = this.metrics.getEnabledMetrics();
            assert.equal(Object.keys(metrics).length, 0, 'There should be 0 metrics');

            var deferred = this.metrics.fetch();
            assert.notStrictEqual(deferred.state(), 'rejected', 'request should not be rejected');
            assert.notStrictEqual(deferred.state(), 'resolved', 'request should not be resolved');

            var request = this.requests[0];
            this.respondTo(request, JSON.stringify(MetricsFixture));
            assert.notStrictEqual(deferred.state(), 'rejected', 'request should not be rejected');
            assert.strictEqual(deferred.state(), 'resolved', 'request should be resolved');

            metrics = this.metrics.getEnabledMetrics();
            assert.equal(Object.keys(metrics).length, 4, 'should contain 4 enabled metrics');
        });
    });
});

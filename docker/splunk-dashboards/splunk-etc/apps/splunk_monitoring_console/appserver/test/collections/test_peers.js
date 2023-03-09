define([
    'underscore',
    'splunk_monitoring_console/collections/Peers',
    '@splunk/swc-mc/dist/test-dependencies',
], function (_, PeersCollection, SwcMcTest) {
    suite('Setup', function () {
        util(SwcMcTest.QunitUtils.FakeXhrModule, {
            setup: function () {
                SwcMcTest.QunitUtils.FakeXhrModule.setup.call(this);

                this.peers = new PeersCollection();
                assert.ok(this.peers, 'We should get no exceptions');
                assert.ok(true, 'module setup successful');
            },
            teardown: function () {
                SwcMcTest.QunitUtils.FakeXhrModule.teardown.call(this);
                this.peers.reset();
                assert.ok(true, 'module teardown successful');
            },
        });

        test('Test fetch', function () {
            this.peers.fetch();
            var request = this.requests[0];
            var requestArgs = this.getRequestArgs(request);
            assert.notEqual(requestArgs.output_mode, undefined, 'output_mode should exist');
            assert.strictEqual(requestArgs.output_mode, 'json', 'output_mode should be json');

            assert.notEqual(requestArgs.count, undefined, 'count should exist');
            assert.equal(requestArgs.count, 1000, 'count should be 1000');

            assert.notEqual(requestArgs.search, undefined, 'search should exist');
            assert.equal(requestArgs.search, 'name=dmc_*', 'search should be name=dmc_*');
        });
    });
});

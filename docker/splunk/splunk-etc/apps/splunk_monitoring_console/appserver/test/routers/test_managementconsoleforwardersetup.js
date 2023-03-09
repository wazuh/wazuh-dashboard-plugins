define([
    '@splunk/swc-mc/dist/test-dependencies',
    'splunk_monitoring_console/routers/MonitoringConsoleForwarderSetup',
    'splunk_monitoring_console/views/settings/forwarder_setup/enterprise/Master',
    'splunk_monitoring_console/views/settings/forwarder_setup/lite/Master',
], function (SwcMcTest, Router, MasterView, MasterLightView) {
    var LOCALE = 'en-US';
    var APP = 'splunk_monitoring_console';
    var PAGE = 'managementconsole_forwarder_setup';

    suite('DMC Forwarder Setup Router', function () {
        util(SwcMcTest.QunitUtils.SplunkdPartials);

        setup(function () {
            this.router = new Router();
            sinon.spy(MasterView.prototype, 'initialize');
            sinon.spy(MasterLightView.prototype, 'initialize');

            // Refer "Returning Promises from Stubs" section from below
            // https://www.sitepoint.com/promises-in-javascript-unit-tests-the-definitive-guide/
            this.router.deferreds.pageViewRendered = sinon.stub();
            this.router.deferreds.pageViewRendered.returns(Promise.resolve('a success'));
            this.router.deferreds.searchesCollectionDfd = sinon.stub();
            this.router.deferreds.searchesCollectionDfd.returns(Promise.resolve('a success'));
            this.router.pageView = {};
            this.router.collection.searchesCollection = new SwcMcTest.MockSplunkDsCollection();
            this.router.collection.searchesCollection.add(new SwcMcTest.MockSplunkDModel());

            this.serverInfoStub = sinon.stub(this.router.model.serverInfo, 'isLite');

            assert.ok(this.router, 'router created');
        });

        teardown(function () {
            MasterView.prototype.initialize.restore();
            MasterLightView.prototype.initialize.restore();
            this.serverInfoStub.restore();
        });

        test('initialize enterprise view:', function (done) {
            this.serverInfoStub.returns(false);
            this.router.page(LOCALE, APP, PAGE);
            this.router.pagePromise.then(function() {
                assert.equal(
                    MasterView.prototype.initialize.callCount,
                    1,
                    'Enterprise Master View should be instantiated once'
                );
                done();
            });
        });
        test('initialize light view:', function (done) {
            this.serverInfoStub.returns(true);
            this.router.collection.searchesCollection.models[0].entry.content.set('disabled', true);
            this.router.page(LOCALE, APP, PAGE);
            this.router.pagePromise.then(function() {
                assert.equal(
                    MasterLightView.prototype.initialize.callCount,
                    1,
                    'Lite Master View should be instantiated once'
                );
                done();
            });
        });
    });
});

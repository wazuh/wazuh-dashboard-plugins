import AppLocalsCollection from 'splunk_monitoring_console/collections/services/AppLocals';
import {AppLocalModel} from '@splunk/swc-mc';
import Download from 'splunk_monitoring_console/views/Download';

suite('Download', function () {
    setup(function () {

        const app = new AppLocalModel();

        app.set('app', 'splunk_monitoring_console');
        app.set('page', 'monitoringconsole_check');
        app.set('route', '');
        app.set('locale', 'en-US');

        const collectionModel = new AppLocalsCollection();
        const disabledCollection = new AppLocalsCollection();
        this.options = {
            model: {
                application: app,
            },
            collection: {
                appLocalsUnfilteredAll: collectionModel,
                appLocalsDisabled: disabledCollection,
            },
        };

        this.downloadView = new Download(this.options);

        this.createHCModel = function (latest = true) {

            const model = new AppLocalModel();

            model.entry.set('name', 'splunk_health_assistant_addon');
            model.entry.content.set('label', 'Splunk Health Assistant Add-on');
            if (!latest) {
                model.entry.content.set('update.version', '3.0.0');
            }
            return model;
        };

        assert.ok(this.downloadView, 'view instantiated successfully');

        this.splunkHealthCheckApp = new AppLocalModel();
    });
    teardown(function () {
        this.options = null;
        this.downloadView = null;
        this.splunkHealthCheckApp = null;
        assert.ok(true, 'Teardown was successful');

    });
    test('test getHealthChecksApp', function () {
        assert.equal(this.downloadView.getHealthChecksApp(), undefined,
            'No Health Check App found.');
        // add the Health check app
        const hcApp = this.createHCModel();
        this.options.collection.appLocalsUnfilteredAll.add(hcApp);
        assert.equal(this.downloadView.getHealthChecksApp(), hcApp,
            'Health Check App found.');
    });
    test('test determineDisabled', function () {
        assert.equal(
            this.downloadView.determineDisabled(),
            false, 'Should not be disabled, app is not present applocals and not present in disabled list.');
        this.options.collection.appLocalsDisabled.add(this.createHCModel(false));
        this.downloadView = new Download(this.options);
        assert.equal(
            this.downloadView.determineDisabled(),
            true, 'Should be disabled, app is not present applocals is present in disabled list.');
        this.options.collection.appLocalsUnfilteredAll.add(this.createHCModel(false));
        this.options.collection.appLocalsDisabled = new AppLocalsCollection();
        this.downloadView = new Download(this.options);
        assert.equal(
            this.downloadView.determineDisabled(),
            false, 'Should not be disabled, app is not up to date.');
        this.options.collection.appLocalsUnfilteredAll = new AppLocalsCollection();
        this.options.collection.appLocalsUnfilteredAll.add(this.createHCModel());
        this.downloadView = new Download(this.options);
        assert.equal(
            this.downloadView.determineDisabled(),
            true, 'Should be disabled, app is present and up to date.');
    });
    test('test getAppDisplayName', function () {
        assert.equal(
            this.downloadView.getAppDisplayName(),
            '',
            'App display name empty as expected.');
        this.options.collection.appLocalsUnfilteredAll.add(this.createHCModel());
        this.downloadView = new Download(this.options);
        assert.equal(
            this.downloadView.getAppDisplayName(),
            'Splunk Health Assistant Add-on',
            'App display name retrieved correctly.');
    });
    test('test getReturnPath', function () {
        assert.equal(
            this.downloadView.getReturnPath(),
            '/app/splunk_monitoring_console/monitoringconsole_check',
            'Return path is correct');
    });
    test('test getDownloadLink', function () {
        this.options.collection.appLocalsUnfilteredAll.add(this.createHCModel(false));
        this.downloadView = new Download(this.options);
        assert.equal(
            this.downloadView.getDownloadLink(),
            '/en-US/manager/appinstall/splunk_health_assistant_addon?app_name=' +
            'Splunk%20Health%20Assistant%20Add-on&implicit_id_required=False&return_to=' +
            '%2Fapp%2Fsplunk_monitoring_console%2Fmonitoringconsole_check',
            'Download link is correct');
    });
    test('test getComponent', function () {
        assert.ok(this.downloadView.getComponent(), 'Download button exists.');
    });
});

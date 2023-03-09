import React from 'react';
import Bookmarks from 'splunk_monitoring_console/collections/Bookmarks';
import Metrics from 'splunk_monitoring_console/collections/Metrics';
import { configure, shallow } from 'enzyme';
import Landing from 'splunk_monitoring_console/views/landing/Landing';
import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';
import { SplunkUtil, AppLocalModel, ClusterConfigModel, HealthDetailsModel, ServerInfoModel }from '@splunk/swc-mc'

suite('Monitoring Console Landing Page', function () {
    setup(function () {
        configure({ adapter: new EnzymeAdapterReact16() });
        this.props = {
            appLocal: new AppLocalModel(),
            application: {
                get: () => {},
            },
            serverInfo: new ServerInfoModel(),
            healthDetails: new HealthDetailsModel(),
            indexerClustering: new ClusterConfigModel(),
            bookmarks: new Bookmarks(),
            metrics: new Metrics(),
            indexes: 11,
            isDistributed: false
        };
        this.wrapper = shallow(<Landing {...this.props} />);
        this.inst = this.wrapper.instance();

        assert.ok(this.wrapper, 'wrapper instantiated successfully');
    });
    teardown(function () {
        this.wrapper = null;
        this.inst = null;
        assert.ok(true, 'Teardown was successful');
    });
    test('Test rendering the Landing component', function () {
        assert.equal(
            this.wrapper.find('div[data-test-name="monitoring-console-landing"]').length,
            1, 'Landing page rendered');
        assert.equal(
            this.wrapper.find('Heading').length,
            6, 'All Headings rendered');
        assert.equal(
            this.wrapper.find('div[data-test-name="deployment-topology"]').length,
            1, 'Deployment topology section rendered');
        assert.equal(
            this.wrapper.find('div[data-test-name="deployment-metrics"]').length,
            1, 'Deployment metrics section rendered');
        assert.equal(
            this.wrapper.find('div[data-test-name="deployment-components"]').length,
            1, 'Deployment Components section rendered');
    });
});

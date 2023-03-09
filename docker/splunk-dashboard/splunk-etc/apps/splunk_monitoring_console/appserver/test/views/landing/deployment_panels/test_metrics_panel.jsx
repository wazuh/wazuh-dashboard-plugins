import React from 'react';
import { configure, shallow } from 'enzyme';
import MetricsPanel from 'splunk_monitoring_console/views/landing/deploymentPanels/MetricsPanel';
import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';

suite('MC Deployment Metrics Panel Component', function () {
    setup(function () {
        configure({ adapter: new EnzymeAdapterReact16() });
        this.fakeMetrics = {
            metric_1: {
                'displayName': 'Metric One',
                'search': 'metric one search',
                'description': 'how does it work? metric 1',
                'disabled': false,
                'recommended': '1',
            },
            metric_2: {
                'displayName': 'Metric Two',
                'search': 'metric two search',
                'description': 'how does it work? metric 2',
                'disabled': false,
                'recommended': '0',
            },
        };

        // Mock XHR
        this.xhr = sinon.useFakeXMLHttpRequest();
        this.requests = [];
        this.xhr.onCreate = function(xhr) {
            this.requests.push(xhr);
        }.bind(this);

        this.props = {
            metrics: {
                fetch: () => {},
                models: [],
                on: () => {},
                getEnabledMetrics: () => { return this.fakeMetrics },
            },
        };
        this.wrapper = shallow(<MetricsPanel {...this.props} />);
        this.inst = this.wrapper.instance();

        assert.ok(this.wrapper, 'Wrapper instantiated successfully');
    });
    teardown(function () {
        this.wrapper = null;
        this.inst = null;
        this.fakeMetrics = {};
        this.xhr.restore();
        assert.ok(true, 'Teardown was successful');
    });
    test('Test rendering the metrics component', function () {
        assert.equal(
            this.wrapper.find('div[data-test-name="deployment-metrics"]').length,
            1, 'MetricsPanel page rendered');
        assert.equal(
            this.wrapper.find('.metricsCardHeader').length,
            1, 'metricsCardHeader rendered');
        assert.equal(
            this.wrapper.find('div[data-test-name="metrics-item"]').length,
            2, '2 metricsItem rendered')
    });
    test('Test handleModalClose', function() {
        this.inst.updateMetrics = sinon.spy();
        this.inst.handleModalClose();
        assert.ok(this.inst.updateMetrics.calledOnce,
            'updateMetrics should be called once');
    });
    test('Test updateMetrics', function() {
        assert.equal(Object.keys(this.inst.state.enabledMetrics).length, 2,
            'Should be 2 enabeled metrics initially');
        this.inst.updateMetricsJobs = sinon.spy();
        this.fakeMetrics['metric_3'] = {
            'displayName': 'Metric Three',
            'search': 'metric Three search',
            'description': 'how does it work? metric 3',
            'disabled': false,
            'recommended': '1',
        };
        this.inst.updateMetrics();
        assert.equal(Object.keys(this.inst.state.enabledMetrics).length, 3,
            'Should now be 3 enabeled metrics');
        assert.ok(this.inst.updateMetricsJobs.calledOnce,
            'updateMetricsJobs should only be called once');
    });
    test('Test updateMetricsJobs', function() {
        assert.equal(Object.keys(this.inst.state.metricsResults).length, 0,
            'metricsResults should be empty');
        assert.equal(Object.keys(this.inst.state.metricsJobs).length, 2,
            'metricsJobs should have 2 entries');
        this.fakeMetrics['metric_3'] = {
            'displayName': 'Metric Three',
            'search': 'metric Three search',
            'description': 'how does it work? metric 3',
            'disabled': false,
            'recommended': '1',
        };
        this.inst.getMetricsResults = sinon.spy();
        this.inst.updateMetricsJobs();
        assert.ok(this.inst.getMetricsResults.calledOnce,
            'getMetricsResults should be called only once');
        assert.equal(Object.keys(this.inst.state.metricsJobs).length, 3,
            'metricsJobs should have 3 items');
        assert.equal(Object.keys(this.inst.state.metricsResults).length, 0,
            'metricsResults should be empty');
    });
    test('Test getMetricsJobs', function() {
        const metricsJobs = this.inst.getMetricsJobs();
        assert.equal(Object.keys(metricsJobs).length, 2,
            'Should be 2 jobs created.');
    });
    test('Test handleTimeRangeChange', function() {
        assert.equal(this.inst.state.earliest, '-24h@h',
            'earliest is set to 24h ago');
        assert.equal(this.inst.state.latest, 'now',
            'latest is set to now')
        this.inst.updateMetricsJobs = sinon.spy();
        this.inst.handleTimeRangeChange(null, { earliest: '-7d@d', latest: '-2d@d' });
        assert.equal(this.inst.state.earliest, '-7d@d',
            'earliest is set to 24h ago');
        assert.equal(this.inst.state.latest, '-2d@d',
            'latest is set to now')
        assert.ok(this.inst.updateMetricsJobs.calledOnce,
            'updateMetricsJobs should be called once');
    });
    test('Test renderSingleValue', function() {
        const errorVal = shallow(this.inst.renderSingleValue('error'));
        assert.equal(errorVal.text(), 'Data not found.',
            'error should warn user');
        const goodVal = shallow(this.inst.renderSingleValue(23));
        assert.equal(goodVal.find('[data-test-name="metric-single-value"]').length, 1,
            'Single value should appear');
    });
});

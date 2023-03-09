import React from 'react';
import { configure, shallow } from 'enzyme';
import MetricsPanelModal from 'splunk_monitoring_console/views/landing/deploymentPanels/MetricsPanelModal';
import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';
import Modal from '@splunk/react-ui/Modal';

suite('MC Deployment Metrics Modal Component', function() {
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
            metric_3: {
                'displayName': 'Metric Three',
                'search': 'metric three search',
                'description': 'how does it work? metric 3',
                'disabled': true,
                'recommended': '1',
            },
            metric_4: {
                'displayName': 'Metric Four',
                'search': 'metric four search',
                'description': 'how does it work? metric 4',
                'disabled': true,
                'recommended': '0',
            },
        };
        this.handleModalClose = sinon.spy();
        this.fetchMetrics = sinon.spy();
        this.props = {
            metrics: {
                fetch: this.fetchMetrics,
                models: [],
                on: () => {},
                getMetrics: () => { return this.fakeMetrics },
                find: () => {},
            },
            handleClose: this.handleModalClose,
        };
        this.wrapper = shallow(<MetricsPanelModal {...this.props} />);
        this.inst = this.wrapper.instance();
        assert.ok(this.wrapper, 'Wrapper instantiated successfully');
    });
    teardown(function () {
        this.wrapper = null;
        this.inst = null;
        this.fakeMetrics = {};
        assert.ok(true, 'Teardown was successful');
    });
    test('Test updateMetrics', function() {
        assert.equal(Object.keys(this.inst.state.metrics).length, 4,
            "currently should be 4 metrics");
        this.fakeMetrics['metric_5'] = {
                'displayName': 'Metric Five',
                'search': 'metric five search',
                'description': 'how does it work? metric 5',
                'disabled': true,
                'recommended': '1',
            }
        this.inst.updateMetrics();
        assert.equal(Object.keys(this.inst.state.metrics).length, 5,
            "currently should be 5 metrics");
    });
    test('Test handleClose nothing changed', function() {
        this.inst.state.open = true;
        assert.equal(this.inst.state.open, true,
            'open is set to true');
        this.inst.state.isWorking = true;
        assert.equal(this.inst.state.isWorking, true,
            'isWorking is set to true');
        this.inst.state.errorMessage = 'argle bargle';
        assert.equal(this.inst.state.errorMessage, 'argle bargle',
            'errorMessage is set to "argle bargle"');
        this.inst.handleClose();
        assert.equal(this.inst.state.open, false,
            'open should be false');
        assert.equal(this.inst.state.isWorking, false,
            'isWorking should be false');
        assert.equal(this.inst.state.errorMessage, '',
            'errorMessage should be empty');
        assert.equal(this.handleModalClose.calledOnce, false, "handleModalClose should not be called");
    });
    test('Test handleClose with changed', function() {
        this.inst.state.open = true;
        assert.equal(this.inst.state.open, true,
            'open is set to true');
        this.inst.state.isWorking = true;
        assert.equal(this.inst.state.isWorking, true,
            'isWorking is set to true');
        this.inst.state.errorMessage = 'argle bargle';
        assert.equal(this.inst.state.errorMessage, 'argle bargle',
            'errorMessage is set to "argle bargle"');
        this.inst.state.changed = true;
        this.inst.handleClose();
        assert.equal(this.inst.state.open, false,
            'open should be false');
        assert.equal(this.inst.state.isWorking, false,
            'isWorking should be false');
        assert.equal(this.inst.state.errorMessage, '',
            'errorMessage should be empty');
        assert.equal(this.handleModalClose.calledOnce, true, "handleModalClose should be called once");
    });
    test('Test handleOpen', function() {
        assert.equal(this.inst.state.open, false,
            'modal should not yet be open');
        this.inst.handleOpen();
        assert.equal(this.inst.state.open, true,
            'modal should be open now');
    });
});

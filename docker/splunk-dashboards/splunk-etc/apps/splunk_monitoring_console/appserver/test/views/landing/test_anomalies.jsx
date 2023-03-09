import React from 'react';
import { configure, shallow } from 'enzyme';
import Anomalies from 'splunk_monitoring_console/views/landing/Anomalies';
import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';

suite('Monitoring Console Anomalies Component', function () {
    setup(function () {
        configure({ adapter: new EnzymeAdapterReact16() });
        this.props = {
            isDistributed: false,
            anomalies: [],
        };
        this.wrapper = shallow(<Anomalies {...this.props} />);
        this.inst = this.wrapper.instance();
        assert.ok(this.wrapper, 'wrapper instantiated successfully');
    });

    teardown(function () {
        this.wrapper = null;
        this.inst = null;
        assert.ok(true, 'Teardown was successful');
    });

    test('Test anomalies component without anomalies', function () {
        assert.equal(
            this.wrapper.find('[data-test-name="anomalies-table"]').length,
            0, 'anomalies table is not rendered');
        
        assert.equal(
            this.wrapper.find('[data-test-name="no-anomalies-section"]').length,
            1, 'no-anomalies section is rendered');
    });

    test('Test anomalies component with anomalies', function () {
        this.wrapper.setProps({
            isDistributed: false,
            anomalies: [
                {
                    'name': ['File Monitor Input', 'TailReader-0'],
                    'health': 'red',
                    'reasons': {
                        'red': {
                            '1': {
                                'description': "description 1",
                                'due_to_stanza': "feature:tailreader",
                                'due_to_threshold': "indicator:data_out_rate:red",
                                'due_to_threshold_value': 2,
                                'indicator': "data_out_rate",
                                'reason': "reason 1",
                            },
                        },
                    },
                },
                {
                    'name': ['Indexer Clustering', 'Search Head Connectivity'],
                    'health': 'yellow',
                    'reasons': {
                        'yellow': {
                            '1': {
                                'description': "description 1",
                                'due_to_stanza': "feature:searchheadconnectivity",
                                'due_to_threshold': "indicator:master_connectivity:yellow",
                                'due_to_threshold_value': 2,
                                'indicator': "master_connectivity",
                                'reason': "reason 1",
                            },
                            '2': {
                                'description': "description 2",
                                'due_to_stanza': "feature:searchheadconnectivity",
                                'due_to_threshold': "indicator:master_connectivity:yellow",
                                'due_to_threshold_value': 2,
                                'indicator': "master_connectivity",
                                'reason': "reason 2",
                            },
                        },
                    },
                },
            ]
        });

        assert.equal(
            this.wrapper.find('[data-test-name="no-anomalies-section"]').length,
            0, 'no-anomalies section is not rendered');

        assert.equal(
            this.wrapper.find('[data-test-name="anomalies-table"]').length,
            1, 'anomalies table is rendered');

        assert.equal(
            this.wrapper.find('[data-test-name="anomalies-table-head"]').length,
            1, 'anomalies table has table head');

        assert.equal(
            this.wrapper.find('[data-test-name="anomalies-table-body"]').length,
            1, 'anomalies table has table body');

        assert.equal(
            this.wrapper.find('[data-test-name="anomalies-table-row-TailReader-0"]').length,
            1, 'anomalies table has TailReader-0 row');

        assert.equal(
            this.wrapper.find('[data-test-name="anomalies-table-row-Search Head Connectivity"]').length,
            1, 'anomalies table has Search Head Connectivity row');
    });
});

import { configure, shallow } from 'enzyme';
import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';
import React from 'react';
import RemoteLoadingShell from '../../../../src/views/splunk_assist/shell/components/RemoteLoadingShell';

suite('Splunk Assist', function () {
    setup(function () {
        configure({ adapter: new EnzymeAdapterReact16() });
        this.props = {
            remoteConfigs: [{ id: 'test', remoteRoot: 'http://localhost/foo/1.0' }],
        };
        this.wrapper = shallow(<RemoteLoadingShell {...this.props} />);
        this.inst = this.wrapper.instance();
        assert.ok(this.wrapper, 'wrapper instantiated successfully');
    });

    teardown(function () {
        this.wrapper = null;
        this.inst = null;
        assert.ok(true, 'Teardown was successful');
    });

    test('Test that the loading message shows up', function () {
        assert.equal(
            this.wrapper.find('[data-test-name="remote-shell-loading-message"]').length,
            1,
            'Loading message showing'
        );
    });
});

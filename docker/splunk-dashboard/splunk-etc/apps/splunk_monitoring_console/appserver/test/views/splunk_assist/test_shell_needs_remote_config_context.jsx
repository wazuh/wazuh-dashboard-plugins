import { configure, mount } from 'enzyme';
import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';
import React from 'react';
import { RemoteConfigContext } from '../../../../src/views/splunk_assist/common/hooks/RemoteConfigProvider';
import ErrorPage from '../../../../src/views/splunk_assist/error/components/ErrorPage/ErrorPage';
import Loading from '../../../../src/views/splunk_assist/shell/components/Loading';
import RemoteLoadingShell from '../../../../src/views/splunk_assist/shell/components/RemoteLoadingShell';
import { ShellNeedsRemoteConfigContext } from '../../../../src/views/splunk_assist/shell/components/ShellNeedsRemoteConfigContext';

suite('ShellNeedsRemoteConfigContext', function () {
    setup(function () {
        configure({ adapter: new EnzymeAdapterReact16() });
    });

    test('Shows the RemoteLoadingShell when the shell is available', function () {
        const wrapper = mount(
            <RemoteConfigContext.Provider
                value={{
                    error: undefined,
                    isLoading: false,
                    remoteConfigs: [{}],
                }}
            >
                <ShellNeedsRemoteConfigContext />
            </RemoteConfigContext.Provider>
        );
        assert.ok(wrapper, 'wrapper instantiated successfully');

        assert.equal(wrapper.find(RemoteLoadingShell).length, 1, 'RemoteLoadingShell');
    });

    test('Shows a loading message while context is loading ', function () {
        const wrapper = mount(
            <RemoteConfigContext.Provider
                value={{
                    error: undefined,
                    isLoading: true,
                    remoteConfigs: [{}],
                }}
            >
                <ShellNeedsRemoteConfigContext />
            </RemoteConfigContext.Provider>
        );

        assert.ok(wrapper, 'wrapper instantiated successfully');

        assert.equal(wrapper.find(Loading).length, 1, 'Loading page');
    });

    test('Shows an error message when there is an error loading context ', function () {
        const wrapper = mount(
            <RemoteConfigContext.Provider
                value={{
                    error: 'booya',
                    isLoading: false,
                    remoteConfigs: [{}],
                }}
            >
                <ShellNeedsRemoteConfigContext />
            </RemoteConfigContext.Provider>
        );

        assert.equal(wrapper.find(ErrorPage).length, 1, 'Error page');
    });
});

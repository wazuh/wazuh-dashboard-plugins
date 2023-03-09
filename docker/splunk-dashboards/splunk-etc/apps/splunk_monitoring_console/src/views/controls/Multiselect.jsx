import React from 'react';
import ReactAdapterBase from 'splunk_monitoring_console/views/ReactAdapterBase';
import BackboneProvider from './BackboneProvider';
import Multiselect from '@splunk/react-ui/Multiselect';
import { ThemeUtils } from '@splunk/swc-mc'
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';

export default ReactAdapterBase.extend({
    createComponent() {
        const { children, props = {} } = this.options;
        if (!children) {
            return null;
        }
        const optionNodes = children.map(child => <Multiselect.Option {...child} />);
        return (
            <SplunkThemeProvider {...ThemeUtils.getCurrentTheme()}>
                <Multiselect {...props} >
                    {optionNodes}
                </Multiselect>
            </SplunkThemeProvider>
        );
    },

    getComponent() {
        return (
            <BackboneProvider store={{}}>
                {this.createComponent()}
            </BackboneProvider>
        );
    },
});

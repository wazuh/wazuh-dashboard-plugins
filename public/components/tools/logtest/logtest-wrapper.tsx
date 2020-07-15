import React from 'react';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { BrowserRouter as Router } from 'react-router-dom';
import { FlyoutComponentWithVariableControl } from './logtest-flyout';

export const FlyoutLogtestWrapper = () => {
    return (
        <Router>
            <WzReduxProvider>
                <FlyoutComponentWithVariableControl/>
            </WzReduxProvider>
        </Router>
    )
}
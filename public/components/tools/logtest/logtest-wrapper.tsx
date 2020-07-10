import React from 'react';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { FlyoutComponentWithVariableControl } from './logtest-flyout';

export const FlyoutLogtestWrapper = () => {
    return (
        <WzReduxProvider>
            <FlyoutComponentWithVariableControl/>
        </WzReduxProvider>
    )
}
import React from 'react';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Center from '../../common/components/Center';
import Wrapper from './Wrapper';

export default (props) => (
    <Wrapper dataTest="loading-spinner-wrapper">
        <Center>
            <WaitSpinner size="large" id="placeholder-main-section-body" {...props} />
        </Center>
    </Wrapper>
);

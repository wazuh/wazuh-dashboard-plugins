
import PropTypes from 'prop-types';
import React from 'react';
import { PageContainer } from './SplunkAssistShell.styles';

const Wrapper = props => (
    <PageContainer data-test={props.dataTest}>
        {props.children}
    </PageContainer>
    );


Wrapper.propTypes = {
    children: PropTypes.node.isRequired,
    dataTest: PropTypes.string,
};

Wrapper.defaultProps = {
    dataTest: 'wrapper',
}

export default Wrapper;

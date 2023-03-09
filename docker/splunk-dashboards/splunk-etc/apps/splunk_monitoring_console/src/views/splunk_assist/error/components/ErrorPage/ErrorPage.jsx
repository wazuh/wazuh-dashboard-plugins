import { _ } from '@splunk/ui-utils/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import { ColumnCenter } from '../../../common/components/Center';
import Wrapper from '../../../shell/components/Wrapper';
import { BrokenRobot } from './broken-robot';
import { ErrorHeading, ErrorMessage, ErrorTextContainer } from './ErrorPage.styles';

const ErrorPage = (props) => (
    <Wrapper dataTest={props.dataTest}>
        <ColumnCenter>
            <BrokenRobot size={5} />
            <ErrorTextContainer>
                <ErrorHeading level={2}>{_('Error Loading Assist')}</ErrorHeading>
                <ErrorMessage>{_('Try the operation again or contact Splunk Support.')}</ErrorMessage>
            </ErrorTextContainer>
        </ColumnCenter>
    </Wrapper>
);

ErrorPage.propTypes = {
    dataTest: PropTypes.string.isRequired,
};

export default ErrorPage;

import { _ } from '@splunk/ui-utils/i18n';
import PropTypes from 'prop-types';
import Button from '@splunk/react-ui/Button';
import React from 'react';
import Link from '@splunk/react-ui/Link';
import { CardSubtitle, StyledP, StyledCardFooter, StyledCardBody } from './Card.styles';
import { instrumentationDocsUrl, instrumentationUrl } from './urls';
import RefreshConnectionButton from './RefreshConnectionButton/RefreshConnectionButton';

const SudOffCard = ({ handleRefresh }) => (
    <React.Fragment>
        <StyledCardBody data-test-name="sud-off-card">
            <CardSubtitle level={2}>{_('Support Usage Data is off')}</CardSubtitle>
            <StyledP>{_('Support Usage Data must be on before you can activate Splunk Assist.')}</StyledP>
            <StyledP>
                {_('Confirm that the Instrumentation App is installed and running. ')}
                <Link to={instrumentationDocsUrl}>{_('Learn more')}</Link>
                {_(' about how to install the Instrumentation app.')}
            </StyledP>
        </StyledCardBody>
        <StyledCardFooter data-test-name="enable-sud-footer">
            <Button data-test-name="enable-sud" label={_('Enable Support Usage Data')} to={instrumentationUrl} appearance="primary" />
            <RefreshConnectionButton handleClick={handleRefresh} />
        </StyledCardFooter>
    </React.Fragment>
);

SudOffCard.propTypes = {
    handleRefresh: PropTypes.func.isRequired,
};

export default SudOffCard;

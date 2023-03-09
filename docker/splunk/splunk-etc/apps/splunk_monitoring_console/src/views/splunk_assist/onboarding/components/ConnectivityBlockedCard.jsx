import Link from '@splunk/react-ui/Link';
import { _ } from '@splunk/ui-utils/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import { CardSubtitle, StyledCardBody, StyledCardFooter, StyledLinkP, StyledP } from './Card.styles';
import RefreshConnectionButton from './RefreshConnectionButton/RefreshConnectionButton';
import { connectivityBlockedUrl } from './urls';

const ConnectivityBlockedCard = ({ handleRefresh }) => (
    <React.Fragment>
        <StyledCardBody data-test-name="connectivity-blocked-card">
            <CardSubtitle level={2}>{_('Splunk Cloud Services is not available')}</CardSubtitle>
            <StyledP>
                {_(
                    'This Splunk Enterprise instance needs to be able to access Splunk Cloud Services for Splunk Assist to work. Confirm that the instance has access to SCS. Network connectivity might be unavailable or blocked.'
                )}
            </StyledP>
            <StyledLinkP>
                <Link data-test-name="connectivity-blocked" to={connectivityBlockedUrl} openInNewContext>
                    {_('Learn More')}
                </Link>
            </StyledLinkP>
        </StyledCardBody>
        <StyledCardFooter>
            <RefreshConnectionButton handleClick={handleRefresh} />
        </StyledCardFooter>
    </React.Fragment>
);

ConnectivityBlockedCard.propTypes = {
    handleRefresh: PropTypes.func.isRequired,
};

export default ConnectivityBlockedCard;

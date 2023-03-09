import React from 'react';
import { _ } from '@splunk/ui-utils/i18n';
import { RobotBlocked } from './robot-blocked';
import { StyledP, StyledHeading, TextContainer, StyledLink } from './ConnectivityBlockedPage.styles';
import { connectivityBlockedUrl } from '../urls';
import { ColumnCenter } from '../../../common/components/Center';

const ConnectivityBlockedPage = () => (
    <ColumnCenter data-test="connectivity-blocked">
        <RobotBlocked size={5} />
        <TextContainer>
            <StyledHeading level={2}>{_('Splunk Cloud Services is not available')}</StyledHeading>
            <StyledP>
                {_(
                    'This Splunk Enterprise instance needs to be able to access Splunk Cloud Services for Splunk Assist to work. Confirm that the instance has access to SCS. Network connectivity might be unavailable or blocked.'
                )}
                <br />
                <StyledLink to={connectivityBlockedUrl} openInNewContext>
                    {_('Learn More')}
                </StyledLink>
            </StyledP>
        </TextContainer>
    </ColumnCenter>
);

export default ConnectivityBlockedPage;

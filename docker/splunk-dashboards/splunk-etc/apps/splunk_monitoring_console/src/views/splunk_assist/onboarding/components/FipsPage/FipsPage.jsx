import { _ } from '@splunk/ui-utils/i18n';
import React from 'react';
import { fipsUrl } from '../urls';
import { ColumnCenter, StyledHeading, StyledLink, StyledP, TextContainer } from './FipsPage.styles';
import { RobotThinking } from './robot-thinking';

const FipsPage = () => (
    <ColumnCenter data-test="connectivity-blocked">
        <RobotThinking size={5} />
        <TextContainer>
            <StyledHeading level={2}>{_('Assist Unavailable')}</StyledHeading>
            <StyledP>
                {_('You cannot activate Assist on Splunk Enterprise instances that have FIPS enabled.')}
                <br />
                <StyledLink to={fipsUrl} openInNewContext>
                    {_('Learn More')}
                </StyledLink>
            </StyledP>
        </TextContainer>
    </ColumnCenter>
);

export default FipsPage;

import Link from '@splunk/react-ui/Link';
import { _ } from '@splunk/ui-utils/i18n';
import Heading from '@splunk/react-ui/Heading';
import PropTypes from 'prop-types';
import P from '@splunk/react-ui/Paragraph';
import React from 'react';
import { LeftSide,
    RightSide,
    Page,
    DescriptionContainer,
    StyledP,
    CardContainer,
    PageTitle,
} from './Onboarding.styles';
import { instrumentationUrl, assistIntroUrl, availabilityBestPracticesUrl, cloudConnectedUrl } from './urls';
import { ActivationCard } from './ActivationCard';
import { AssistFeatureCard } from './AssistFeatureCard';
import { CloudConnected, AvailabilityBestPractices } from './images';
import { TextContainer } from '../components/AssistFeatureCard/AssistFeatureCard.styles';


const Onboarding = props => (
        <Page>
            <LeftSide data-test-name="left-side">
                <DescriptionContainer data-test="description-container">
                    <PageTitle level={1}>{_('Introducing Assist')}</PageTitle>
                    <StyledP>
                        {_(`Assist brings the power of Splunk Cloud management insights to Splunk Enterprise
                        deployments that you administer. It analyzes and evaluates security posture,
                        alerting you with cloud-powered recommendations to configure and update Splunk
                        apps to enhance overall security.`,
                            )}
                    </StyledP>
                    <StyledP>
                        {_(`Assist is a fully-managed cloud service that provides deep insight into Splunk
                        Enterprise deployment security posture. You can quickly apply configuration best
                        practices that are consistent with how Splunk manages Splunk Cloud Platform for
                        some of the largest and most complex deployments.`,
                            )}
                    </StyledP>
                    <StyledP>
                        {_(`Assist uses Support Usage Data that you share with Splunk to provide insights.
                        Splunk links the Support Usage Data to your account using your license GUID. You
                        can change your Support Usage Data preferences at any time in your`)}
                        {' '}
                        <Link data-test-name="instrumentation-settings" to={instrumentationUrl}>{_('Instrumentation Settings')}</Link>
                    </StyledP>
                    <StyledP>
                        {_('Visit the')}
                        {' '}
                        <Link data-test-name="assist-intro" to={assistIntroUrl} openInNewContext>
                            {_('Assist documentation page')}
                        </Link>
                        {' '}
                        {_('for more information about Assist activation.')}
                    </StyledP>
                </DescriptionContainer>
                <Heading level={2}>{_('Assist features')}</Heading>
                <CardContainer data-test="assist-feature-cards">
                    <AssistFeatureCard link={cloudConnectedUrl} data-test-name="cloud">
                        <CloudConnected size={7} />
                        <TextContainer data-test-name="connected-container">
                            <Heading level={4}>{_('Cloud Connected')}</Heading>
                            <P>{_('Learn how to make your apps ready for the cloud.')}</P>
                        </TextContainer>
                    </AssistFeatureCard>

                    <AssistFeatureCard
                        data-test-name="availability"
                        link={availabilityBestPracticesUrl}
                    >
                        <AvailabilityBestPractices size={7} />
                        <TextContainer data-test-name="availability-container">
                            <Heading level={4}>{_('Availability Best Practices')}</Heading>
                            <P>
                                {_(`Ensure SSL Certificates are up to date across all Splunk instances in your
                                deployment`)}
                            </P>
                        </TextContainer>
                    </AssistFeatureCard>
                </CardContainer>
            </LeftSide>
            <RightSide data-test-name="right-side">
                <ActivationCard $height={props.instructionsCardHeight}>
                    {props.instructionsCard}
                </ActivationCard>
            </RightSide>
        </Page>
    );

Onboarding.propTypes = {
    instructionsCard: PropTypes.node.isRequired,
    instructionsCardHeight: PropTypes.number,
};

Onboarding.defaultProps = {
    instructionsCardHeight: 400,
}

export default Onboarding;

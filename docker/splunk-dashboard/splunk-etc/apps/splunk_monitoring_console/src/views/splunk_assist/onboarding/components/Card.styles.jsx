import Heading from '@splunk/react-ui/Heading';
import Card from '@splunk/react-ui/Card';
import variables from '@splunk/themes/variables';
import P from '@splunk/react-ui/Paragraph';
import styled from 'styled-components';

export const CardSubtitle = styled(Heading)`
    color: ${variables.contentColorDefault};
    margin-top: ${variables.spacingMedium};
    margin-bottom: ${variables.spacingLarge};
    padding: 0 ${variables.spacingMedium};
    text-align: center;
`;


export const StyledP = styled(P)`
    font-weight: ${variables.fontWeightBold};
    font-size: ${variables.fontSizeLarge};
    text-align: center;
`;


export const StyledLinkP = styled(P)`
    margin: -${variables.spacingSmall}  auto 0 auto;
    text-align: center;
`;


export const StyledCardFooter = styled(Card.Footer)`
    padding-top: 0;
    text-align: center;
`;

export const StyledCardBody = styled(Card.Body)`
  padding-bottom: 0;
`;

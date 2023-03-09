import styled from 'styled-components';
import P from '@splunk/react-ui/Paragraph';
import Heading from '@splunk/react-ui/Heading';
import Link from '@splunk/react-ui/Link/';
import variables from '@splunk/themes/variables';

export const StyledHeading = styled(Heading)`
    margin-top: ${variables.spacingLarge};
    margin-bottom: ${variables.spacingLarge};
    text-align: center;
`;

export const StyledP = styled(P)`
    font-weight: ${variables.fontWeightBold};
    font-size: ${variables.fontSizeLarge};
    padding: ${variables.spacingXSmall};
    text-align: center;
`;

export const StyledLink = styled(Link)`
    margin-top: ${variables.spacingXSmall};
`;

export const TextContainer = styled.div`
    width: 360px;
`;

import styled from 'styled-components';
import variables from '@splunk/themes/variables';
import Heading from '@splunk/react-ui/Heading';
import P from '@splunk/react-ui/Paragraph';

export const ErrorHeading = styled(Heading)`
    margin-top: ${variables.spacingXXXLarge};
    margin-bottom: ${variables.spacingLarge};
    text-align: center;
`;

export const ErrorMessage = styled(P)`
    font-weight: ${variables.fontWeightBold};
    font-size: ${variables.fontSizeLarge};
    padding: ${variables.spacingXSmall};
    text-align: center;
`;

export const ErrorTextContainer = styled.div`
    width: 360px;
`;

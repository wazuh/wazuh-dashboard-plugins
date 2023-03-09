import styled from 'styled-components';
import Card from '@splunk/react-ui/Card';
import Heading from '@splunk/react-ui/Heading';
import { variables } from '@splunk/themes';

export const ActivationCardContainer = styled(Card)`
    width: 480px;
    height: ${({ $height }) => `${$height}px`};
`;

export const CardTitle = styled(Heading)`
    margin-top: 0;
    margin-bottom: 0;
`;

export const StyledCardHeader = styled(Card.Header)`
    border-bottom: 1px solid ${variables.neutral300};
    padding: ${variables.spacingXLarge};
`;

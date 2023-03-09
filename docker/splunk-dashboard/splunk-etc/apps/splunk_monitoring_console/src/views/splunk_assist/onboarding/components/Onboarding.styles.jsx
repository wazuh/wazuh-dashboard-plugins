import styled from 'styled-components';
import P from '@splunk/react-ui/Paragraph';
import Heading from '@splunk/react-ui/Heading';
import variables from '@splunk/themes/variables';
import { ActivationCardContainer } from '../components/ActivationCard/ActivationCard.styles';

export const Page = styled.div`
    display: flex;
    gap: 120px;
    padding: 108px 104px 104px 104px;
    min-width: 960px;
    max-width: 1440px;
    align-self: center;
`;

export const PageTitle = styled(Heading)`
   margin-bottom: ${variables.spacingMedium};
   margin-top: unset;
`;

export const DescriptionContainer = styled.div`
    max-width: 800px;
`;

export const StyledP = styled(P)`
    margin-bottom: ${variables.spacingXLarge};
`;

export const CardContainer = styled.div`
    display: flex;
    flex-flow: column;
    gap: ${variables.spacingXLarge};
    width: 600px;
`;

export const LeftSide = styled.div`
    display: flex;
    flex-flow: column;
    width: 50%;
    min-width: 50%;

    ${CardContainer} {
        margin-top: ${variables.spacingXLarge};
    }
`;

export const RightSide = styled.div`
    ${ActivationCardContainer} {
        position: sticky;
        top: 120px;
    }
`;

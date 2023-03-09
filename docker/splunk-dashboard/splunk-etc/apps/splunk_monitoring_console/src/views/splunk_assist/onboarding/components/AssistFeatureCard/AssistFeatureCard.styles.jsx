import styled from 'styled-components';
import variables from '@splunk/themes/variables';
import { overlayColors } from '@splunk/themes/mixins';

export const FeatureCard = styled.div`
    background-color: ${variables.backgroundColorSection};
    padding: ${variables.spacingXSmall} ${variables.spacingMedium};
    display: flex;
    border-radius: ${variables.borderRadius};
    flex-direction: row;
    align-items: center;
    flex: 1 1 auto;
    gap: ${variables.spacingMedium};
    height: 112px;
    border: 1px solid ${variables.neutral200};
    // copied from clickable card in sui docs because there is no mixin/variable for transitions
    transition: height 0.2s ease 0s, width 0.2s ease 0s, min-width 0.2s ease 0s, max-width 0.2s ease 0s,
    margin 0.2s ease 0s, box-shadow 0.2s ease 0s, border-color 0.2s ease 0s;

    &:hover {
        border-color: ${variables.interactiveColorBorderHover};
        background-color: ${overlayColors(
            variables.backgroundColorSection,
            variables.interactiveColorOverlayHover
        )};
    }
`;

export const TextContainer = styled.div`
    width: 360px;
    h4 {
        margin: ${variables.spacingXSmall} 0;
        font-size: ${variables.fontSizeLarge};
    }
    p {
        margin-bottom: 0;
    }
`;

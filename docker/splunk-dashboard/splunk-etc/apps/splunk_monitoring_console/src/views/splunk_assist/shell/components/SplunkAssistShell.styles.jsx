/* eslint-disable import/prefer-default-export */
import variables from '@splunk/themes/variables';
import styled from 'styled-components';

export const PageContainer = styled.main`
    background-color: ${variables.backgroundColorPage};
    display: flex;
    flex-flow: column;
    padding: ${variables.spacingLarge};
`;

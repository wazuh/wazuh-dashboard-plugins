import React from 'react';
import PropTypes from 'prop-types';
import { ActivationCardContainer, CardTitle, StyledCardHeader } from './ActivationCard.styles';


export const ActivationCard = ({ children, $height }) => (
    <ActivationCardContainer data-test="activation-card" $height={$height}>
        <StyledCardHeader title={<CardTitle level={2}>Activate Assist</CardTitle>} />
        {children}
    </ActivationCardContainer>
    );


ActivationCard.propTypes = {
    $height: PropTypes.number,
    children: PropTypes.element.isRequired,
};

ActivationCard.defaultProps = {
    $height: 400,
};

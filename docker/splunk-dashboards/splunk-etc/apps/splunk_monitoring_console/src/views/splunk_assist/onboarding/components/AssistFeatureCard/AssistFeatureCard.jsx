import React from 'react';
import PropTypes from 'prop-types';
import Clickable from '@splunk/react-ui/Clickable';
import { FeatureCard } from './AssistFeatureCard.styles';


export const AssistFeatureCard = ({ link, children, ...rest }) => (
    <Clickable data-test="assist-feature-card" openInNewContext to={link} {...rest}>
        <FeatureCard>{children}</FeatureCard>
    </Clickable>
);

AssistFeatureCard.propTypes = {
    link: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
};

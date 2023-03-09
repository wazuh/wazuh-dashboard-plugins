import React from 'react';
import PropTypes from 'prop-types';
import { icons } from '../Anomalies';
import './ComponentsPanel.pcss';

function DeploymentComponentsPanel(props) {
    const { features } = props;
    return (
        <div
            data-test-name="components-card"
            className="componentsCard"
        >
            <div className="componentsCardHeader" />
            <div className="componentsCardBody">
                {features.map(feature => (
                    <div
                        className="componentItem"
                        data-test-name="component-item"
                        key={feature.name}
                    >
                        <div className="componentItemLabel">
                            {feature.display_name ? feature.display_name : feature.name}
                        </div>
                        {icons[feature.health].icon}
                    </div>
                ))}
            </div>
        </div>
    );
}

DeploymentComponentsPanel.propTypes = {
    features: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

export default DeploymentComponentsPanel;
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@splunk/react-ui/Button';
import Refresh from '@splunk/react-icons/Refresh';
import { _ } from '@splunk/ui-utils/i18n';

const RefreshConnectionButton = ({ handleClick }) => (
    <Button
        data-test="refresh-connection"
        icon={<Refresh hideDefaultTooltip screenReaderText={null} />}
        label={_('Refresh Connection')}
        onClick={handleClick}
    />
);

RefreshConnectionButton.propTypes = {
    handleClick: PropTypes.func.isRequired,
};

export default RefreshConnectionButton;

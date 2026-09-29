/*
 * Wazuh app - React component for rendering a subsection's fixed fields.
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import PropTypes from 'prop-types';

import WzConfigurationSetting from './configuration-setting';
import WzConfigurationSettingsHeader from './configuration-settings-header';

/**
 * Renders one subsection's already-resolved fields as label/value rows,
 * reusing the same generic, presentation-only pieces every per-section view
 * used to build its own forms out of -- this component is the only new
 * piece: a thin mapping from registry fields + resolved values to those
 * pieces, instead of a bespoke render method per section.
 */
const WzConfigurationFixedFields = ({ title, description, help, items }) => (
  <WzConfigurationSettingsHeader
    title={title}
    description={description}
    help={help}
  >
    {items.map(item => (
      <WzConfigurationSetting
        key={item.id}
        keyItem={item.id}
        label={item.label}
        value={item.render ? item.render(item.value) : item.value}
        info={item.info}
      />
    ))}
  </WzConfigurationSettingsHeader>
);

WzConfigurationFixedFields.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  help: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    }),
  ),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.any,
      render: PropTypes.func,
      info: PropTypes.string,
    }),
  ).isRequired,
};

export default WzConfigurationFixedFields;

/*
 * Wazuh app - React component for the Configuration page's category rail.
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiText,
  EuiSpacer,
  EuiFacetButton,
  EuiFacetGroup,
} from '@elastic/eui';

/**
 * Persistent left-hand navigation for the Configuration page's default
 * (no search query) view: every category, grouped the same way as the
 * page itself, one selected at a time -- the detail pane next to it
 * renders only the selected category's content.
 */
const WzConfigurationCategoryRail = ({
  groups,
  selectedCategoryId,
  onSelectCategory,
}) => (
  <nav aria-label='Configuration categories'>
    {groups.map(group => (
      <Fragment key={`rail-group-${group.title}`}>
        <EuiText size='xs' color='subdued'>
          {group.title}
        </EuiText>
        <EuiSpacer size='xs' />
        <EuiFacetGroup gutterSize='none'>
          {group.categories.map(category => {
            const isSelected = category.id === selectedCategoryId;
            return (
              <EuiFacetButton
                key={category.id}
                isSelected={isSelected}
                quantity={category.entriesCount}
                aria-current={isSelected ? 'page' : undefined}
                onClick={() => onSelectCategory(category.id)}
              >
                {category.title}
              </EuiFacetButton>
            );
          })}
        </EuiFacetGroup>
        <EuiSpacer size='m' />
      </Fragment>
    ))}
  </nav>
);

WzConfigurationCategoryRail.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      categories: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          title: PropTypes.string.isRequired,
          entriesCount: PropTypes.number.isRequired,
        }),
      ).isRequired,
    }),
  ).isRequired,
  selectedCategoryId: PropTypes.string,
  onSelectCategory: PropTypes.func.isRequired,
};

export default WzConfigurationCategoryRail;

/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { } from 'react';
import { EuiBadge } from '@elastic/eui';
import { GroupingComponents} from '../../../common/util';
import './wz-search-badges.less';

const buttonLabel = (count) => `+${count} filters`;

export function WzSearchBadges({ filters, onFiltersChange }) {
  const removeFilter = (key) => { const newFilters = [...filters]; newFilters.splice(key, 1); onFiltersChange(newFilters) };
  const badges = filters.map((filter, key) => badge({ filter, key, removeFilter }));
  const gruopingBadges = GroupingComponents({children: badges, buttonLabel})
  return gruopingBadges;
}

function badge({ filter, key, removeFilter }) {
  return (
    <EuiBadge key={key}
      className='wz-search-badge'
      color='hollow'
      iconType='cross'
      iconSide='right'
      onFocus={e => e.stopPropagation()}
      iconOnClick={() => removeFilter(key)}
      iconOnClickAriaLabel={'Remove filter'} >
      {filter.field !== 'q' ? `${filter.field}:` : ''} {filter.value}
    </EuiBadge>
  )
}
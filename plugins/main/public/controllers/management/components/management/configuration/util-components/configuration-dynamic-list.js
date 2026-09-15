/*
 * Wazuh app - React component for rendering a dynamic list of configured items.
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
import { EuiText } from '@elastic/eui';

import WzConfigurationSettingsHeader from './configuration-settings-header';
import WzConfigurationListTable from './configuration-list-table';
import WzConfigurationListMasterDetail from './configuration-list-master-detail';
import { itemMatchesQuery } from './configuration-list-utils';

/**
 * Renders one dynamic list (e.g. "Monitored directories"): a single-column
 * table when items only expose one property, or a master-detail layout
 * (entries on the left, selected entry's fields on the right) when items
 * expose several.
 */
const WzConfigurationDynamicList = ({ list, items, query }) => {
  const hasItems = Array.isArray(items) && items.length > 0;
  if (!hasItems) {
    // Hidden by an active search query -- unrelated to "nothing configured",
    // so stay silent exactly like a query that matches nothing below.
    if (query) {
      return null;
    }
    return (
      <WzConfigurationSettingsHeader
        title={list.title}
        description={list.description}
        help={list.help}
      >
        <EuiText size='s' color='subdued'>
          Nothing configured yet.
        </EuiText>
      </WzConfigurationSettingsHeader>
    );
  }
  const q = query ? query.trim().toLowerCase() : '';
  const matchingItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item, index }) => itemMatchesQuery(list, item, index, q));
  if (matchingItems.length === 0) {
    return null;
  }
  return (
    <WzConfigurationSettingsHeader
      title={list.title}
      description={list.description}
      help={list.help}
    >
      {list.itemFields.length === 1 ? (
        <WzConfigurationListTable list={list} matchingItems={matchingItems} />
      ) : (
        <WzConfigurationListMasterDetail
          list={list}
          matchingItems={matchingItems}
        />
      )}
    </WzConfigurationSettingsHeader>
  );
};

WzConfigurationDynamicList.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    help: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
      }),
    ),
    itemLabel: PropTypes.func.isRequired,
    itemFields: PropTypes.array.isRequired,
  }).isRequired,
  items: PropTypes.array,
  query: PropTypes.string,
};

export default WzConfigurationDynamicList;

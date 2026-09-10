/*
 * Wazuh app - React component for rendering a single-property dynamic list as a table.
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
import { EuiBasicTable } from '@elastic/eui';

import { readItemField } from './configuration-list-utils';

/**
 * Renders a `kind: 'list'` setting whose items only expose one property
 * (e.g. a list of plain paths) as a single-column table instead of one
 * stacked label/value block per item.
 */
const WzConfigurationListTable = ({ list, matchingItems }) => {
  const [itemField] = list.itemFields;
  const rows = matchingItems.map(({ item, index }) => {
    const rawValue = readItemField(item, itemField.field);
    return {
      id: `${list.id}-${index}`,
      value: itemField.render ? itemField.render(rawValue) : rawValue,
    };
  });
  const columns = [{ field: 'value', name: itemField.label }];
  return <EuiBasicTable items={rows} columns={columns} rowHeader='value' />;
};

WzConfigurationListTable.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.string.isRequired,
    itemFields: PropTypes.array.isRequired,
  }).isRequired,
  matchingItems: PropTypes.arrayOf(
    PropTypes.shape({
      item: PropTypes.any,
      index: PropTypes.number.isRequired,
    }),
  ).isRequired,
};

export default WzConfigurationListTable;

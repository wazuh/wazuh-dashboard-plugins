/*
 * Wazuh app - React component for rendering a multi-property dynamic list as master-detail.
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
} from '@elastic/eui';

import { readItemField } from './configuration-list-utils';
import WzConfigurationFixedFields from './configuration-fixed-fields';

/**
 * Renders a `kind: 'list'` setting whose items expose several properties
 * (e.g. a monitored directory's options) as a master-detail layout: every
 * entry is listed on the left, and the selected one's fields are shown on
 * the right using the same per-item render a single-property list would
 * otherwise stack for every item.
 */
const WzConfigurationListMasterDetail = ({ list, matchingItems }) => {
  const [selectedIndex, setSelectedIndex] = useState(matchingItems[0].index);

  const effectiveIndex = matchingItems.some(
    ({ index }) => index === selectedIndex,
  )
    ? selectedIndex
    : matchingItems[0].index;

  const selectedEntry = matchingItems.find(
    ({ index }) => index === effectiveIndex,
  );

  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={false} style={{ width: 240 }}>
        <EuiListGroup gutterSize='none' bordered flush>
          {matchingItems.map(({ item, index }) => (
            <EuiListGroupItem
              key={`${list.id}-${index}`}
              size='s'
              label={list.itemLabel(item, index)}
              isActive={index === effectiveIndex}
              onClick={() => setSelectedIndex(index)}
            />
          ))}
        </EuiListGroup>
      </EuiFlexItem>
      <EuiFlexItem>
        <WzConfigurationFixedFields
          title={list.itemLabel(selectedEntry.item, selectedEntry.index)}
          items={list.itemFields.map((f, fieldIndex) => ({
            // Positional id -- several fields (e.g. every `opts`-derived
            // check) can share the same `f.field`, so keying on it would
            // give sibling rows duplicate React keys and corrupt
            // reconciliation when the selected item changes.
            id: `${list.id}-${selectedEntry.index}-${fieldIndex}`,
            label: f.label,
            value: readItemField(selectedEntry.item, f.field),
            render: f.render,
            info: f.info,
          }))}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

WzConfigurationListMasterDetail.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.string.isRequired,
    itemLabel: PropTypes.func.isRequired,
    itemFields: PropTypes.array.isRequired,
  }).isRequired,
  matchingItems: PropTypes.arrayOf(
    PropTypes.shape({
      item: PropTypes.any,
      index: PropTypes.number.isRequired,
    }),
  ).isRequired,
};

export default WzConfigurationListMasterDetail;

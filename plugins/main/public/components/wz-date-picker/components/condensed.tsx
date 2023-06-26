/*
 * Wazuh app - React component for select time and sync with plugin platform discover
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect } from 'react';
import { useTimeFilter } from '../../common/welcome/components'
import {
  EuiPopover,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem
} from '@elastic/eui';
import {
  prettyDuration
} from '../../../../../../node_modules/@elastic/eui/lib/components/date_picker/super_date_picker/pretty_duration'
import { formatUIDate } from '../../../react-services/time-service'

export function CondensedPicker({ ranges, onTimeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(6);
  const [customRange, setCustomRange] = useState();
  const timeFilter = useTimeFilter();
  useEffect(() => {
    const rangeSelected = ranges.findIndex(range => (range.start === timeFilter.from && range.end === timeFilter.to));
    if (rangeSelected === -1) {
      setCustomRange(prettyDuration(timeFilter.from, timeFilter.to))
    } else {
      setCustomRange(undefined);
      if (selectedRange !== rangeSelected){
        setSelectedRange(rangeSelected);
      }
    }
  }, [timeFilter]);

  const dateFormat = () => {
    const result = customRange.replace(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}/gi,
      (e) => formatUIDate(e)
    );
    return result;
  }

  const button = (<EuiButtonEmpty
    onClick={() => setIsOpen(!isOpen)}
    iconType="arrowDown"
    iconSide="right">
    {!!customRange
      ? dateFormat()
      : ranges[selectedRange].label}
  </EuiButtonEmpty>);

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
    >
      <div style={{ width: '200px' }}>
      {ranges.map((range, idx) => (
        <EuiFlexGroup key={idx} gutterSize="s" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              onClick={() => { setIsOpen(false); onTimeChange(range); setSelectedRange(idx) }} >
              {range.label}
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>)) }
      </div>
    </EuiPopover>
  )

}

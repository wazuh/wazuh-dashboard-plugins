/*
 * Wazuh app - React component Multi-select
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useState } from 'react';
import {
  EuiPopover,
  EuiPopoverTitle,
  EuiFieldSearch,
  EuiFilterSelectItem,
  EuiLoadingChart,
  EuiSpacer,
  EuiIcon,
  EuiFilterGroup,
  EuiFilterButton,
  FilterChecked,
} from '@elastic/eui';
import { IValueSuggestion, useValueSuggestion } from '../../hooks';

export const MultiSelect = ({ item, onChange, selectedOptions }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { suggestedValues, isLoading, setQuery }: IValueSuggestion = useValueSuggestion(
    item.key,
    item?.options
  );
  const [items, setItems] = useState<
    { key: any; label: any; value: any; checked: FilterChecked }[]
  >([]);
  const [activeFilters, setActiveFilters] = useState<number>(0);

  useEffect(() => {
    if (!isLoading) {
      setItems(
        suggestedValues
          .map((value, key) => ({
            key: key,
            label: value,
            value: item.key,
            filterByKey: item.filterByKey,
            checked: 'off' as FilterChecked,
          }))
          .sort((a, b) => a.label - b.label)
      );
    }
  }, [suggestedValues, isLoading, setQuery]);

  useEffect(() => {
    // TODO this doesn't work when selected options change from out side 
    /* items.forEach((item) => {
      item.checked = selectedOptions.find((element) =>
        Object.keys(selectedOptions).includes(element.value)
      )
        ? 'on'
        : 'off';
    }); */
  }, [selectedOptions]);

  const toggleFilter = (item) => {
    item.checked = item.checked === 'on' ? 'off' : 'on';
    updateFilters();
  };

  const updateFilters = () => {
    const selectedItems = items.filter((item) => item.checked === 'on');
    setActiveFilters(selectedItems.length);
    onChange(selectedItems);
  };

  const onSearch = (selectedOptions) => {
    // TODO this doesn't work
    setQuery(selectedOptions);
  };

  const onButtonClick = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const button = (
    <EuiFilterButton
      iconType="arrowDown"
      onClick={onButtonClick}
      isSelected={isPopoverOpen}
      numFilters={suggestedValues.length}
      hasActiveFilters={activeFilters > 0}
      numActiveFilters={activeFilters}
    >
      {item.placeholder}
    </EuiFilterButton>
  );

  return (
    <EuiFilterGroup data-test-subj={`multiSelect-${item.key}`}>
      <EuiPopover
        id={`popoverMultiSelect-${item.key}`}
        ownFocus
        button={button}
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        panelPaddingSize="none"
        withTitle
      >
        <EuiPopoverTitle>
          <EuiFieldSearch onSearch={onSearch} />
        </EuiPopoverTitle>
        <div className="euiFilterSelect__items">
          {items.map((item) => (
            <EuiFilterSelectItem
              checked={item.checked}
              key={item.key}
              onClick={() => toggleFilter(item)}
              showIcons={item.checked === 'on'}
            >
              {item.label}
            </EuiFilterSelectItem>
          ))}
          {isLoading && (
            <div className="euiFilterSelect__note">
              <div className="euiFilterSelect__noteContent">
                <EuiLoadingChart size="m" />
                <EuiSpacer size="xs" />
                <p>Loading filters</p>
              </div>
            </div>
          )}
          {suggestedValues.length === 0 && (
            <div className="euiFilterSelect__note">
              <div className="euiFilterSelect__noteContent">
                <EuiIcon type="minusInCircle" />
                <EuiSpacer size="xs" />
                <p>No filters found</p>
              </div>
            </div>
          )}
        </div>
      </EuiPopover>
    </EuiFilterGroup>
  );
};

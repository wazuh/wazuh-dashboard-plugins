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
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFilterSelectItem,
  EuiIcon,
  EuiLoadingChart,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  FilterChecked,
} from '@elastic/eui';
import { IValueSuggestion, useValueSuggestion } from '../../hooks';

const ON = 'on';
const OFF = 'off';

export const MultiSelect = ({ item, onChange, selectedOptions, onRemove }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
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
            checked: OFF as FilterChecked,
          }))
          .sort((a, b) => a.label - b.label)
      );
    }
  }, [suggestedValues, isLoading]);

  useEffect(() => {
    setItems(
      items.map((item) => ({
        ...item,
        checked: selectedOptions.find((element) => element.label === filterBy(item)) ? ON : OFF,
      }))
    );
    setActiveFilters(selectedOptions.length);
  }, [selectedOptions]);

  const filterBy = (item) => {
    return item.filterByKey ? item.key.toString() : item.label;
  };

  const toggleFilter = (item) => {
    item.checked = item.checked === ON ? OFF : ON;
    updateFilters(item.value);
  };

  const updateFilters = (id) => {
    const selectedItems = items.filter((item) => item.checked === ON);
    setActiveFilters(selectedItems.length);
    if (selectedItems.length) {
      onChange(selectedItems,id);
    } else {
      onRemove(item.key);
    }
  };

  const onSearch = (selectedOptions) => {
    setQuery(selectedOptions.target.value);
  };

  const onButtonClick = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
    setQuery('');
  };

  const button = (
    <EuiFilterButton
      iconType="arrowDown"
      onClick={onButtonClick}
      isSelected={isPopoverOpen}
      numFilters={selectedOptions.length}
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
          <EuiFieldSearch onChange={onSearch} />
        </EuiPopoverTitle>
        <div className="euiFilterSelect__items">
          {items.map((item) => (
            <EuiFilterSelectItem
              checked={item.checked}
              key={item.key}
              onClick={() => toggleFilter(item)}
              showIcons={item.checked === ON}
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

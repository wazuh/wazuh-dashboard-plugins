/*
 * Wazuh app - React component Multi-select
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import _ from 'lodash';

const ON = 'on';
const OFF = 'off';

interface Item {
  key: any;
  label: string;
  value: any;
  checked: FilterChecked;
}

export const MultiSelect = ({
  item,
  onChange,
  selectedOptions,
  onRemove,
  isDisabled,
  filterDrillDownValue,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const { suggestedValues, isLoading, setQuery }: IValueSuggestion = useValueSuggestion(
    item.key,
    filterDrillDownValue,
    item?.options
  );
  const [items, setItems] = useState<Item[]>([]);
  const [activeFilters, setActiveFilters] = useState<number>(0);

  const addCheckedOptions = () => {
    selectedOptions.map((value) => {
      if (ON === value.checked && suggestedValues.indexOf(value.label) === -1) {
        suggestedValues.push(value.label);
      }
    });
  };

  const orderByLabel = (items) => {
    return _.orderBy(items, 'label', 'asc');
  };

  const orderByChecked = (items) => {
    return _.orderBy(items, 'checked', 'desc');
  };

  const buildSuggestedValues = () => {
    const result = suggestedValues.map((value, key) => ({
      key: key,
      label: value,
      value: item.key,
      filterByKey: item.filterByKey,
      checked: selectedOptions.find((element) => element.label === value)
        ? (ON as FilterChecked)
        : (OFF as FilterChecked),
    }));

    return orderByChecked(orderByLabel(result));
  };

  useEffect(() => {
    if (!isLoading) {
      addCheckedOptions();
      setItems(buildSuggestedValues());
    }
  }, [suggestedValues, isLoading]);

  const setSelectedKey = (item: Item) => {
    const label = item.label.match(/\[.+?\]/g);
    if (label) {
      return parseInt(label[0].substring(1, label[0].length - 1));
    } else {
      return parseInt(item.key);
    }
  };

  const buildSelectedOptions = () => {
    const result = items.map((item) => ({
      ...item,
      checked: selectedOptions.find((element) => element.label === item.label)
        ? (ON as FilterChecked)
        : (OFF as FilterChecked),
      key: setSelectedKey(item),
    }));

    return orderByChecked(orderByLabel(result));
  };

  useEffect(() => {
    addCheckedOptions();
    setItems(buildSelectedOptions());
    setActiveFilters(selectedOptions.length);
  }, [selectedOptions]);

  const toggleFilter = (item: Item) => {
    items.map((item) => (item.key = setSelectedKey(item)));
    item.checked = item.checked === ON ? OFF : ON;
    item.key = setSelectedKey(item);
    updateFilters(item.value);
  };

  const updateFilters = (id) => {
    const selectedItems = items.filter((item) => item.checked === ON);
    setActiveFilters(selectedItems.length);
    if (selectedItems.length) {
      onChange(selectedItems, id);
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
      isDisabled={isDisabled}
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

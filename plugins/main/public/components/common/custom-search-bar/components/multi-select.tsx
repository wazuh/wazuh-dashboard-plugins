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
import { IndexPattern } from 'src/plugins/data/public';
import { IValueSuggestion, useValueSuggestion } from '../../hooks';
import _ from 'lodash';
import { BoolFilter } from '../../hooks/use-value-suggestion';

const Switch = {
  ON: 'on',
  OFF: 'off',
} as const;

type SwitchType = (typeof Switch)[keyof typeof Switch];

interface Item {
  key: any;
  label: string;
  value: any;
  checked: SwitchType;
}

interface MultiSelectProps {
  item: {
    key: string;
    placeholder: string;
    filterByKey?: boolean;
    options?: string[];
  };
  onChange: (selectedOptions: Item[], id: string) => void;
  selectedOptions: Item[];
  onRemove: (id: string) => void;
  isDisabled?: boolean;
  filterDrillDownValue?: BoolFilter;
  indexPattern: IndexPattern;
}

const mapToString = (value: any) =>
  typeof value === 'string' ? value : String(value);

export const MultiSelect: React.FC<MultiSelectProps> = ({
  item,
  onChange,
  selectedOptions,
  onRemove,
  isDisabled,
  filterDrillDownValue,
  indexPattern,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const { suggestedValues, isLoading, setQuery }: IValueSuggestion =
    useValueSuggestion(
      item.key,
      filterDrillDownValue,
      item?.options,
      indexPattern,
    );
  const [items, setItems] = useState<Item[]>([]);
  const [activeFilters, setActiveFilters] = useState<number>(0);

  const orderByLabel = items => {
    return _.orderBy(items, 'label', 'asc');
  };

  const orderByChecked = items => {
    return _.orderBy(items, 'checked', 'desc');
  };

  const buildSuggestedValues = () => {
    // Get the selected options that are not included in the suggested values
    const selectedOptionsNotInSuggestedValues = selectedOptions
      .filter(
        value =>
          Switch.ON === value.checked &&
          suggestedValues.indexOf(value.label) === -1,
      )
      .map(value => value.label);

    // Compose the selected options and suggested values and only accept unique values
    const uniqueSuggestions = [
      ...new Set(
        [...selectedOptionsNotInSuggestedValues, ...suggestedValues].map(
          mapToString,
        ),
      ),
    ];
    const result = uniqueSuggestions.map((value, key) => {
      return {
        key: key,
        label: value,
        value: item.key,
        filterByKey: item.filterByKey,
        checked: selectedOptions.find(element => element.label === value)
          ? (Switch.ON as FilterChecked)
          : (Switch.OFF as FilterChecked),
      };
    });

    return orderByChecked(orderByLabel(result));
  };

  useEffect(() => {
    if (!isLoading) {
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
    const result = items.map(item => ({
      ...item,
      checked: selectedOptions.find(element => element.label === item.label)
        ? (Switch.ON as FilterChecked)
        : (Switch.OFF as FilterChecked),
      key: setSelectedKey(item),
    }));

    return orderByChecked(orderByLabel(result));
  };

  useEffect(() => {
    setItems(buildSelectedOptions());
    setActiveFilters(selectedOptions.length);
  }, [selectedOptions]);

  const toggleFilter = (item: Item) => {
    items.map(item => (item.key = setSelectedKey(item)));
    item.checked = item.checked === Switch.ON ? Switch.OFF : Switch.ON;
    item.key = setSelectedKey(item);
    updateFilters(item.value);
  };

  const updateFilters = (id: string) => {
    const selectedItems = items.filter(item => item.checked === Switch.ON);
    setActiveFilters(selectedItems.length);
    if (selectedItems.length) {
      onChange(selectedItems, id);
    } else {
      onRemove(item.key);
    }
  };

  const onSearch = selectedOptions => {
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
      iconType='arrowDown'
      onClick={onButtonClick}
      isSelected={isPopoverOpen}
      numFilters={selectedOptions.length}
      hasActiveFilters={activeFilters > 0}
      numActiveFilters={activeFilters}
      isDisabled={isDisabled}
      size='s'
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
        panelPaddingSize='none'
      >
        <EuiPopoverTitle>
          <EuiFieldSearch onChange={onSearch} />
        </EuiPopoverTitle>
        <div className='euiFilterSelect__items'>
          {items.map(item => (
            <EuiFilterSelectItem
              checked={item.checked}
              key={item.key}
              onClick={() => toggleFilter(item)}
              showIcons={item.checked === Switch.ON}
            >
              {item.label}
            </EuiFilterSelectItem>
          ))}
          {isLoading && (
            <div className='euiFilterSelect__note'>
              <div className='euiFilterSelect__noteContent'>
                <EuiLoadingChart size='m' />
                <EuiSpacer size='xs' />
                <p>Loading filters</p>
              </div>
            </div>
          )}
          {suggestedValues.length === 0 && (
            <div className='euiFilterSelect__note'>
              <div className='euiFilterSelect__noteContent'>
                <EuiIcon type='minusInCircle' />
                <EuiSpacer size='xs' />
                <p>No filters found</p>
              </div>
            </div>
          )}
        </div>
      </EuiPopover>
    </EuiFilterGroup>
  );
};

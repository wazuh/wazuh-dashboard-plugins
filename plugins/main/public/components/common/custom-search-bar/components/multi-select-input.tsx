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
  EuiFormRow,
  EuiPopover,
  EuiPopoverTitle,
  FilterChecked,
} from '@elastic/eui';
import { IndexPattern } from 'src/plugins/data/public';
import _ from 'lodash';
import { BoolFilter } from '../../hooks/use-value-suggestion';
import { useForm } from '../../form/hooks';

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
    validate?: (value: string) => string | undefined;
  };
  onChange: (selectedOptions: Item[], id: string) => void;
  selectedOptions: Item[];
  onRemove: (id: string) => void;
  isDisabled?: boolean;
  filterDrillDownValue?: BoolFilter;
  indexPattern: IndexPattern;
}

/* This component create a multiselect whose values should be types in the search input, and remove
clicking in he selected items

*/
export const MultiSelectInput: React.FC<MultiSelectProps> = ({
  item,
  onChange,
  selectedOptions,
  onRemove,
  isDisabled,
  filterDrillDownValue,
  indexPattern,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const form = useForm({
    query: {
      type: 'text',
      initialValue: '',
      validate: item.validate,
    },
  });
  const [items, setItems] = useState<Item[]>([]);
  const [activeFilters, setActiveFilters] = useState<number>(0);

  const orderByLabel = items => {
    return _.orderBy(items, 'label', 'asc');
  };

  const orderByChecked = items => {
    return _.orderBy(items, 'checked', 'desc');
  };

  const buildQueryItem = query => ({
    key: setSelectedKey({ label: query }),
    label: query,
    value: item.key,
    filterByKey: item.filterByKey,
    checked: Switch.ON,
  });

  const setSelectedKey = (item: Item) => {
    const label = item.label.match(/\[.+?\]/g);
    if (label) {
      return parseInt(label[0].substring(1, label[0].length - 1));
    } else {
      return parseInt(item.key);
    }
  };

  const buildSelectedOptions = options => {
    const result = options.map(item => ({
      ...item,
      checked: options.find(element => element.label === item.label)
        ? (Switch.ON as FilterChecked)
        : (Switch.OFF as FilterChecked),
      key: setSelectedKey(item),
    }));

    return orderByChecked(orderByLabel(result));
  };

  useEffect(() => {
    setItems(buildSelectedOptions(selectedOptions));
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

  const onSearchInput = value => {
    // Ignore if there is no value, repeated values, or error in the input
    if (
      !value ||
      items.some(({ label }) => label === value) ||
      form.fields.query.error
    ) {
      return;
    }

    onChange([...items, buildQueryItem(value)], item.key);
    form.fields.query.onChange({ target: { value: '' } });
  };

  const onButtonClick = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
    form.fields.query.onChange({ target: { value: '' } });
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

  const isInvalid = Boolean(form.fields.query.error);

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
          <EuiFormRow
            fullWidth
            isInvalid={isInvalid}
            error={form.fields.query.error}
          >
            <EuiFieldSearch
              onChange={form.fields.query.onChange}
              onSearch={onSearchInput}
              value={form.fields.query.currentValue}
              isInvalid={isInvalid}
              isClearable={true}
            />
          </EuiFormRow>
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
        </div>
      </EuiPopover>
    </EuiFilterGroup>
  );
};

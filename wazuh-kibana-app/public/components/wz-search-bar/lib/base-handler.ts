/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { suggestItem } from '../wz-search-bar';

export abstract class BaseHandler {
  inputStage?: string;
  isSearch?: boolean;

  async buildSuggestItems(inputValue: string): Promise<suggestItem[]> {
    return [];
  }

  buildSuggestFields(inputValue: string): suggestItem[] {
    return [];
  }

  async buildSuggestValues(inputValue: string, value: string = ''): Promise<suggestItem[]> {
    return [];
  }

  buildSuggestValue(value: string | number = '') {
    return {
      type: { iconType: 'kqlValue', color: 'tint0' },
      label: typeof value !== 'string' ? value.toString() : value,
    };
  }

  filterSuggestFields(item, field: string = '') {
    return item.label.includes(field);
  }

  filterSuggestValues(item: number | string, inputValue: string) {
    if (typeof item === 'number' && !!inputValue) {
      // @ts-ignore
      return item == inputValue;
    } else if (!!inputValue) {
      // @ts-ignore
      return item.includes(inputValue);
    }
    return true;
  }

  onItemClick(item: suggestItem, inputValue: string, filters: object): void {}

  onInputChange(
    inputValue: string,
    currentFilters: object
  ): {
    isInvalid: boolean;
    filters: object;
  } {
    return { isInvalid: true, filters: {} };
  }

  onKeyPress(inputValue: string, currentFilters: object): void {}

  mapSuggestFields(item): suggestItem {
    const suggestItem = {
      type: {
        iconType: 'kqlField',
        color: 'tint4',
      },
      label: item.label,
    };
    if (item.description) {
      suggestItem['description'] = item.description;
    }
    return suggestItem;
  }
}

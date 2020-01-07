/*
 * Wazuh app - React component for show search and filter in the rules,decoder and CDB lists.
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { suggestItem } from '../wz-search-bar';
import { boolean } from 'joi';


export abstract class BaseHandler {
  inputStage?: string;
  
  buildSuggestItems(inputValue: string):suggestItem[] {
    return [];
  }
  
  buildSuggestFields(inputValue:string):suggestItem[] {
    return [];
  };

  filterSuggestFields(item, field: string = '') {
    return item.label.includes(field);
  }

  onItemClick(item:suggestItem, inputValue:string, filters:object):{
    inputValue:string, filters:object
  } { return {inputValue, filters}; }

  onInputChange(inputValue:string, currentFilters:object):{
    isInvalid: boolean, filters: object
  } { return {isInvalid:true, filters:{}} }

  mapSuggestFields(item): suggestItem {
    const suggestItem = {
      type: {
        iconType: 'kqlField',
        color: 'tint4'
      },
      label: item.label,
    }
    if (item.description) {
      suggestItem['description'] = item.description;
    }
    return suggestItem;
  }
}

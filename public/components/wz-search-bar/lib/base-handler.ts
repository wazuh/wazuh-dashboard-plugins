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


export abstract class BaseHandler {

  buildSuggestFields(inputValue:string):suggestItem[] {
    return [];
  };

  filterSuggestFields(item, field: string = '') {
    return item.label.includes(field);
  }

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

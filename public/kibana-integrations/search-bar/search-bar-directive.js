/*
 * Author: Elasticsearch B.V.
 * Updated by Wazuh, Inc.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import 'ngreact';
import { wrapInI18nContext } from 'ui/i18n';
import { uiModules } from 'ui/modules';
import { SearchBar } from './search_bar';

const app = uiModules.get('app/wazuh', ['react']);

app.directive('wzSearchBar', (reactDirective, localStorage) => {
  return reactDirective(
    wrapInI18nContext(SearchBar),
    undefined,
    {},
    {
      store: localStorage
    }
  );
});

/*
 * Wazuh app - kbn-src sustitution directive
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
import chrome from 'ui/chrome';
const app = uiModules.get('app/wazuh', []);

app.directive('wzSrc', function() {
  return {
    restrict: 'A',
    link: function($scope, $el, $attr) {
      const url = chrome.addBasePath($attr.wzSrc);
      $attr.$set('src', url);
    }
  };
});

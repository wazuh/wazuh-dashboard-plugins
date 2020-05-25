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

import _ from 'lodash';
import { uiModules } from 'ui/modules';
// Debounce service, angularized version of lodash debounce
// borrowed heavily from https://github.com/shahata/angular-debounce

const module = uiModules.get('app/wazuh');

module.service('debounce', [
  '$timeout',
  function($timeout) {
    return function(func, wait, options) {
      let timeout;
      let args;
      let self;
      let result;
      options = _.defaults(options || {}, {
        leading: false,
        trailing: true,
        invokeApply: true
      });

      function debounce() {
        self = this;
        args = arguments;

        const later = function() {
          timeout = null;
          if (!options.leading || options.trailing) {
            result = func.apply(self, args);
          }
        };

        const callNow = options.leading && !timeout;

        if (timeout) {
          $timeout.cancel(timeout);
        }
        timeout = $timeout(later, wait, options.invokeApply);

        if (callNow) {
          result = func.apply(self, args);
        }

        return result;
      }

      debounce.cancel = function() {
        $timeout.cancel(timeout);
        timeout = null;
      };

      return debounce;
    };
  }
]);

export function DebounceProvider(debounce) {
  return debounce;
}

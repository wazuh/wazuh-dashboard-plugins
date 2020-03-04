/*
 * Wazuh app - Module to catch last url
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
// Manage leaving the app to another Kibana tab
export function goToKibana($location, $window) {
  const url = $location.$$absUrl.substring(0, $location.$$absUrl.indexOf('#'));
  const lastSubUrl = $window.sessionStorage.getItem(`lastSubUrl:${url}`) || '';
  if (
    lastSubUrl.includes('/wazuh#/visualize') ||
    lastSubUrl.includes('/wazuh#/doc') ||
    lastSubUrl.includes('/wazuh#/context')
  ) {
    $window.sessionStorage.setItem(`lastSubUrl:${url}`, url);
  }

  $window.location.href = $location.absUrl().replace('/wazuh#', '/kibana#');
}

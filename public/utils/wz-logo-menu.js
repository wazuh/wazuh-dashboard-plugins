/*
 * Wazuh app - Remove Wazuh name
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Remove Kibana Wazuh name and breadcrumb
export const changeWazuhNavLogo = () => {
  const interval = setInterval(() => {
    const nav = $('nav');
    if (nav.length) {
      clearInterval(interval);
    }
    $('.euiHeader > .euiBreadcrumbs  > .euiBreadcrumb').html(``);
  }, 100);
};

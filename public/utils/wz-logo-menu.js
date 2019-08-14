/*
 * Wazuh app - Replace Wazuh name string by logo
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Adds the logowz-menu
export const changeWazuhNavLogo = () => {
  const interval = setInterval(() => {
    const nav = $('nav');
    if (nav.length) {
      clearInterval(interval);
    }
    $('.euiBreadcrumb').html(
      '<img src="/plugins/wazuh/img/logo.svg" class="navBarLogo" alt="">'
    );
  }, 100);
};

/*
 * Wazuh app - Load a different them depending on IS_DARK_THEME value
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import wzMenuTemplate from '../directives/wz-menu/wz-menu-jq.html';

// Adds the logo
const addLogo = () => {
  $('.euiBreadcrumb').html('<img src="/plugins/wazuh/img/new_logo_white.svg" class="navBarLogo" alt="">')
}

// Clear active class
const clearActive = () => {
  $('.wz-menu-button').removeClass('wz-menu-active');
}

// Change the navbar with JQuery for the wz-menu
export const changeNavBar = () => {
  const interval = setInterval(() => {
    const nav = $('nav');
    if (nav.length) {
      nav.append(`<div class="wz-menu-jq">${wzMenuTemplate}</div><div class="wz-menu-bottom-line"></div>`);
      clearInterval(interval);
    }
    addLogo()
    const owBtn = $('#wzBtnOverview')
    const mngBtn = $('#wzBtnManager')
    const agBtn = $('#wzBtnAgents')
    const disBtn = $('#wzBtnDiscover')
    const devBtn = $('#wzBtnDev')
    const setBtn = $('#wzBtnSettings')


    owBtn.click(() => {
      window.location.href = '#/overview';
      clearActive();
      owBtn.addClass('wz-menu-active');
    });

    mngBtn.click(() => {
      window.location.href = '#/manager';
      clearActive();
      mngBtn.addClass('wz-menu-active');
    });

    agBtn.click(() => {
      window.location.href = '#/agents-preview';
      clearActive();
      agBtn.addClass('wz-menu-active');
    });

    disBtn.click(() => {
      window.location.href = '#/wazuh-discover';
      clearActive();
      disBtn.addClass('wz-menu-active');
    });

    devBtn.click(() => {
      window.location.href = '#/wazuh-dev';
      clearActive();
      devBtn.addClass('wz-menu-active');
    });

    setBtn.click(() => {
      window.location.href = '#/settings';
      clearActive();
      setBtn.addClass('wz-menu-active');
    });
  }, 500);
}
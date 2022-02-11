/*
 * Wazuh app - plugin platform theming configuration file
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { getAngularModule } from '../kibana-services';

const app = getAngularModule();

app.config(function($mdThemingProvider) {
  let kibanaWhiteBlack = {
    '50': '#ffffff',
    '100': '#ffffff',
    '200': '#ffffff',
    '300': '#ffffff',
    '400': '#fafafa',
    '500': '#ecf0f1',
    '600': '#dde4e6',
    '700': '#cfd9db',
    '800': '#c0cdd1',
    '900': '#000000',
    A100: '#ffffff',
    A200: '#ffffff',
    A400: '#ffffff',
    A700: '#a3b6bb'
  };

  $mdThemingProvider.definePalette('kibanaWhiteBlack', kibanaWhiteBlack);

  let kibanaBlue = {
    '50': '#a4d9ea',
    '100': '#8fd0e5',
    '200': '#7ac8e0',
    '300': '#65bfdc',
    '400': '#51b7d7',
    '500': '#3caed2',
    '600': '#2ea2c7',
    '700': '#2991b2',
    '800': '#24809d',
    '900': '#206f88',
    A100: '#b8e2ef',
    A200: '#cdeaf3',
    A400: '#e2f3f8',
    A700: '#1b5e74',
    contrastDefaultColor: 'dark'
  };

  $mdThemingProvider.definePalette('kibanaBlue', kibanaBlue);

  $mdThemingProvider
    .theme('default')
    .primaryPalette('blue-grey', {
      default: '100',
      'hue-1': '300',
      'hue-2': '500',
      'hue-3': '700'
    })
    .accentPalette('kibanaBlue', {
      default: '500',
      'hue-1': '800',
      'hue-2': '300',
      'hue-3': '100'
    })
    .warnPalette('amber', {
      default: '300',
      'hue-1': '500',
      'hue-2': '700',
      'hue-3': '900'
    })
    .backgroundPalette('kibanaWhiteBlack', {
      default: '50',
      'hue-1': '50',
      'hue-2': '600',
      'hue-3': '900'
    });
});

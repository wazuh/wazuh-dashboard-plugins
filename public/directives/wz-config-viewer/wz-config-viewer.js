/*
 * Wazuh app - Wazuh config viewer directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import template from './wz-config-viewer.html';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

class WzConfigViewer {
  constructor() {
    this.restrict = 'E';
    this.scope = {
      getjson: '&',
      getxml: '&',
      jsoncontent: '=jsoncontent',
      xmlcontent: '=xmlcontent'
    };
    this.replace = true;
    this.template = template;
  }

  link(scope) {
    scope.callgetjson = () => {
      scope.getjson();
    };
    scope.callgetxml = () => scope.getxml();
  }
}

app.directive('wzConfigViewer', () => new WzConfigViewer());

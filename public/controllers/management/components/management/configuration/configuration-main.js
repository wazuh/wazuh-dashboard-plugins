/*
 * Wazuh app - React component for show main configuration.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import WzConfigurationSwitch from './configuration-switch';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withReduxProvider,
} from '../../../../../components/common/hocs';
import { compose } from 'redux';
import { i18n } from '@kbn/i18n';
const text1 = i18n.translate('controller.manage.comp.confi.main.text1', {
  defaultMessage: 'Management',
});
const text2 = i18n.translate('controller.manage.comp.confi.main.text2', {
  defaultMessage: 'Configuration',
});
const text3 = i18n.translate('controller.manage.comp.confi.main.text3', {
  defaultMessage: 'Agents',
});
const text4 = i18n.translate('controller.manage.comp.confi.main.text4', {
  defaultMessage: 'Configuration',
});
export default compose(
  withErrorBoundary,
  withReduxProvider,
  withGlobalBreadcrumb(props => {
    let breadcrumb = false;
    if (props.agent.id === '000') {
      breadcrumb = [
        { text: '' },
        { text: text1, href: '#/manager' },
        { text: text2 },
      ];
    } else {
      breadcrumb = [
        { text: '' },
        {
          text: text3,
          href: '#/agents-preview',
        },
        { agent: props.agent },
        { text: text4 },
      ];
    }
    $('#breadcrumbNoTitle').attr('title', '');
    return breadcrumb;
  }),
)(WzConfigurationSwitch);

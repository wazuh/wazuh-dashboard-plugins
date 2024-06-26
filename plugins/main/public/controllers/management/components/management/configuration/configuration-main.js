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
} from '../../../../../components/common/hocs';
import { compose } from 'redux';
import { endpointSummary, settings } from '../../../../../utils/applications';
import NavigationService from '../../../../../react-services/navigation-service';

export default compose(
  withErrorBoundary,
  withGlobalBreadcrumb(props => {
    let breadcrumb = false;
    if (props.agent?.id === '000') {
      breadcrumb = [{ text: settings.breadcrumbLabel }];
    } else {
      breadcrumb = [
        {
          text: endpointSummary.breadcrumbLabel,
          href: NavigationService.getInstance().getUrlForApp(
            endpointSummary.id,
            {
              path: `#/agents-preview`,
            },
          ),
        },
        { agent: props.agent },
        { text: 'Configuration' },
      ];
    }
    $('#breadcrumbNoTitle').attr('title', '');
    return breadcrumb;
  }),
)(WzConfigurationSwitch);

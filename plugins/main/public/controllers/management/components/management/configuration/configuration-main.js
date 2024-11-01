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
import { SECTIONS } from '../../../../../sections';

export default compose(
  withErrorBoundary,
  withGlobalBreadcrumb(({ agent }) => {
    let breadcrumb = false;
    if (agent?.id === '000') {
      breadcrumb = [{ text: settings.breadcrumbLabel }];
    } else {
      breadcrumb = [
        {
          text: endpointSummary.breadcrumbLabel,
          href: NavigationService.getInstance().getUrlForApp(
            endpointSummary.id,
            {
              path: `#/${SECTIONS.AGENTS_PREVIEW}`,
            },
          ),
        },
        { agent },
        { text: 'Configuration' },
      ];
    }
    document.querySelector('#breadcrumbNoTitle')?.setAttribute('title', '');
    return breadcrumb;
  }),
)(WzConfigurationSwitch);

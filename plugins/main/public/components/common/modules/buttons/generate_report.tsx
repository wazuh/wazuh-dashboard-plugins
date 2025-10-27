/*
 * Wazuh app - Component for the module generate reports
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { WzButton } from '../../../common/buttons';
import NavigationService from '../../../../react-services/navigation-service';

export const ButtonModuleGenerateReport = () => {
  const redirectToReporting = () =>
    NavigationService.getInstance().navigateToApp('reportsDashboards');

  return (
    <WzButton
      buttonType='empty'
      iconType='document'
      onClick={redirectToReporting}
    >
      Generate report
    </WzButton>
  );
};

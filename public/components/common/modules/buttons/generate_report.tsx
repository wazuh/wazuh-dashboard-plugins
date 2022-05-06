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
import { useAsyncAction } from '../../hooks';
import { getUiSettings } from '../../../../kibana-services';
import { ReportingService } from '../../../../react-services';
import $ from 'jquery';
import { WzButton } from '../../../common/buttons';


export const ButtonModuleGenerateReport = ({agent, moduleID, disabledReport}) => {
  const action = useAsyncAction(async () => {
    const reportingService = new ReportingService();
    const isDarkModeTheme = getUiSettings().get('theme:darkMode');
    if (isDarkModeTheme) {

      //Patch to fix white text in dark-mode pdf reports
      const defaultTextColor = '#DFE5EF';

      //Patch to fix dark backgrounds in visualizations dark-mode pdf reports
      const $labels = $('.euiButtonEmpty__text, .echLegendItem');
      const $vizBackground = $('.echChartBackground');
      const defaultVizBackground = $vizBackground.css('background-color');

      try {
        $labels.css('color', 'black');
        $vizBackground.css('background-color', 'transparent');
        await reportingService.startVis2Png(moduleID, agent?.id || false)
        $vizBackground.css('background-color', defaultVizBackground);
        $labels.css('color', defaultTextColor);
      } catch (e) {
        $labels.css('color', defaultTextColor);
        $vizBackground.css('background-color', defaultVizBackground);
      }
    } else {
      await reportingService.startVis2Png(moduleID, agent?.id || false)
    }
  }, [agent]);
  
  return (
    <WzButton
      buttonType='empty'
      iconType='document'
      isLoading={action.running}
      onClick={action.run}
      isDisabled={disabledReport}
      tooltip={disabledReport ? {position: 'top', content: 'No results match for this search criteria.'} : undefined}
    >
      Generate report
    </WzButton>
  )
}


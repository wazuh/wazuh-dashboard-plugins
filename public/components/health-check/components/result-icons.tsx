/*
 * Wazuh app - Result Icons Component
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import React from 'react';
import {
  EuiIcon,
  EuiButtonIcon,
  EuiLoadingSpinner,
  EuiToolTip,
} from '@elastic/eui';
import { resultsPreset } from '../types/result-icons-presets';

const ResultIcons = ({ result, children, initCheck }) => {
  

  return (
    <>{
      resultsPreset[result].disabled ? <>Disabled</> : <>
        <EuiToolTip
          position='top'
          content={resultsPreset[result].tooltipText}>
          {resultsPreset[result].spinner ? <EuiLoadingSpinner size="m" /> :
            <EuiIcon aria-label={result} type={resultsPreset[result].iconType} color={resultsPreset[result].iconColor}></EuiIcon>
          }
        </EuiToolTip>

        {children}
        {resultsPreset[result].retry && <EuiToolTip
          position='top'
          content='Retry'
        >
          <EuiButtonIcon
            display="base"
            iconType="refresh"
            iconSize="m"
            onClick={initCheck}
            size="m"
            aria-label="Next"
          />
        </EuiToolTip>}
      </>
    }
    </>
  );

};
export default ResultIcons;
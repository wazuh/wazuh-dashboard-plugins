/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useState, Fragment } from 'react'
import {
  euiPaletteColorBlind,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiLoadingChart,
} from '@elastic/eui';
import { useTimeFilter } from '../../../';
import { getRequirementAlerts } from './lib';
import { Requirements_leggend, RequirementsDonnut } from './components';

export function RequirementsBody(props) {
  const { requirement } = props;
  const colors = euiPaletteColorBlind();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([])
  const timeFilter = useTimeFilter();
  useEffect(() => {
    const { id } = props.agent;
    setLoading(true);
    getRequirementAlerts(id, timeFilter, requirement).then(e => {
      setData(e.alerts_count);
      setTimeout(() => setLoading(false), 700);
    })
  }, [requirement, timeFilter]);
  if (loading) return (
    <div style={{ textAlign: "center", paddingTop: 100, height: 238}}>
      <EuiLoadingChart size="xl" />
    </div>
  )
  if (!data.length) return (<div>No data!</div>);
  return (
    <Fragment>
      <EuiFlexItem>
        <EuiSpacer size="m" />
      </EuiFlexItem>
      <EuiFlexGroup>
        <EuiFlexItem>
          <RequirementsDonnut data={data} colors={colors} {...props} />
        </EuiFlexItem>
        <EuiFlexItem>
          <Requirements_leggend data={data} colors={colors} requirement={requirement} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  );
}


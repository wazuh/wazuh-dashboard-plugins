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

import React from "react";
import { EuiIcon } from "@elastic/eui";
import { EuiFlexGroup, EuiListGroup } from "@elastic/eui";

export function Requirements_leggend({ data, colors }) {
  const list = data.map((item, idx) => ({
    label: `${item.key} (${item.doc_count})`,
    icon: <EuiIcon type="dot" color={colors[idx]} />,
    href: '#',
    color: 'text'
  }));
  return (
    <EuiFlexGroup>
      <EuiListGroup listItems={list} color='text' />
    </EuiFlexGroup>
  );
}

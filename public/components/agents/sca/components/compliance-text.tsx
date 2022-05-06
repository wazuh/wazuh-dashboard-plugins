/*
 * Wazuh app - ComplianceText component
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
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

interface IComplianceText {
  complianceText: string;
}

type item = {
  title: string;
  description: string;
};

interface IComplianceItem {
  item: item;
}

export const ComplianceText: React.FunctionComponent<IComplianceText> = ({ complianceText }) => {
  const complianceList = complianceText.split('\n');
  //@ts-ignore
  const listItems: item[] = complianceList
    .map((item) => /(?<title>\S+): (?<description>.+)/.exec(item)?.groups)
    .filter((item) => !!item);
  return (
    <EuiFlexGroup direction="column" gutterSize="xs">
      {listItems.map((item, idx) => (
        <ComplianceItem key={idx} item={item} />
      ))}
    </EuiFlexGroup>
  );
};

const ComplianceItem: React.FunctionComponent<IComplianceItem> = ({ item }) => {
  return (
    <EuiFlexItem>
      <p>
        <strong>{item.title}: </strong> {item.description}
      </p>
    </EuiFlexItem>
  );
};

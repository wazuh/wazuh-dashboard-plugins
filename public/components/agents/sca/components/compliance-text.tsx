import React from 'react';
import {
  EuiFlexItem,
  EuiFlexGroup
} from '@elastic/eui';

interface IComplianceText {
  complianceText: string
}

type item = {
  title: string
  description: string
}

interface IComplianceItem {
  item: item
}

export const ComplianceText: React.FunctionComponent<IComplianceText> = ({ complianceText }) => {
  const complianceList = complianceText.split("\n");
  //@ts-ignore
  const listItems: item[] = complianceList.map(item => /(?<title>\S+): (?<description>.+)/.exec(item)?.groups).filter(item => !!item);
  return (
    <EuiFlexGroup direction="column" gutterSize="xs">
      {listItems.map((item, idx) => <ComplianceItem key={idx} item={item} />)}
    </EuiFlexGroup>
  )
}

const ComplianceItem: React.FunctionComponent<IComplianceItem> = ({ item }) => {
  return (
    <EuiFlexItem>
      <p><strong>{item.title}: </strong> {item.description}</p>
    </EuiFlexItem>
  )
}
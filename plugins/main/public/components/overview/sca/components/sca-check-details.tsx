import React from 'react';
import { scaI18n } from '../../i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';

type MitreCategory = { id?: string[]; name?: string[] };

const getMitreDisplayValues = (value?: MitreCategory): string[] => {
  const ids = value?.id ?? [];
  const names = value?.name ?? [];
  const length = Math.max(ids.length, names.length);
  const result: string[] = [];
  for (let index = 0; index < length; index++) {
    const id = ids[index];
    const name = names[index];
    if (id && name) {
      result.push(`${id} - ${name}`);
    } else if (id || name) {
      result.push(id || name);
    }
  }
  return result;
};

interface CheckDetailsProps {
  check: {
    description: string;
    rationale: string;
    remediation: string;
    condition: string;
    rules: string[];
    compliance: Record<string, string[]>;
    mitre: Record<string, MitreCategory>;
  };
}
export const CheckDetails: React.FC<CheckDetailsProps> = ({ check }) => {
  return (
    <EuiFlexGroup direction='column' gutterSize='m' style={{ padding: 16 }}>
      <EuiFlexItem>
        <EuiTitle size='s'>
          <h3>{scaI18n.description}</h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiText>
          <p>{check.description} </p>
        </EuiText>
      </EuiFlexItem>

      <EuiFlexItem>
        <EuiTitle size='s'>
          <h3>{scaI18n.rationale}</h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiText>
          <p>{check.rationale}</p>
        </EuiText>
      </EuiFlexItem>

      <EuiFlexItem>
        <EuiTitle size='s'>
          <h3>{scaI18n.remediation}</h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiText>
          <p>{check.remediation}</p>
        </EuiText>
      </EuiFlexItem>

      <EuiFlexItem>
        <EuiTitle size='s'>
          <h3>{scaI18n.checkWithCondition(check.condition)}</h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiText>
          <ul>
            {check.rules.map((rule: string, index: number) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        </EuiText>
      </EuiFlexItem>

      <EuiFlexItem>
        <EuiTitle size='s'>
          <h3>{scaI18n.compliance}</h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiText>
          <ul>
            {Object.entries(check.compliance || {}).map(([key, values]) => (
              <li key={key}>
                <strong>{key}: </strong>
                <code>{(values || []).join(', ')}</code>
              </li>
            ))}
          </ul>
        </EuiText>
      </EuiFlexItem>

      <EuiFlexItem>
        <EuiTitle size='s'>
          <h3>{scaI18n.mitre}</h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiText>
          <ul>
            {Object.entries(check.mitre || {})
              .map(
                ([key, value]) =>
                  [key, getMitreDisplayValues(value)] as [string, string[]],
              )
              .filter(([, values]) => values.length > 0)
              .map(([key, values]) => (
                <li key={key}>
                  <strong>{key}: </strong>
                  <code>{values.join(', ')}</code>
                </li>
              ))}
          </ul>
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

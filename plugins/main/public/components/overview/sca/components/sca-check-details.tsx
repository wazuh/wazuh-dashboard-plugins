import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';

interface CheckDetailsProps {
  check: {
    description: string;
    rationale: string;
    remediation: string;
    condition: string;
    rules: string[];
    compliance: Record<string, string[]>;
    mitre: Record<string, string[]>;
  };
}
export const CheckDetails: React.FC<CheckDetailsProps> = ({ check }) => {
  return (
    <EuiFlexGroup direction='column' gutterSize='m' style={{ padding: 16 }}>
      <EuiFlexItem>
        <EuiTitle size='s'>
          <h3>Description</h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiText>
          <p>{check.description} </p>
        </EuiText>
      </EuiFlexItem>

      <EuiFlexItem>
        <EuiTitle size='s'>
          <h3>Rationale</h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiText>
          <p>{check.rationale}</p>
        </EuiText>
      </EuiFlexItem>

      <EuiFlexItem>
        <EuiTitle size='s'>
          <h3>Remediation</h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiText>
          <p>{check.remediation}</p>
        </EuiText>
      </EuiFlexItem>

      <EuiFlexItem>
        <EuiTitle size='s'>
          <h3>Check (Condition: {check.condition})</h3>
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
          <h3>Compliance</h3>
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
          <h3>Mitre</h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiText>
          <ul>
            {Object.entries(check.mitre || {}).map(([key, values]) => (
              <li key={key}>
                <strong>{key}: </strong>
                <code>{(values || []).join(', ')}</code>
              </li>
            ))}
          </ul>
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

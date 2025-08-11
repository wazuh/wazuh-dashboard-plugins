import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiPanel,
} from '@elastic/eui';

interface CheckDetailsProps {
  check: {
    description: string;
    rationale: string;
    remediation: string;
    condition: string;
    rules: string[];
    compliance: string[];
  };
}

export const CheckDetails: React.FC<CheckDetailsProps> = ({ document }) => {
  const { check } = document._source;

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
            {check.compliance.map((compliance: string, index: number) => {
              if (!compliance.includes(':')) {
                return (
                  <li key={index}>
                    <code>{compliance}</code>
                  </li>
                );
              }
              const complianceSplitted = compliance.split(':');
              const complianceLabel = complianceSplitted[0];
              const complianceValue = complianceSplitted[1];
              return (
                <li key={index}>
                  <strong>{complianceLabel}: </strong>
                  <code>{complianceValue}</code>
                </li>
              );
            })}
          </ul>
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

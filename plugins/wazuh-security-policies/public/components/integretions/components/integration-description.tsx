import React from 'react';
import {
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';

interface IntegrationDescriptionProps {
  keyValue: string;
  value: any;
}

export const IntegrationDescription = (props: IntegrationDescriptionProps) => {
  const { keyValue, value } = props;
  const renderTitleDescription = (key: string, value: string) => (
    <div style={{ margin: '10px', minWidth: '200px', maxWidth: '250px' }}>
      <EuiDescriptionListTitle>{key}</EuiDescriptionListTitle>
      <EuiDescriptionListDescription style={{ wordBreak: 'break-word' }}>
        {value}
      </EuiDescriptionListDescription>
    </div>
  );

  const renderObjectValue = (keyObject: string, valueObject: object) => {
    const subList = Object.entries(valueObject).map(([key, value]) => ({
      key: `${keyObject}.${key}`,
      value: value,
    }));

    return subList.map(item => renderTitleDescription(item.key, item.value));
  };

  const renderValue = (key: string, value: any) => {
    if (Array.isArray(value)) {
      return renderTitleDescription(key, value.join(', '));
    } else if (typeof value === 'object') {
      return renderObjectValue(key, value);
    } else if (typeof value === 'boolean') {
      return renderTitleDescription(key, value ? 'Enable' : 'Disable');
    } else {
      return renderTitleDescription(key, value);
    }
  };

  return renderValue(keyValue, value);
};

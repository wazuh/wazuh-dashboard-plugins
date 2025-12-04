import React from 'react';
import { EuiLink } from '@elastic/eui';
import { formatUIDate } from '../../../../react-services';

type MetadataFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'url'
  | 'boolean'
  | 'boolean_yesno';

export const MetadataFieldText: React.FC<{ value: string }> = ({ value }) => {
  return value;
};

export const MetadataFieldURL: React.FC<{ value: string }> = ({ value }) => {
  return (
    <EuiLink target='_blank' rel='noopener noreferrer' href={value}>
      {value}
    </EuiLink>
  );
};

export const MetadataFieldBoolean: React.FC<{ value: string }> = ({
  value,
}) => {
  return String(value);
};

export const MetadataFieldBooleanAsYesNo: React.FC<{ value: string }> = ({
  value,
}) => {
  return value ? 'Yes' : 'No';
};

export const MetadataFieldDate: React.FC<{ value: string }> = ({ value }) => {
  return formatUIDate(value);
};

const mapFieldRenderers: {
  [key in MetadataFieldType]: React.FC<{ value: any }>;
} = {
  text: MetadataFieldText,
  boolean: MetadataFieldBoolean,
  boolean_yesno: MetadataFieldBooleanAsYesNo,
  number: MetadataFieldText,
  date: MetadataFieldDate,
  url: MetadataFieldURL,
};

export const Metadata: React.FC<{
  type: MetadataFieldType;
  value: string | number;
  label?: string;
}> = ({ value, label, type = 'text' }) => {
  return (
    <div>
      <div>
        <strong>{label}</strong>
      </div>
      <div style={label ? { marginTop: '4px' } : {}}>
        {typeof value === 'undefined'
          ? '-'
          : Array.isArray(value)
          ? value.map((v, i) => (
              <div key={`${label}-${i}`}>
                {mapFieldRenderers[type]({ value: v })}
              </div>
            ))
          : mapFieldRenderers[type]({ value })}
      </div>
    </div>
  );
};

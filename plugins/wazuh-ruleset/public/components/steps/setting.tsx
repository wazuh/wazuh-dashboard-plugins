import React from 'react';
import {
  EuiForm,
  EuiFormRow,
  EuiCodeBlock,
  EuiSpacer,
  EuiFieldText,
} from '@elastic/eui';

function parseObjectValue(value: object) {
  const listSettings = Object.entries(value).map(entry => {
    let parsedValue = '';

    if (Array.isArray(entry[1])) {
      parsedValue = entry[1].join(', ');
    } else if (typeof entry[1] === 'string') {
      parsedValue = entry[1];
    }

    return { subtitle: entry[0], value: parsedValue };
  });

  return listSettings;
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const SettingValue = ({
  title,
  value,
}: {
  title: string;
  value: string | object;
}) => {
  if (typeof value === 'object') {
    const values = parseObjectValue(value);

    return (
      <>
        {values.map(({ subtitle, value }, index) => (
          <EuiFormRow fullWidth label={`${title}.${subtitle}`} key={index}>
            <EuiCodeBlock language='json'>{value}</EuiCodeBlock>
          </EuiFormRow>
        ))}
      </>
    );
  }

  return (
    <>
      {/* <EuiFormRow label={title} fullWidth>
        <EuiCodeBlock>{value}</EuiCodeBlock>
      </EuiFormRow> */}
      <EuiFieldText
        prepend={capitalizeFirstLetter(title)}
        value={value}
        fullWidth
        readOnly
      />
      <EuiSpacer />
    </>
  );
};

const Setting = ({ title, value }: { title: string; value: string }) => (
  <EuiForm>
    {/* <EuiDescribedFormGroup
        title={<h2>{title}</h2>}
        titleSize='xxxs'
        // description={description}
        fullWidth
      > */}
    <SettingValue title={title} value={value} />
    {/* </EuiDescribedFormGroup> */}
  </EuiForm>
);

export const Settings = ({ step }: { step: object | any[] | string }) => {
  const listSettings = Object.entries(step).map(entry => {
    const value = Array.isArray(entry[1]) ? entry[1].join(', ') : entry[1];

    return {
      title: entry[0],
      description: entry[0],
      value: value,
    };
  });

  return listSettings.map(({ title, description, value }, index) => (
    <Setting
      key={index}
      title={title}
      description={description}
      value={value}
    />
  ));
};

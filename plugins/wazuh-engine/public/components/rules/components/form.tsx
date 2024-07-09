import React, { useMemo } from 'react';
import spec from '../spec.json';
import { transfromAssetSpecToForm } from '../utils/transform-asset-spec';

export const RuleForm = props => {
  const { useForm, InputForm } = props;
  const specForm = useMemo(() => transfromAssetSpecToForm(spec), []);
  const { fields } = useForm(specForm);

  return (
    <>
      {Object.entries(fields).map(([name, formField]) => (
        <InputForm {...formField} label={name} />
      ))}
    </>
  );
};

import React, { useMemo } from 'react';
import spec from '../spec.json';
import specMerge from '../spec-merge.json';
import { transfromAssetSpecToForm } from '../utils/transform-asset-spec';
import { FormGroup } from '../../../common/form';

export const Form = props => {
  const { useForm, InputForm } = props;
  const specForm = useMemo(() => transfromAssetSpecToForm(spec, specMerge), []);

  return (
    <FormGroup
      useForm={useForm}
      InputForm={InputForm}
      specForm={specForm}
      groupInputsByKey='_meta.groupForm'
      renderGroups={[
        { title: 'General', groupKey: 'metadata' },
        { title: 'Author', groupKey: 'author' },
        { title: 'Steps', groupKey: 'steps' },
      ]}
    />
  );
};

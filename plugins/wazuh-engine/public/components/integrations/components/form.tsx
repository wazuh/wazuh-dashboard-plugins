import React, { useMemo } from 'react';
import spec from '../spec.json';
import specMerge from '../spec-merge.json';
import { transfromAssetSpecToForm } from '../utils/transform-asset-spec';
import { FormGroup } from '../../../common/form';

export const RuleForm = props => {
  const { useForm, InputForm } = props;
  const specForm = useMemo(() => transfromAssetSpecToForm(spec, specMerge), []);

  return (
    <FormGroup
      useForm={useForm}
      InputForm={InputForm}
      specForm={specForm}
      groupInputsByKey='_meta.groupForm'
      renderGroups={[
        { title: 'Documentation', groupKey: 'documentation' },
        { title: 'Policy', groupKey: 'policy' },
        { title: 'Changelog', groupKey: 'changelog' },
      ]}
    />
  );
};

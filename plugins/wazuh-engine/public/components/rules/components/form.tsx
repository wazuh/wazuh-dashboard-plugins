import React, { useMemo } from 'react';
import spec from '../spec.json';
import specMerge from '../spec-merge.json';
import { transfromAssetSpecToForm } from '../utils/transform-asset-spec';
import {
  FormGroup,
  FormInputGroupPanel,
  FormInputLabel,
  InputAssetCheck,
  InputAssetMap,
  addSpaceBetween,
} from '../../../common/form';
import {
  EuiButton,
  EuiButtonIcon,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
} from '@elastic/eui';

export const Form = props => {
  const { useForm, InputForm } = props;
  const specForm = useMemo(() => {
    const result = transfromAssetSpecToForm(spec, specMerge);
    return result;
  }, []);

  const { fields } = useForm(specForm);

  return (
    <>
      <FormInputGroupPanel title='General'>
        <>
          <InputForm {...fields.name} label={fields.name._meta.label} />
          {['title', 'description', 'compatibility', 'integration'].map(key => {
            const keyProp = `metadata.${key}`;
            return (
              <InputForm
                {...fields[keyProp]}
                label={fields[keyProp]._meta.label}
                label={
                  <FormInputLabel
                    label={fields[keyProp]._meta.label}
                    description={fields[keyProp].description}
                  />
                }
              />
            );
          })}
          <EuiSpacer />
          <FormInputGroupPanel title='Versions'>
            <>
              {fields['metadata.versions'].fields.map(
                ({ version: field }, indexField) => (
                  <InputForm
                    {...field}
                    label='Version'
                    postInput={() => (
                      <EuiFlexItem style={{ alignSelf: 'center' }}>
                        <EuiButtonIcon
                          display='base'
                          color='danger'
                          iconType='cross'
                          onClick={() =>
                            fields['metadata.versions'].removeItem(indexField)
                          }
                        ></EuiButtonIcon>
                      </EuiFlexItem>
                    )}
                  />
                ),
              )}
              <EuiSpacer />
              <EuiButton onClick={fields['metadata.versions'].addNewItem}>
                Add
              </EuiButton>
            </>
          </FormInputGroupPanel>
          <EuiSpacer />
          <FormInputGroupPanel title='References'>
            <>
              {fields['metadata.references'].fields.map(
                ({ reference: field }, indexField) => (
                  <InputForm
                    {...field}
                    label='Reference'
                    postInput={() => (
                      <EuiFlexItem style={{ alignSelf: 'center' }}>
                        <EuiButtonIcon
                          display='base'
                          color='danger'
                          iconType='cross'
                          onClick={() =>
                            fields['metadata.references'].removeItem(indexField)
                          }
                        ></EuiButtonIcon>
                      </EuiFlexItem>
                    )}
                  />
                ),
              )}
              <EuiSpacer />
              <EuiButton onClick={fields['metadata.references'].addNewItem}>
                Add
              </EuiButton>
            </>
          </FormInputGroupPanel>
        </>
      </FormInputGroupPanel>
      <EuiSpacer />
      <FormInputGroupPanel title='Author'>
        <>
          {['name', 'url', 'email', 'date'].map(key => {
            const keyProp = `metadata.author.${key}`;
            return (
              <InputForm
                {...fields[keyProp]}
                label={fields[keyProp]._meta.label}
              />
            );
          })}
        </>
      </FormInputGroupPanel>
      <EuiSpacer />
      <FormInputGroupPanel title='Definitions'>
        <>
          {fields['definitions'].fields.map((field, indexField) => (
            <EuiFlexGroup>
              {['key', 'value'].map(fieldName => (
                <EuiFlexItem>
                  <InputForm {...field[fieldName]} label={fieldName} />
                </EuiFlexItem>
              ))}
              <EuiFlexItem grow={false} style={{ alignSelf: 'center' }}>
                <EuiButtonIcon
                  display='base'
                  color='danger'
                  iconType='cross'
                  onClick={() => fields['definitions'].removeItem(indexField)}
                ></EuiButtonIcon>
              </EuiFlexItem>
            </EuiFlexGroup>
          ))}
          <EuiSpacer />
          <EuiButton onClick={fields['definitions'].addNewItem}>Add</EuiButton>
        </>
      </FormInputGroupPanel>
      <EuiSpacer />
      <FormInputGroupPanel title='Check'>
        <InputAssetCheck
          useForm={useForm}
          InputForm={InputForm}
          {...fields.check}
        />
      </FormInputGroupPanel>
      <EuiSpacer />
      <FormInputGroupPanel title='Map'>
        <InputAssetMap
          useForm={useForm}
          InputForm={InputForm}
          {...fields.map}
        />
      </FormInputGroupPanel>
      <EuiSpacer />
      <FormInputGroupPanel title='Normalize'>
        <>
          {fields.normalize.fields
            .map((field, indexNormalize) => (
              <>
                <FormInputGroupPanel
                  title={`Normalize ${indexNormalize + 1}`}
                  actions={
                    <EuiButtonIcon
                      display='base'
                      color='danger'
                      iconType='cross'
                      onClick={() =>
                        fields.normalize.removeItem(indexNormalize)
                      }
                    ></EuiButtonIcon>
                  }
                >
                  <FormInputGroupPanel title='Check'>
                    <InputAssetCheck
                      useForm={useForm}
                      InputForm={InputForm}
                      {...field.check}
                    />
                  </FormInputGroupPanel>
                  <EuiSpacer />
                  <FormInputGroupPanel title='Map'>
                    <InputAssetMap
                      useForm={useForm}
                      InputForm={InputForm}
                      {...field.map}
                    />
                  </FormInputGroupPanel>
                  <EuiSpacer />
                  <FormInputGroupPanel title='Parse'>
                    <InputAssetMap
                      useForm={useForm}
                      InputForm={InputForm}
                      {...field.map}
                    />
                  </FormInputGroupPanel>
                </FormInputGroupPanel>
              </>
            ))
            .reduce(addSpaceBetween, <></>)}
          <EuiSpacer />
          <EuiButton onClick={fields.normalize.addNewItem}>Add</EuiButton>
        </>
      </FormInputGroupPanel>
    </>
  );
};

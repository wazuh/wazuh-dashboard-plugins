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
  InputAssetParse,
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
  const { useForm, InputForm, onSave } = props;
  const specForm = useMemo(() => {
    const result = transfromAssetSpecToForm(spec, specMerge);
    return result;
  }, []);

  const { fields, errors, changed } = useForm(specForm);

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
                label={
                  <FormInputLabel
                    label={fields[keyProp]._meta.label}
                    description={fields[keyProp]._spec.description}
                  />
                }
              />
            );
          })}
          <EuiSpacer />
          <FormInputGroupPanel
            title={
              <FormInputLabel
                label='Versions'
                description={fields['metadata.versions']._spec.description}
              />
            }
          >
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
          <FormInputGroupPanel
            title={
              <FormInputLabel
                label='References'
                description={fields['metadata.references']._spec.description}
              />
            }
          >
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
                label={
                  <FormInputLabel
                    label={fields[keyProp]._meta.label}
                    description={fields[keyProp]._spec.description}
                  />
                }
              />
            );
          })}
        </>
      </FormInputGroupPanel>
      <EuiSpacer />
      <FormInputGroupPanel
        title={
          <FormInputLabel
            label={fields['definitions']._meta.label}
            description={fields['definitions']._spec.description}
          />
        }
      >
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
      <FormInputGroupPanel
        title={
          <FormInputLabel
            label={fields.check._meta.label}
            description={fields.check._spec.description}
          />
        }
      >
        <InputAssetCheck
          useForm={useForm}
          InputForm={InputForm}
          {...fields.check}
        />
      </FormInputGroupPanel>
      <EuiSpacer />
      <FormInputGroupPanel
        title={
          <FormInputLabel
            label={fields.map._meta.label}
            description={fields.map._spec.description}
          />
        }
      >
        <InputAssetMap field={fields.map} InputForm={InputForm} />
      </FormInputGroupPanel>
      <EuiSpacer />
      <FormInputGroupPanel
        title={
          <FormInputLabel
            label={fields.normalize._meta.label}
            description={fields.normalize._spec.description}
          />
        }
      >
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
                  <FormInputGroupPanel
                    title={
                      <FormInputLabel
                        label={fields.check._meta.label}
                        description={fields.check._spec.description}
                      />
                    }
                  >
                    <InputAssetCheck
                      useForm={useForm}
                      InputForm={InputForm}
                      {...field.check}
                    />
                  </FormInputGroupPanel>
                  <EuiSpacer />
                  <FormInputGroupPanel
                    title={
                      <FormInputLabel
                        label={fields.map._meta.label}
                        description={fields.map._spec.description}
                      />
                    }
                  >
                    <InputAssetMap field={field.map} InputForm={InputForm} />
                  </FormInputGroupPanel>
                  <EuiSpacer />
                  <FormInputGroupPanel
                    title={
                      <FormInputLabel
                        label='Parse'
                        description='Further decomposes and extracts fields from the event data if required'
                      />
                    }
                  >
                    <InputAssetParse
                      field={field.parse}
                      InputForm={InputForm}
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
      <EuiSpacer />
      <EuiFlexGroup justfyContent='flexEnds'>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            isDisabled={Boolean(Object.keys(errors).length)}
            onClick={() => onSave({ fields, errors, changed })}
          >
            Save
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

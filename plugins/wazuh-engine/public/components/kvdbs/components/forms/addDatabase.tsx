import React, { useMemo, useState } from 'react';
import spec from '../../spec.json';
import specMerge from '../../spec-merge.json';

import { transfromAssetSpecToForm } from '../../../rules/utils/transform-asset-spec';
import { getServices } from '../../../../services';
import {
  EuiButton,
  EuiButtonIcon,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiHorizontalRule,
  EuiConfirmModal,
} from '@elastic/eui';

export const AddDatabase = () => {
  const [isGoBackModalVisible, setIsGoBackModalVisible] = useState(false);
  const InputForm = getServices().InputForm;
  const useForm = getServices().useForm;
  const specForm = useMemo(() => transfromAssetSpecToForm(spec, specMerge), []);
  const { fields } = useForm(specForm);
  const navigationService = getServices().navigationService;

  let modal;

  if (isGoBackModalVisible) {
    modal = (
      <EuiConfirmModal
        title='Do this thing'
        onCancel={() => {
          setIsGoBackModalVisible(false);
        }}
        onConfirm={async () => {
          setIsGoBackModalVisible(false);
          navigationService.getInstance().navigate('/engine/kvdbs');
        }}
        cancelButtonText="No, don't do it"
        confirmButtonText='Yes, do it'
        defaultFocusedButton='confirm'
      >
        <p>Are you sure you'll come back? All changes will be lost.</p>
      </EuiConfirmModal>
    );
  }

  return (
    <>
      <EuiFlexGroup justifyContent='spaceBetween' alignItems='center'>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            aria-label='Back'
            color='primary'
            iconSize='l'
            iconType='arrowLeft'
            onClick={() => setIsGoBackModalVisible(true)}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle>
            <h1>Create new database</h1>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiLink
            href={'#'} // TODO: change link to documentation
            target='_blank'
            external
            style={{ textAlign: 'center' }}
            rel='noopener noreferrer'
          >
            Documentation
          </EuiLink>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={() => {
              // TODO: Implement
            }}
            iconType='importAction'
          >
            Import file
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            iconType='save'
            onClick={() => {
              /*TODO=> Add funcionallity*/
            }}
          >
            Save
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiHorizontalRule margin='xs' />
      {Object.entries(fields).map(([name, formField]) => (
        <InputForm {...formField} label={formField?._meta?.label || name} />
      ))}
      {modal}
    </>
  );
};

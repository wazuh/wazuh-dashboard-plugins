import React, { useState, useEffect } from 'react';
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiButton,
  EuiTitle,
  EuiFlyout,
  EuiOverlayMask,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
  EuiFieldText,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiComboBox
} from '@elastic/eui';
import { RolesTable } from './roles-table';
import { WzRequest } from '../../../react-services/wz-request'
import { CreateRole } from './create-role';
import { EditRole } from './edit-role';

export const Roles = () => {
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [isEditFlyoutVisible, setIsEditFlyoutVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [roles, setRoles] = useState([])
  const [policiesData, setPoliciesData] = useState([])
  const [loadingTable, setLoadingTable] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasChangeCreate, setHasChangeCreate] = useState(false);


  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);


  async function getData() {
    setLoadingTable(true);
    const roles_request = await WzRequest.apiReq(
      'GET',
      '/security/roles',
      {}
    );
    const roles = (((roles_request || {}).data || {}).data || {}).affected_items || [];
    setRoles(roles);
    const policies_request = await WzRequest.apiReq(
      'GET',
      '/security/policies',
      {}
    );
    const policiesData = (((policies_request || {}).data || {}).data || {}).affected_items || [];
    setPoliciesData(policiesData);
    setLoadingTable(false);
  }

  useEffect(() => {
    getData();
  }, []);



  const closeFlyout = async () => {
    setIsFlyoutVisible(false);
    await getData();
  };


  let flyout;
  if (isFlyoutVisible) {
    flyout = (
      <EuiOverlayMask
        headerZindexLocation="below"
        onClick={() => {
          setIsModalVisible(hasChangeCreate);
        }}
      >
        <CreateRole
          closeFlyout={() => {
            setIsModalVisible(hasChangeCreate);
          }}
          onChangeCreateRole={(hasChange) => {
            setHasChangeCreate(hasChange);
          }}
        />
      </EuiOverlayMask>
    );
  }
  let modal;
  if (isModalVisible) {
    console.log("ENTRA MODAL")
    modal = (
      <EuiOverlayMask>
        <EuiModal onClose={closeModal}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>Modal title</h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            If you go back the changes will disappeared. Are you sure?
            <EuiSpacer />
          </EuiModalBody>

          <EuiModalFooter>
            <EuiButton
              onClick={() => {console.log("ENTRA AQUI???")
                setIsModalVisible(false);
                setIsFlyoutVisible(false);
              }}
              fill
            >
              Yes
            </EuiButton>
            <EuiButton
              onClick={() => {
                setIsModalVisible(false)
              }}
              fill
            >
              No
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      </EuiOverlayMask>
    );
  }

  const editRole = (item) => {
    setEditingRole(item);
    setIsEditFlyoutVisible(true);
  }


  const closeEditingFlyout = async () => {
    setIsEditFlyoutVisible(false);
    await getData();
  };

  let editFlyout;
  if (isEditFlyoutVisible) {
    editFlyout = (
      <EuiOverlayMask 
        headerZindexLocation="below"
        onClick={async () => {await closeEditingFlyout(); }}>
        <EditRole role={editingRole} closeFlyout={closeEditingFlyout} />
      </EuiOverlayMask >
    );
  }

  return (
    <EuiPageContent>
      <EuiPageContentHeader>
        <EuiPageContentHeaderSection>
          <EuiTitle>
            <h2>Roles</h2>
          </EuiTitle>
        </EuiPageContentHeaderSection>
        <EuiPageContentHeaderSection>
          {!loadingTable && (
            <div>
              <EuiButton onClick={() => setIsFlyoutVisible(true)}>Create role</EuiButton>
              {flyout}
              {editFlyout}
              {modal}
            </div>
          )}
        </EuiPageContentHeaderSection>
      </EuiPageContentHeader>
      <EuiPageContentBody>
        <RolesTable
          loading={loadingTable}
          roles={roles}
          policiesData={policiesData}
          editRole={editRole}
          updateRoles={getData}
        ></RolesTable>
      </EuiPageContentBody>
    </EuiPageContent>
  );
};
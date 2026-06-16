/*
 * Wazuh app - Case management form tab for the Document details flyout
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useCallback, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiComboBox,
  EuiConfirmModal,
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EuiOutsideClickDetector,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { formatUIDate } from '../../../../react-services';
import { CaseData, CaseStatus } from './case-management-service';
import {
  CaseManagementFormDocument,
  useCaseManagementForm,
} from './use-case-management-form';

const CASE_STATUS_OPTIONS: Array<{ value: CaseStatus; text: string }> = [
  { value: 'ACTIVE', text: 'Active' },
  { value: 'ACKNOWLEDGED', text: 'Acknowledged' },
  { value: 'COMPLETED', text: 'Completed' },
  { value: 'AUDIT', text: 'Audit' },
  { value: 'ERROR', text: 'Error' },
  { value: 'DELETED', text: 'Deleted' },
];

const STATUS_BADGE_COLOR: Record<CaseStatus, string> = {
  ACTIVE: 'primary',
  ACKNOWLEDGED: 'warning',
  COMPLETED: 'success',
  AUDIT: 'accent',
  ERROR: 'danger',
  DELETED: 'default',
};

interface CaseManagementTabProps {
  document: CaseManagementFormDocument;
  onSaveSuccess?: (caseData: CaseData | null) => void;
}

export const CaseManagementTab: React.FC<CaseManagementTabProps> = ({
  document,
  onSaveSuccess,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCleanModalVisible, setIsCleanModalVisible] = useState(false);

  const handleOperationSuccess = useCallback(
    (caseData: CaseData | null) => {
      setIsEditing(false);
      onSaveSuccess?.(caseData);
    },
    [onSaveSuccess],
  );

  const {
    status,
    comment,
    tags,
    caseUsername,
    isLoadingCase,
    existingCreatedAt,
    existingUpdatedAt,
    isSaving,
    isCleaning,
    isDirty,
    isNewCase,
    setStatus,
    setComment,
    setTags,
    handleTagCreate,
    handleSave,
    handleClean,
    handleReset,
  } = useCaseManagementForm(document, handleOperationSuccess);

  const openCleanModal = useCallback(() => setIsCleanModalVisible(true), []);
  const closeCleanModal = useCallback(() => setIsCleanModalVisible(false), []);
  const confirmClean = useCallback(async () => {
    closeCleanModal();
    await handleClean();
  }, [closeCleanModal, handleClean]);

  if (isLoadingCase) {
    return (
      <EuiFlexGroup
        justifyContent='center'
        alignItems='center'
        style={{ padding: '32px' }}
      >
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size='l' />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  const showForm = isEditing || isNewCase;

  const readOnlyItems = [
    {
      title: <EuiDescriptionListTitle>Tags</EuiDescriptionListTitle>,
      description: (
        <EuiDescriptionListDescription>
          {tags.length
            ? tags.map(tag => (
                <EuiBadge key={tag.label} color='hollow'>
                  {tag.label}
                </EuiBadge>
              ))
            : '—'}
        </EuiDescriptionListDescription>
      ),
    },
    {
      title: <EuiDescriptionListTitle>Comment</EuiDescriptionListTitle>,
      description: (
        <EuiDescriptionListDescription>
          {comment || '—'}
        </EuiDescriptionListDescription>
      ),
    },
    ...(!isNewCase
      ? [
          {
            title: <EuiDescriptionListTitle>User</EuiDescriptionListTitle>,
            description: (
              <EuiDescriptionListDescription>
                {caseUsername || '—'}
              </EuiDescriptionListDescription>
            ),
          },
        ]
      : []),
    ...(existingCreatedAt
      ? [
          {
            title: (
              <EuiDescriptionListTitle>Created at</EuiDescriptionListTitle>
            ),
            description: (
              <EuiDescriptionListDescription>
                {formatUIDate(existingCreatedAt)}
              </EuiDescriptionListDescription>
            ),
          },
        ]
      : []),
    ...(existingUpdatedAt
      ? [
          {
            title: (
              <EuiDescriptionListTitle>Updated at</EuiDescriptionListTitle>
            ),
            description: (
              <EuiDescriptionListDescription>
                {formatUIDate(existingUpdatedAt)}
              </EuiDescriptionListDescription>
            ),
          },
        ]
      : []),
  ];

  return (
    <EuiFlexGroup direction='column' gutterSize='m' style={{ padding: '16px' }}>
      {isCleanModalVisible && (
        <EuiOverlayMask>
          <EuiOutsideClickDetector onOutsideClick={closeCleanModal}>
            <EuiConfirmModal
              title='Clean case'
              onCancel={closeCleanModal}
              onConfirm={confirmClean}
              cancelButtonText='Cancel'
              confirmButtonText='Clean'
              buttonColor='danger'
              defaultFocusedButton='confirm'
            >
              This action removes the case data from the finding.
            </EuiConfirmModal>
          </EuiOutsideClickDetector>
        </EuiOverlayMask>
      )}

      {/* Header */}
      <EuiFlexItem grow={false}>
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem>
            <EuiFlexGroup alignItems='center' gutterSize='s'>
              <EuiFlexItem grow={false}>
                <EuiTitle size='xs'>
                  <h3>Case management</h3>
                </EuiTitle>
              </EuiFlexItem>
              {status && (
                <EuiFlexItem grow={false}>
                  <EuiBadge color={STATUS_BADGE_COLOR[status]}>
                    {status}
                  </EuiBadge>
                </EuiFlexItem>
              )}
              {isNewCase && (
                <EuiFlexItem grow={false}>
                  <EuiText size='s' color='subdued'>
                    <em>No case data yet. Fill in the form to create one.</em>
                  </EuiText>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize='xs' responsive={false}>
              {!showForm && (
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    size='s'
                    iconType='pencil'
                    onClick={() => setIsEditing(true)}
                    disabled={isSaving || isCleaning}
                  >
                    Edit
                  </EuiButtonEmpty>
                </EuiFlexItem>
              )}
              {!isNewCase && (
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    size='s'
                    color='danger'
                    iconType='trash'
                    onClick={openCleanModal}
                    disabled={isSaving || isCleaning}
                    isLoading={isCleaning}
                  >
                    Clean
                  </EuiButtonEmpty>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>

      {!showForm && (
        <EuiFlexItem grow={false}>
          <EuiDescriptionList
            type='column'
            compressed
            listItems={readOnlyItems}
            columnWidths={[1, 3]}
          />
        </EuiFlexItem>
      )}

      {!showForm ? null : (
        <>
          {readOnlyItems.length > 3 && (
            <EuiFlexItem grow={false}>
              <EuiDescriptionList
                type='column'
                compressed
                listItems={readOnlyItems.slice(2)}
                columnWidths={[1, 3]}
              />
            </EuiFlexItem>
          )}

          {!isNewCase && <EuiSpacer size='s' />}

          {/* Editable fields */}
          <EuiFlexItem>
            <EuiForm component='form'>
              <EuiFormRow
                fullWidth
                label='Status'
                helpText='Current lifecycle status of this finding.'
              >
                <EuiSelect
                  fullWidth
                  options={CASE_STATUS_OPTIONS}
                  value={status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatus(e.target.value as CaseStatus)
                  }
                  disabled={isSaving || isCleaning}
                  hasNoInitialSelection={isNewCase && !status}
                  aria-label='Case status'
                />
              </EuiFormRow>

              <EuiSpacer size='m' />

              <EuiFormRow
                fullWidth
                label='Tags'
                helpText='Type a tag name and press Enter to add it.'
              >
                <EuiComboBox
                  fullWidth
                  noSuggestions
                  placeholder='Add tags…'
                  selectedOptions={tags}
                  onCreateOption={handleTagCreate}
                  onChange={setTags}
                  isDisabled={isSaving || isCleaning}
                  aria-label='Case tags'
                />
              </EuiFormRow>

              <EuiSpacer size='m' />

              <EuiFormRow
                label='Comment'
                helpText='Add a free-text note about this finding.'
                fullWidth
              >
                <EuiTextArea
                  placeholder='Write a comment…'
                  value={comment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setComment(e.target.value)
                  }
                  disabled={isSaving || isCleaning}
                  rows={4}
                  fullWidth
                  resize='vertical'
                  aria-label='Case comment'
                />
              </EuiFormRow>

              <EuiSpacer size='l' />

              <EuiFlexGroup gutterSize='s' justifyContent='flexEnd'>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    onClick={() => {
                      handleReset();
                      setIsEditing(false);
                    }}
                    disabled={isSaving || isCleaning}
                    size='s'
                  >
                    Cancel
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    onClick={handleReset}
                    disabled={isSaving || isCleaning || !isDirty}
                    size='s'
                  >
                    Reset
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton
                    fill
                    size='s'
                    onClick={handleSave}
                    isLoading={isSaving}
                    disabled={!status || (!isNewCase && !isDirty) || isCleaning}
                  >
                    {isNewCase ? 'Create case' : 'Update case'}
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiForm>
          </EuiFlexItem>
        </>
      )}
    </EuiFlexGroup>
  );
};

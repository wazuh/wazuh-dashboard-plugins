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

import React from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiComboBox,
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { CaseStatus } from './case-management-service';
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

function formatTimestamp(value: string | number): string {
  const ms = typeof value === 'number' ? value : Number(value);
  if (!isNaN(ms)) {
    const date = new Date(ms);
    if (!isNaN(date.getTime())) return date.toLocaleString();
  }
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

interface CaseManagementTabProps {
  document: CaseManagementFormDocument;
}

export const CaseManagementTab: React.FC<CaseManagementTabProps> = ({ document }) => {
  const {
    status,
    comment,
    tags,
    caseUsername,
    isLoadingCase,
    existingCreatedAt,
    existingUpdatedAt,
    isSaving,
    isDirty,
    isNewCase,
    setStatus,
    setComment,
    setTags,
    handleTagCreate,
    handleSave,
    handleReset,
  } = useCaseManagementForm(document);

  if (isLoadingCase) {
    return (
      <EuiFlexGroup justifyContent='center' alignItems='center' style={{ padding: '32px' }}>
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size='l' />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  const metadataItems = [
    ...(!isNewCase
      ? [
          {
            title: <EuiDescriptionListTitle>User</EuiDescriptionListTitle>,
            description: (
              <EuiDescriptionListDescription>{caseUsername || '—'}</EuiDescriptionListDescription>
            ),
          },
        ]
      : []),
    ...(existingCreatedAt
      ? [
          {
            title: <EuiDescriptionListTitle>Created at</EuiDescriptionListTitle>,
            description: (
              <EuiDescriptionListDescription>
                {formatTimestamp(existingCreatedAt)}
              </EuiDescriptionListDescription>
            ),
          },
        ]
      : []),
    ...(existingUpdatedAt
      ? [
          {
            title: <EuiDescriptionListTitle>Updated at</EuiDescriptionListTitle>,
            description: (
              <EuiDescriptionListDescription>
                {formatTimestamp(existingUpdatedAt)}
              </EuiDescriptionListDescription>
            ),
          },
        ]
      : []),
  ];

  return (
    <EuiFlexGroup direction='column' gutterSize='m' style={{ padding: '16px' }}>
      {/* Header */}
      <EuiFlexItem grow={false}>
      <EuiFlexGroup alignItems='center' gutterSize='s'>
        <EuiFlexItem grow={false}>
          <EuiTitle size='xs'>
            <h3>Case management</h3>
          </EuiTitle>
        </EuiFlexItem>
        {status && (
          <EuiFlexItem grow={false}>
            <EuiBadge color={STATUS_BADGE_COLOR[status]}>{status}</EuiBadge>
          </EuiFlexItem>
        )}
      {isNewCase && (
            <EuiFlexItem grow={false}>
              <EuiText size='s' color='subdued'>
                <em>No case data yet — fill in the form to create one.</em>
              </EuiText>
            </EuiFlexItem>
      )}
        </EuiFlexGroup>
      </EuiFlexItem>

      {/* Read-only metadata */}
      <EuiFlexItem grow={false}>
        <EuiDescriptionList
          type='column'
          compressed
          listItems={metadataItems}
          columnWidths={[1, 3]}
        />
      </EuiFlexItem>

      <EuiSpacer size='s' />

      {/* Editable fields */}
      <EuiFlexItem>
      <EuiForm component='form'>
          <EuiFormRow
            label='Status'
            helpText='Current lifecycle status of this finding.'
          >
          <EuiSelect
            options={CASE_STATUS_OPTIONS}
            value={status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setStatus(e.target.value as CaseStatus)
            }
            disabled={isSaving}
            hasNoInitialSelection={isNewCase && !status}
            aria-label='Case status'
          />
          </EuiFormRow>

          <EuiSpacer size='m' />

          <EuiFormRow
            label='Tags'
            helpText='Type a tag name and press Enter to add it.'
          >
          <EuiComboBox
            noSuggestions
            placeholder='Add tags…'
            selectedOptions={tags}
            onCreateOption={handleTagCreate}
            onChange={setTags}
            isDisabled={isSaving}
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
            disabled={isSaving}
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
                onClick={handleReset}
                disabled={isSaving || !isDirty}
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
              disabled={!status || (!isNewCase && !isDirty)}
            >
              {isNewCase ? 'Create case' : 'Update case'}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiForm>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

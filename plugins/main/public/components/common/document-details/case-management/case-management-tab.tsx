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
  EuiButtonIcon,
  EuiCallOut,
  EuiComboBox,
  EuiComment,
  EuiCommentList,
  EuiConfirmModal,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormLabel,
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
import {
  CaseComment,
  CaseData,
  CasePriority,
  CaseSeverity,
  CaseStatus,
  CaseTLP,
  MAX_CASE_COMMENTS,
} from './case-management-service';
import {
  CaseManagementFormDocument,
  useCaseManagementForm,
} from './use-case-management-form';

const CASE_STATUS_OPTIONS: Array<{ value: CaseStatus; text: string }> = [
  { value: 'active', text: 'Active' },
  { value: 'acknowledged', text: 'Acknowledged' },
  { value: 'completed', text: 'Completed' },
  { value: 'audit', text: 'Audit' },
  { value: 'error', text: 'Error' },
  { value: 'deleted', text: 'Deleted' },
];

const CASE_SEVERITY_OPTIONS: Array<{ value: CaseSeverity; text: string }> = [
  { value: 'informational', text: 'Informational' },
  { value: 'low', text: 'Low' },
  { value: 'medium', text: 'Medium' },
  { value: 'high', text: 'High' },
  { value: 'critical', text: 'Critical' },
];

const CASE_PRIORITY_OPTIONS: Array<{ value: CasePriority | ''; text: string }> =
  [
    { value: '', text: '—' },
    { value: 'urgent', text: 'Urgent' },
    { value: 'high', text: 'High' },
    { value: 'medium', text: 'Medium' },
    { value: 'low', text: 'Low' },
  ];

const CASE_TLP_OPTIONS: Array<{ value: CaseTLP | ''; text: string }> = [
  { value: '', text: '—' },
  { value: 'TLP:RED', text: 'TLP:RED' },
  { value: 'TLP:AMBER', text: 'TLP:AMBER' },
  { value: 'TLP:GREEN', text: 'TLP:GREEN' },
  { value: 'TLP:CLEAR', text: 'TLP:CLEAR' },
];

const STATUS_BADGE_COLOR: Record<CaseStatus, string> = {
  active: 'primary',
  acknowledged: 'warning',
  completed: 'success',
  audit: 'accent',
  error: 'danger',
  deleted: 'default',
};

const SEVERITY_BADGE_COLOR: Record<CaseSeverity, string> = {
  informational: 'default',
  low: 'success',
  medium: 'warning',
  high: 'accent',
  critical: 'danger',
};

const PRIORITY_BADGE_COLOR: Record<CasePriority, string> = {
  low: 'default',
  medium: 'warning',
  high: 'accent',
  urgent: 'danger',
};

const TLP_BADGE_COLOR: Record<CaseTLP, string> = {
  'TLP:RED': 'danger',
  'TLP:AMBER': 'warning',
  'TLP:GREEN': 'success',
  'TLP:CLEAR': 'hollow',
};

const optionText = (
  options: Array<{ value: string; text: string }>,
  value: string | undefined,
): string | undefined => options.find(option => option.value === value)?.text;

const renderTwoColumnRows = (
  items: Array<{
    title: string;
    description: React.ReactNode;
    fullWidth?: boolean;
  }>,
) => {
  const rows: Array<typeof items> = [];
  let pending: (typeof items)[number] | undefined;
  for (const item of items) {
    if (item.fullWidth) {
      if (pending) {
        rows.push([pending]);
        pending = undefined;
      }
      rows.push([item]);
    } else if (pending) {
      rows.push([pending, item]);
      pending = undefined;
    } else {
      pending = item;
    }
  }
  if (pending) {
    rows.push([pending]);
  }
  return rows.map((row, rowIndex) => (
    <React.Fragment key={row[0].title}>
      {rowIndex > 0 && <EuiSpacer />}
      <EuiFlexGroup justifyContent='flexEnd'>
        {row.map(item => (
          <EuiFlexItem key={item.title}>
            <EuiFormLabel>{item.title}</EuiFormLabel>
            <EuiSpacer size='s' />
            {typeof item.description === 'string' ? (
              <EuiText size='s'>{item.description}</EuiText>
            ) : (
              <div>{item.description}</div>
            )}
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </React.Fragment>
  ));
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
  const [editingCommentKey, setEditingCommentKey] = useState<
    string | undefined
  >();
  const [editingCommentDraft, setEditingCommentDraft] = useState('');

  const stopEditingComment = useCallback(() => {
    setEditingCommentKey(undefined);
    setEditingCommentDraft('');
  }, []);

  const handleOperationSuccess = useCallback(
    (caseData: CaseData | null) => {
      setIsEditing(false);
      stopEditingComment();
      onSaveSuccess?.(caseData);
    },
    [onSaveSuccess, stopEditingComment],
  );

  const {
    status,
    title,
    description,
    severity,
    priority,
    tlp,
    tags,
    comments,
    newComment,
    editedComments,
    currentUsername,
    caseUsername,
    isLoadingCase,
    loadFailed,
    existingCreatedAt,
    existingUpdatedAt,
    isSaving,
    isCleaning,
    isDirty,
    isNewCase,
    setStatus,
    setTitle,
    setDescription,
    setSeverity,
    setPriority,
    setTlp,
    setTags,
    handleTagCreate,
    setNewComment,
    applyCommentEdit,
    discardCommentEdit,
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

  if (loadFailed) {
    return (
      <div style={{ padding: '16px' }}>
        <EuiCallOut
          title='Could not load the case data'
          color='danger'
          iconType='alert'
        >
          Reopen the document details to retry.
        </EuiCallOut>
      </div>
    );
  }

  const showForm = isEditing || isNewCase;
  const commentLimitReached = comments.length >= MAX_CASE_COMMENTS;

  const renderCommentsThread = (editable: boolean) => {
    if (!comments.length) {
      return null;
    }
    return (
      <>
        <EuiTitle size='xxs'>
          <h4>{`Comments (${comments.length}/${MAX_CASE_COMMENTS})`}</h4>
        </EuiTitle>
        <EuiSpacer size='l' />
        <EuiCommentList>
          {comments.map((comment: CaseComment, index: number) => {
            const commentKey = comment.created_at;
            const isOwn = Boolean(
              currentUsername &&
                commentKey &&
                comment.author === currentUsername,
            );
            const isEditingThis =
              editable && !!commentKey && editingCommentKey === commentKey;
            const pendingText = commentKey
              ? editedComments[commentKey]
              : undefined;
            const wasEdited =
              comment.updated_at && comment.updated_at !== comment.created_at;

            return (
              <EuiComment
                key={commentKey ?? `comment-${index}`}
                username={comment.author ?? '—'}
                timestamp={
                  comment.created_at
                    ? formatUIDate(comment.created_at)
                    : undefined
                }
                event={wasEdited ? 'edited' : undefined}
                actions={
                  editable && isOwn && !isEditingThis ? (
                    <EuiButtonIcon
                      iconType='pencil'
                      color='text'
                      aria-label='Edit comment'
                      isDisabled={
                        isSaving ||
                        isCleaning ||
                        // One inline edit at a time: switching pencils would
                        // silently discard the current draft.
                        editingCommentKey !== undefined
                      }
                      onClick={() => {
                        setEditingCommentKey(commentKey);
                        setEditingCommentDraft(
                          pendingText ?? comment.comment ?? '',
                        );
                      }}
                    />
                  ) : undefined
                }
              >
                {isEditingThis ? (
                  <>
                    <EuiTextArea
                      value={editingCommentDraft}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEditingCommentDraft(e.target.value)
                      }
                      rows={3}
                      fullWidth
                      resize='vertical'
                      aria-label='Edit comment text'
                    />
                    <EuiSpacer size='xs' />
                    <EuiFlexGroup
                      gutterSize='xs'
                      justifyContent='flexEnd'
                      responsive={false}
                    >
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon
                          iconType='cross'
                          color='danger'
                          aria-label='Cancel comment edit'
                          onClick={stopEditingComment}
                        />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon
                          iconType='check'
                          aria-label='Apply comment edit'
                          isDisabled={!editingCommentDraft.trim()}
                          onClick={() => {
                            applyCommentEdit(
                              commentKey as string,
                              editingCommentDraft,
                            );
                            stopEditingComment();
                          }}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </>
                ) : (
                  <>
                    <EuiText size='s' style={{ textAlign: 'justify' }}>
                      {pendingText ?? comment.comment ?? ''}
                    </EuiText>
                    {pendingText !== undefined && (
                      <EuiText size='xs' color='subdued'>
                        <em>Edited — pending save</em>
                      </EuiText>
                    )}
                  </>
                )}
              </EuiComment>
            );
          })}
        </EuiCommentList>
      </>
    );
  };

  const summaryItems = [
    {
      title: 'Title',
      description: title || '—',
      fullWidth: true,
    },
    {
      title: 'Description',
      description: description ? (
        <EuiText size='s' style={{ textAlign: 'justify' }}>
          {description}
        </EuiText>
      ) : (
        '—'
      ),
      fullWidth: true,
    },
  ];

  const shortItems = [
    {
      title: 'Severity',
      description: severity ? (
        <EuiBadge color={SEVERITY_BADGE_COLOR[severity]}>
          {optionText(CASE_SEVERITY_OPTIONS, severity)}
        </EuiBadge>
      ) : (
        '—'
      ),
    },
    {
      title: 'Priority',
      description: priority ? (
        <EuiBadge color={PRIORITY_BADGE_COLOR[priority]}>
          {optionText(CASE_PRIORITY_OPTIONS, priority)}
        </EuiBadge>
      ) : (
        '—'
      ),
    },
    {
      title: 'TLP',
      description: tlp ? (
        <EuiBadge color={TLP_BADGE_COLOR[tlp]}>{tlp}</EuiBadge>
      ) : (
        '—'
      ),
    },
  ];

  const tagsItem = {
    title: 'Tags',
    description: tags.length
      ? tags.map(tag => (
          <EuiBadge key={tag.label} color='hollow'>
            {tag.label}
          </EuiBadge>
        ))
      : '—',
    fullWidth: true,
  };

  const metadataItems = [
    ...(!isNewCase
      ? [
          {
            title: 'User',
            description: caseUsername || '—',
          },
        ]
      : []),
    ...(existingCreatedAt
      ? [
          {
            title: 'Created at',
            description: formatUIDate(existingCreatedAt),
          },
        ]
      : []),
    ...(existingUpdatedAt
      ? [
          {
            title: 'Updated at',
            description: formatUIDate(existingUpdatedAt),
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
                  <EuiBadge color={STATUS_BADGE_COLOR[status] ?? 'default'}>
                    {optionText(CASE_STATUS_OPTIONS, status) ?? status}
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
        <>
          <EuiFlexItem grow={false}>
            {renderTwoColumnRows([
              ...summaryItems,
              ...shortItems,
              ...metadataItems,
              tagsItem,
            ])}
          </EuiFlexItem>
          {comments.length > 0 && (
            <EuiFlexItem grow={false}>
              {renderCommentsThread(false)}
            </EuiFlexItem>
          )}
        </>
      )}

      {!showForm ? null : (
        <>
          {metadataItems.length > 0 && (
            <EuiFlexItem grow={false}>
              {renderTwoColumnRows(metadataItems)}
            </EuiFlexItem>
          )}

          {!isNewCase && <EuiSpacer size='s' />}

          {/* Editable fields */}
          <EuiFlexItem>
            <EuiForm component='form'>
              <EuiFormRow
                fullWidth
                label='Title *'
                helpText='Short summary of this case.'
              >
                <EuiFieldText
                  fullWidth
                  placeholder='Case title…'
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTitle(e.target.value)
                  }
                  disabled={isSaving || isCleaning}
                  maxLength={1024}
                  aria-label='Case title'
                />
              </EuiFormRow>

              <EuiSpacer size='m' />

              <EuiFormRow
                fullWidth
                label='Description'
                helpText='Detailed description of this case.'
              >
                <EuiTextArea
                  fullWidth
                  placeholder='Describe the case…'
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(e.target.value)
                  }
                  disabled={isSaving || isCleaning}
                  rows={3}
                  resize='vertical'
                  aria-label='Case description'
                />
              </EuiFormRow>

              <EuiSpacer size='m' />

              <EuiFlexGroup gutterSize='m'>
                <EuiFlexItem>
                  <EuiFormRow
                    fullWidth
                    label='Status *'
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
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiFormRow
                    fullWidth
                    label='Severity *'
                    helpText='Impact severity of this case.'
                  >
                    <EuiSelect
                      fullWidth
                      options={CASE_SEVERITY_OPTIONS}
                      value={severity}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setSeverity(e.target.value as CaseSeverity)
                      }
                      disabled={isSaving || isCleaning}
                      hasNoInitialSelection={!severity}
                      aria-label='Case severity'
                    />
                  </EuiFormRow>
                </EuiFlexItem>
              </EuiFlexGroup>

              <EuiSpacer size='m' />

              <EuiFlexGroup gutterSize='m'>
                <EuiFlexItem>
                  <EuiFormRow
                    fullWidth
                    label='Priority'
                    helpText='Triage priority of this case.'
                  >
                    <EuiSelect
                      fullWidth
                      options={CASE_PRIORITY_OPTIONS}
                      value={priority}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setPriority(e.target.value as CasePriority | '')
                      }
                      disabled={isSaving || isCleaning}
                      aria-label='Case priority'
                    />
                  </EuiFormRow>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiFormRow
                    fullWidth
                    label='TLP'
                    helpText='Traffic Light Protocol sharing level.'
                  >
                    <EuiSelect
                      fullWidth
                      options={CASE_TLP_OPTIONS}
                      value={tlp}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setTlp(e.target.value as CaseTLP | '')
                      }
                      disabled={isSaving || isCleaning}
                      aria-label='Case TLP'
                    />
                  </EuiFormRow>
                </EuiFlexItem>
              </EuiFlexGroup>

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

              {renderCommentsThread(true)}

              {comments.length > 0 && <EuiSpacer size='s' />}

              <EuiFormRow
                fullWidth
                label='New comment'
                helpText={
                  commentLimitReached
                    ? `Comment limit reached (${MAX_CASE_COMMENTS}).`
                    : 'The comment is added with your username when you save.'
                }
              >
                <EuiTextArea
                  fullWidth
                  placeholder='Write a comment…'
                  value={newComment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewComment(e.target.value)
                  }
                  disabled={isSaving || isCleaning || commentLimitReached}
                  rows={3}
                  resize='vertical'
                  aria-label='New case comment'
                />
              </EuiFormRow>

              <EuiSpacer size='l' />

              <EuiFlexGroup gutterSize='s' justifyContent='flexEnd'>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    onClick={() => {
                      handleReset();
                      stopEditingComment();
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
                    onClick={() => {
                      handleReset();
                      stopEditingComment();
                    }}
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
                    disabled={
                      !status ||
                      !title.trim() ||
                      !severity ||
                      (!isNewCase && !isDirty) ||
                      isCleaning ||
                      // Confirm or cancel the open inline comment edit first,
                      // otherwise its draft would be silently discarded.
                      editingCommentKey !== undefined
                    }
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

import React, { useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonIcon,
  EuiText,
  EuiTitle,
  EuiSpacer,
  EuiConfirmModal,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ConversationSummary } from '../../../common/types';

interface ConversationListProps {
  conversations: ConversationSummary[];
  isLoading: boolean;
  /** Null while the current chat has never been saved yet (a brand new, unsaved conversation). */
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  onDelete: (id: string) => void;
}

/**
 * `Intl.RelativeTimeFormat` is a built-in (no new dependency) — picks the coarsest unit that still rounds to at least 1 (seconds only for
 * anything under a minute), falling back to a plain locale datetime string if the browser's Intl
 * implementation throws for any reason (defensive; every evergreen browser OSD targets supports
 * this API).
 */
function formatRelativeTime(iso: string): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) {
    return '';
  }
  const diffSeconds = Math.round((target - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
  ];

  let chosenUnit: Intl.RelativeTimeFormatUnit = 'second';
  let value = diffSeconds;
  for (const { unit, seconds } of units) {
    if (absSeconds >= seconds) {
      chosenUnit = unit;
      value = Math.round(diffSeconds / seconds);
      break;
    }
  }

  try {
    const locale =
      typeof i18n.getLocale === 'function' ? i18n.getLocale() : undefined;
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
      value,
      chosenUnit,
    );
  } catch {
    return new Date(iso).toLocaleString();
  }
}

const truncateTextStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

/**
 * Sidebar-style list of the caller's own saved conversations: a "New conversation" action,
 * one row per conversation (title + relative `updatedAt`, click to resume), and a per-row delete
 * with a confirm modal (matches settings_page.tsx's provider-delete pattern). Purely presentational
 * — chat-page.tsx owns the actual load/select/save/delete side effects and the list of
 * `conversations` this renders.
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading,
  activeConversationId,
  onSelect,
  onNewConversation,
  onDelete,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(
    null,
  );
  // Hover-to-reveal delete icon (cheap, no stylesheet available in this plugin yet): tracked in
  // React state rather than a CSS :hover rule, so the icon fades in only for the row currently
  // under the pointer, while staying reachable (opacity change only, never unmounted) for
  // keyboard/touch users who can't hover.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const requestDelete = (
    event: React.MouseEvent,
    conversation: ConversationSummary,
  ) => {
    // Never let the row's own onClick (resume) fire alongside the trash icon's click.
    event.stopPropagation();
    setDeleteTarget(conversation);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <EuiFlexGroup
        responsive={false}
        alignItems='center'
        justifyContent='spaceBetween'
        gutterSize='s'
      >
        <EuiFlexItem grow={false}>
          <EuiTitle size='xxs'>
            <h3>
              {i18n.translate('wazuhAiAssistant.chat.conversations.title', {
                defaultMessage: 'Conversations',
              })}
            </h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {isLoading && (
            <EuiLoadingSpinner
              size='s'
              aria-label={i18n.translate(
                'wazuhAiAssistant.chat.conversations.loading',
                {
                  defaultMessage: 'Loading conversations',
                },
              )}
            />
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='s' />
      <EuiButton
        iconType='plusInCircle'
        size='s'
        fill={false}
        fullWidth
        style={{ textDecoration: 'none' }}
        onClick={onNewConversation}
      >
        {i18n.translate('wazuhAiAssistant.chat.conversations.new', {
          defaultMessage: 'New conversation',
        })}
      </EuiButton>
      <EuiSpacer size='m' />

      {conversations.length === 0 ? (
        <EuiText size='xs' color='subdued'>
          <p>
            {i18n.translate('wazuhAiAssistant.chat.conversations.empty', {
              defaultMessage: 'No saved conversations yet.',
            })}
          </p>
        </EuiText>
      ) : (
        conversations.map(conversation => {
          const isSelected = conversation.id === activeConversationId;
          const isHovered = conversation.id === hoveredId;
          return (
            <React.Fragment key={conversation.id}>
              {/* Plain `div` (not EuiFlexGroup) carries the interactive/a11y attributes, since
                  EUI's own prop types don't guarantee accepting arbitrary role/tabIndex/onKeyDown
                  passthrough — EuiFlexGroup nested inside is purely for the row's layout. */}
              <div
                role='button'
                tabIndex={0}
                // Programmatic indication of the single-select list's current item, for assistive
                // tech — previously the selected row was signaled only visually (border/background
                // tint + font-weight), with nothing for a screen reader to key off of.
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => onSelect(conversation.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(conversation.id);
                  }
                }}
                onMouseEnter={() => setHoveredId(conversation.id)}
                onMouseLeave={() =>
                  setHoveredId(current =>
                    current === conversation.id ? null : current,
                  )
                }
                // wzConvoRow (chat-page.scss) only adds a reduced-motion-safe transition timing for
                // the background/border-color changes below — the colors themselves stay driven by
                // this row's own hover/selected state, unchanged.
                className='wzConvoRow'
                style={{
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: 4,
                  // `--wz-accent`/`--wz-accent-soft`/`--wz-accent-hover` (chat-page.scss, sourced
                  // from EUI's own `$eui*` SASS variables) — CSS custom properties inherit through
                  // this whole subtree regardless of the EuiPanel/component boundaries in between,
                  // so no extra prop is needed here to reach them. The left border on selection
                  // reads unambiguously even for users who rely on more than a background tint
                  // (e.g. reduced contrast themes).
                  borderLeft: isSelected
                    ? '3px solid var(--wz-accent)'
                    : '3px solid transparent',
                  background: isSelected
                    ? 'var(--wz-accent-soft)'
                    : isHovered
                    ? 'var(--wz-accent-hover)'
                    : 'transparent',
                }}
              >
                <EuiFlexGroup
                  responsive={false}
                  alignItems='center'
                  gutterSize='xs'
                >
                  <EuiFlexItem grow style={{ minWidth: 0 }}>
                    <EuiText
                      size='s'
                      style={{
                        ...truncateTextStyle,
                        fontWeight: isSelected ? 600 : undefined,
                      }}
                      title={conversation.title}
                    >
                      {conversation.title}
                    </EuiText>
                    <EuiText
                      size='xs'
                      color='subdued'
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatRelativeTime(conversation.updatedAt)}
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem
                    grow={false}
                    style={{ opacity: isHovered || isSelected ? 1 : 0.35 }}
                  >
                    <EuiButtonIcon
                      iconType='trash'
                      color='danger'
                      aria-label={i18n.translate(
                        'wazuhAiAssistant.chat.conversations.delete',
                        {
                          defaultMessage: 'Delete conversation',
                        },
                      )}
                      onClick={(event: React.MouseEvent) =>
                        requestDelete(event, conversation)
                      }
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>
              <EuiSpacer size='xs' />
            </React.Fragment>
          );
        })
      )}

      {deleteTarget && (
        <EuiConfirmModal
          title={i18n.translate(
            'wazuhAiAssistant.chat.conversations.deleteConfirm.title',
            {
              defaultMessage: 'Delete conversation',
            },
          )}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          cancelButtonText={i18n.translate(
            'wazuhAiAssistant.chat.conversations.deleteConfirm.cancel',
            {
              defaultMessage: 'Cancel',
            },
          )}
          confirmButtonText={i18n.translate(
            'wazuhAiAssistant.chat.conversations.deleteConfirm.confirm',
            { defaultMessage: 'Delete' },
          )}
          buttonColor='danger'
        >
          <p>
            {i18n.translate(
              'wazuhAiAssistant.chat.conversations.deleteConfirm.body',
              {
                defaultMessage:
                  'This will permanently delete the conversation "{title}". This action cannot be undone.',
                values: { title: deleteTarget.title },
              },
            )}
          </p>
        </EuiConfirmModal>
      )}
    </>
  );
};

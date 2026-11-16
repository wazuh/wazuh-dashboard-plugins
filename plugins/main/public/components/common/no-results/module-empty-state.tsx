import React, { useContext, useEffect, useState } from 'react';
import { ReactReduxContext } from 'react-redux';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { Applications } from '../../../utils/applications';
import { getWzCurrentAppID } from '../../../kibana-services';
import { PinnedAgentManager } from '../../wz-agent-selector/wz-agent-selector-service';

/** Unpins the pinned agent, like the header button, so the tab shows all agents. */
export const unpinPinnedAgent = () => new PinnedAgentManager().unPinAgent();

/** Id of the mounted application, `undefined` outside the app (the getter throws there). */
export const getCurrentAppId = (): string | undefined => {
  try {
    return getWzCurrentAppID();
  } catch {
    return undefined;
  }
};

/** Documentation of the current application, the page its About flyout and Help menu link. */
const useCurrentAppDocs = () => {
  const currentAppId = getCurrentAppId();
  const app = Applications.find(({ id }) => id === currentAppId);
  return app?.docsUrl
    ? {
        href: app.docsUrl,
        label: i18n.translate('wazuh.common.moduleEmptyState.docsLink', {
          defaultMessage: 'Learn more about {module} in the documentation',
          values: { module: app.title },
        }),
      }
    : undefined;
};

interface PinnedAgentState {
  appStateReducers?: { currentAgentData?: { id?: string } };
}

const getPinnedAgentId = (store?: {
  getState: () => unknown;
}): string | undefined =>
  (store?.getState() as PinnedAgentState | undefined)?.appStateReducers
    ?.currentAgentData?.id || undefined;

/**
 * Id of the pinned agent, read from the store if there is one (nothing outside a store provider),
 * and kept up to date when the agent is pinned or unpinned.
 */
const usePinnedAgentId = () => {
  const store = useContext(ReactReduxContext)?.store;
  const [agentId, setAgentId] = useState(getPinnedAgentId(store));

  useEffect(() => {
    setAgentId(getPinnedAgentId(store));
    return store?.subscribe(() => setAgentId(getPinnedAgentId(store)));
  }, [store]);

  return agentId;
};

export interface ModuleEmptyStateProps {
  /**
   * Name of the module in the test ids: `wz<testSubj>EmptyState`, and `...Unpin` for the button
   * that unpins the agent.
   */
  testSubj: string;
  /** What is empty, for the situation (never received data, pinned agent, search, ...). */
  title: React.ReactNode;
  /**
   * What to try first, one short sentence under the title, such as changing the search. It is
   * the line the user reads after the title, so keep the explanation out of it.
   */
  hint?: React.ReactNode;
  /**
   * Why it is empty, rendered under the actions in small subdued text. Keep it quick to scan:
   * - Short paragraphs of one idea each.
   * - Put checks or steps in a `ModuleEmptyStateList`, not in one comma-separated sentence.
   * - Bold only the UI names the user acts on, through a `FormattedMessage` placeholder.
   */
  children?: React.ReactNode;
  /**
   * Unpins the agent. The button is shown whenever an agent is pinned; pass this to replace the
   * default action, or to show the button without a store.
   */
  onUnpinAgent?: () => void;
  /**
   * Whether the prompt can unpin the agent (default). Set it to `false` where unpinning would change
   * the page behind, such as inside a flyout: no button is shown even with a pinned agent.
   */
  allowUnpinAgent?: boolean;
  /** Module actions, rendered after the unpin button. */
  actions?: React.ReactNode[];
  /**
   * Documentation page for the situation, shown as the last link. Defaults to the documentation
   * of the current module, the same page its About flyout links.
   */
  docs?: { path: string; label: string; testSubj?: string };
  /** Icon of the prompt. */
  iconType?: string;
  /** Replaces the test id derived from `testSubj`. */
  dataTestSubj?: string;
}

export interface ModuleEmptyStateListProps {
  /** Checks or steps, one short sentence each. */
  items: React.ReactNode[];
  /** Numbers the items, for steps that follow an order. */
  ordered?: boolean;
  'data-test-subj'?: string;
}

/** Checks or steps of an empty state. */
export const ModuleEmptyStateList = ({
  items,
  ordered = false,
  'data-test-subj': dataTestSubj,
}: ModuleEmptyStateListProps) => {
  const List = ordered ? 'ol' : 'ul';
  return (
    <List data-test-subj={dataTestSubj}>
      {items.map((item, index) => (
        /* The items are static text, their order never changes. */
        <li key={index}>{item}</li>
      ))}
    </List>
  );
};

/**
 * Empty state shared by the module tabs (Dashboard, Inventory and Findings): a block centered in
 * the panel and left aligned inside, so it reads top to bottom: the title, what to try and the
 * actions, then, separated and subdued, why it is empty and the link to the docs. Each module
 * provides the text and the actions of its situations.
 */
export const ModuleEmptyState = ({
  testSubj,
  title,
  hint,
  children,
  onUnpinAgent,
  allowUnpinAgent = true,
  actions = [],
  docs,
  iconType = 'search',
  dataTestSubj,
}: ModuleEmptyStateProps) => {
  const pinnedAgentId = usePinnedAgentId();
  const appDocs = useCurrentAppDocs();
  const docsLink = docs
    ? { href: webDocumentationLink(docs.path), ...docs }
    : appDocs;
  const unpin = allowUnpinAgent
    ? onUnpinAgent ?? (pinnedAgentId ? unpinPinnedAgent : undefined)
    : undefined;
  const allActions = [
    ...(unpin
      ? [
          <EuiButton
            key='unpin'
            size='s'
            fill
            onClick={unpin}
            data-test-subj={`wz${testSubj}EmptyStateUnpin`}
          >
            {i18n.translate('wazuh.common.moduleEmptyState.unpinAgent', {
              defaultMessage: 'Unpin agent',
            })}
          </EuiButton>,
        ]
      : []),
    ...actions,
  ];

  return (
    <EuiPanel
      hasBorder
      hasShadow={false}
      paddingSize='l'
      data-test-subj={dataTestSubj ?? `wz${testSubj}EmptyState`}
    >
      {/* A centered block, left aligned inside, so every line starts at the same edge. */}
      <EuiFlexGroup
        gutterSize='l'
        alignItems='flexStart'
        responsive={false}
        style={{ maxWidth: 600, margin: '0 auto' }}
      >
        <EuiFlexItem grow={false}>
          <EuiIcon type={iconType} size='xl' color='primary' />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size='xs'>
            <h2>{title}</h2>
          </EuiTitle>
          {hint ? (
            <>
              <EuiSpacer size='xs' />
              <EuiText size='s'>
                <p>{hint}</p>
              </EuiText>
            </>
          ) : null}
          {allActions.length ? (
            <>
              <EuiSpacer size='m' />
              {/* Small text, so link actions match the size of the text around them. */}
              <EuiText size='s'>
                <EuiFlexGroup
                  gutterSize='s'
                  alignItems='center'
                  wrap
                  responsive={false}
                >
                  {allActions.map((action, index) => (
                    /* The unpin button, then the module actions, in a fixed order. */
                    <EuiFlexItem key={index} grow={false}>
                      {action}
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
              </EuiText>
            </>
          ) : null}
          {children || docsLink ? (
            <>
              <EuiHorizontalRule margin='m' />
              <EuiText size='s' color='subdued'>
                {children}
                {docsLink ? (
                  <p>
                    <EuiLink
                      href={docsLink.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      external
                      data-test-subj={
                        docs?.testSubj ?? `wz${testSubj}EmptyStateDocs`
                      }
                    >
                      {docsLink.label}
                    </EuiLink>
                  </p>
                ) : null}
              </EuiText>
            </>
          ) : null}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};

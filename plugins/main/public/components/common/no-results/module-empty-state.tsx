import React, { useContext, useEffect, useState } from 'react';
import { ReactReduxContext } from 'react-redux';
import {
  EuiButton,
  EuiEmptyPrompt,
  EuiLink,
  EuiPanel,
  EuiText,
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
  /** Why it is empty and what to try. Paragraphs are rendered centered in small text. */
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

/**
 * Empty state shared by the module tabs (Dashboard, Inventory and Findings): a centered prompt
 * with the title and the explanation of the situation, the actions and the link to the docs. Each
 * module provides the text and the actions of its situations.
 */
export const ModuleEmptyState = ({
  testSubj,
  title,
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
    <EuiPanel hasBorder hasShadow={false} paddingSize='l'>
      <EuiEmptyPrompt
        iconType={iconType}
        titleSize='s'
        title={<h2>{title}</h2>}
        body={children}
        actions={allActions.length ? allActions : undefined}
        data-test-subj={dataTestSubj ?? `wz${testSubj}EmptyState`}
      />
      {docsLink ? (
        <EuiText size='s' textAlign='center'>
          <EuiLink
            href={docsLink.href}
            target='_blank'
            rel='noopener noreferrer'
            external
            data-test-subj={docs?.testSubj ?? `wz${testSubj}EmptyStateDocs`}
          >
            {docsLink.label}
          </EuiLink>
        </EuiText>
      ) : null}
    </EuiPanel>
  );
};

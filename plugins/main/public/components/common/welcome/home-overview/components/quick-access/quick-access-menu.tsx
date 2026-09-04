import React, { useMemo, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiListGroup,
  EuiListGroupItem,
  EuiPopover,
  EuiPopoverTitle,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../../../kibana-services';
import { Applications, Categories } from '../../../../../../utils/applications';
import {
  getModuleUrl,
  getRulesUrl,
  getDecodersUrl,
  getDetectorsUrl,
  getIntegrationsUrl,
  getKvdbsUrl,
  getFiltersUrl,
  getAiAssistantUrl,
} from '../../utils/navigation';

interface QuickAccessItem {
  id: string;
  title: string;
  getHref: () => string;
}

interface QuickAccessGroup {
  id: string;
  label: string;
  icon: string;
  order: number;
  items: QuickAccessItem[];
}

const getDataDrivenGroups = (): QuickAccessGroup[] =>
  Applications.filter(app => app.showInOverviewApp).reduce<QuickAccessGroup[]>(
    (groups, app) => {
      let group = groups.find(({ id }) => id === app.category);
      if (!group) {
        const category = Categories.find(({ id }) => id === app.category);
        if (!category) {
          return groups;
        }
        group = {
          id: category.id,
          label: category.label,
          icon: category.euiIconType,
          order: category.order,
          items: [],
        };
        groups.push(group);
      }
      group.items.push({
        id: app.id,
        title: app.title,
        getHref: () => getModuleUrl(app.id),
      });
      return groups;
    },
    [],
  );

/**
 * The Ruleset Management plugin is external to Wazuh's app registry, so its
 * group is declared here — nothing in `Applications` describes it. The entries
 * mirror the Ruleset management tiles on this page (see
 * `security-analytics-tiles.tsx`), so both surfaces expose the same content
 * types. `order` mirrors that plugin's own nav category, which sits between
 * Cloud security (500) and Agents management (600).
 */
const SECURITY_ANALYTICS_GROUP: QuickAccessGroup = {
  id: 'security-analytics',
  label: 'Ruleset management',
  icon: 'securityAnalyticsApp',
  order: 550,
  items: [
    { id: 'rules', title: 'Rules', getHref: getRulesUrl },
    { id: 'decoders', title: 'Decoders', getHref: getDecodersUrl },
    { id: 'detectors', title: 'Detectors', getHref: getDetectorsUrl },
    { id: 'integrations', title: 'Integrations', getHref: getIntegrationsUrl },
    { id: 'kvdbs', title: 'KVDBs', getHref: getKvdbsUrl },
    { id: 'filters', title: 'Filters', getHref: getFiltersUrl },
  ],
};

export const QuickAccessMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const groups = useMemo(
    () =>
      [...getDataDrivenGroups(), SECURITY_ANALYTICS_GROUP].sort(
        (a, b) => a.order - b.order,
      ),
    [],
  );

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          size='xs'
          iconType='arrowDown'
          iconSide='right'
          onClick={() => setIsOpen(open => !open)}
          data-test-subj='quick-access-menu-button'
        >
          Quick access
        </EuiButtonEmpty>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition='downRight'
      repositionOnScroll
      panelPaddingSize='m'
      data-test-subj='quick-access-menu-popover'
    >
      {isOpen && (
        <RedirectAppLinks application={getCore().application}>
          <EuiPopoverTitle>
            <EuiFlexGroup
              gutterSize='s'
              alignItems='center'
              justifyContent='spaceBetween'
              responsive={false}
            >
              <EuiFlexItem grow={false}>Quick access</EuiFlexItem>
              <EuiFlexItem grow={false}>
                {/*
                 * Home's entry point to the AI Assistant, which lives in the separate
                 * `wazuh-ai-assistant` plugin (see `getAiAssistantUrl`). It sits in the popover
                 * title rather than in the group grid below because the assistant is not one of
                 * the `Applications`/category-driven groups — it is a single shortcut, not a
                 * content type. `RedirectAppLinks` (wrapping this subtree) turns the `href` into
                 * an in-app `navigateToApp`, same as the group items.
                 */}
                <EuiLink
                  href={getAiAssistantUrl()}
                  data-test-subj='quick-access-ai-assistant-link'
                >
                  <EuiIcon type='machineLearningApp' size='s' />{' '}
                  {i18n.translate(
                    'wazuh.homeOverview.quickAccess.aiAssistant',
                    {
                      defaultMessage: 'AI Assistant',
                    },
                  )}
                </EuiLink>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPopoverTitle>
          <EuiFlexGrid columns={2} style={{ width: 420 }}>
            {groups.map(group => (
              <EuiFlexItem
                key={group.id}
                data-test-subj={`quick-access-group-${group.id}`}
              >
                <EuiText size='xs'>
                  <strong>
                    <EuiIcon type={group.icon} size='s' /> {group.label}
                  </strong>
                </EuiText>
                <EuiListGroup flush gutterSize='none' maxWidth={false}>
                  {group.items.map(item => (
                    <EuiListGroupItem
                      key={item.id}
                      label={item.title}
                      href={item.getHref()}
                      size='s'
                    />
                  ))}
                </EuiListGroup>
              </EuiFlexItem>
            ))}
          </EuiFlexGrid>
        </RedirectAppLinks>
      )}
    </EuiPopover>
  );
};

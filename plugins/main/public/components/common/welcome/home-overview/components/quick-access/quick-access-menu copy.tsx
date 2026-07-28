import React, { useMemo, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiListGroup,
  EuiListGroupItem,
  EuiPopover,
  EuiPopoverTitle,
  EuiText,
} from '@elastic/eui';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../../../kibana-services';
import { Applications, Categories } from '../../../../../../utils/applications';
import {
  getModuleUrl,
  getRulesUrl,
  getDecodersUrl,
  getIntegrationsUrl,
  getDetectorsUrl,
} from '../../utils/navigation';

const QUICK_ACCESS_CATEGORY_IDS = [
  'wz-category-endpoint-security',
  'wz-category-threat-intelligence',
  'wz-category-security-operations',
  'wz-category-cloud-security',
];

const PINNED_STORAGE_KEY = 'wz-home-overview-quick-access-pinned';
const MAX_PINNED_ITEMS = 6;

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
  Applications.filter(
    app =>
      app.showInOverviewApp && QUICK_ACCESS_CATEGORY_IDS.includes(app.category),
  ).reduce<QuickAccessGroup[]>((groups, app) => {
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
  }, []);

/**
 * The Security Analytics dashboards plugin is optionally-mounted and external
 * to Wazuh's own Applications/Categories registry, so its group is defined
 * here rather than in utils/applications.ts. `order: 550` mirrors that
 * plugin's own nav-category order (between Cloud security's 500 and Agents
 * management's 600), so it sorts into 5th position alongside the other groups.
 */
const SECURITY_ANALYTICS_GROUP: QuickAccessGroup = {
  id: 'security-analytics',
  label: 'Security analytics',
  icon: 'securityAnalyticsApp',
  order: 550,
  items: [
    { id: 'rules', title: 'Rules', getHref: getRulesUrl },
    { id: 'decoders', title: 'Decoders', getHref: getDecodersUrl },
    { id: 'integrations', title: 'Integrations', getHref: getIntegrationsUrl },
    { id: 'detectors', title: 'Detectors', getHref: getDetectorsUrl },
  ],
};

const ALL_GROUPS = [...getDataDrivenGroups(), SECURITY_ANALYTICS_GROUP].sort(
  (a, b) => a.order - b.order,
);
const ALL_ITEMS = ALL_GROUPS.flatMap(group => group.items);

const readPinnedIds = (): string[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(PINNED_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(stored)) {
      return [];
    }
    const validIds = new Set(ALL_ITEMS.map(item => item.id));
    return stored.filter(
      (id): id is string => typeof id === 'string' && validIds.has(id),
    );
  } catch {
    return [];
  }
};

export const QuickAccessMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>(readPinnedIds);

  const togglePin = (id: string) =>
    setPinnedIds(previous => {
      const next = previous.includes(id)
        ? previous.filter(pinnedId => pinnedId !== id)
        : previous.length >= MAX_PINNED_ITEMS
        ? previous
        : [...previous, id];
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

  const pinnedItems = useMemo(
    () =>
      pinnedIds
        .map(id => ALL_ITEMS.find(item => item.id === id))
        .filter((item): item is QuickAccessItem => Boolean(item)),
    [pinnedIds],
  );

  return (
    <EuiFlexGroup gutterSize='xs' alignItems='center' responsive={false} wrap>
      {pinnedItems.length > 0 && (
        <EuiFlexItem grow={false}>
          <RedirectAppLinks application={getCore().application}>
            <EuiFlexGroup gutterSize='xs' responsive={false} wrap>
              {pinnedItems.map(item => (
                <EuiFlexItem grow={false} key={item.id}>
                  <EuiButtonEmpty
                    size='xs'
                    href={item.getHref()}
                    data-test-subj={`quick-access-pinned-${item.id}`}
                  >
                    {item.title}
                  </EuiButtonEmpty>
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
          </RedirectAppLinks>
        </EuiFlexItem>
      )}
      <EuiFlexItem grow={false}>
        <EuiPopover
          button={
            <EuiButtonEmpty
              size='xs'
              iconType='arrowDown'
              iconSide='right'
              onClick={() => setIsOpen(!isOpen)}
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
          panelStyle={{ maxWidth: 730 }}
          data-test-subj='quick-access-menu-popover'
        >
          {isOpen && (
            <RedirectAppLinks application={getCore().application}>
              <EuiPopoverTitle>Quick access</EuiPopoverTitle>
              <EuiFlexGrid
                columns={2}
                responsive={false}
                style={{ width: 700 }}
              >
                {ALL_GROUPS.map(group => (
                  <EuiFlexItem
                    key={group.id}
                    data-test-subj={`quick-access-group-${group.id}`}
                    style={{ minWidth: 0 }}
                  >
                    <EuiText size='xs'>
                      <strong>
                        <EuiIcon type={group.icon} size='s' /> {group.label}
                      </strong>
                    </EuiText>
                    <EuiListGroup flush gutterSize='none' maxWidth={false}>
                      {group.items.map(item => {
                        const isPinned = pinnedIds.includes(item.id);
                        return (
                          <EuiListGroupItem
                            key={item.id}
                            label={item.title}
                            href={item.getHref()}
                            size='s'
                            extraAction={{
                              iconType: isPinned ? 'pinFilled' : 'pin',
                              'aria-label': isPinned
                                ? `Unpin ${item.title}`
                                : `Pin ${item.title}`,
                              isDisabled:
                                !isPinned &&
                                pinnedIds.length >= MAX_PINNED_ITEMS,
                              onClick: event => {
                                event.preventDefault();
                                togglePin(item.id);
                              },
                            }}
                          />
                        );
                      })}
                    </EuiListGroup>
                  </EuiFlexItem>
                ))}
              </EuiFlexGrid>
            </RedirectAppLinks>
          )}
        </EuiPopover>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

import React, { useMemo, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiFlexGrid,
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
      data-test-subj='quick-access-menu-popover'
    >
      {isOpen && (
        <RedirectAppLinks application={getCore().application}>
          <EuiPopoverTitle>Quick access</EuiPopoverTitle>
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

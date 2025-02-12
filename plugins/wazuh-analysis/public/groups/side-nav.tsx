import { EuiSideNavItemType, htmlIdGenerator } from '@elastic/eui';
import { App } from 'opensearch-dashboards/public';
import { getCore } from '../plugin-services';
import { type Group } from '../../../wazuh-core/public/services/application/types';

interface Options {
  group: Group<any>;
  selectedAppId?: App['id'];
}

export function createSideNavItems({ group, selectedAppId }: Options) {
  const items: EuiSideNavItemType<any>[] = [
    {
      id: htmlIdGenerator(group.getId())(),
      name: group.getTitle(),
      items: group.getApps().map(app => ({
        id: app.id,
        name: app.title,
        onClick: () => getCore().application.navigateToApp(app.id),
        isSelected: app.id === selectedAppId,
      })),
    },
  ];

  return items;
}

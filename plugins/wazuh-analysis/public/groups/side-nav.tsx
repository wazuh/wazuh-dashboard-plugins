import { EuiSideNavItemType } from '@elastic/eui';
import { App } from 'opensearch-dashboards/public';
import { getCore } from '../plugin-services';

export function createSideNavItems(
  id: string,
  name: string,
  apps: App[],
  selectedAppId?: App['id'],
) {
  const items: EuiSideNavItemType<any>[] = [
    {
      name,
      id,
      items: apps.map(app => ({
        id: app.id,
        name: app.title,
        onClick: () => getCore().application.navigateToApp(app.id),
        isSelected: app.id === selectedAppId,
      })),
    },
  ];

  return items;
}

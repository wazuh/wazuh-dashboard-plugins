import { EuiSideNavItemType } from '@elastic/eui';
import { App } from 'opensearch-dashboards/public';

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
        onClick: () => alert(`click on ${app.id}`),
        isSelected: app.id === selectedAppId,
      })),
    },
  ];

  return items;
}

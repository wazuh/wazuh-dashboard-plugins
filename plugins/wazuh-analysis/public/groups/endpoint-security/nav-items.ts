import { EuiSideNavItemType, htmlIdGenerator } from '@elastic/eui';
import { App } from 'opensearch-dashboards/public';
import { createSideNavItems } from '../side-nav';
import { ENDPOINT_SECURITY_ID, ENDPOINT_SECURITY_TITLE } from './constants';
import { getEndpointSecurityApps } from './applications';

interface Props {
  selectedAppId?: App['id'];
}

export function createEndpointSecurityNavItems(
  props?: Props,
): EuiSideNavItemType<any>[] {
  const items: EuiSideNavItemType<any>[] = createSideNavItems(
    htmlIdGenerator(ENDPOINT_SECURITY_ID)(),
    ENDPOINT_SECURITY_TITLE,
    getEndpointSecurityApps(),
    props?.selectedAppId,
  );

  return items;
}

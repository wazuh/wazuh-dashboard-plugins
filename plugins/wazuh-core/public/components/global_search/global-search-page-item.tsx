import {
  EuiBreadcrumb,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHighlight,
  EuiIcon,
  EuiSimplifiedBreadcrumbs,
} from '@elastic/eui';
import {
  ChromeNavLink,
  ChromeRegistrationNavLink,
  CoreStart,
  NavGroupItemInMap,
} from 'opensearch-dashboards/public';
import React from 'react';

interface Props {
  key: React.Key;
  link: ChromeRegistrationNavLink &
    ChromeNavLink & { navGroup: NavGroupItemInMap };
  coreStart: CoreStart;
  search: string;
  callback?: () => void;
}

export const GlobalSearchPageItem = ({
  key,
  link,
  coreStart,
  search,
  callback,
}: Props) => {
  const breadcrumbs: EuiBreadcrumb[] = [];
  const navGroupElement = (navGroup: NavGroupItemInMap) => (
    <EuiFlexGroup gutterSize='s' alignItems='center'>
      {navGroup.icon && (
        <EuiFlexItem>
          <EuiIcon type={navGroup.icon} color='text' />
        </EuiFlexItem>
      )}
      <EuiFlexItem>
        <EuiHighlight search={search} highlightAll={true}>
          {navGroup.title}
        </EuiHighlight>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  breadcrumbs.push({ text: navGroupElement(link.navGroup) });

  const onNavItemClick = () => {
    callback?.();
    coreStart.chrome.navGroup.setCurrentNavGroup(link.navGroup.id);
    coreStart.application.navigateToApp(link.id);
  };

  breadcrumbs.push({
    text: (
      <EuiHighlight search={search} highlightAll={true}>
        {link.title}
      </EuiHighlight>
    ),
    onClick: () => {},
  });

  return (
    <div
      key={key}
      aria-hidden='true'
      data-test-subj={`global-search-item-${link.id}`}
      onClick={onNavItemClick}
    >
      <EuiSimplifiedBreadcrumbs
        breadcrumbs={breadcrumbs}
        hideTrailingSeparator
        responsive
      />
    </div>
  );
};

import {
  ChromeNavLink,
  ChromeRegistrationNavLink,
  CoreStart,
} from 'opensearch-dashboards/public';
import { first } from 'rxjs/operators';
import React, { ReactNode } from 'react';
import { GlobalSearchPageItem } from './page-item';

function match(title: string | undefined, query: string) {
  return title && title.toLowerCase().includes(query.toLowerCase());
}

export const searchPages = async (
  query: string,
  applicationIds: string[],
  coreStart?: CoreStart,
  callback?: () => void,
): Promise<ReactNode[]> => {
  if (!coreStart) {
    return [];
  }

  const navGroupMap = await coreStart.chrome.navGroup
    .getNavGroupsMap$()
    .pipe(first())
    .toPromise();
  const searchResult = applicationIds.flatMap(useCaseId => {
    const navGroup = navGroupMap[useCaseId];

    if (!navGroup) {
      return [];
    }

    const links = navGroup.navLinks as (ChromeRegistrationNavLink &
      ChromeNavLink)[];
    // parent nav links are not clickable
    const parentNavLinkIds = new Set(
      links.map(link => link.parentNavLinkId).filter(link => !!link),
    );

    return links
      .filter(link => {
        const title = link.title;
        let parentNavLinkTitle = '';

        // parent title also taken into consideration for search its sub items
        if (link.parentNavLinkId) {
          parentNavLinkTitle =
            navGroup.navLinks.find(
              navLink => navLink.id === link.parentNavLinkId,
            )?.title ?? '';
        }

        const navGroupTitleMatch = match(navGroup.title, query);
        const titleMatch = match(title, query);
        const parentTitleMatch = match(parentNavLinkTitle, query);

        return (
          !link.disabled &&
          (navGroupTitleMatch || titleMatch || parentTitleMatch) &&
          !parentNavLinkIds.has(link.id)
        );
      })
      .map(link => ({
        ...link,
        navGroup,
      }));
  });
  const pages = searchResult
    .slice(0, 10)
    .map(link => (
      <GlobalSearchPageItem
        key={link.id}
        link={link}
        search={query}
        coreStart={coreStart}
        callback={callback}
      />
    ));

  return pages;
};

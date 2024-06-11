import { useEffect, ReactNode } from 'react';
import { useRouterSearch } from '../common/hooks';
import NavigationService from '../../react-services/navigation-service';

const childrenMatchSearchRoute = (routeSearch, search) => {
  const searchParams = new URLSearchParams(routeSearch);
  return [...searchParams.entries()].every(([key, value]) => {
    if (value.startsWith(':')) {
      return search[key];
    }
    return search[key] === value;
  });
};

/* Create similar components of react-router-dom library to route the changes in
the search params */
export const Switch = ({ children }) => {
  const search = useRouterSearch();
  const child = (Array.isArray(children) ? children : [children]).find(child =>
    child.props.path
      ? childrenMatchSearchRoute(child.props.path, search)
      : child.props.to,
  );

  return (
    child?.props?.render?.({ search }) ||
    child?.props?.children ||
    child ||
    null
  );
};

export const Route = ({
  path,
  children,
  render,
}: {
  path: string;
  children?: ReactNode;
  render?: () => ReactNode;
}) => null;

export const Redirect = ({ to }) => {
  const navigationService = NavigationService.getInstance();
  useEffect(() => {
    navigationService.navigate({
      pathname: navigationService.getPathname(),
      search: to,
    });
  }, []);
  return null;
};

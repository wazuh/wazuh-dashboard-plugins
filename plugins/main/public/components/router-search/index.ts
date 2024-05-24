import { useEffect, ReactNode } from 'react';
import { useRouterSearch } from '../common/hooks';
import { useHistory, useLocation } from 'react-router-dom';

const childrenMatchSearchRoute = (routeSearch, search) => {
  const searchParams = new URLSearchParams(routeSearch);
  return [...searchParams.entries()].every(
    ([key, value]) => search[key] === value,
  );
};

/* Create similar components of react-router-dom library to route the changes in
the search params */
export const Switch = ({ children }) => {
  const search = useRouterSearch();
  const child = children.find(child =>
    child.props.path
      ? childrenMatchSearchRoute(child.props.path, search)
      : child.props.to,
  );

  return child?.props?.render?.({}) || child?.props?.children || child || null;
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
  const location = useLocation();
  const history = useHistory();
  useEffect(() => {
    history.push({
      pathname: location.pathname,
      search: to,
    });
  }, []);
  return null;
};

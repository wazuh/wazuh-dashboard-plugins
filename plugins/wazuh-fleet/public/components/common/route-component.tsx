import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCore } from '../../plugin-services';
import { ViewInterface } from '../interfaces/interfaces';

interface RouterComponentProps {
  view: ViewInterface;
  restProps: any;
}

export const RouteComponent = (props: RouterComponentProps) => {
  const { view, restProps } = props;
  const { id } = useParams();

  useEffect(() => {
    getCore().chrome.setBreadcrumbs(view.breadcrumb(id || undefined));
  }, [id, view]);

  return view.render({ ...restProps });
};

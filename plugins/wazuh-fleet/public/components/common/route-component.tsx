import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCore } from '../../plugin-services';
import { ViewInterface } from '../interfaces/interfaces';

interface RouterComponentProps {
  view: ViewInterface;
  restProps: any;
  setRenderMenu: React.Dispatch<React.SetStateAction<boolean>>;
}

export const RouteComponent = (props: RouterComponentProps) => {
  const { view, restProps, setRenderMenu } = props;
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      getCore().chrome.setBreadcrumbs(view.breadcrumb(id));
    } else {
      getCore().chrome.setBreadcrumbs(view.breadcrumb());
    }

    setRenderMenu(view.renderMenu);
  }, [id, view]);

  return view.render({ ...restProps });
};

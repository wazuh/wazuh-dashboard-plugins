import React from 'react';
import { Logtest } from '../../directives/wz-logtest/components/logtest';
import { ToolDevTools } from './devtools/devtools-old';
import { devTools, rulesetTest } from '../../utils/applications';
import {
  withGlobalBreadcrumb,
  withGuardAsync,
  withReduxProvider,
} from '../common/hocs';
import { compose } from 'redux';

const views = {
  devTools: {
    breadcrumb: devTools.breadcrumbLabel,
    component: ToolDevTools,
  },
  logtest: {
    breadcrumb: rulesetTest.breadcrumbLabel,
    component: Logtest,
  },
};

export const ToolsRouter = compose(
  withReduxProvider,
  withGuardAsync(
    ({ location }) => {
      const tab = new URLSearchParams(location.search).get('tab');
      if (views[tab]) {
        return { ok: false, data: { tab } };
      }
      return { ok: true, data: { tab } };
    },
    () => null,
  ),
  withGlobalBreadcrumb(({ tab }) => [
    {
      text: views[tab].breadcrumb,
    },
  ]),
)(({ tab }) => {
  const View = views[tab].component;
  return <View />;
});

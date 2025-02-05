import React from 'react';
import { EuiPage, EuiPageBody, EuiPageContentBody } from '@elastic/eui';
import { AppMountParameters } from '../../../../src/core/public';

export interface AnalysisAppDependencies {}

interface AnalysisAppProps {
  appBasePath: string;
  history: AppMountParameters['history'];
  dependencies: AnalysisAppDependencies;
}

export const AnalysisApp = (_props: AnalysisAppProps) => (
  <EuiPage>
    <EuiPageBody>
      <EuiPageContentBody>AnalysisApp</EuiPageContentBody>
    </EuiPageBody>
  </EuiPage>
);

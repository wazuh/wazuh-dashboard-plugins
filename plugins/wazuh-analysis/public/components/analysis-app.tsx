import React from 'react';
import { AppMountParameters } from '../../../../src/core/public';

export interface AnalysisAppDependencies {}

interface AnalysisAppProps {
  appBasePath: string;
  history: AppMountParameters['history'];
  dependencies: AnalysisAppDependencies;
}

export const AnalysisApp = (_props: AnalysisAppProps) => <>AnalysisApp</>;

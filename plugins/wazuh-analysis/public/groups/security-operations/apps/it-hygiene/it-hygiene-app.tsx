import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { IT_HYGIENE_TITLE } from '../../constants';

interface ItHygieneAppProps {
  params: AppMountParameters;
}

export const ItHygieneApp = (_props: ItHygieneAppProps) => (
  <>{IT_HYGIENE_TITLE} App</>
);

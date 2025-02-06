import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { IT_HYGIENE_TITLE } from '../../constants';

interface ItHygieneProps {
  params: AppMountParameters;
}

export const ItHygieneApp = (_props: ItHygieneProps) => (
  <>{IT_HYGIENE_TITLE} App</>
);

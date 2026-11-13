import React from 'react';
import { ButtonModuleGenerateReport } from '../../../../common/modules/buttons';
import { useRouterSearch } from '../../../../common/hooks/use-router-search';
import { MODULE_SUB_TABS_SEARCH_PARAM } from '../../../../common/tabs';
import { COMPLIANCE_TAB_ID_CONTROLS } from '../../shared/constants';
import { TAB_VIEW_ID_EVENTS } from '../../../../../../common/constants';

// Sub-tabs without a dashboard. Any other value falls back to the Dashboard sub-tab.
const SUB_TABS_WITHOUT_REPORT = [
  COMPLIANCE_TAB_ID_CONTROLS,
  TAB_VIEW_ID_EVENTS,
];

/**
 * Generate report button of a framework tab. A framework tab holds its own sub-tabs, which do not
 * render buttons, so the button lives in the module header and shows only while the Dashboard
 * sub-tab is open. The report is the framework dashboard with the agent filter, the filters and
 * the time range of the page.
 */
export const ButtonComplianceGenerateReport = (
  props: React.ComponentProps<typeof ButtonModuleGenerateReport>,
) => {
  const search = useRouterSearch();
  if (SUB_TABS_WITHOUT_REPORT.includes(search[MODULE_SUB_TABS_SEARCH_PARAM])) {
    return null;
  }
  return <ButtonModuleGenerateReport {...props} />;
};

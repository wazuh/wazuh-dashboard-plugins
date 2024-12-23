import React from 'react';
import { DashboardSecurityServiceSetupReturn } from '../../types';

export function createDashboardSecurityHOCs({
  useDashboardSecurityAccount,
  useDashboardSecurityIsAdmin,
}: DashboardSecurityServiceSetupReturn['hooks']): DashboardSecurityServiceSetupReturn['hocs'] {
  const withDashboardSecurityAccount = (WrappedComponent: React.ElementType) =>
    function WithDashboardSecurityAccount(props: any) {
      const dashboardSecurityAccount = useDashboardSecurityAccount();

      return (
        <WrappedComponent
          {...props}
          dashboardSecurityAccount={dashboardSecurityAccount}
        />
      );
    };

  const withDashboardSecurityAccountAdmin = (
    WrappedComponent: React.ElementType,
  ) =>
    function WithDashboardSecurityAccountAdmin(props: any) {
      const dashboardSecurityAccountAdmin = useDashboardSecurityIsAdmin();

      return (
        <WrappedComponent
          {...props}
          dashboardSecurityAccountAdmin={dashboardSecurityAccountAdmin}
        />
      );
    };

  return {
    withDashboardSecurityAccount,
    withDashboardSecurityAccountAdmin,
  };
}

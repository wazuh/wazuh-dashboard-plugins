import React from 'react';
import { BehaviorSubject } from 'rxjs';

export interface DashboardSecurityServiceAccount {
  administrator: boolean;
  administrator_requirements: string | null;
}

export interface DashboardSecurityServiceSetupReturn {
  hooks: {
    useDashboardSecurityAccount: () => [
      DashboardSecurityServiceAccount,
      (accountData: any) => void,
    ];
    useDashboardSecurityIsAdmin: () => boolean;
  };
  hocs: {
    // FIXME: enhance typing
    withDashboardSecurityAccount: (
      WrappedComponent: React.ElementType,
    ) => (props: any) => React.ElementRef;
    withDashboardSecurityAccountAdmin: (
      WrappedComponent: React.ElementType,
    ) => (props: any) => React.ElementRef;
  };
}

export interface DashboardSecurityServiceSetupDeps {
  updateData$: BehaviorSubject<DashboardSecurityServiceAccount>;
}

export interface DashboardSecurityService {
  account: DashboardSecurityServiceAccount;
  account$: BehaviorSubject<DashboardSecurityServiceAccount>;
  setup: (
    deps: DashboardSecurityServiceSetupDeps,
  ) => Promise<DashboardSecurityServiceSetupReturn>;
  start: () => void;
  stop: () => void;
}

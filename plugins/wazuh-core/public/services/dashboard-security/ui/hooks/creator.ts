import {
  DashboardSecurityService,
  DashboardSecurityServiceSetupReturn,
} from '../../types';

export function createDashboardSecurityHooks({
  account$,
}: {
  account$: DashboardSecurityService['account$'];
}): DashboardSecurityServiceSetupReturn['hooks'] {
  const setAccount = data => {
    account$.next(data);
  };

  return {
    useDashboardSecurityAccount: function useDashboardSecurityAccount() {
      return [account$.getValue(), setAccount];
    },
    useDashboardSecurityIsAdmin: function useDashboardSecurityIsAdmin() {
      return account$.getValue()?.administrator;
    },
  };
}

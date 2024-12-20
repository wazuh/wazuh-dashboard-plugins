import { BehaviorSubject } from 'rxjs';
import jwtDecode from 'jwt-decode';
import { Logger } from '../../../common/services/configuration';
import { WAZUH_ROLE_ADMINISTRATOR_ID } from '../../../common/constants';
import { createDashboardSecurityHooks } from './ui/hooks/creator';
import { createDashboardSecurityHOCs } from './ui/hocs/creator';
import {
  DashboardSecurityServiceAccount,
  DashboardSecurityService,
  DashboardSecurityServiceSetupDeps,
  DashboardSecurityServiceSetupReturn,
} from './types';

export class DashboardSecurity implements DashboardSecurityService {
  private securityPlatform = '';
  public account$: BehaviorSubject<DashboardSecurityServiceAccount>;

  constructor(
    private readonly logger: Logger,
    private readonly http: { get: (path: string) => any },
  ) {
    this.account$ = new BehaviorSubject({
      administrator: false,
      administrator_requirements: null,
    });
  }

  private async fetchCurrentPlatform() {
    try {
      this.logger.debug('Fetching the security platform');

      const response = await this.http.get(
        '/elastic/security/current-platform',
      );

      this.securityPlatform = response.platform;
      this.logger.debug(`Security platform: ${this.securityPlatform}`);

      return this.securityPlatform;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  get account() {
    return this.account$.getValue();
  }

  async setup({
    updateData$,
  }: DashboardSecurityServiceSetupDeps): Promise<DashboardSecurityServiceSetupReturn> {
    this.logger.debug('Setup');

    let hooks, hocs;

    try {
      this.logger.debug('Creating the UI utilities');

      this.logger.debug('Creating hooks');
      hooks = createDashboardSecurityHooks({
        account$: this.account$,
      });
      this.logger.debug('Created hooks');

      this.logger.debug('Creating HOCs');
      hocs = createDashboardSecurityHOCs(hooks);
      this.logger.debug('Created HOCs');
      this.logger.debug('Created the UI utilities');
    } catch (error) {
      this.logger.error(`Error creating the UI utilities: ${error.message}`);
      throw error;
    }

    try {
      this.logger.debug('Getting security platform');
      this.securityPlatform = await this.fetchCurrentPlatform();
    } catch (error) {
      this.logger.error(
        `Error fetching the current platform: ${error.message}`,
      );
    }

    // Update the dashboard security account information based on server API token
    updateData$.subscribe(({ token }: { token: string }) => {
      const jwtPayload: {
        rbac_roles?: number[];
      } | null = token ? jwtDecode(token) : null;

      this.account$.next(this.getAccountFromJWTAPIDecodedToken(jwtPayload));
    });

    return {
      hooks,
      hocs,
    };
  }

  async start() {}

  async stop() {}

  private getAccountFromJWTAPIDecodedToken(decodedToken: {
    rbac_roles?: number[];
  }) {
    const isAdministrator = decodedToken?.rbac_roles?.some?.(
      role => role === WAZUH_ROLE_ADMINISTRATOR_ID,
    );

    return {
      administrator: isAdministrator,
      administrator_requirements: isAdministrator
        ? null
        : 'User has no administrator role in the selected API connection.',
    };
  }
}

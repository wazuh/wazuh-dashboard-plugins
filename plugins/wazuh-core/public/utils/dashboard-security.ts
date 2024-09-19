import { WAZUH_ROLE_ADMINISTRATOR_ID } from '../../common/constants';
import { Logger } from '../../common/services/configuration';

export class DashboardSecurity {
  private securityPlatform: string = '';
  constructor(private logger: Logger, private http) {}
  private async fetchCurrentPlatform() {
    try {
      this.logger.debug('Fetching the security platform');
      const response = await this.http.get(
        '/elastic/security/current-platform',
      );
      this.logger.debug(`Security platform: ${this.securityPlatform}`);
      return response.platform;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
  async setup() {
    try {
      this.logger.debug('Setup');
      this.securityPlatform = await this.fetchCurrentPlatform();
      this.logger.debug(`Security platform: ${this.securityPlatform}`);
    } catch (error) {
      this.logger.error(error.message);
    }
  }
  async start() {}
  async stop() {}
  getAccountFromJWTAPIDecodedToken(decodedToken: number[]) {
    const isAdministrator = decodedToken?.rbac_roles?.some?.(
      (role: number) => role === WAZUH_ROLE_ADMINISTRATOR_ID,
    );
    return {
      administrator: isAdministrator,
      administrator_requirements: !isAdministrator
        ? 'User has no administrator role in the selected API connection.'
        : null,
    };
  }
}

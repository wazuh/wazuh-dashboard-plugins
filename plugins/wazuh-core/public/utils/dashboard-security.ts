import { i18n } from '@osd/i18n';
import { WAZUH_ROLE_ADMINISTRATOR_ID } from '../../common/constants';
import { ILogger } from '../../common/services/configuration';

type CurrentPlatformResponse = {
  platform: string;
  authContextFields: string[];
};

export class DashboardSecurity {
  private securityPlatform: string = '';
  private currentPlatformRequest?: Promise<CurrentPlatformResponse>;
  constructor(private logger: ILogger, private http) {}
  // The platform does not change at runtime, so later callers reuse the first request
  private requestOnce() {
    if (!this.currentPlatformRequest) {
      this.currentPlatformRequest = this.requestCurrentPlatform().catch(
        error => {
          this.currentPlatformRequest = undefined;
          throw error;
        },
      );
    }
    return this.currentPlatformRequest;
  }
  private async fetchCurrentPlatform() {
    return (await this.requestOnce()).platform;
  }
  /** User fields of the authentication context of the security platform */
  async fetchAuthContextFields() {
    return (await this.requestOnce()).authContextFields;
  }
  private async requestCurrentPlatform(): Promise<CurrentPlatformResponse> {
    try {
      this.logger.debug('Fetching the security platform');
      const response = await this.http.get(
        '/elastic/security/current-platform',
      );
      return {
        platform: response.platform,
        authContextFields: response.authContextFields ?? [],
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
  async setup() {
    try {
      this.logger.debug('Setup');
      const response = await this.requestOnce();
      this.securityPlatform = response.platform;
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
        ? i18n.translate('wazuhCore.security.administrator.missingRole', {
            defaultMessage:
              'User has no administrator role in the selected API connection.',
          })
        : null,
    };
  }
}

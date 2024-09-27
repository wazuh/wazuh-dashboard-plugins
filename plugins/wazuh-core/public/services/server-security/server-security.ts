import { ILogger } from '../../../common/services/configuration';
import { checkMissingUserPermissions } from './wz-user-permissions';
import {
  ServerSecurity,
  ServerSecurityCombinedPermission,
  ServerSecuritySetupDeps,
  ServerSecuritySetupReturn,
} from './types';
import { createServerSecurityHooks } from './ui/hooks/creator';
import { createServerSecurityHOCS } from './ui/hocs/creator';
import { createServerSecurityUI } from './ui/components/creator';
import { LoadingServerUserLogging } from './ui/components/loading';
import { WzEmptyPromptNoPermissions } from './ui/components/prompt';

export class CoreServerSecurity implements ServerSecurity {
  private getUserPermissions: any;
  constructor(private logger: ILogger, { getUserPermissions }) {
    this.getUserPermissions = getUserPermissions;
  }
  setup(deps: ServerSecuritySetupDeps): ServerSecuritySetupReturn {
    this.logger.debug('Setup');

    this.logger.debug('Creating runtime hooks');
    const hooks = createServerSecurityHooks({
      ...deps,
      checkMissingUserPermissions: this.checkMissingUserPermissions,
    });
    this.logger.debug('Created runtime hooks');

    this.logger.debug('Creating runtime HOCs');
    const hocs = createServerSecurityHOCS({
      ...deps,
      ...hooks,
      LoadingServerUserLogging,
      PromptNoPermissions: WzEmptyPromptNoPermissions,
    });
    this.logger.debug('Created runtime HOCs');

    this.logger.debug('Creating UI components');
    const ui = createServerSecurityUI(hooks);
    this.logger.debug('Creating UI components');

    this.logger.debug('Setup finished');

    return {
      hooks,
      hocs,
      ui,
    };
  }
  start() {}
  stop() {}
  checkMissingUserPermissions(
    requiredPermissions: ServerSecurityCombinedPermission[],
    userPermissions: any,
  ) {
    return checkMissingUserPermissions(requiredPermissions, userPermissions);
  }
  getMissingUserPermissions(
    requiredPermissions: ServerSecurityCombinedPermission[],
  ) {
    return checkMissingUserPermissions(
      requiredPermissions,
      this.getUserPermissions(),
    );
  }
}

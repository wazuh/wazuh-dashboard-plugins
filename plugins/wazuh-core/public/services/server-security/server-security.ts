import { BehaviorSubject } from 'rxjs';
import { Logger } from '../../../common/services/configuration';
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
  public serverSecurityUserData$: BehaviorSubject<{
    logged: boolean;
    policies: any;
    token: string;
  }>;

  constructor(private readonly logger: Logger) {
    this.serverSecurityUserData$ = new BehaviorSubject({
      logged: false,
      policies: null,
      token: null,
    });
  }

  setup(deps: ServerSecuritySetupDeps): ServerSecuritySetupReturn {
    this.logger.debug('Setup');

    this.logger.debug('Creating runtime hooks');

    // Update the user server security information based on the authentication
    deps.auth$.subscribe(data => this.serverSecurityUserData$.next(data));

    const hooks = createServerSecurityHooks({
      ...deps,
      serverSecurityUserData$: this.serverSecurityUserData$,
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
      this.serverSecurityUserData$.getValue(),
    );
  }
}

import { ModelState } from '../../domain/enums/model-state';
import { ModelStatus } from '../../domain/enums/model-status';

export class ModelStateMapper {
  static toStatus(
    state: string,
    defaultStatus = ModelStatus.ACTIVE,
  ): ModelStatus {
    switch (state?.toUpperCase()) {
      case ModelState.DEPLOYED:
      case ModelState.LOADED:
        return ModelStatus.ACTIVE;
      case ModelState.UNDEPLOYED:
      case ModelState.NOT_DEPLOYED:
        return ModelStatus.INACTIVE;
      case ModelState.DEPLOY_FAILED:
      case ModelState.LOAD_FAILED:
        return ModelStatus.ERROR;
      default:
        return defaultStatus;
    }
  }
}

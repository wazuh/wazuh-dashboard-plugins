import { compose } from 'redux';
import {
  withErrorBoundary,
  withRouteResolvers,
} from '../../../../components/common/hocs';
// Redux
import WzManagementMain from '../management/management-main';
import {
  enableMenu,
  ip,
  nestedResolve,
  savedSearch,
} from '../../../../services/resolves';

export default compose(
  withErrorBoundary,
  withRouteResolvers({ enableMenu, ip, nestedResolve, savedSearch }),
)(WzManagementMain);

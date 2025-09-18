import { compose } from 'redux';
import {
  withErrorBoundary,
  withRouteResolvers,
} from '../../../../components/common/hocs';
// Redux
import WzManagementMain from '../management/management-main';
import { nestedResolve } from '../../../../services/resolves';

export default compose(
  withErrorBoundary,
  withRouteResolvers({ nestedResolve }),
)(WzManagementMain);

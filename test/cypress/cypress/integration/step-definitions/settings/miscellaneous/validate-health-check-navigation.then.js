import { validateURLIncludes } from '../../../utils/driver';
import { HEALTH_CHECK_URL } from '../../../utils/health-check-constants';

Then('The application navigates to the health checks page', () => {
  validateURLIncludes(HEALTH_CHECK_URL);
});

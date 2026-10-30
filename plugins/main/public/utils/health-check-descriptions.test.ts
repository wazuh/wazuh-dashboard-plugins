import {
  HEALTH_CHECK_TASK_CERTIFICATE_VALIDITY,
  HEALTH_CHECK_TASK_DASHBOARDS,
  HEALTH_CHECK_TASK_INDEX_PATTERNS,
  HEALTH_CHECK_TASK_NOTIFICATION_CHANNELS,
  HEALTH_CHECK_TASK_SERVER_API_CONNECTION,
  HEALTH_CHECK_TASK_SERVER_API_RUN_AS,
} from '../../common/constants';
import type { CoreSetup } from 'opensearch-dashboards/public';
import { registerHealthCheckDescriptions } from './health-check-descriptions';

describe('registerHealthCheckDescriptions', () => {
  it('describes every check the server registers', () => {
    const describeCheck = jest.fn();

    registerHealthCheckDescriptions({
      describe: describeCheck,
    } as unknown as CoreSetup['healthCheck']);

    expect(describeCheck.mock.calls.map(([name]) => name).sort()).toEqual(
      [
        HEALTH_CHECK_TASK_CERTIFICATE_VALIDITY,
        HEALTH_CHECK_TASK_DASHBOARDS,
        HEALTH_CHECK_TASK_INDEX_PATTERNS,
        HEALTH_CHECK_TASK_NOTIFICATION_CHANNELS,
        HEALTH_CHECK_TASK_SERVER_API_CONNECTION,
        HEALTH_CHECK_TASK_SERVER_API_RUN_AS,
      ].sort(),
    );
    describeCheck.mock.calls.forEach(([, description]) => {
      expect(description.title).toBeTruthy();
      expect(description.description).toBeTruthy();
      expect(description.remediation).toBeTruthy();
    });
  });
});

import { FimEmptyState } from '../components/empty-state/fim-empty-state';
import { DashboardFIM } from './dashboard';

// Returns the configuration so the test reads what the FIM dashboard passes to the shared one
jest.mock('../../../common/dashboards/dashboard', () => ({
  createDashboard: (config: unknown) => config,
}));
jest.mock('../../../common/data-source', () => ({
  FIMDataSource: jest.fn(),
  FIMDataSourceRepository: jest.fn(),
}));
jest.mock('../components/empty-state/fim-empty-state', () => ({
  FimEmptyState: () => null,
}));

describe('DashboardFIM', () => {
  it('explains what to do when the current state has no monitored files', () => {
    const { emptyState } = DashboardFIM as unknown as {
      emptyState: JSX.Element;
    };

    expect(emptyState.type).toBe(FimEmptyState);
    expect(emptyState.props.kind).toBe('dashboard');
  });
});

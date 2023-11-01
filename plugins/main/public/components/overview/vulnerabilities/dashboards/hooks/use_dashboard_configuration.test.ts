import { renderHook, act } from '@testing-library/react-hooks';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { DashboardContainerInput } from '../../../../../../../../src/plugins/dashboard/public';
import { useDashboardConfiguration } from './use_dashboard_configuration';

describe('useDashboardConfiguration', () => {
  test('initial configuration is set correctly', () => {
    const emptyInitialConfiguration: DashboardContainerInput = {
      viewMode: ViewMode.EDIT,
      filters: [],
      query: undefined,
      timeRange: undefined,
      useMargins: false,
      title: '',
      isFullScreenMode: false,
      panels: {},
      id: '',
    };

    const { result } = renderHook(() => useDashboardConfiguration());

    expect(result.current.configuration).toEqual(emptyInitialConfiguration);
    expect(typeof result.current.updateConfiguration).toBe('function');
  });

  test('updateConfiguration updates configuration correctly', () => {
    const { result } = renderHook(() => useDashboardConfiguration());

    const updatedConfig = {
      viewMode: ViewMode.VIEW,
      title: 'Updated Title',
    };

    act(() => {
      result.current.updateConfiguration(updatedConfig);
    });

    expect(result.current.configuration.viewMode).toBe(updatedConfig.viewMode);
    expect(result.current.configuration.title).toBe(updatedConfig.title);
  });

  test('updateConfiguration merges properties correctly', () => {
    const { result } = renderHook(() => useDashboardConfiguration());

    const updatedConfig = {
      viewMode: ViewMode.VIEW,
      title: 'Updated Title',
    };

    act(() => {
      result.current.updateConfiguration(updatedConfig);
    });

    expect(result.current.configuration.viewMode).toBe(updatedConfig.viewMode);
    expect(result.current.configuration.title).toBe(updatedConfig.title);

    const additionalUpdate = {
      description: 'Updated Description',
    };

    act(() => {
      result.current.updateConfiguration(additionalUpdate);
    });

    expect(result.current.configuration.viewMode).toBe(updatedConfig.viewMode);
    expect(result.current.configuration.title).toBe(updatedConfig.title);
    expect(result.current.configuration.description).toBe(additionalUpdate.description);
  });
});

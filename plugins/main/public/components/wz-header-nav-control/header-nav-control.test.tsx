import { registerHeaderNavControl } from './header-nav-control';
import { CoreStart } from 'opensearch_dashboards/public';

const mockRender = jest.fn();
const mockUnmount = jest.fn();
const mockCreateRoot = jest.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- matches createRoot's arity
  (container: unknown) => ({
    render: mockRender,
    unmount: mockUnmount,
  }),
);

jest.mock('react-dom/client', () => ({
  createRoot: (container: unknown) => mockCreateRoot(container),
}));

function buildCoreStart(isNewHomePageEnable: boolean) {
  const navControls = {
    registerRight: jest.fn(),
    registerLeftBottom: jest.fn(),
  };

  return {
    uiSettings: { get: jest.fn(() => isNewHomePageEnable) },
    chrome: { navControls },
  } as unknown as CoreStart;
}

describe('registerHeaderNavControl', () => {
  it('mounts with createRoot and unmounts on cleanup, in the right slot per home page setting', () => {
    const Components = () => null;

    const coreStart = buildCoreStart(false);
    registerHeaderNavControl(coreStart, Components);

    expect(coreStart.chrome.navControls.registerRight).toHaveBeenCalledTimes(1);
    expect(
      coreStart.chrome.navControls.registerLeftBottom,
    ).not.toHaveBeenCalled();

    const { mount } = coreStart.chrome.navControls.registerRight.mock
      .calls[0][0] as { mount: (el: HTMLElement) => () => void };
    const el = document.createElement('div');

    const unmountControl = mount(el);

    expect(mockCreateRoot).toHaveBeenCalledWith(el);
    expect(mockRender).toHaveBeenCalledTimes(1);
    expect(mockUnmount).not.toHaveBeenCalled();

    unmountControl();

    expect(mockUnmount).toHaveBeenCalledTimes(1);
  });

  it('registers in the left-bottom slot when the new home page is enabled', () => {
    const Components = () => null;
    const coreStart = buildCoreStart(true);

    registerHeaderNavControl(coreStart, Components);

    expect(
      coreStart.chrome.navControls.registerLeftBottom,
    ).toHaveBeenCalledTimes(1);
    expect(coreStart.chrome.navControls.registerRight).not.toHaveBeenCalled();
  });
});

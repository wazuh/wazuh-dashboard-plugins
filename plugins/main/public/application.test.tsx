import { renderApp } from './application';

jest.mock('./app', () => ({}));
jest.mock('./app-router', () => ({
  Application: () => null,
}));
jest.mock('./redux/store', () => ({}));

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

describe('renderApp', () => {
  it('mounts with createRoot on the given element and unmounts on cleanup', async () => {
    const element = document.createElement('div');

    const unmountApp = await renderApp({ element });

    expect(mockCreateRoot).toHaveBeenCalledWith(element);
    expect(mockRender).toHaveBeenCalledTimes(1);
    expect(mockUnmount).not.toHaveBeenCalled();

    unmountApp();

    expect(mockUnmount).toHaveBeenCalledTimes(1);
  });
});

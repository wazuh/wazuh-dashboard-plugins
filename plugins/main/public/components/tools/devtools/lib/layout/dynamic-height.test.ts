import { DynamicHeight } from '../../../../../utils/dynamic-height';
import { EDITOR_MIRRORS } from '../../constants';
import { setupDynamicHeight } from './dynamic-height';

const flushMutations = () => new Promise(resolve => setTimeout(resolve, 0));

describe('setupDynamicHeight', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest
      .spyOn(DynamicHeight, 'dynamicHeightDevTools')
      .mockImplementation(() => undefined);
    document.body.innerHTML = `<div id="app-wrapper">
      <div id="${EDITOR_MIRRORS.LEFT_COLUMN_ID}"></div>
    </div>`;
  });

  afterEach(() => {
    spy.mockRestore();
    window.onresize = null;
    document.body.innerHTML = '';
  });

  it('calculates the height on setup and on window resize', () => {
    setupDynamicHeight(window);
    expect(spy).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('resize'));
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('recalculates when a bottom bar is added or removed', async () => {
    setupDynamicHeight(window);
    spy.mockClear();

    const bar = document.createElement('div');
    bar.className = 'euiBottomBar';
    document.getElementById('app-wrapper')!.appendChild(bar);
    await flushMutations();
    expect(spy).toHaveBeenCalledTimes(1);

    bar.remove();
    await flushMutations();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('stops observing once the Dev Tools columns are gone', async () => {
    setupDynamicHeight(window);
    spy.mockClear();

    document.getElementById(EDITOR_MIRRORS.LEFT_COLUMN_ID)!.remove();
    await flushMutations();
    expect(spy).not.toHaveBeenCalled();

    document
      .getElementById('app-wrapper')!
      .appendChild(document.createElement('div'));
    await flushMutations();
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not fail when there is no app wrapper', () => {
    document.body.innerHTML = '';
    expect(() => setupDynamicHeight(window)).not.toThrow();
  });
});

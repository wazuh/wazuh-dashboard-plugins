import {
  buildEndpointHintItem,
  buildQueryParamHintItem,
} from './hint-builders';

describe('hint-builders', () => {
  it('builds endpoint hint with renderer adding label', () => {
    const item = buildEndpointHintItem('/_cat/indices');
    expect(item.text).toBe('/_cat/indices');
    expect(item.displayText).toBe('/_cat/indices');
    const container = document.createElement('div');
    item.render?.(container, {} as any, item);
    expect(container.querySelector('.wz-hint')).toBeTruthy();
    expect(container.querySelector('.wz-hint__text')?.textContent).toBe(
      '/_cat/indices',
    );
    expect(container.querySelector('.wz-hint__label')?.textContent).toBe(
      'endpoint',
    );
    expect(container.innerHTML).toMatchSnapshot();
  });

  it('builds query param hint with correct label for flags', () => {
    const flagItem = buildQueryParamHintItem(
      'pretty',
      '/_cat/indices?pretty=',
      true,
    );
    const paramItem = buildQueryParamHintItem('size', '/_search?size=', false);
    expect(flagItem.text).toBe('/_cat/indices?pretty=');
    expect(paramItem.text).toBe('/_search?size=');

    const c1 = document.createElement('div');
    flagItem.render?.(c1, {} as any, flagItem);
    expect(c1.querySelector('.wz-hint__label')?.textContent).toBe('flag');

    const c2 = document.createElement('div');
    paramItem.render?.(c2, {} as any, paramItem);
    expect(c2.querySelector('.wz-hint__label')?.textContent).toBe('param');
  });
});

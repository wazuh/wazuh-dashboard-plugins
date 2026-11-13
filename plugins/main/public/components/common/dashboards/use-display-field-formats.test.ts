import { renderHook } from '@testing-library/react';
import { FieldFormatInstanceType } from '../../../../../../src/plugins/data/public';
import {
  applyDisplayFieldFormats,
  useDisplayFieldFormats,
} from './use-display-field-formats';

const mockRegistry = new Map<string, unknown>();
const mockGetInstance = jest.fn((id: string, params?: unknown) => ({
  id,
  params,
}));

jest.mock('../../../kibana-services', () => ({
  getDataPlugin: () => ({
    fieldFormats: {
      getType: (id: string) => mockRegistry.get(id),
      register: (types: Array<{ id: string }>) =>
        types.forEach(type => mockRegistry.set(type.id, type)),
      getInstance: mockGetInstance,
    },
  }),
}));

const FormatType = {
  id: 'test_format',
} as unknown as FieldFormatInstanceType;

describe('applyDisplayFieldFormats', () => {
  beforeEach(() => {
    mockRegistry.clear();
    mockGetInstance.mockClear();
  });

  it('registers the format type, sets the format and puts back the previous one', () => {
    const previous = { id: 'string' };
    const indexPattern = {
      fieldFormatMap: { a: previous } as Record<string, unknown>,
    };

    const restore = applyDisplayFieldFormats(indexPattern, {
      a: { type: FormatType, params: { section: 'pci-dss' } },
      b: { type: FormatType },
    });

    expect(mockRegistry.get('test_format')).toBe(FormatType);
    expect(indexPattern.fieldFormatMap.a).toEqual({
      id: 'test_format',
      params: { section: 'pci-dss' },
    });
    expect(indexPattern.fieldFormatMap.b).toEqual({
      id: 'test_format',
      params: undefined,
    });

    restore();

    expect(indexPattern.fieldFormatMap).toEqual({ a: previous });
  });
});

describe('useDisplayFieldFormats', () => {
  it('applies the formats while mounted and removes them on unmount', () => {
    const indexPattern = { fieldFormatMap: {} as Record<string, unknown> };
    const formats = { a: { type: FormatType } };

    const { unmount, rerender } = renderHook(() =>
      useDisplayFieldFormats(indexPattern, formats),
    );

    expect(indexPattern.fieldFormatMap.a).toBeDefined();

    // Rendering again does not create the format again.
    mockGetInstance.mockClear();
    rerender();
    expect(mockGetInstance).not.toHaveBeenCalled();

    unmount();

    expect(indexPattern.fieldFormatMap).toEqual({});
  });

  it('does nothing without formats', () => {
    const indexPattern = { fieldFormatMap: {} as Record<string, unknown> };

    renderHook(() => useDisplayFieldFormats(indexPattern, undefined));

    expect(indexPattern.fieldFormatMap).toEqual({});
  });
});

/**
 * Thin integration tests for public function wrappers delegating to GroupingService.
 */

describe('lib/grouping index wrappers', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('delegates analyzeGroups to service.parseGroups', async () => {
    const parseGroups = jest.fn().mockReturnValue(['ok']);
    jest.doMock('./grouping-service', () => ({
      GroupingService: jest.fn().mockImplementation(() => ({ parseGroups })),
    }));

    const mod = await import('./index');
    const result = mod.analyzeGroups({} as any);
    expect(parseGroups).toHaveBeenCalled();
    expect(result).toEqual(['ok']);
  });

  it('delegates calculateWhichGroup to service.selectActiveGroup', async () => {
    const selectActiveGroup = jest.fn().mockReturnValue({ id: 1 });
    jest.doMock('./grouping-service', () => ({
      GroupingService: jest
        .fn()
        .mockImplementation(() => ({ selectActiveGroup })),
    }));

    const mod = await import('./index');
    const result = mod.calculateWhichGroup({} as any, true, [] as any);
    expect(selectActiveGroup).toHaveBeenCalledWith(expect.anything(), true, []);
    expect(result).toEqual({ id: 1 });
  });

  it('delegates highlightGroup to service.highlightGroup', async () => {
    const highlightGroup = jest.fn();
    jest.doMock('./grouping-service', () => ({
      GroupingService: jest.fn().mockImplementation(() => ({ highlightGroup })),
    }));

    const mod = await import('./index');
    const ed = {} as any;
    const grp = {} as any;
    mod.highlightGroup(ed, grp);
    expect(highlightGroup).toHaveBeenCalledWith(ed, grp);
  });

  it('delegates checkJsonParseError to service.validateJson', async () => {
    const validateJson = jest.fn().mockReturnValue(['bad']);
    jest.doMock('./grouping-service', () => ({
      GroupingService: jest.fn().mockImplementation(() => ({ validateJson })),
    }));

    const mod = await import('./index');
    const ed = {} as any;
    const res = mod.checkJsonParseError(ed, []);
    expect(validateJson).toHaveBeenCalledWith(ed, []);
    expect(res).toEqual(['bad']);
  });
});

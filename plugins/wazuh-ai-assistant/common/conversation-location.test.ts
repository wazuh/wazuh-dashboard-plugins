import {
  CONVERSATION_ROUTE_PREFIX,
  LAST_CONVERSATION_STORAGE_KEY,
  NEW_CONVERSATION_ROUTE,
  buildConversationRoute,
  isConversationId,
  parseConversationRoute,
  readLastConversationId,
  writeLastConversationId,
} from './conversation-location';
import { KeyValueStorage } from './draft-stash';

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
}

/** A storage whose every operation throws, as a locked-down browser context does. */
function throwingStorage(): KeyValueStorage {
  const boom = () => {
    throw new Error('storage unavailable');
  };
  return {
    getItem: boom,
    setItem: boom,
    removeItem: boom,
    key: boom,
    get length(): number {
      return boom();
    },
  };
}

describe('isConversationId', () => {
  it('accepts a saved-object UUID', () => {
    expect(isConversationId('9f0c2c4e-1b3a-4f77-9d1e-2a5b6c7d8e9f')).toBe(true);
  });

  it('rejects path traversal, query strings and separators', () => {
    expect(isConversationId('../settings')).toBe(false);
    expect(isConversationId('abc?x=1')).toBe(false);
    expect(isConversationId('abc/def')).toBe(false);
    expect(isConversationId('')).toBe(false);
  });

  it('rejects an id longer than a saved-object id can be', () => {
    expect(isConversationId('a'.repeat(129))).toBe(false);
  });
});

describe('parseConversationRoute', () => {
  it('reads the id out of a conversation route', () => {
    expect(parseConversationRoute(`${CONVERSATION_ROUTE_PREFIX}conv-1`)).toBe(
      'conv-1',
    );
  });

  it('decodes a percent-encoded id', () => {
    expect(parseConversationRoute(`${CONVERSATION_ROUTE_PREFIX}conv%2D1`)).toBe(
      'conv-1',
    );
  });

  it('returns null for a hash that addresses no conversation', () => {
    expect(parseConversationRoute('')).toBeNull();
    expect(parseConversationRoute(NEW_CONVERSATION_ROUTE)).toBeNull();
    expect(parseConversationRoute('#/settings')).toBeNull();
  });

  it('returns null instead of throwing on a malformed encoding', () => {
    expect(parseConversationRoute(`${CONVERSATION_ROUTE_PREFIX}%E0%A4%A`)).toBe(
      null,
    );
  });

  it('returns null for an id that is not a usable saved-object id', () => {
    expect(
      parseConversationRoute(`${CONVERSATION_ROUTE_PREFIX}..%2Fsettings`),
    ).toBeNull();
  });
});

describe('buildConversationRoute', () => {
  it('round-trips with parseConversationRoute', () => {
    const route = buildConversationRoute('conv-1');
    expect(parseConversationRoute(route)).toBe('conv-1');
  });

  it('builds the new-conversation route for null', () => {
    expect(buildConversationRoute(null)).toBe(NEW_CONVERSATION_ROUTE);
    expect(parseConversationRoute(buildConversationRoute(null))).toBeNull();
  });
});

describe('last-conversation storage', () => {
  it('round-trips an id', () => {
    const storage = fakeStorage();
    writeLastConversationId(storage, 'conv-1');
    expect(storage.getItem(LAST_CONVERSATION_STORAGE_KEY)).toBe('conv-1');
    expect(readLastConversationId(storage)).toBe('conv-1');
  });

  it('forgets the id when written as null', () => {
    const storage = fakeStorage({
      [LAST_CONVERSATION_STORAGE_KEY]: 'conv-1',
    });
    writeLastConversationId(storage, null);
    expect(readLastConversationId(storage)).toBeNull();
  });

  it('ignores a stored value that is not a usable id', () => {
    const storage = fakeStorage({
      [LAST_CONVERSATION_STORAGE_KEY]: '../settings',
    });
    expect(readLastConversationId(storage)).toBeNull();
  });

  it('never throws when storage itself is unavailable', () => {
    const storage = throwingStorage();
    expect(readLastConversationId(storage)).toBeNull();
    expect(() => writeLastConversationId(storage, 'conv-1')).not.toThrow();
    expect(() => writeLastConversationId(storage, null)).not.toThrow();
  });
});

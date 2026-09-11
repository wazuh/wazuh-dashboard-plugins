import {
  DESCRIPTION_TRUNCATE_LENGTH,
  truncateDescription,
} from './truncate-description';

describe('truncateDescription', () => {
  it('leaves a description at or under the limit untouched', () => {
    const description = 'a'.repeat(DESCRIPTION_TRUNCATE_LENGTH);

    expect(truncateDescription(description)).toBe(description);
  });

  it('cuts a longer description to the limit and marks it with an ellipsis', () => {
    const description = 'a'.repeat(DESCRIPTION_TRUNCATE_LENGTH + 20);

    const truncated = truncateDescription(description);

    expect(truncated).toBe(`${'a'.repeat(DESCRIPTION_TRUNCATE_LENGTH)}…`);
  });
});

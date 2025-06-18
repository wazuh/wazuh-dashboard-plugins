export const EditActionGroups = {
  ADD: 'add',
  REMOVE: 'remove',
} as const;

export type EditActionGroups =
  (typeof EditActionGroups)[keyof typeof EditActionGroups];

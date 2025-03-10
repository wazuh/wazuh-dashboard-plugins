export const EditActionGroups = {
  ADD: 'add',
  REMOVE: 'remove',
};

export type EditActionGroups =
  (typeof EditActionGroups)[keyof typeof EditActionGroups];

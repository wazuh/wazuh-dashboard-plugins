export type Rule = {
  id: number;
  name: string;
  rule: any;
  roles: number[];
};

export type UpdateRule = {
  name: string;
  rule: any;
};

export type CreateRule = UpdateRule;

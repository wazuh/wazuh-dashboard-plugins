export const OPERATOR_COMPARE = {
  EQUALITY: '=',
  NOT_EQUALITY: '!=',
  BIGGER: '>',
  SMALLER: '<',
  LIKE_AS: '~',
} as const;
export type OperatorCompare =
  (typeof OPERATOR_COMPARE)[keyof typeof OPERATOR_COMPARE];

export const OPERATOR_GROUP = {
  OPEN: '(',
  CLOSE: ')',
} as const;

export type OperatorGroup =
  (typeof OPERATOR_GROUP)[keyof typeof OPERATOR_GROUP];

export const CONJUNCTION = {
  AND: ';',
  OR: ',',
} as const;

export type Conjunction = (typeof CONJUNCTION)[keyof typeof CONJUNCTION];

export const GROUP_OPERATOR_BOUNDARY = {
  OPEN: 'operator_group_open',
  CLOSE: 'operator_group_close',
};

export const ICON_TYPE = {
  KQL_FIELD: 'kqlField',
  KQL_OPERAND: 'kqlOperand',
  KQL_VALUE: 'kqlValue',
  KQL_SELECTOR: 'kqlSelector',
  TOKEN_DENSE_VECTOR: 'tokenDenseVector',
  SEARCH: 'search',
  ALERT: 'alert',
} as const;

export type User = {
  id: number;
  username: string;
  roles: number[];
};

export type UpdateUser = {
  password?: string;
};

export type CreateUser = UpdateUser & {
  password: string;
  username: string;
};

export type User = {
  id: number;
  username: string;
  roles: number[];
  allow_run_as: boolean;
};

export type UpdateUser = {
  password?: string;
  allow_run_as: boolean;
};

export type CreateUser = UpdateUser & {
  password: string;
  username: string;
};

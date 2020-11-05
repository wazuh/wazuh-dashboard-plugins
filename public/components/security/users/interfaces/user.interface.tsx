export interface IUser {
  id: number,
  username: string;
  roles: Array<number>;
  allow_run_as: boolean;
}

export interface IUpdateUser {
  password: string;
  allow_run_as: boolean;
}

export interface ICreateUser extends IUpdateUser {
  username: string;  
}
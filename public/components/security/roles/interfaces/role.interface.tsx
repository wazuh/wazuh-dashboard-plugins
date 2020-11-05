export interface IRole {
  id: number,
  name: string;
  polices: Array<number>;  
  users: Array<number>;
  rules: Array<number>;
}
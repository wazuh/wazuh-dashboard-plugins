export interface WzToken {
  iss: string;
  aud: string;
  nbf: number;
  exp: number;
  sub: string;
  run_as: boolean;
  rbac_roles: number[];
  rbac_mode: string;
}

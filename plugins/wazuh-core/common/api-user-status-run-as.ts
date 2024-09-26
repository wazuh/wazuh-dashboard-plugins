export enum API_USER_STATUS_RUN_AS {
  UNABLE_TO_CHECK = -1 /* Initial value or could not check the user can
  use the run_as */,
  ALL_DISABLED = 0, // Wazuh HOST and USER API user configured with run_as=false or undefined
  USER_NOT_ALLOWED = 1, // Wazuh HOST API user configured with run_as=true in configuration but it has not run_as in Wazuh API
  HOST_DISABLED = 2, // Wazuh HOST API user configured with run_as=false in configuration but it has run_as in Wazuh API
  ENABLED = 3, // Wazuh API user configured with run_as=true and allow run_as
}

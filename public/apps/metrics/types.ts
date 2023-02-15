import { EuiComboBoxOptionOption } from '@elastic/eui';
import { NavigationPublicPluginStart } from '../../../../../src/plugins/navigation/public';
import { DashboardStart } from '../../../../../src/plugins/dashboard/public';
import { DataPublicPluginStart } from '../../../../../src/plugins/data/public';
import { AppMountParameters, CoreStart } from '../../../../../src/core/public';
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OpendistroSecurityPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OpendistroSecurityPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  dashboard: DashboardStart;
  data: DataPublicPluginStart;
}

export interface AppDependencies {
  coreStart: CoreStart;
  params: AppMountParameters;
}

export interface BreadcrumbsPageDependencies extends AppDependencies {
  buildBreadcrumbs: (pageTitle: string, subAction?: string) => void;
}

export interface AuthInfo {
  user_name: string;
  tenants: {
    [tenant: string]: boolean;
  };
}

export interface ClientConfigType {
  readonly_mode: {
    roles: string[];
  };
  ui: {
    basicauth: {
      login: {
        title: string;
        subtitle: string;
        showbrandimage: boolean;
        brandimage: string;
        buttonstyle: string;
      };
    };
    autologout: boolean;
    backend_configurable: boolean;
  };
  multitenancy: {
    enabled: boolean;
    tenants: {
      enable_private: boolean;
      enable_global: boolean;
    };
  };
  auth: {
    type: string;
    logout_url: string;
  };
  clusterPermissions: {
    include: string[];
  };
  indexPermissions: {
    include: string[];
  };
  disabledTransportCategories: {
    exclude: string[];
  };
  disabledRestCategories: {
    exclude: string[];
  };
}

export type ComboBoxOptions = EuiComboBoxOptionOption[];

export type FieldLevelSecurityMethod = 'exclude' | 'include';

export enum ResourceType {
  roles = 'roles',
  users = 'users',
  permissions = 'permissions',
  tenants = 'tenants',
  auth = 'auth',
  auditLogging = 'auditLogging',
}

export enum Action {
  view = 'view',
  create = 'create',
  edit = 'edit',
  duplicate = 'duplicate',
}

export enum SubAction {
  mapuser = 'mapuser',
}

export enum PageId {
  dashboardId = 'dashboards',
  visualizationId = 'visualize',
}

export enum TenantPermissionType {
  None = '',
  Read = 'Read only',
  ReadWrite = 'Read and Write',
}

export interface RouteItem {
  name: string;
  href: string;
}

export interface DataObject<T> {
  [key: string]: T;
}

export interface ObjectsMessage<T> {
  total: number;
  data: DataObject<T>;
}

export interface RoleIndexPermission {
  index_patterns: string[];
  dls: string;
  fls: string[];
  masked_fields: string[];
  allowed_actions: string[];
}

export interface RoleIndexPermissionView extends RoleIndexPermission {
  id: number;
}

export interface RoleTenantPatterns {
  tenant_patterns: string[];
}

export interface RoleTenantPermission extends RoleTenantPatterns {
  allowed_actions: string[];
}

export interface RoleTenantPermissionView extends RoleTenantPatterns {
  permissionType: string;
}

export interface RoleUpdate {
  cluster_permissions: string[];
  index_permissions: RoleIndexPermission[];
  tenant_permissions: RoleTenantPermission[];
}

export interface RoleDetail extends RoleUpdate {
  reserved: boolean;
}

export interface RoleMappingDetail {
  backend_roles: string[];
  hosts: string[];
  users: string[];
}

export interface TenantUpdate {
  description: string;
}

export interface TenantName {
  tenant: string;
}

export interface Tenant extends TenantUpdate, TenantName {
  reserved: boolean;
  tenantValue: string;
}

export interface TenantSelect extends TenantName {
  username: string;
}

export interface RoleTenantPermissionDetail extends RoleTenantPermissionView, Tenant {}

export interface UserAttributes {
  [key: string]: string;
}

export interface InternalUser {
  attributes: UserAttributes;
  backend_roles: string[];
}

export interface InternalUserUpdate extends InternalUser {
  password: string;
}

export interface ActionGroupUpdate {
  allowed_actions: string[];
}

export interface ActionGroupItem extends ActionGroupUpdate {
  reserved: boolean;
  type: 'cluster' | 'index' | 'all' | 'kibana' | undefined;
}

export interface ExpandedRowMapInterface {
  [key: string]: React.ReactNode;
}

export interface FormRowDeps {
  headerText: string;
  optional?: boolean;
  headerSubText?: string;
  helpLink?: string;
  helpText?: string;
}

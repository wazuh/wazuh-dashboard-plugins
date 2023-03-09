#
# Copyright 2021 Splunk Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""Splunk user access control related utilities."""

import json
from typing import List, Optional

from splunklib import binding

from solnlib import _utils
from solnlib import splunk_rest_client as rest_client
from solnlib import utils

__all__ = [
    "ObjectACLException",
    "ObjectACL",
    "ObjectACLManagerException",
    "ObjectACLManager",
    "AppCapabilityManagerException",
    "AppCapabilityManager",
    "UserAccessException",
    "check_user_access",
    "InvalidSessionKeyException",
    "get_current_username",
    "UserNotExistException",
    "get_user_capabilities",
    "user_is_capable",
    "get_user_roles",
]


class ObjectACLException(Exception):
    pass


class ObjectACL:
    """Object ACL record.

    Examples:
       >>> from solnlib import user_access
       >>> obj_acl = user_access.ObjectACL(
       >>>    'test_collection',
       >>>    '9defa6f510d711e6be16a45e60e34295',
       >>>    'test_object',
       >>>    'Splunk_TA_test',
       >>>    'admin',
       >>>    {'read': ['*'], 'write': ['admin'], 'delete': ['admin']},
       >>>    False)
    """

    OBJ_COLLECTION_KEY = "obj_collection"
    OBJ_ID_KEY = "obj_id"
    OBJ_TYPE_KEY = "obj_type"
    OBJ_APP_KEY = "obj_app"
    OBJ_OWNER_KEY = "obj_owner"
    OBJ_PERMS_KEY = "obj_perms"
    OBJ_PERMS_READ_KEY = "read"
    OBJ_PERMS_WRITE_KEY = "write"
    OBJ_PERMS_DELETE_KEY = "delete"
    OBJ_PERMS_ALLOW_ALL = "*"
    OBJ_SHARED_BY_INCLUSION_KEY = "obj_shared_by_inclusion"

    def __init__(
        self,
        obj_collection: str,
        obj_id: str,
        obj_type: str,
        obj_app: str,
        obj_owner: str,
        obj_perms: dict,
        obj_shared_by_inclusion: bool,
    ):
        """Initializes ObjectACL.

        Arguments:
            obj_collection: Collection where object currently stored.
            obj_id: ID of this object.
            obj_type: Type of this object.
            obj_app: App of this object.
            obj_owner: Owner of this object.
            obj_perms: Object perms, like: {'read': ['*'], 'write': ['admin'], 'delete': ['admin']}.
            obj_shared_by_inclusion: Flag of object is shared by inclusion.
        """
        self.obj_collection = obj_collection
        self.obj_id = obj_id
        self.obj_type = obj_type
        self.obj_app = obj_app
        self.obj_owner = obj_owner
        self._check_perms(obj_perms)
        self._obj_perms = obj_perms
        self.obj_shared_by_inclusion = obj_shared_by_inclusion

    @classmethod
    def _check_perms(cls, obj_perms):
        if not isinstance(obj_perms, dict):
            raise ObjectACLException(
                "Invalid object acl perms type: %s, should be a dict." % type(obj_perms)
            )

        if not (
            cls.OBJ_PERMS_READ_KEY in obj_perms
            and cls.OBJ_PERMS_WRITE_KEY in obj_perms
            and cls.OBJ_PERMS_DELETE_KEY in obj_perms
        ):
            raise ObjectACLException(
                "Invalid object acl perms: %s, "
                "should include read, write and delete perms." % obj_perms
            )

    @property
    def obj_perms(self):
        return self._obj_perms

    @obj_perms.setter
    def obj_perms(self, obj_perms):
        self._check_perms(obj_perms)
        self._obj_perms = obj_perms

    @property
    def record(self) -> dict:
        """Get object acl record.

        Returns: Object acl record, like:

            {
                '_key': 'test_collection-1234',
                'obj_collection': 'test_collection',
                'obj_id': '1234',
                'obj_type': 'test_object',
                'obj_app': 'Splunk_TA_test',
                'obj_owner': 'admin',
                'obj_perms': {'read': ['*'], 'write': ['admin'], 'delete': ['admin']},
                'obj_shared_by_inclusion': True
            }
        """

        return {
            "_key": self.generate_key(self.obj_collection, self.obj_id),
            self.OBJ_COLLECTION_KEY: self.obj_collection,
            self.OBJ_ID_KEY: self.obj_id,
            self.OBJ_TYPE_KEY: self.obj_type,
            self.OBJ_APP_KEY: self.obj_app,
            self.OBJ_OWNER_KEY: self.obj_owner,
            self.OBJ_PERMS_KEY: self._obj_perms,
            self.OBJ_SHARED_BY_INCLUSION_KEY: self.obj_shared_by_inclusion,
        }

    @staticmethod
    def generate_key(obj_collection: str, obj_id: str) -> str:
        """Generate object acl record key.

        Arguments:
            obj_collection: Collection where object currently stored.
            obj_id: ID of this object.

        Returns:
            Object acl record key.
        """

        return "{obj_collection}_{obj_id}".format(
            obj_collection=obj_collection, obj_id=obj_id
        )

    @staticmethod
    def parse(obj_acl_record: dict) -> "ObjectACL":
        """Parse object acl record and construct a new `ObjectACL` object from
        it.

        Arguments:
            obj_acl_record: Object acl record.

        Returns:
            New `ObjectACL` object.
        """

        return ObjectACL(
            obj_acl_record[ObjectACL.OBJ_COLLECTION_KEY],
            obj_acl_record[ObjectACL.OBJ_ID_KEY],
            obj_acl_record[ObjectACL.OBJ_TYPE_KEY],
            obj_acl_record[ObjectACL.OBJ_APP_KEY],
            obj_acl_record[ObjectACL.OBJ_OWNER_KEY],
            obj_acl_record[ObjectACL.OBJ_PERMS_KEY],
            obj_acl_record[ObjectACL.OBJ_SHARED_BY_INCLUSION_KEY],
        )

    def merge(self, obj_acl: "ObjectACL"):
        """Merge current object perms with perms of `obj_acl`.

        Arguments:
            obj_acl: Object acl to merge.
        """

        for perm_key in self._obj_perms:
            self._obj_perms[perm_key] = list(
                set.union(
                    set(self._obj_perms[perm_key]), set(obj_acl._obj_perms[perm_key])
                )
            )
            if self.OBJ_PERMS_ALLOW_ALL in self._obj_perms[perm_key]:
                self._obj_perms[perm_key] = [self.OBJ_PERMS_ALLOW_ALL]

    def __str__(self):
        return json.dumps(self.record)


class ObjectACLManagerException(Exception):
    """Exception for ObjectACLManager."""

    pass


class ObjectACLNotExistException(Exception):
    """Exception for the situation when ACL does not exist."""

    pass


class ObjectACLManager:
    """Object ACL manager.

    Examples:
       >>> from solnlib import user_access
       >>> oaclm = user_access.ObjectACLManager(session_key,
                                                'Splunk_TA_test')
    """

    def __init__(
        self,
        collection_name: str,
        session_key: str,
        app: str,
        owner: Optional[str] = "nobody",
        scheme: Optional[str] = None,
        host: Optional[str] = None,
        port: Optional[int] = None,
        **context: dict,
    ):
        """Initializes ObjectACLManager.

        Arguments:
            collection_name: Collection name to store object ACL info.
            session_key: Splunk access token.
            app: App name of namespace.
            owner: (optional) Owner of namespace, default is `nobody`.
            scheme: (optional) The access scheme, default is None.
            host: (optional) The host name, default is None.
            port: (optional) The port number, default is None.
            context: Other configurations for Splunk rest client.

        Raises:
            ObjectACLManagerException: If init ObjectACLManager failed.
        """
        collection_name = "{app}_{collection_name}".format(
            app=app, collection_name=collection_name
        )
        try:
            self._collection_data = _utils.get_collection_data(
                collection_name,
                session_key,
                app,
                owner,
                scheme,
                host,
                port,
                None,
                **context,
            )
        except KeyError:
            raise ObjectACLManagerException(
                f"Get object acl collection: {collection_name} fail."
            )

    @utils.retry(exceptions=[binding.HTTPError])
    def update_acl(
        self,
        obj_collection: str,
        obj_id: str,
        obj_type: str,
        obj_app: str,
        obj_owner: str,
        obj_perms: dict,
        obj_shared_by_inclusion: bool = True,
        replace_existing: bool = True,
    ):
        """Update acl info of object.

        Construct a new object acl info first, if `replace_existing` is True
        then replace existing acl info else merge new object acl info with the
        old one and replace the old acl info with merged acl info.

        Arguments:
            obj_collection: Collection where object currently stored.
            obj_id: ID of this object.
            obj_type: Type of this object.
            obj_app: App of this object.
            obj_owner: Owner of this object.
            obj_perms: Object perms, like:

                {
                    'read': ['*'],
                    'write': ['admin'],
                    'delete': ['admin']
                }.
            obj_shared_by_inclusion: (optional) Flag of object is shared by
                inclusion, default is True.
            replace_existing: (optional) Replace existing acl info flag, True
                indicates replace old acl info with new one else merge with old
                acl info, default is True.
        """

        obj_acl = ObjectACL(
            obj_collection,
            obj_id,
            obj_type,
            obj_app,
            obj_owner,
            obj_perms,
            obj_shared_by_inclusion,
        )

        if not replace_existing:
            try:
                old_obj_acl = self.get_acl(obj_collection, obj_id)
            except ObjectACLNotExistException:
                old_obj_acl = None

            if old_obj_acl:
                obj_acl.merge(old_obj_acl)

        self._collection_data.batch_save(obj_acl.record)

    @utils.retry(exceptions=[binding.HTTPError])
    def update_acls(
        self,
        obj_collection: str,
        obj_ids: List[str],
        obj_type: str,
        obj_app: str,
        obj_owner: str,
        obj_perms: dict,
        obj_shared_by_inclusion: bool = True,
        replace_existing: bool = True,
    ):
        """Batch update object acl info to all provided `obj_ids`.

        Arguments:
            obj_collection: Collection where objects currently stored.
            obj_ids: IDs list of objects.
            obj_type: Type of this object.
            obj_app: App of this object.
            obj_owner: Owner of this object.
            obj_perms: Object perms, like:

                {
                    'read': ['*'],
                    'write': ['admin'],
                    'delete': ['admin']
                }.
            obj_shared_by_inclusion: (optional) Flag of object is shared by
                inclusion, default is True.
            replace_existing: (optional) Replace existing acl info flag, True
                indicates replace old acl info with new one else merge with old acl
                info, default is True.
        """

        obj_acl_records = []
        for obj_id in obj_ids:
            obj_acl = ObjectACL(
                obj_collection,
                obj_id,
                obj_type,
                obj_app,
                obj_owner,
                obj_perms,
                obj_shared_by_inclusion,
            )

            if not replace_existing:
                try:
                    old_obj_acl = self.get_acl(obj_collection, obj_id)
                except ObjectACLNotExistException:
                    old_obj_acl = None

                if old_obj_acl:
                    obj_acl.merge(old_obj_acl)

            obj_acl_records.append(obj_acl.record)

        self._collection_data.batch_save(*obj_acl_records)

    @utils.retry(exceptions=[binding.HTTPError])
    def get_acl(self, obj_collection: str, obj_id: str) -> "ObjectACL":
        """Get acl info.

        Query object acl info with parameter of the combination of
        `obj_collection` and `obj_id` from `self.collection_name` and
        return it.

        Arguments:
            obj_collection: Collection where object currently stored.
            obj_id: ID of this object.

        Returns:
            Object acl info if success else None.

        Raises:
            ObjectACLNotExistException: If object ACL info does not exist.
        """

        key = ObjectACL.generate_key(obj_collection, obj_id)
        try:
            obj_acl = self._collection_data.query_by_id(key)
        except binding.HTTPError as e:
            if e.status != 404:
                raise

            raise ObjectACLNotExistException(
                "Object ACL info of {}_{} does not exist.".format(
                    obj_collection, obj_id
                )
            )

        return ObjectACL.parse(obj_acl)

    @utils.retry(exceptions=[binding.HTTPError])
    def get_acls(self, obj_collection: str, obj_ids: List[str]) -> List[ObjectACL]:
        """Batch get acl info.

        Query objects acl info with parameter of the combination of
        `obj_collection` and `obj_ids` from KVStore and return them.

        Arguments:
            obj_collection: Collection where object currently stored.
            obj_ids: IDs of objects.

        Returns:
            List of `ObjectACL` instances.
        """

        query = json.dumps(
            {
                "$or": [
                    {"_key": ObjectACL.generate_key(obj_collection, obj_id)}
                    for obj_id in obj_ids
                ]
            }
        )
        obj_acls = self._collection_data.query(query=query)

        return [ObjectACL.parse(obj_acl) for obj_acl in obj_acls]

    @utils.retry(exceptions=[binding.HTTPError])
    def delete_acl(self, obj_collection: str, obj_id: str):
        """Delete acl info.

        Query object acl info with parameter of the combination of
        `obj_collection` and `obj_ids` from KVStore and delete it.

        Arguments:
            obj_collection: Collection where object currently stored.
            obj_id: ID of this object.

        Raises:
            ObjectACLNotExistException: If object ACL info does not exist.
        """

        key = ObjectACL.generate_key(obj_collection, obj_id)
        try:
            self._collection_data.delete_by_id(key)
        except binding.HTTPError as e:
            if e.status != 404:
                raise

            raise ObjectACLNotExistException(
                "Object ACL info of {}_{} does not exist.".format(
                    obj_collection, obj_id
                )
            )

    @utils.retry(exceptions=[binding.HTTPError])
    def delete_acls(self, obj_collection: str, obj_ids: List[str]):
        """Batch delete acl info.

        Query objects acl info with parameter of the combination of
        `obj_collection` and `obj_ids` from KVStore and delete them.

        Arguments:
            obj_collection: Collection where object currently stored.
            obj_ids: IDs of objects.
        """

        query = json.dumps(
            {
                "$or": [
                    {"_key": ObjectACL.generate_key(obj_collection, obj_id)}
                    for obj_id in obj_ids
                ]
            }
        )
        self._collection_data.delete(query=query)

    @utils.retry(exceptions=[binding.HTTPError])
    def get_accessible_object_ids(
        self, user: str, operation: str, obj_collection: str, obj_ids: List[str]
    ) -> List[str]:
        """Get accessible IDs of objects from `obj_acls`.

        Arguments:
            user: User name of current `operation`.
            operation: User operation, possible option: (read/write/delete).
            obj_collection: Collection where object currently stored.
            obj_ids: IDs of objects.

        Returns:
            List of IDs of accessible objects.
        """

        obj_acls = self.get_acls(obj_collection, obj_ids)
        accessible_obj_ids = []
        for obj_acl in obj_acls:
            perms = obj_acl.obj_perms[operation]
            if ObjectACL.OBJ_PERMS_ALLOW_ALL in perms or user in perms:
                accessible_obj_ids.append(obj_acl.obj_id)

        return accessible_obj_ids


class AppCapabilityManagerException(Exception):
    """Exception for AppCapabilityManager."""

    pass


class AppCapabilityNotExistException(Exception):
    """Exception for the situation when AppCapability does not exist for a
    specific app."""

    pass


class AppCapabilityManager:
    """App capability manager.

    Examples:
       >>> from solnlib import user_access
       >>> acm = user_access.AppCapabilityManager('test_collection',
                                                  session_key,
                                                  'Splunk_TA_test')
       >>> acm.register_capabilities(...)
       >>> acm.unregister_capabilities(...)
    """

    def __init__(
        self,
        collection_name: str,
        session_key: str,
        app: str,
        owner: str = "nobody",
        scheme: str = None,
        host: str = None,
        port: int = None,
        **context: dict,
    ):
        """Initializes AppCapabilityManager.

        Arguments:
            collection_name: Collection name to store capabilities.
            session_key: Splunk access token.
            app: App name of namespace.
            owner: (optional) Owner of namespace, default is `nobody`.
            scheme: (optional) The access scheme, default is None.
            host: (optional) The host name, default is None.
            port: (optional) The port number, default is None.
            context: Other configurations for Splunk rest client.

        Raises:
            AppCapabilityManagerException: If init AppCapabilityManager failed.
        """
        self._app = app

        collection_name = f"{app}_{collection_name}"
        try:
            self._collection_data = _utils.get_collection_data(
                collection_name,
                session_key,
                app,
                owner,
                scheme,
                host,
                port,
                None,
                **context,
            )
        except KeyError:
            raise AppCapabilityManagerException(
                f"Get app capabilities collection: {collection_name} failed."
            )

    @utils.retry(exceptions=[binding.HTTPError])
    def register_capabilities(self, capabilities: dict):
        """Register app capabilities.

        Arguments:
            capabilities: App capabilities, example:

                {
                    'object_type1': {
                        'read': 'read_app_object_type1',
                        'write': 'write_app_object_type1',
                        'delete': 'delete_app_object_type1'},
                        'object_type2': {
                        'read': 'read_app_object_type2',
                        'write': 'write_app_object_type2',
                        'delete': 'delete_app_object_type2'
                    },
                    ...
                }
        """

        record = {"_key": self._app, "capabilities": capabilities}
        self._collection_data.batch_save(record)

    @utils.retry(exceptions=[binding.HTTPError])
    def unregister_capabilities(self):
        """Unregister app capabilities.

        Raises:
            AppCapabilityNotExistException: If app capabilities are not registered.
        """

        try:
            self._collection_data.delete_by_id(self._app)
        except binding.HTTPError as e:
            if e.status != 404:
                raise

            raise AppCapabilityNotExistException(
                "App capabilities for %s have not been registered." % self._app
            )

    @utils.retry(exceptions=[binding.HTTPError])
    def capabilities_are_registered(self) -> bool:
        """Check if app capabilities are registered.

        Returns:
            True if app capabilities are registered else False.
        """

        try:
            self._collection_data.query_by_id(self._app)
        except binding.HTTPError as e:
            if e.status != 404:
                raise

            return False

        return True

    @utils.retry(exceptions=[binding.HTTPError])
    def get_capabilities(self) -> dict:
        """Get app capabilities.

        Returns:
            App capabilities.

        Raises:
             AppCapabilityNotExistException: If app capabilities are not registered.
        """

        try:
            record = self._collection_data.query_by_id(self._app)
        except binding.HTTPError as e:
            if e.status != 404:
                raise

            raise AppCapabilityNotExistException(
                "App capabilities for %s have not been registered." % self._app
            )

        return record["capabilities"]


class UserAccessException(Exception):
    """Exception for the situation when there is user access exception."""

    pass


def check_user_access(
    session_key: str,
    capabilities: dict,
    obj_type: str,
    operation: str,
    scheme: str = None,
    host: str = None,
    port: int = None,
    **context: dict,
):
    """User access checker.

    It will fetch user capabilities from given `session_key` and check if
    the capability extracted from `capabilities`, `obj_type` and `operation`
    is contained, if user capabilities include the extracted capability user
    access is ok else fail.

    Arguments:
        session_key: Splunk access token.
        capabilities: App capabilities, example:

            {
                'object_type1': {
                    'read': 'read_app_object_type1',
                    'write': 'write_app_object_type1',
                    'delete': 'delete_app_object_type1'},
                    'object_type2': {
                    'read': 'read_app_object_type2',
                    'write': 'write_app_object_type2',
                    'delete': 'delete_app_object_type2'
                },
                ...
            }
        obj_type: Object type.
        operation: User operation, possible option: (read/write/delete).
        scheme: (optional) The access scheme, default is None.
        host: (optional) The host name, default is None.
        port: (optional) The port number, default is None.
        context: Other configurations for Splunk rest client.

    Raises:
        UserAccessException: If user access permission is denied.

    Examples:
       >>> from solnlib.user_access import check_user_access
       >>> def fun():
       >>>     check_user_access(
       >>>         session_key, capabilities, 'test_object', 'read')
       >>>     ...
    """

    username = get_current_username(
        session_key, scheme=scheme, host=host, port=port, **context
    )
    capability = capabilities[obj_type][operation]
    if not user_is_capable(
        session_key,
        username,
        capability,
        scheme=scheme,
        host=host,
        port=port,
        **context,
    ):
        raise UserAccessException(
            "Permission denied, %s does not have the capability: %s."
            % (username, capability)
        )


class InvalidSessionKeyException(Exception):
    """Exception when Splunk session key is invalid."""

    pass


@utils.retry(exceptions=[binding.HTTPError])
def get_current_username(
    session_key: str,
    scheme: str = None,
    host: str = None,
    port: int = None,
    **context: dict,
) -> str:
    """Get current user name from `session_key`.

    Arguments:
        session_key: Splunk access token.
        scheme: (optional) The access scheme, default is None.
        host: (optional) The host name, default is None.
        port: (optional) The port number, default is None.
        context: Other configurations for Splunk rest client.

    Returns:
        Current user name.

    Raises:
        InvalidSessionKeyException: If `session_key` is invalid.

    Examples:
       >>> from solnlib import user_access
       >>> user_name = user_access.get_current_username(session_key)
    """

    _rest_client = rest_client.SplunkRestClient(
        session_key, "-", scheme=scheme, host=host, port=port, **context
    )
    try:
        response = _rest_client.get(
            "/services/authentication/current-context", output_mode="json"
        ).body.read()
    except binding.HTTPError as e:
        if e.status != 401:
            raise

        raise InvalidSessionKeyException("Invalid session key.")

    return json.loads(response)["entry"][0]["content"]["username"]


class UserNotExistException(Exception):
    """Exception when user does not exist."""

    pass


@utils.retry(exceptions=[binding.HTTPError])
def get_user_capabilities(
    session_key: str,
    username: str,
    scheme: str = None,
    host: str = None,
    port: int = None,
    **context: dict,
) -> List[dict]:
    """Get user capabilities.

    Arguments:
        session_key: Splunk access token.
        scheme: (optional) The access scheme, default is None.
        host: (optional) The host name, default is None.
        port: (optional) The port number, default is None.
        context: Other configurations for Splunk rest client.

    Returns:
        User capabilities.

    Raises:
        UserNotExistException: If `username` does not exist.

    Examples:
       >>> from solnlib import user_access
       >>> user_capabilities = user_access.get_user_capabilities(
       >>>     session_key, 'test_user')
    """

    _rest_client = rest_client.SplunkRestClient(
        session_key, "-", scheme=scheme, host=host, port=port, **context
    )
    url = f"/services/authentication/users/{username}"
    try:
        response = _rest_client.get(url, output_mode="json").body.read()
    except binding.HTTPError as e:
        if e.status != 404:
            raise

        raise UserNotExistException("User: %s does not exist." % username)

    return json.loads(response)["entry"][0]["content"]["capabilities"]


def user_is_capable(
    session_key: str,
    username: str,
    capability: str,
    scheme: str = None,
    host: str = None,
    port: int = None,
    **context: dict,
) -> bool:
    """Check if user is capable for given `capability`.

    Arguments:
        session_key: Splunk access token.
        username: (optional) User name of roles to get.
        capability: The capability we wish to check for.
        scheme: (optional) The access scheme, default is None.
        host: (optional) The host name, default is None.
        port: (optional) The port number, default is None.
        context: Other configurations for Splunk rest client.

    Returns:
        True if user is capable else False.

    Raises:
        UserNotExistException: If `username` does not exist.

    Examples:
       >>> from solnlib import user_access
       >>> is_capable = user_access.user_is_capable(
       >>>     session_key, 'test_user', 'object_read_capability')
    """

    capabilities = get_user_capabilities(
        session_key, username, scheme=scheme, host=host, port=port, **context
    )
    return capability in capabilities


@utils.retry(exceptions=[binding.HTTPError])
def get_user_roles(
    session_key: str, username: str, scheme=None, host=None, port=None, **context
) -> List:
    """Get user roles.

    Arguments:
        session_key: Splunk access token.
        username: (optional) User name of roles to get.
        scheme: (optional) The access scheme, default is None.
        host: (optional) The host name, default is None.
        port: (optional) The port number, default is None.
        context: Other configurations for Splunk rest client.

    Returns:
        User roles.

    Raises:
        UserNotExistException: If `username` does not exist.

    Examples:
       >>> from solnlib import user_access
       >>> user_roles = user_access.get_user_roles(session_key, 'test_user')
    """

    _rest_client = rest_client.SplunkRestClient(
        session_key, "-", scheme=scheme, host=host, port=port, **context
    )
    url = f"/services/authentication/users/{username}"
    try:
        response = _rest_client.get(url, output_mode="json").body.read()
    except binding.HTTPError as e:
        if e.status != 404:
            raise

        raise UserNotExistException("User: %s does not exist." % username)

    return json.loads(response)["entry"][0]["content"]["roles"]

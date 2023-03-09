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

"""This module provides two kinds of checkpointer: KVStoreCheckpointer,
FileCheckpointer for modular input to save checkpoint."""

import base64
import json
import logging
import os
import os.path as op
import traceback
import warnings
from abc import ABCMeta, abstractmethod
from typing import Any, Dict, Iterable, Optional

from splunklib import binding

from solnlib import _utils, utils

__all__ = ["CheckpointerException", "KVStoreCheckpointer", "FileCheckpointer"]


class CheckpointerException(Exception):
    pass


class Checkpointer(metaclass=ABCMeta):
    """Base class of checkpointer."""

    @abstractmethod
    def update(self, key: str, state: Any):
        """Updates document with an id that equals to `key` and `state` as
        document data."""

    @abstractmethod
    def batch_update(self, states: Iterable[Dict[str, Any]]):
        """Updates multiple documents."""

    @abstractmethod
    def get(self, key: str) -> dict:
        """Gets document with an id that equals to `key`."""

    @abstractmethod
    def delete(self, key: str):
        """Deletes document with an id that equals to `key`."""


class KVStoreCheckpointer(Checkpointer):
    """KVStore checkpointer.

    Use KVStore to save modular input checkpoint.

    More information about KV Store in Splunk is
    [here](https://dev.splunk.com/enterprise/docs/developapps/manageknowledge/kvstore/aboutkvstorecollections).

    Examples:
        >>> from solnlib.modular_input import checkpointer
        >>> checkpoint = checkpointer.KVStoreCheckpointer(
                "unique_addon_checkpoints",
                "session_key",
                "unique_addon"
            )
        >>> checkpoint.update("input_1", {"timestamp": 1638043093})
        >>> checkpoint.get("input_1")
        >>> # returns {"timestamp": 1638043093}
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
        **context: Any,
    ):
        """Initializes KVStoreCheckpointer.

        Arguments:
            collection_name: Collection name of kvstore checkpointer.
            session_key: Splunk access token.
            app: App name of namespace.
            owner: (optional) Owner of namespace, default is `nobody`.
            scheme: (optional) The access scheme, default is None.
            host: (optional) The host name, default is None.
            port: (optional) The port number, default is None.
            context: Other configurations for Splunk rest client.

        Raises:
            binding.HTTPError: HTTP error different from 404, for example 503
                when KV Store is initializing and not ready to serve requests.
            CheckpointerException: If init KV Store checkpointer failed.
        """
        try:
            if not context.get("pool_connections"):
                context["pool_connections"] = 5
            if not context.get("pool_maxsize"):
                context["pool_maxsize"] = 5
            self._collection_data = _utils.get_collection_data(
                collection_name,
                session_key,
                app,
                owner,
                scheme,
                host,
                port,
                {"state": "string"},
                **context,
            )
        except KeyError:
            raise CheckpointerException("Get KV Store checkpointer failed.")

    @utils.retry(exceptions=[binding.HTTPError])
    def update(self, key: str, state: Any) -> None:
        """Updates document with an id that equals to `key` and `state` as
        document data.

        Arguments:
            key: `id` of the document to update.
            state: Document data to update. It can be integer, string,
                or a dict, or anything that can be an argument to `json.dumps`.

        Raises:
            binding.HTTPError: when an error occurred in Splunk, for example,
                when Splunk is restarting and KV Store is not yet initialized.
        """
        record = {"_key": key, "state": json.dumps(state)}
        self._collection_data.batch_save(record)

    @utils.retry(exceptions=[binding.HTTPError])
    def batch_update(self, states: Iterable[Dict[str, Any]]) -> None:
        """Updates multiple documents.

        Arguments:
            states: Iterable that contains documents to update. Document should
                be a dict with at least "state" key.

        Raises:
            binding.HTTPError: when an error occurred in Splunk, for example,
                when Splunk is restarting and KV Store is not yet initialized.
        """
        for state in states:
            state["state"] = json.dumps(state["state"])
        self._collection_data.batch_save(*states)

    @utils.retry(exceptions=[binding.HTTPError])
    def get(self, key: str) -> Optional[Any]:
        """Gets document with an id that equals to `key`.

        Arguments:
            key: `id` of the document to get.

        Raises:
            binding.HTTPError: When an error occurred in Splunk (not 404 code),
                can be 503 code, when Splunk is restarting and KV Store is not
                yet initialized.

        Returns:
            Document data under `key` or `None` in case of no data.
        """
        try:
            record = self._collection_data.query_by_id(key)
        except binding.HTTPError as e:
            if e.status != 404:
                logging.error(f"Get checkpoint failed: {traceback.format_exc()}.")
                raise
            return None
        return json.loads(record["state"])

    @utils.retry(exceptions=[binding.HTTPError])
    def delete(self, key: str) -> None:
        """Deletes document with an id that equals to `key`.

        Arguments:
            key: `id` of the document to delete.

        Raises:
            binding.HTTPError: When an error occurred in Splunk (not 404 code),
                can be 503 code, when Splunk is restarting and KV Store is not
                yet initialized.
        """
        try:
            self._collection_data.delete_by_id(key)
        except binding.HTTPError as e:
            if e.status != 404:
                logging.error(f"Delete checkpoint failed: {traceback.format_exc()}.")
                raise


class FileCheckpointer(Checkpointer):
    """File checkpointer.

    Use file to save modular input checkpoint.

    Examples:
        >>> from solnlib.modular_input import checkpointer
        >>> ck = checkpointer.FileCheckpointer('/opt/splunk/var/...')
        >>> ck.update(...)
        >>> ck.get(...)
    """

    def __init__(self, checkpoint_dir: str):
        """Initializes FileCheckpointer.

        Arguments:
            checkpoint_dir: Checkpoint directory.
        """
        warnings.warn(
            "FileCheckpointer is deprecated, please use KVStoreCheckpointer",
            stacklevel=2,
        )
        self._checkpoint_dir = checkpoint_dir

    def encode_key(self, key):
        return base64.b64encode(key.encode()).decode()

    def update(self, key, state):
        file_name = op.join(self._checkpoint_dir, self.encode_key(key))
        with open(file_name + "_new", "w") as fp:
            json.dump(state, fp)

        if op.exists(file_name):
            try:
                os.remove(file_name)
            except OSError:
                pass

        os.rename(file_name + "_new", file_name)

    def batch_update(self, states):
        for state in states:
            self.update(state["_key"], state["state"])

    def get(self, key):
        file_name = op.join(self._checkpoint_dir, self.encode_key(key))
        try:
            with open(file_name) as fp:
                return json.load(fp)
        except (OSError, ValueError):
            return None

    def delete(self, key):
        file_name = op.join(self._checkpoint_dir, self.encode_key(key))
        try:
            os.remove(file_name)
        except OSError:
            pass

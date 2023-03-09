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
"""This module provide utils that are private to solnlib."""

import re
from typing import Any, Dict, Optional, Union

from splunklib import binding, client

from solnlib import splunk_rest_client
from solnlib.utils import retry


@retry(exceptions=[binding.HTTPError])
def get_collection_data(
    collection_name: str,
    session_key: str,
    app: str,
    owner: Optional[str] = None,
    scheme: Optional[str] = None,
    host: Optional[str] = None,
    port: Optional[Union[str, int]] = None,
    fields: Optional[Dict] = None,
    **context: Any,
) -> client.KVStoreCollectionData:
    """Get collection data, if there is no such collection - creates one.

    Arguments:
        collection_name: Collection name of KV Store checkpointer.
        session_key: Splunk access token.
        app: App name of namespace.
        owner: Owner of namespace, default is `nobody`.
        scheme: The access scheme, default is None.
        host: The host name, default is None.
        port: The port number, default is None.
        fields: Fields used to initialize the collection if it's missing.
        context: Other configurations for Splunk rest client.

    Raises:
        binding.HTTPError: HTTP error different from 404, for example 503 when
            KV Store is initializing and not ready to serve requests.
        KeyError: KV Store did not get collection_name.

    Returns:
        KV Store collections data instance.
    """
    kvstore = splunk_rest_client.SplunkRestClient(
        session_key, app, owner=owner, scheme=scheme, host=host, port=port, **context
    ).kvstore

    collection_name = re.sub(r"[^\w]+", "_", collection_name)
    try:
        kvstore.get(name=collection_name)
    except binding.HTTPError as e:
        if e.status != 404:
            raise

        fields = fields if fields is not None else {}
        kvstore.create(collection_name, fields=fields)

    collections = kvstore.list(search=collection_name)
    for collection in collections:
        if collection.name == collection_name:
            return collection.data
    else:
        raise KeyError(f"Get collection data: {collection_name} failed.")

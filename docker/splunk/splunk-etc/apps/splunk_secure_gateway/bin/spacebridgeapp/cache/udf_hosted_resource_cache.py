from cachetools import Cache, TTLCache
from datetime import datetime, timedelta
from dateutil.tz import UTC
from dateutil.parser import isoparse


class UdfHostedResourceCache(TTLCache):
    def __init__(self, maxsize, ttl=timedelta(hours=1)):
        # default ttl of 1 hour but should get overwritten
        super(UdfHostedResourceCache, self).__init__(maxsize=maxsize, ttl=ttl, timer=lambda: datetime.now(UTC))

    def __setitem__(self, key, value, cache_setitem=Cache.__setitem__):
        super(UdfHostedResourceCache, self).__setitem__(key, value)
        # check that value contains a tuple with second param is a iso time code string
        if isinstance(value, tuple) and len(value) > 1:
            expires_at = isoparse(value[1])
            link = self._TTLCache__links.get(key, None)
            if link:
                link.expires = expires_at

    def expire(self, time=None):
        """
        Remove expired items from the cache.
        :param time:
        :return:
        """
        if time is None:
            time = self._TTLCache__timer()
        root = self._TTLCache__root
        curr = root.next
        links = self._TTLCache__links
        cache_delitem = Cache.__delitem__
        while curr is not root:
            next = curr.next
            if curr.expires < time:
                cache_delitem(self, curr.key)
                del links[curr.key]
                curr.unlink()
            curr = next

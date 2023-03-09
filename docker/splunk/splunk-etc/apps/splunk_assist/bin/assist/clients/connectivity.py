import logging
from http import HTTPStatus
from typing import Optional, Dict

import requests


class _ConnectivityCall:
    log: logging.Logger
    url: str
    session: requests.Session
    http_status: Optional[int]


    def __init__(self, log: logging.Logger, url: str, s: requests.Session):
        self.log = log
        self.url = url
        self.session = s

        self.http_status = None

    def __enter__(self):
        connected = False
        try:
            r = self.session.head(self.url)
            self.http_status = r.status_code
            self.log.info("Connectivity call result, url=%s, status_code=%s", self.url, r.status_code)

            # we're calling scs unauthorized
            connected = r.status_code in [HTTPStatus.UNAUTHORIZED, HTTPStatus.OK]
        except requests.exceptions.RequestException:
            pass

        return connected

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.log.warning("Connectivity call failed, http_status=%s, exc_type=%s", self.http_status, exc_type)
            return True



class ConnectivityClient:
    log: logging.Logger
    url: str
    s: requests.Session

    def __init__(self, log: logging.Logger, url: str, s: requests.Session):
        self.log = log
        self.url = url
        self.session = s

    def call(self):
        return _ConnectivityCall(self.log, self.url, self.session)



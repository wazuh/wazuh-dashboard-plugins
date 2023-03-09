import logging

import requests
from assist.serverinfo import load_proxy_settings

def requests_session(log: logging.Logger) -> requests.Session:
    proxy = load_proxy_settings(log)
    s = requests.Session()

    s.proxies = {'http': proxy.get('http_proxy'), 'https': proxy.get('https_proxy')}

    return s

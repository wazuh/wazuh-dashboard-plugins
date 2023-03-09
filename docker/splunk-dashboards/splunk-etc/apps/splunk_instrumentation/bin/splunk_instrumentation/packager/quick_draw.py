import requests
from splunk_instrumentation.constants import QUICKDRAW_URL, DEFAULT_QUICKDRAW


def get_quick_draw(qd_url=None, requests_transport_adapter=None):
    """A factory to get the quickdraw result.

    If not supplied with qd_url, it will grab QUICKDRAW_URL from constants.
    If not supplied with requests_transport_adapter, it will use the defaults
    provided by the Requests library.
    """
    if get_quick_draw.quick_draw_results:
        return get_quick_draw.quick_draw_results
    url = qd_url or QUICKDRAW_URL
    try:
        with requests.sessions.Session() as session:
            if requests_transport_adapter:
                session.adapters.clear()
                session.mount('http', requests_transport_adapter)
            # Make sure that we can't get stuck here by specifying a brief
            # timeout.
            # See SPL-141718 [Splunkweb Appserver may take a long time to
            # start due to SWA/splunk_instrumentation] for more details.
            response = session.get(url, timeout=10).json()
            get_quick_draw.quick_draw_results = response
    except Exception:
        return DEFAULT_QUICKDRAW
    return response


get_quick_draw.quick_draw_results = None

import sys
import json
import csv
import gzip
from collections import OrderedDict
from future.moves.urllib.request import urlopen, Request
from future.moves.urllib.error import HTTPError, URLError

def send_webhook_request(url, body, user_agent=None):
    if url is None:
        sys.stderr.write("ERROR No URL provided\n")
        return False
    sys.stderr.write("INFO Sending POST request to url=%s with size=%d bytes payload\n" % (url, len(body)))
    sys.stderr.write("DEBUG Body: %s\n" % body)
    try:
        if sys.version_info >= (3, 0) and type(body) == str:
            body = body.encode()
        req = Request(url, body, {"Content-Type": "application/json", "User-Agent": user_agent})
        res = urlopen(req)
        if 200 <= res.code < 300:
            sys.stderr.write("INFO Webhook receiver responded with HTTP status=%d\n" % res.code)
            return True
        else:
            sys.stderr.write("ERROR Webhook receiver responded with HTTP status=%d\n" % res.code)
            return False
    except HTTPError as e:
        sys.stderr.write("ERROR Error sending webhook request: %s\n" % e)
    except URLError as e:
        sys.stderr.write("ERROR Error sending webhook request: %s\n" % e)
    except ValueError as e:
        sys.stderr.write("ERROR Invalid URL: %s\n" % e)
    return False


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] != "--execute":
        sys.stderr.write("FATAL Unsupported execution mode (expected --execute flag)\n")
        sys.exit(1)
    try:
        settings = json.loads(sys.stdin.read())
        url = settings['configuration'].get('url')
        body = OrderedDict(
            sid=settings.get('sid'),
            search_name=settings.get('search_name'),
            app=settings.get('app'),
            owner=settings.get('owner'),
            results_link=settings.get('results_link'),
            result=settings.get('result')
        )
        user_agent = settings['configuration'].get('user_agent', 'Splunk')
        if not send_webhook_request(url, json.dumps(body), user_agent=user_agent):
            sys.exit(2)
    except Exception as e:
        sys.stderr.write("ERROR Unexpected error: %s\n" % e)
        sys.exit(3)

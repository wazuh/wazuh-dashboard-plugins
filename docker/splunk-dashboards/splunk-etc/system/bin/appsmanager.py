################################################################################
#                            Remote Application Management                     #
################################################################################

from contextlib import closing

import splunk
import splunk.bundle as bundle
import splunk.clilib.bundle_paths as bundle_paths
import splunk.clilib.cli_common as cli_common
import splunk.rest
import splunk.rest.format as format
import json
import logging as logger
import splunk.safe_lxml_etree as etree
import os
import sys
import platform

from future.moves.urllib.parse import urlencode, quote, unquote
from future.moves.urllib.error import HTTPError, URLError
from future.moves.urllib.request import urlopen, Request, URLopener


# overridden by settings in server.conf -> [applicationsManagement]
DEFAULT_URL = "https://apps.splunk.com/api/apps"
LOGIN_URL   = "https://apps.splunk.com/api/account:login/"
VETTED_APPS_URI = "/services/appsbrowser/v1/app/"
VETTED_APP_INSTALL_METHOD_SINGLE = "simple"
VETTED_APP_INSTALL_METHOD_DISTRIBUTED = "appmgmt_phase"
INSTANCE_TYPE_CLOUD = "cloud"

HTTP_ACTION         = "action"
HTTP_ACTION_INSTALL = "install"
HTTP_ACTION_DOWNLOAD = "download"

HTTP_GET_COUNT      = "count"
HTTP_GET_OFFSET     = "offset"
HTTP_GET_QUERY      = "q"
HTTP_GET_SORTBY     = "sort_by"
HTTP_GET_SORTDIR    = "sort_dir"

HTTP_AUTH_TOKEN     = "auth"
HTTP_AUTH_HEADER    = "X-Auth-Token"

PRODUCT_TYPE_LITE   = "lite"

# Gets sent to SplunkBase.
GET_ARG_PRODTYPE    = "product"

NSMAP = { 'a' : format.ATOM_NS,
          's' : format.SPLUNK_NS,
  'opensearch': format.OPENSEARCH_NS }

URLOPEN_TIMEOUT     = 15

def isCloud(sessionKey):
    """ Returns true if running on a cloud stack i.e instanceType == 'cloud' """
    server_conf = bundle.getConf('server', sessionKey)
    if ('instanceType' in server_conf['general'] and
            server_conf['general']['instanceType'] == INSTANCE_TYPE_CLOUD):
        return True
    return False


def getAppInstallMethod() -> str:
    server_config = cli_common.getConfStanza("server", "applicationsManagement")
    return server_config.get("filterAppInstallMethod", VETTED_APP_INSTALL_METHOD_SINGLE)


class RemoteAppsHandlerList(splunk.rest.BaseRestHandler):

    """
    Generate links to remote applications and categories.
    """

    def handle_GET(self):
        links = { }
        links["entries"] = "Remote Applications"
        links["categories"] = "Remote Application Categories"
        return links



class RemoteAppsSetup(splunk.rest.BaseRestHandler):

    """
    Prepare remote applications management based on configuration settings.
    """

    def __init__(self, method, requestInfo, responseInfo, sessionKey):
        splunk.rest.BaseRestHandler.__init__(self,
                                            method,
                                            requestInfo,
                                            responseInfo,
                                            sessionKey)
        # Default values
        self._allowRemote = True
        self._login = LOGIN_URL
        self._base = DEFAULT_URL
        self._agent = None
        self._platformInfo = None
        self._supportInProductInstall = True
        self._sslpol = bundle_paths.SSLPolicy()
        try:
            platform_info = platform.platform()
            os_name = platform.system()
            arch = platform.machine()
            py_ver = URLopener().version
            with open(os.path.join(bundle_paths.etc(), "splunk.version")) as f:
                for i in f:
                    if i.startswith("VERSION"):
                        version = i.split("=")[1].strip().strip('"')
                    elif i.startswith("BUILD"):
                        build = i.split("=")[1].strip()
            self._agent = "Splunkd/%s (%s; version=%s; arch=%s; build=%s; %s)" % (version, os_name, platform_info, arch, build, py_ver)
            self._platformInfo = {'version': version, 'platform': os_name}
        except Exception as e:
            logger.exception(e)
        # Manual overrides in server.conf
        try:
            conf = bundle.getConf("server", self.sessionKey)
            s = conf["applicationsManagement"]
            if not s.isDisabled():
                if "allowInternetAccess" in s:
                    self._allowRemote = bundle_paths.parse_boolean(s["allowInternetAccess"])
                if "loginUrl" in s:
                    self._login = s["loginUrl"]
                if "url" in s:
                    self._base = s["url"]
                if "useragent" in s:
                    self._agent = s["useragent"]
                if "caCertFile" in s:
                    self._sslpol._cafile = bundle_paths.expandvars(s["caCertFile"])
                if "sslCommonNameList" in s:
                    self._sslpol._sslCommonNameList = bundle_paths.expandvars(s["sslCommonNameList"])
                if "cipherSuite" in s:
                    self._sslpol._cipherSuite = bundle_paths.expandvars(s["cipherSuite"])
            s = conf["shclustering"]
            if not s.isDisabled():
                self._supportInProductInstall = False
        except Exception as e:
            logger.exception(e)
        logger.debug("applicationsManagement.allowInternetAccess = %s" % str(self._allowRemote))
        logger.debug("applicationsManagement.loginUrl = %s" % self._login)
        logger.debug("applicationsManagement.url = %s" % self._base)
        logger.debug("applicationsManagement.useragent = %s" % self._agent)
        logger.debug("applicationsManagement.supportInProductInstall = %s" % str(self._supportInProductInstall))
        if self._sslpol._cafile is None:
            logger.debug("applicationsManagement.caCertFile = %s" % str(self._sslpol._cafile))
        if self._sslpol._sslCommonNameList is None:
            logger.debug("applicationsManagement.sslCommonNameList = %s" % str(self._sslpol._sslCommonNameList))
        if self._sslpol._cipherSuite is None:
            logger.debug("applicationsManagement.cipherSuite = %s" % str(self._sslpol._cipherSuite))

    def verifyAllowRemote(self):
        if not self._allowRemote:
            raise splunk.RESTException(503, "Internet access is disabled")


class RemoteAppsLogin(RemoteAppsSetup):

    """
    Handle login to remote applications provider.
    """

    def handle_POST(self):
        self.verifyAllowRemote()
        try:
            post_args = urlencode(self.request["form"])
            if sys.version_info >= (3, 0): post_args = post_args.encode()
            logger.debug("Logging into %s" % self._login)
            bundle_paths.BundleInstaller().validate_server_cert(self._login, self._sslpol)
            # Forward post arguments, including username and password.
            with closing(urlopen(self._login, post_args, URLOPEN_TIMEOUT)) as f:
                root = etree.parse(f).getroot()
                token = root.xpath("a:id", namespaces=NSMAP)[0].text
                if self.request["output_mode"] == "json":
                    self.response.setHeader('content-type', 'application/json')
                    sessDict = {"response" : { "sessionKey" : token } }
                    self.response.write(json.dumps(sessDict))
                else:
                    # Generate response.
                    response = etree.Element("response")
                    sessionKey = etree.SubElement(response, "sessionKey")
                    sessionKey.text = token
                    self.response.setHeader('content-type', 'text/xml')
                    self.response.write(etree.tostring(response, pretty_print=True))
                logger.debug("Login successful")
        except HTTPError as e:
            if e.code in [401, 405]:
                # Returning 401 logs off current session
                # Splunkbase retuns 405 when only password is submitted
                raise splunk.RESTException(400, e.msg)
            raise splunk.RESTException(e.code, e.msg)
        except Exception as e:
            logger.exception(e)
            raise splunk.AuthenticationFailed



class RemoteAppsManager(RemoteAppsSetup):

    """
    Interact with remote applications provider.
    """

    # /services/apps/remote/ -> "base depth" of 3 URL parts
    BASE_DEPTH = 3

    def handle_GET(self):
        """
        Respond to an HTTP GET with information about remote applications.
        """
        self.verifyAllowRemote()
        try:
            url = self._native_to_foreign_url()
            get_args = {}
            # The Apps site returns specific apps for products such as "lite".
            # Choosing to be selective, as it may not respect all prod types...
            # (But startswith() so we match lite and litefree..)
            if self.getProductType().startswith(PRODUCT_TYPE_LITE):
                get_args[GET_ARG_PRODTYPE] = "lite"
            # Create a new ElementTree based on the root element of the remote
            # feed. This strips things like processing instructions and the XML
            # manifest.
            tree = etree.ElementTree(self._get_feed_root(url, extra_get_args=get_args))
            root = tree.getroot()
            self._transform_feed(root)
            for h in format.getAtomStyleNodes():
                root.addprevious(h)
            str = etree.tostring(tree,
                                xml_declaration=True,
                                encoding='UTF-8',
                                pretty_print=True)
            self.response.setHeader('content-type', 'text/xml')
            self.response.write(str.decode('UTF-8'))
        except Exception as e:
            if len(self.pathParts) == self.BASE_DEPTH:
                # If we're handling the base endpoint, suppress exceptions.
                # They probably aren't caused by user error here.
                logger.exception(e)
                # We can't get to the remote source, or it isn't providing
                # parseable XML back to us. Display no remote apps.
                return { }
            else:
                # Otherwise, allow exceptions to reach user, as they are likely
                # caused by a bad URL or application name.
                raise

    def handle_POST(self):
        """
        Install a remote application in response to an HTTP POST.
        """
        self.verifyAllowRemote()
        parts = len(self.pathParts)
        if parts == self.BASE_DEPTH + 2:
            default_version = True
        elif parts == self.BASE_DEPTH + 3:
            default_version = False
        else:
            raise splunk.BadRequest
        if HTTP_AUTH_TOKEN not in self.args:
            raise splunk.BadRequest("Missing argument: %s" % HTTP_AUTH_TOKEN)
        if HTTP_ACTION not in self.args:
            raise splunk.BadRequest("Missing argument: %s" % HTTP_ACTION)
        if self.args[HTTP_ACTION] not in (HTTP_ACTION_INSTALL, HTTP_ACTION_DOWNLOAD):
            raise splunk.BadRequest("Invalid value '%s' for argument '%s'" %
                                    (self.args[HTTP_ACTION], HTTP_ACTION))
        if isCloud(self.sessionKey):
            app_name = self.pathParts[self.BASE_DEPTH + 1]
            getargs = {'appid': app_name, 'offset': 0, 'limit': 1}
            try:
                # TODO:  pass `app_version` to Splunkbase
                app_version = self.pathParts[self.BASE_DEPTH + 2]
            except IndexError:
                app_version = ""
            logger.info("querying vetted app with args: %s" % getargs)

            serverResponse, serverContent = splunk.rest.simpleRequest(VETTED_APPS_URI, self.sessionKey, getargs, keepTrailingSlash=True)
            if serverResponse.status != 200:
                raise splunk.BadRequest('Error while querying Splunkbase. Splunkd returned %s' % serverContent)
            vetted_apps = json.loads(serverContent).get('results', [])
            if len(vetted_apps) == 0 or vetted_apps[0]['appid'] != app_name \
                    or not self._is_valid_install_method(vetted_apps[0]):
                raise splunk.BadRequest('App %s is not vetted for Splunk Cloud.' % app_name)

        url = self._native_to_foreign_url()
        root = self._get_feed_root(url)
        if default_version:
            root = self._get_latest_version(root)
        href = self._parse_link(root)

        try:
            # Package up a Request with auth information.
            req = Request(href)
            # XXX: Converting the auth token from a POST arg to a header
            # requires us to unquote() it. If the client did not correctly
            # quote() the token, login will fail.
            req.add_header(HTTP_AUTH_HEADER,
                           unquote(self.args[HTTP_AUTH_TOKEN]))
            # Install using this Request object.
            installer = bundle_paths.BundleInstaller()
            if self.args[HTTP_ACTION] == HTTP_ACTION_INSTALL:
                b, status = installer.install_from_url(req, sslpol=self._sslpol)
                self.response.setStatus(status)
                if ((status == bundle_paths.BundleInstaller.STATUS_INSTALLED) or
                    (status == bundle_paths.BundleInstaller.STATUS_UPGRADED)):
                    # Migrate old-style bundles.
                    logger.debug("Configuring application contents")
                    try:
                        b.migrate()
                    except Exception as e:
                        logger.exception(e)
                        self.addMessage("WARN", "Error during configuration: %s" % e)
                    # Redirect to local application.
                    self.response.setHeader("Location", self._redirect_to_local(b))
                    # Let splunkd know about newly-installed app.
                    logger.debug("Notifying splunkd that app has been installed")
                    splunk.rest.simpleRequest('apps/local/_reload', sessionKey=self.sessionKey)
                if status == bundle_paths.BundleInstaller.STATUS_INSTALLED:
                    self.addMessage("INFO", "Installed application: %s" % b.name())
                elif status == bundle_paths.BundleInstaller.STATUS_UPGRADED:
                    self.addMessage("INFO", "Upgraded application: %s" % b.name())
                else:
                    self.addMessage("WARN",
                                    "Could not install application: %s" % b.name())
            else:
                assert self.args[HTTP_ACTION] == HTTP_ACTION_DOWNLOAD
                downloaded = installer.download_from_url(req, sslpol=self._sslpol)
                self.addMessage("INFO", "Downloaded application file: %s" % downloaded)
                self.response.setHeader('content-type', 'application/json')
                response_json = {"downloaded": downloaded}
                self.response.write(json.dumps(response_json))

        except splunk.ResourceNotFound:
            raise
        except splunk.AuthorizationFailed:
            raise
        except splunk.InternalServerError:
            raise
        except Exception as e:
            logger.exception(e)
            raise splunk.InternalServerError(e)

    def _native_to_foreign_url(self):
        """
        Convert this endpoint's URL into a remote-provider URL.
        """
        url = self._base
        for part in self.pathParts[self.BASE_DEPTH:]:
            url += "/" + part
        return url

    def _foreign_to_native_url(self, url):
        """
        Convert a remote-provider URL into a URL pointing to this endpoint.
        """
        if not url.startswith(self._base):
            return url
        converted_base = splunk.mergeHostPath()
        for part in self.pathParts[:self.BASE_DEPTH]:
            converted_base += '/' + part
        return converted_base + url[len(self._base):]

    def _get_feed_root(self, url, extra_get_args={}):
        """
        Get an Atom feed of application information from the remote provider.
        """
        try:
            target_url = url
            # Forward GET arguments, and add user-agent.
            args_dict = {}
            headers = {}

            args_dict.update(self.request["query"])
            if (len(extra_get_args) > 0):
                args_dict.update(extra_get_args)
            if self._platformInfo:
                args_dict.update(self._platformInfo)
            args = urlencode(args_dict)
            if args != "":
                target_url += ("?" + args)
            logger.debug("Getting feed from: %s" % target_url)

            if self._agent:
                headers["User-Agent"] = self._agent

            bundle_paths.BundleInstaller().validate_server_cert(target_url, self._sslpol)
            req = Request(target_url, None, headers)
            f = urlopen(req, None, URLOPEN_TIMEOUT)
        except HTTPError as e:
            raise splunk.RESTException(e.code, e.msg)
        except URLError as e:
            logger.exception(e)
            raise splunk.RESTException(503, "Splunk is unable to connect to the Internet to find more apps.")
        except Exception as e:
            logger.exception(e)
            raise splunk.RESTException(404, "Resource not found")
        try:
            root = etree.parse(f).getroot()
            f.close()
            return root
        except Exception as e:
            raise splunk.InternalServerError(e)

    # XXX: This is very brittle. Assumptions:
    # - The local apps endpoint is named 'local'.
    # - If the remote apps endpoint is at: /services/apps/remote,
    #   then the local apps endpoint is at: /services/apps/local
    # - Local apps are located at /services/apps/local/<app_name>
    def _redirect_to_local(self, b):
        url = splunk.mergeHostPath()
        for part in self.pathParts[:(self.BASE_DEPTH - 1)]:
            url += '/' + part
        url += '/' + 'local'
        url += '/' + quote(b.prettyname())
        return url

    def _is_valid_install_method(self, vetted_app):
        """
        Validate install method based on server configuration
        """
        if getAppInstallMethod() == VETTED_APP_INSTALL_METHOD_DISTRIBUTED:
            return vetted_app['install_method_distributed'] == VETTED_APP_INSTALL_METHOD_DISTRIBUTED
        return vetted_app['install_method_single'] == VETTED_APP_INSTALL_METHOD_SINGLE

    def _transform_feed(self, xml):
        """
        Make an Atom feed from the remote provider look as though we generated
        it by rewriting certain URLs in the feed.
        """
        try:
            self._convert_remote_elements(xml)
            for entry in xml.xpath("//a:entry", namespaces=NSMAP):
                self._convert_remote_elements(entry)
        except Exception as e:
            logger.exception(e)
            raise splunk.InternalServerError(e)

    def _convert_remote_elements(self, root):
        """
        Make URLs that point to the remote provider point to us instead.
        """
        # Rewrite URL in ID.
        for id in root.xpath("a:id", namespaces=NSMAP):
            id.text = self._foreign_to_native_url(id.text)
        # Rewrite hrefs in links.
        for link in root.xpath("a:link", namespaces=NSMAP):
            href = link.get("href")
            rel = link.get("rel")
            # Leave download links alone.
            if href and (rel != "download"):
                link.set("href", self._foreign_to_native_url(href))
        if not self._supportInProductInstall:
            # XXX: Prevent in-product app install -- make all apps non-free.
            for price in root.xpath("//a:entry/a:content/s:dict/s:key[@name='price']", namespaces=NSMAP):
                price.text = 'other'

    def _get_latest_version(self, xml):
        """
        Given a feed of version entries for an application, get the feed for
        the latest version.
        """
        try:
            entry = self._get_latest_version_entry(xml)
            href = entry.xpath("a:link/@href", namespaces=NSMAP)[0]
            return self._get_feed_root(href)
        except Exception as e:
            logger.exception(e)
            msg = "Could not find latest version of application"
            raise splunk.ResourceNotFound(msg)

    def _get_latest_version_entry(self, xml):
        """
        Given a feed of version entries for an application, get the entry for
        the latest version.
        """
        for entry in xml.xpath("//a:entry", namespaces=NSMAP):
            try:
                contents = self._convert_content(entry)
                if contents["islatest"] == "True":
                    return entry
            except Exception as e:
                logger.exception(e)
        return None

    def _parse_link(self, xml):
        """
        Given a feed of application files, get the URL of the installer.
        """
        msg = "Could not find application download location"
        try:
            for entry in xml.xpath("//a:entry", namespaces=NSMAP):
                try:
                    contents = self._convert_content(entry)
                    if contents["fileclass"] in ["bundle", "other"]:
                        return entry.xpath("a:link/@href", namespaces=NSMAP)[0]
                except Exception as e:
                    logger.exception(e)
            raise splunk.ResourceNotFound(msg)
        except Exception as e:
            logger.exception(e)
            raise splunk.ResourceNotFound(msg)

    def _convert_content(self, xml):
        """
        Convert an Atom entry's <content> node into a Python datastructure.
        """
        try:
            return format.nodeToPrimitive(xml.xpath("a:content", namespaces=NSMAP)[0][0])
        except Exception as e:
            logger.exception(e)
            return None

    def _get_from_xml(self, xml, location_path, contents, key):
        """
        Set the value for contents[key] to the text at location_path in xml.
        """
        try:
            contents[key] = xml.xpath(location_path, namespaces=NSMAP)[0].text
        except Exception as e:
            logger.exception(e)

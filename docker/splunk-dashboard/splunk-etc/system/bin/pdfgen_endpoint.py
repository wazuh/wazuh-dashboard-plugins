import sys
import splunk.safe_lxml_etree as et
import logging
import time
import json
from io import BytesIO
from future.moves.urllib.parse import unquote
import re

import splunk
import splunk.rest as rest
import splunk.entity as entity
import splunk.auth
import splunk.clilib.cli_common as cli_common
import splunk.models.dashboard as sm_dashboard
import splunk.models.dashboard_panel as sm_dashboard_panel
import splunk.models.saved_search as sm_saved_search
import splunk.search
import splunk.search.searchUtils
from splunk.util import normalizeBoolean, toDefaultStrings

import splunk.pdf.pdfgen_views as pv
import splunk.pdf.pdfgen_utils as pu
import splunk.pdf.pdfgen_chart as pc
import splunk.pdf.pdfgen_table as pt
from splunk.pdf.studio.pdfgen_studio import convertDashboardToPdfContent
import splunk.pdf.pdfrenderer as pdfrenderer
from builtins import range, filter
from gettext import gettext as _

logger = pu.getLogger()

ERROR_MSG = _("Unable to render PDF.")
DEFAULT_FEED_COUNT = 1000
DEFAULT_TIMEOUT = 3600 # in seconds
DEFAULT_MAX_ROWS_PER_TABLE = 1000
DEFAULT_INCLUDE_SPLUNK_LOGO = True
DEFAULT_PAPER_SIZE =   'letter'
DEFAULT_PAPER_ORIENTATION = 'portrait'

# Change the default lxml parsing to not allow imported entities
import splunk.safe_lxml_etree

class ArgError(Exception):
    def __init__(self, message):
        super(ArgError, self).__init__(message)
    def __str__(self):
        return repr(self.value)

class TimeoutError(Exception):
    def __str__(self):
        return repr(self.value)

class PDFGenHandler(splunk.rest.BaseRestHandler):
    _args = {}
    _deletePdfFileAfterSettingResponse = True
    _timeoutTime = None

    _views = []
    _inputSids = {}
    
    _title = "Untitled"
    _description = ""
    _dashboardContent = None
    _pdfContent = None
    _dashboardName = None
    _dashboardXml = None
    _reportName = None
    _viewType = None
    _paperSize = DEFAULT_PAPER_SIZE
    _namespace = None
    _owner = None
    _timeoutDuration = DEFAULT_TIMEOUT
    _maxRowsPerTable = DEFAULT_MAX_ROWS_PER_TABLE
    _includeSplunkLogo = DEFAULT_INCLUDE_SPLUNK_LOGO
    _cidFontList = None
    _now = None
    _timestampStr = ""
    _searchStr = None
    _et = ''
    _lt = ''
    _inactiveViews = None
    _fileNamePattern = None
    _enableInsecurePdfgen = False
    _resultId = -1

    _touchSearchJobsLastTime = None
    _pdfBuffer = None
    _pdfRenderer = None

    _pdfSettings = {
        pdfrenderer.SETTING_FOOTER_ENABLED : '1',
        pdfrenderer.SETTING_FOOTER_ENABLED : '1',
        pdfrenderer.SETTING_HEADER_CENTER : 'description',
        pdfrenderer.SETTING_FOOTER_LEFT : 'logo',
        pdfrenderer.SETTING_FOOTER_CENTER : 'title',
        pdfrenderer.SETTING_FOOTER_RIGHT : 'timestamp,pagination',
        pdfrenderer.SETTING_HTML_IMAGE_RENDERING : '1'
    }
    _requestSettings = {
        'pdf' : {}, 
        'server' : { 'sslRootCAPath' : ''}
    }
    
    VIEW_TYPE_DASHBOARD = 'dashboard'
    VIEW_TYPE_REPORT =    'report'
    VIEW_TYPE_SEARCH = 'search'

    ARG_INPUT_DASHBOARD = 'input-dashboard'
    ARG_INPUT_DASHBOARD_XML = 'input-dashboard-xml'
    ARG_INPUT_REPORT = 'input-report'
    ARG_INPUT_SEARCH = 'input-search'
    ARG_INPUT_LOCALE = 'locale'
    ARG_INPUT_ET = 'et'
    ARG_INPUT_LT = 'lt'
    ARG_INPUT_PAPERSIZE = 'paper-size'
    ARG_INPUT_SID = 'sid'
    ARG_INPUT_NAMESPACE = 'namespace'
    ARG_INPUT_OWNER = 'owner'
    ARG_INPUT_TIMEOUT = 'timeout'
    ARG_INPUT_MAX_ROWS_PER_TABLE = 'max-rows-per-table'
    ARG_INPUT_INCLUDE_SPLUNK_LOGO = 'include-splunk-logo'
    ARG_INPUT_REPORT_FILE_NAME = 'report-file-name'
    ARG_INPUT_NOW = 'now'
    ARG_INPUT_TIMEZONE = 'timezone'
    ARG_INPUT_RESULT_ID = 'result_id'
    ARG_CACHE_BUSTER = '_'
    ARG_CSRF_FORM_KEY = 'splunk_form_key'
    ARG_DISPLAY_INLINE = 'inline'

    _validArgs = [
        ARG_INPUT_DASHBOARD,
        ARG_INPUT_DASHBOARD_XML,
        ARG_INPUT_REPORT,
        ARG_INPUT_SEARCH,
        ARG_INPUT_ET,
        ARG_INPUT_LT,
        ARG_INPUT_PAPERSIZE,
        ARG_INPUT_SID,
        ARG_INPUT_NAMESPACE,
        ARG_INPUT_OWNER,
        ARG_INPUT_TIMEOUT,
        ARG_INPUT_MAX_ROWS_PER_TABLE,
        ARG_INPUT_INCLUDE_SPLUNK_LOGO,
        ARG_INPUT_NOW,
        ARG_CACHE_BUSTER,
        ARG_CSRF_FORM_KEY,
        ARG_INPUT_LOCALE,
        ARG_INPUT_TIMEZONE,
        ARG_INPUT_RESULT_ID
        ]

    SID_VALIDATOR_STR="sid_([0-9]+)"
    sidRE=re.compile(SID_VALIDATOR_STR)

    POLLING_WAIT_TIME = 0.5
    TOUCH_SEARCH_INTERVAL = 10

    ALERT_ACTIONS_ENTITY = '/configs/conf-alert_actions'
    SERVER_ENTITY = '/configs/conf-server'
    LIMITS_ENTITY = '/configs/conf-limits'
    WEB_ENTITY = '/configs/conf-web'

    def handle_GET(self):
        self._handleRequest()

    def handle_POST(self):
        self._handleRequest()

    def _handleRequest(self):
        logger.debug("pdfgen/render request: " + str(self.request))
        if not self._initialize():
            return
        
        if self.method == 'GET' and not self._enableInsecurePdfgen:
            errorMsg = "pdfgen GET is deprecated. Please use POST instead."
            pu.logErrorAndTrace(errorMsg)
            self._outputError([errorMsg])
            return

        if self._dashboardContent and not self._handleStudioDashboardPdf():
            return
        if not self._dashboardContent and not self._render():
            return

        self._respond()

    def _handleStudioDashboardPdf(self):
        try:
            self._pdfContent = convertDashboardToPdfContent(self.sessionKey, self._namespace, self._owner, self._dashboardContent, self._dashboardName)
            self._pdfBuffer = BytesIO(self._pdfContent)
            return True
        except Exception as e:
            errorMsg = "Exception raised while trying to render Studio Dashboard \"%s\" to PDF. %s" % (self._dashboardName, str(e))
            pu.logErrorAndTrace(errorMsg)
            self._outputError([errorMsg])
            return False

    def _initialize(self):
        try:
            self._initParameters()

            if self._viewType == self.VIEW_TYPE_DASHBOARD:
                # handle Xml vs. entity name
                logger.debug("dashboardName=%s dashboardXml=%s" % (self._dashboardName, self._dashboardXml))
                if self._dashboardXml != None:
                    (self._title, self._description, self._views) = pv.getDashboardTitleAndPanelsFromXml(
                        dashboardXml=self._dashboardXml,
                        namespace=self._namespace,
                        owner=self._owner,
                        sessionKey=self.sessionKey)
                elif self._dashboardName != None:
                    self._dashboardContent = pv.getStudioDashboardContent(self._dashboardName, self._namespace, self._owner, self.sessionKey)
                    if self._dashboardContent != None:
                        return True
                    (self._title, self._description, self._views) = pv.getDashboardTitleAndPanels(
                        dashboard_name=self._dashboardName, 
                        namespace=self._namespace, 
                        owner=self._owner, 
                        sessionKey=self.sessionKey)
            elif self._viewType == self.VIEW_TYPE_REPORT:
                self._views.append(pv.Report(savedSearchName=self._reportName, namespace=self._namespace, owner=self._owner, sessionKey=self.sessionKey))
                self._title = self._reportName
            elif self._viewType == self.VIEW_TYPE_SEARCH:
                self._title = self._reportName
                self._views.append(pv.SearchReport(search=self._searchStr, et=self._et, lt=self._lt, title=self._title, namespace=self._namespace, owner=self._owner, sessionKey=self.sessionKey))

            self._handlePresetSearchIDs()
            
            # instantiate the pdfRenderer object with a file-like object
            self._pdfBuffer = BytesIO()
            self._pdfRenderer = pdfrenderer.PDFRenderer(namespace=self._namespace, title=self._title,
                                                        description=self._description, outputFile=self._pdfBuffer,
                                                        paperSize=self._paperSize, timestamp=self._timestampStr,
                                                        includeSplunkLogo=self._includeSplunkLogo,
                                                        cidFontList=self._cidFontList, pdfSettings=self._pdfSettings,
                                                        requestSettings=self._requestSettings, sessionKey=self.sessionKey)
            return True
        except ArgError as e:
            self.response.setStatus(400)
            self.response.write(e.args[0])
        except Exception as e:
            errorMsg = "Bailing out of Integrated PDF Generation. Exception raised while preparing to render \"%s\" to PDF. %s" % (self._title, e)
            pu.logErrorAndTrace(errorMsg)
            self._outputError([errorMsg])
        return False

    def _render(self):
        try:
            self._inactiveViews = self._views[:]
            for _ in range(3):
                self._startNextSearch()

        except Exception as e:
            errorMsg = "Exception raised while trying to prepare \"%s\" for rendering to PDF. %s" % (self._title, e)
            pu.logErrorAndTrace(errorMsg)
            self._outputError([errorMsg])
            return False

        # iterate over views and render each to the pdf
        viewPrepErrors = []
        for i, view in enumerate(self._views):
            try:
                self._keepAllSearchesAlive()
                self._checkForTimeout()
               
                isLastView = (i == len(self._views) - 1) 
                self._renderView(self._pdfRenderer, view, lastView = isLastView)
                
                self._startNextSearch()

            except TimeoutError:
                errorMsg = "Timeout while trying to prepare \"%s\" for rendering to PDF." % self._title
                self._outputTimeoutError(errorMsg)
                return
            except Exception as e:
                errorMsg = "Exception raised while trying to prepare \"%s\" for rendering to PDF. %s" % (self._title, e)
                pu.logErrorAndTrace(errorMsg)
                viewPrepErrors.append(errorMsg)
        if len(self._views) == 0:
            # fix SPL-67268, render a empty dashboard if there's 0 views
            self._pdfRenderer.renderText("")

        # if we weren't able to render any views successfully, output an error as response to endpoint
        if len(viewPrepErrors) == len(self._views) and len(self._views) > 0:
            self._outputError(viewPrepErrors)
            logger.error("No views prepared without exceptions. Bailing out of Integrated PDF Generation.")
            return False
            
        try:
            self._pdfRenderer.save()
        except Exception as e:
            errorMsg = []
            errorMsg.append("Exception raised while trying to render \"%s\" to PDF." % (self._title))

            # SPL-80872 - [PDF] Cannot render PDF report of A5 size if the table is too big
            if "too large on page" in e.args[0]:
                errorMsg.append("Please try using a larger paper size than %s." % (self._paperSize))

            errorMsg.append("%s" % (e))
            pu.logErrorAndTrace(errorMsg)
            self._outputError(errorMsg)
            return False

        return True

    def _respond(self):
        # save and write out the file
        try:
            self.response.write(self._pdfBuffer.getvalue(), flushBuffer=True)
            self.response.setHeader('content-type', 'application/pdf')
            # override normal cache-control header to fix problem on ie6-ie8 (see SPL-50739)
            self.response.setHeader('cache-control', 'max-age=0, must-revalidate')
            name = self._generateFileName()
            logger.info('Generated pdf, filename = %s' % name)
            disposition = 'inline' if self.ARG_DISPLAY_INLINE in self.args else 'attachment'
            self.response.setHeader('content-disposition',
                                    disposition + '; filename="' + name + '"')
            self.response.setStatus(200)
            self._pdfBuffer.close()
        except Exception as e:
            errorMsg = "Exception raised while trying to respond. Bailing out of Integrated PDF Generation. Rendering \"%s\" to PDF. %s" % (self._title, e)
            pu.logErrorAndTrace(errorMsg)
            self._outputError([errorMsg])
            return False
        return True

    def _generateFileName(self):
        name = self._reportName
        if self._viewType == self.VIEW_TYPE_DASHBOARD:
            name = self._dashboardName
        props = {
            "owner": self._owner,
            "app": self._namespace,
            "type": self._viewType,
            "name": name
        }
        return pu.makeReportName(pattern=self._fileNamePattern, type="pdf", reportProps=props)

    def _outputTimeoutError(self, message):
        self.response.write("PDF Generation timed out: %s" % message)
        self.response.setHeader('content-type', 'text/html')
        self.response.setStatus(408)

    def _outputError(self, errorDetailsArray):
        outputErrorMsg = ERROR_MSG + "<br/><ul>"
        for errorDetail in errorDetailsArray:
            outputErrorMsg = outputErrorMsg + "<li>" + pu.secureMessage(errorDetail) + "</li>"
        outputErrorMsg = outputErrorMsg + "</ul>"
        self.response.write(outputErrorMsg)
        self.response.setHeader('content-type', 'text/html')
        self.response.setStatus(400)

    def _initParameters(self):
        self._owner=self.request['userName']

        # SPL-107168 Need to populate namespace & owner beforehand which are needed 
        # to generate context specific URI while initializing conf defaults

        # get namespace/owner
        self._namespace = self.args.get(self.ARG_INPUT_NAMESPACE)
        if self.ARG_INPUT_OWNER in self.args:
            self._owner = self.args.get(self.ARG_INPUT_OWNER)

        self._initArgs()
        self._initWebDefaults()
        self._initLimitsDefaults()       
        self._initAlertActionsDefaults()

        # initialize view type
        # the order matters, check dashboard xml first
        if self.ARG_INPUT_DASHBOARD_XML in self.args:
            self._dashboardXml = unquote(self.args.get(self.ARG_INPUT_DASHBOARD_XML))
            self._viewType = self.VIEW_TYPE_DASHBOARD
            self._dashboardName = self.args.get(self.ARG_INPUT_DASHBOARD)
            logger.debug("pdfgen/render xml=%s" % self._dashboardXml)
        elif self.ARG_INPUT_DASHBOARD in self.args:
            self._dashboardName = self.args.get(self.ARG_INPUT_DASHBOARD)
            self._viewType = self.VIEW_TYPE_DASHBOARD
        elif self.ARG_INPUT_REPORT in self.args:
            self._reportName = self.args.get(self.ARG_INPUT_REPORT)
            self._viewType = self.VIEW_TYPE_REPORT 
        elif self.ARG_INPUT_SEARCH in self.args:
            self._searchStr = self.args.get(self.ARG_INPUT_SEARCH, "No search query specified")
            self._et = self.args.get(self.ARG_INPUT_ET, 0)
            self._lt = self.args.get(self.ARG_INPUT_LT, '')

            # if et or lt is 0.000 change it to 0
            if float(self._et)==0.0:
                logger.debug("_et was %s, updating it to '0'" % self._et)
                self._et = '0'

            if self._lt and float(self._lt)==0.0:
                logger.debug("_lt was %s, updating it to '0'" % self._lt)
                self._lt = '0'

            self._reportName = 'Splunk search results'
            self._viewType = self.VIEW_TYPE_SEARCH

        # initialize papersize
        if self.ARG_INPUT_PAPERSIZE in self.args:
            paperSizeArg = self.args.get(self.ARG_INPUT_PAPERSIZE).lower()
            if paperSizeArg in pdfrenderer.PAPERSIZES:
                self._paperSize = paperSizeArg
            else:
                logger.warn('Invalid paper size "%s"' % paperSizeArg)
                raise ArgError("Paper size is not valid. Please check the pdfgen.log file for more information.")
        logger.debug("pdf-init paper-size=%s" % self._paperSize)

        # initialize include-splunk-logo
        self._includeSplunkLogo = normalizeBoolean(self.args.get(self.ARG_INPUT_INCLUDE_SPLUNK_LOGO, self._includeSplunkLogo))
        logger.debug("pdf-init include-splunk-logo=%s" % self._includeSplunkLogo)

        # initialize max-row-per-table
        if self.ARG_INPUT_MAX_ROWS_PER_TABLE in self.args:
            maxRowsPerTableArg = self.args.get(self.ARG_INPUT_MAX_ROWS_PER_TABLE)
            try:
                self._maxRowsPerTable = int(maxRowsPerTableArg)
            except:
                logger.warn('Max-rows-per-table="%s" is invalid, must be an integer' % maxRowsPerTableArg)
                raise ArgError("max-rows-per-table is invalid, must be an integer. Please check the pdfgen.log file for more information.")
        logger.debug("pdf-init max-rows-per-table=%s" % (str(self._maxRowsPerTable)))

        # initialize timeout
        if self.ARG_INPUT_TIMEOUT in self.args:
            self._timeoutDuration = int(self.args.get(self.ARG_INPUT_TIMEOUT))
        logger.debug("pdf-init timeoutDuration=%s" % self._timeoutDuration)
        self._startTimeoutClock()

        if self.ARG_INPUT_REPORT_FILE_NAME in self.args:
            self._fileNamePattern = self.args.get(self.ARG_INPUT_REPORT_FILE_NAME)
            logger.debug("pdf-init report-file-name=%s" % self._fileNamePattern)

        if self.ARG_INPUT_RESULT_ID in self.args:
            resultIdStr = self.args.get(self.ARG_INPUT_RESULT_ID)
            if resultIdStr.isdigit():
                self._resultId = int(resultIdStr)
                logger.debug("pdf-init per_alert_result_id=%d" % self._resultId)
            else:
                logger.warn("pdf-init received invalid per_alert_result_id=%s"% resultIdStr)

        # initialize time of report
        self._initTimeOfReport()

        # check for SIDs
        if self._viewType is self.VIEW_TYPE_REPORT:
            if self.ARG_INPUT_SID in self.args:
                self._inputSids[0] = self.args.get(self.ARG_INPUT_SID)
        else:
            for argK, argV in self.args.items():
                if self.ARG_INPUT_SID in argK:
                    # we want the panel sequence number which is retrieved from "sid_<seqNum>"
                    match = self.sidRE.match(argK)
                    if match != None and len(match.groups(0)) > 0:
                        seqNum = match.groups(0)[0]
                        if len(seqNum) > 0:
                            self._inputSids[int(seqNum)] = argV
                            logger.debug("sid seqNum=%s value=%s" % (seqNum, argV))

        # allow override from http arguments
        for validArgs in pdfrenderer.ALL_PDF_SETTINGS:
            v = self.args.get(validArgs) or self._pdfSettings.get(validArgs)
            if v is not None:
                v = v.strip()
                # SPL-98329 convert value into lowercase except logo path
                if validArgs != pdfrenderer.SETTING_LOGO_PATH:
                    v = v.lower()
                if validArgs in pdfrenderer.PDF_BOOLEAN_SETTINGS:
                    self._pdfSettings[validArgs] = normalizeBoolean(v)
                else:
                    self._pdfSettings[validArgs] = v

        logger.debug("pdfSettings=%s" % (str(self._pdfSettings)))

        self._validateParameters()

        self._timestampStr = splunk.search.searchUtils.getFormattedTimeForUser(self.sessionKey, now=self._now, timeFormat='%F %T %Z')

        self._locale = self.args.get(self.ARG_INPUT_LOCALE)
        logger.info("pdf-init locale=%s" % self._locale)

        self._server_zoneinfo = self.args.get(self.ARG_INPUT_TIMEZONE)
        if self._server_zoneinfo is None:
            self._server_zoneinfo = toDefaultStrings(rest.simpleRequest('/services/search/timeparser/tz', sessionKey=self.sessionKey)[1])
        logger.info("pdf-init server_zoneinfo=%s" % self._server_zoneinfo)

    def _initTimeOfReport(self):
        # 1) try to use get time-of-report from the request args
        # 2) if not possible, get current UTC epoch time
        if self.ARG_INPUT_NOW in self.args:
            nowStr = self.args.get(self.ARG_INPUT_NOW)
            try:
                self._now = float(nowStr)
            except:
                logger.warning("invalid now argument passed to pdfgen/render arg=%s" % nowStr)
        if self._now is None:
            self._now = time.time() 

        logger.info("pdf time-of-report=%s" % self._now)

    def _validateParameters(self):
        # raise ArgError if there are problems with any parameters
        if self._dashboardName is None and self._reportName is None and self._dashboardXml is None:
            raise ArgError("PDF endpoint must be called with one of the following args: 'input-dashboard=<dashboard-id>' or 'input-report=<report-id>' or 'input-dashboard-xml=<dashboard-xml>'")

    def _initArgs(self):
        for arg in self.args:
            logger.debug("Testing argument arg=%s value=%s" % (arg, self.args[arg]))
            if arg not in self._validArgs and arg not in pdfrenderer.ALL_PDF_SETTINGS:
                # check for sid_N for dashboards
                if self.sidRE.match(arg) is None:            
                    logger.warn("Invalid argument passed to pdfgen/render. arg=%s value=%s" % (arg, self.args[arg]))

    def _initAlertActionsDefaults(self):
        """ use alertActions entity to determine default papersize
            return in form of "<size>" or "<size>-landscape"
        """
        paperSize = DEFAULT_PAPER_SIZE
        paperOrientation = DEFAULT_PAPER_ORIENTATION
        try:
            # SPL-107168 Passing namespace and owner to generate context specifc endpoint
            settings = entity.getEntity(self.ALERT_ACTIONS_ENTITY, 'email', namespace=self._namespace, owner=self._owner, sessionKey=self.sessionKey)
            # paperSize is 'letter', 'legal', 'A4', etc
            paperSize = settings.get('reportPaperSize') or DEFAULT_PAPER_SIZE
            # paperOrientation is 'portrait' or 'landscape'
            paperOrientation = settings.get('reportPaperOrientation') or DEFAULT_PAPER_ORIENTATION
            self._includeSplunkLogo = normalizeBoolean(settings.get('reportIncludeSplunkLogo', self._includeSplunkLogo))
            cidFontListString = settings.get('reportCIDFontList', '') or ''
            self._cidFontList = cidFontListString.split(' ')
            self._fileNamePattern = settings.get('reportFileName')            

            # retrieve pdf settings
            for k, v in settings.items():
                if k.startswith(pdfrenderer.SETTING_PREFIX):
                    self._pdfSettings[k] = v
                    keyNoPrefix = k[len(pdfrenderer.SETTING_PREFIX):len(k)]
                    # SSL settings are stored in pdf namespace, but the ssl_context
                    # won't find these settings if they are prefixed w/ pdf
                    self._requestSettings['pdf'][keyNoPrefix] = v

        except Exception as e:
            logger.error("Could not access or parse email stanza of alert_actions.conf. Error=%s" % str(e))

        if paperOrientation == 'landscape':
            self._paperSize = paperSize + '-landscape'
        else:    
            self._paperSize = paperSize


    def _initLimitsDefaults(self):
        """ use limits entity to determine defaults
        """
        try:
            # SPL-107168 Passing namespace and owner to generate context specifc endpoint
            settings = entity.getEntity(self.LIMITS_ENTITY, 'pdf', namespace=self._namespace, owner=self._owner, sessionKey=self.sessionKey)
            logger.debug("limitsPDFStanza=%s" % (str(settings)))
            self._maxRowsPerTable = int(settings.get('max_rows_per_table', self._maxRowsPerTable))
            self._timeoutDuration = int(settings.get('render_endpoint_timeout', self._timeoutDuration))
        except Exception as e:
            logger.error("Could not access or parse pdf stanza of limits.conf. Error=%s" % str(e))

    def _initWebDefaults(self):
        defaultSplunkdConnectionTimeout = 30
        try:
            splunkdConnectionTimeout = int(cli_common.getWebConfKeyValue('splunkdConnectionTimeout'))
            self._enableInsecurePdfgen = normalizeBoolean(cli_common.getWebConfKeyValue('enable_insecure_pdfgen'))
            if splunkdConnectionTimeout < defaultSplunkdConnectionTimeout:
                splunkdConnectionTimeout = defaultSplunkdConnectionTimeout

            splunk.rest.SPLUNKD_CONNECTION_TIMEOUT = splunkdConnectionTimeout
        except Exception as e:
            logger.error("Could not access or parse settings stanza of web.conf. Error=%s" % e)
            splunk.rest.SPLUNKD_CONNECTION_TIMEOUT = defaultSplunkdConnectionTimeout
        finally:    
            logger.info("splunkdConnectionTimeout=%s" % splunk.rest.SPLUNKD_CONNECTION_TIMEOUT)

    #
    # handling searches
    #

    def _handlePresetSearchIDs(self):
        if len(self._inputSids) > 0:
            for view in self._views:
                index = view.getViewIndex()
                if index in self._inputSids.keys():
                    try:
                        searchJobObj = splunk.search.SearchJob(self._inputSids[index], hostPath=None, sessionKey=self.sessionKey)
                    except Exception as e:
                        logger.warning("Nonexistent search job object for sid: " + self._inputSids[index])
                        searchJobObj = None

                    if searchJobObj != None:
                        if searchJobObj.isExpired():
                            logger.warning("Expired search job object for sid: " + self._inputSids[index])
                        else:
                            view.setSearchJobObj(searchJobObj)

    def _startNextSearch(self):
        if len(self._inactiveViews) == 0:
            return

        view = self._inactiveViews.pop(0)
        if view.hasSearchError():
            return

        if view.getSearchJobObj() is None and view.requiresSearchJobObj():
            # start the search!
            logger.debug("dispatching search for view: %s" % view.getTitle())
            if not view.dispatchSearch(overrideNowTime=self._now, maxRowsPerTable=self._maxRowsPerTable):
                logger.error("could not dispatch search for view: %s" % view.getTitle())
    
    def _keepAllSearchesAlive(self):
        currentTime = time.time()
        logger.debug("currentTime = %s self._touchSearchJobsLastTime = %s" % (currentTime, self._touchSearchJobsLastTime))
        if self._touchSearchJobsLastTime is not None:
            delta = currentTime - self._touchSearchJobsLastTime
            if delta < self.TOUCH_SEARCH_INTERVAL:
                return

        self._touchSearchJobsLastTime = currentTime
        for view in self._views:
            if not view.hasSearchError():
                view.touchSearchJob()

    #
    # Timeout
    #

    def _startTimeoutClock(self):
        currentTime = int(time.time())
        self._timeoutTime = currentTime + self._timeoutDuration 
        logger.debug("PDF timeout setup: currentTime=%s timeoutDuration=%s timeoutTime=%s" % (currentTime, self._timeoutDuration, self._timeoutTime))

    def _checkForTimeout(self):
        currentTime = int(time.time())
        timedOut = currentTime > self._timeoutTime
        if timedOut:
            logger.info("PDF timeout. timeoutDuration = %s timeoutTime = %s currentTime = %s" % (self._timeoutDuration, self._timeoutTime, currentTime))
            for view in self._views:
                if not view.hasSearchError():
                    view.cancelSearch()
            raise TimeoutError()         

    #
    # Rendering
    #

    def _renderView(self, pdfRenderer, view, lastView=False):
        """ render an individual panel """

        types = view.getRenderTypes()
        pdfRenderer.conditionalPageBreak(types)

        # always render header first
        self._renderViewHeader(pdfRenderer, view)

        if view.hasError():
            pdfRenderer.renderText(view.getError())
            return
        if view.requiresSearchJobObj():
            if view.hasSearchError():
                pdfRenderer.renderText(view.getSearchError())
                return
            while not view.isSearchComplete() and not view.isRealtime():
                time.sleep(self.POLLING_WAIT_TIME)
                self._keepAllSearchesAlive()
                self._checkForTimeout()

        if 'trellis.enabled' in view.getOptions() and normalizeBoolean(view.getOptions()['trellis.enabled']):
            pdfRenderer.renderText("PDF export is not available for visualizations using trellis layout.")
        else:
            try:
                for type in types:
                    if type == 'chart':
                        self._renderChart(pdfRenderer, view)
                    elif type == 'map':
                        self._renderMap(pdfRenderer, view)
                    elif type == 'table':
                        self._renderTable(pdfRenderer, view)
                    elif type == 'event':
                        self._renderEvents(pdfRenderer, view)
                    elif type == 'single':
                        self._renderSingle(pdfRenderer, view)
                    elif type == 'list':
                        self._renderList(pdfRenderer, view)
                    elif type == 'html':
                        self._renderHtml(pdfRenderer, view)
                    elif type == 'viz':
                        pdfRenderer.renderText("PDF export does not support custom visualizations.")
                    else:
                        pdfRenderer.renderText("No render option for type '%s'" % type)
                        logger.warning("PDFGenHandler::_renderView> No render option for type = '%s'" % type)
            except Exception as e:
                if (isinstance(e, splunk.AuthorizationFailed) and
                        'check_risky_command' in e.extendedMessages and
                        pu.isRiskyCommandCheckDashboardEnabled(self.sessionKey)):
                    # This is a special case for chain searches containing risky commands, which throw an AuthorizationFailed
                    # exception which does not contain any useful info for security reasons. Because of this, we need to return
                    # a more generic risky commands error message.
                    content = "Found potentially risky commands."
                else:
                    content = str(e)
                pu.logErrorAndTrace(e)
                pdfRenderer.renderText(content)

        if not lastView:
            pdfRenderer.spaceBetween()

    def _renderViewHeader(self, pdf_renderer, view):
        title = view.getTitle()
        if title is not None and len(title) > 0:
            pdf_renderer.renderText("%s" % title, style = pdf_renderer.TITLE_STYLE, escapeText=True)
            pdf_renderer.spaceBetween(0.1 * pdf_renderer.ONE_INCH)
            
        subtitle = view.getSubtitle()
        if subtitle is not None and len(subtitle) > 0:
            pdf_renderer.renderText("%s" % subtitle, style=pdf_renderer.SUBTITLE_STYLE, escapeText=True)
            pdf_renderer.spaceBetween(0.1 * pdf_renderer.ONE_INCH)
            
        description = view.getDescription()
        if description is not None and len(description) > 0:
            pdf_renderer.renderText(description)

    def _renderTable(self, pdfRenderer, view):
        """ render a table of results """
        # get options
        options = view.getOptions()

        if "show" in options and not normalizeBoolean(options['show']):
            return

        fieldFormats = view.getFieldFormats()
        displayRowNumbers = False
        if "displayRowNumbers" in options:
            displayRowNumbers = normalizeBoolean(options['displayRowNumbers'])

        overlay = None
        if "dataOverlayMode" in options:
            overlay = options['dataOverlayMode']
        if "overlay" in options:
            overlay = options['overlay']

        resultsExist = False

        # get results object
        view.getSearchJobObj().setFetchOptions(output_mode="json_cols", time_format=pt.TIME_RAW_FORMAT)
        results = view.getSearchJobResults()
        
        # determine field set
        explicitFieldList = view.getSearchFieldList()
        fieldOrder = []
        if len(explicitFieldList) > 0:
            for field in explicitFieldList:
                if field in results.fieldOrder and field not in fieldOrder:
                    fieldOrder.append(field)
            if len(fieldOrder) == 0:
                logger.warning("%s: results.fieldOrder does not contain any explicitly specified fields: %s" % (view.getTitle(), explicitFieldList))
                return 
        else:
            fieldOrder = self._renderTable_restrictFields(results.fieldOrder)

        if len(fieldOrder) == 0:
            pdfRenderer.renderText("No results found.")
            return

        tableData = pt.TableData(columnNames=fieldOrder)

        if self._resultId >= len(list(results)):
            logger.warn('PDFRenderTable: found result_id=%d is greater than size_of_results=%d, PDF will be generated with all of search results.'
                        % (self._resultId, len(list(results))))

        if self._resultId == -1 or self._resultId >= len(list(results)):
            for i, result in enumerate(results):
                if i >= self._maxRowsPerTable:
                    break

                if (i > 0) and ((i % 100) == 0):
                    self._keepAllSearchesAlive()

                resultsExist = True
                tableData.addRowFromSearchResult(result)
        else:
            logger.debug('PDFRenderTable: Generate per_result_alert for result_id=%d' % self._resultId)
            resultsExist = True
            tableData.addRowFromSearchResult(results[self._resultId])

        if resultsExist:
            pdfRenderer.renderTable(tableData, title=view.getSubtitle() or view.getTitle(), displayLineNumbers=displayRowNumbers,
                                    fieldFormats=fieldFormats, overlayMode=overlay)
        else:
            logger.warning("PDFGenHandler::_renderTable> no results for table")
            pdfRenderer.renderText("No results found.")

    def _renderTable_restrictFields(self, inputFieldOrder):
        """ restrict the fields that are output in tables
            do not display any fields that start with an underscore
            except for _raw and _time
            position _time, if present, at the front of fieldOrder, and
            position _raw, if present, at the end of fieldOrder
            ---
            for the time being, if _time and _raw are both present,
            do not show any other field
        """
        timeFieldPresent = "_time" in inputFieldOrder
        rawFieldPresent = "_raw" in inputFieldOrder

        # do not include any fields that start with '_'
        publicFields = []
        for field in inputFieldOrder:
            if len(field) > 0 and field[0] != '_':
                publicFields.append(field)

        # build up output fieldOrder
        fieldOrder = []

        # always show _time first
        if timeFieldPresent:
            fieldOrder.append("_time")

        # if both _time and _raw present, do not show other fields
        if timeFieldPresent == False or rawFieldPresent == False:
            for field in publicFields:
                fieldOrder.append(field)

        # always show _raw last
        if rawFieldPresent:
            fieldOrder.append("_raw")

        logger.debug("PDFGenHandler::_renderTable_restrictFields> inputFieldOrder=" + str(inputFieldOrder) + " fieldOrder=" + str(fieldOrder))

        return fieldOrder

    def _renderList(self, pdfRenderer, view):
        """ render a list display """

        # build 2-d list of lists
        data = []
        resultsExist = False

        results = view.getSearchJobResults()
        fieldOrder = results.fieldOrder

        # get options
        optionsDict = view.getOptions()
        labelField = optionsDict.get("labelField", None)
        valueField = optionsDict.get("valueField", None)
        initialSort = optionsDict.get("initialSort", labelField)
        initialSortDir = optionsDict.get("initialSortDir", "asc")

        # validate options
        if labelField is None or valueField is None:
            logger.warning("PDFGenHandler::_renderList> missing either labelField or valueField in list")
            return

        # build up 2-d data set
        data = []

        if self._resultId >= len(list(results)):
            logger.warn('PDFGenHandler::_renderList: found result_id=%d is greater than size_of_results=%d, PDF will be generated with all of search results.'
                        % (self._resultId, len(list(results))))

        if self._resultId == -1 or self._resultId >= len(list(results)):
            for result in results:
                label = str(result.get(labelField, default=""))
                value = str(result.get(valueField, default=""))

                logger.debug("PDFGenHandler::_renderList> label, value: " + label + ", " + value)

                if label != "" or value != "":
                    row = [label, value]
                    data.append(row)
        else:
            r = results[self._resultId]
            label = str(r.get(labelField, default=""))
            value = str(r.get(valueField, default=""))
            logger.debug("PDFGenHandler::_renderList> for per_result_alert label, value: " + label + ", " + value)
            if label != "" or value != "":
                row = [label, value]
                data.append(row)

        # sort by initialSort and initialSortDir
        sortIndex = 0
        if initialSort == valueField:
            sortIndex = 1
        sortDescending = initialSortDir.lower() == "desc"

        data = sorted(data, key=lambda row: row[sortIndex], reverse=sortDescending)
        logger.debug("PDFGenHandler::_renderList> data: " +str(data))

        # render the data as lines of text
        if len(data) > 0:
            for row in data:
                pdfRenderer.renderText(row[0] + " " + row[1])
        else:
            pdfRenderer.renderText("No results for list")


    def _renderSingle(self, pdfRenderer, view):
        """ render a SingleValue display """
        optionsDict = view.getOptions()
        logger.debug("_renderSingle optionsDict='%s'" % optionsDict)
        props = {"exportMode":"true"}        
        props.update(view.getSingleValueProps())
        self._renderSvgBasedViz(pdfRenderer, view, props, mode="single")

    def _renderChart(self, pdfRenderer, view):
        """ render a chart from the results """
        props = {"exportMode":"true","enableChartClick":"false","enableLegendClick":"false", "data.count":10000}
        props.update(view.getChartProps())

        self._renderSvgBasedViz(pdfRenderer, view, props, mode="chart")

    def _renderMap(self, pdfRenderer, view):
        """ render a map from the results """
        mapProps = view.getMapProps()
        mapFitBounds = mapProps.get('map.fitBounds')
        dataFitBounds = mapProps.get('data.bounds')

        fitBounds = None
        fitBoundsArray = []
        if dataFitBounds:
            fitBounds = dataFitBounds
        elif mapFitBounds:
            fitBounds = mapFitBounds
        else:
            fitBounds = '(-90,-180,90,180)'

        if fitBounds:
            fitBounds = fitBounds.replace('(', '')
            fitBounds = fitBounds.replace(')', '')

            fitBoundsArray = [bound.strip() for bound in fitBounds.split(',')]

        gFilterPostProcess = None
        if mapProps.get('type', 'marker') == 'choropleth':
            geomFilterArguments = []
            if len(fitBoundsArray) == 4:
                geomFilterArguments.append('min_y=%s' % fitBoundsArray[0])
                geomFilterArguments.append('min_x=%s' % fitBoundsArray[1])
                geomFilterArguments.append('max_y=%s' % fitBoundsArray[2])
                geomFilterArguments.append('max_x=%s' % fitBoundsArray[3])

            geomFilterPostProcess = 'geomfilter %s' % ' '.join(geomFilterArguments)
            logger.debug("Rendering Map in PDF. postprocess = %s geomFilterArguments=%s" % (geomFilterPostProcess, geomFilterArguments))
            gFilterPostProcess = geomFilterPostProcess
        else:
            geoFilterArguments = []

            if len(fitBoundsArray) == 4:
                geoFilterArguments.append('south=%s' % fitBoundsArray[0])
                geoFilterArguments.append('west=%s' % fitBoundsArray[1])
                geoFilterArguments.append('north=%s' % fitBoundsArray[2])
                geoFilterArguments.append('east=%s' % fitBoundsArray[3])

            if 'maxClusters' in mapProps:
                geoFilterArguments.append('maxclusters=%s' % mapProps['maxClusters'])

            geoFilterPostProcess = 'geofilter %s' % ' '.join(geoFilterArguments)
            logger.debug("Rendering Map in PDF. postprocess = %s geoFilterArguments=%s" % (geoFilterPostProcess, geoFilterArguments))
            gFilterPostProcess = geoFilterPostProcess

        self._renderSvgBasedViz(pdfRenderer, view, mapProps, mode="map", postSearch=gFilterPostProcess)

    def _renderSvgBasedViz(self, pdfRenderer, view, props, mode, postSearch=None):
        # set the fetch option output_mode to 'json_cols'
        #  this will cause the data returned by getFeed to be
        #  pre-populated into the columnar form that the charting code wants
        # set the fetch option time_format to '%FT%T.%Q%:z'
        #  this is the only time format that is accepted by charting
        # set the show_metadata flag to true for chart mode only
        #  this will populate the metadata for each field, which certain chart types need to render correctly
        fetchOptions = {'output_mode': 'json_cols', 'time_format': '%FT%T.%Q%:z'};
        if postSearch is not None:
            fetchOptions['search'] = postSearch;
        if mode == "chart":
            fetchOptions['show_metadata'] = 'true';
        elif mode == "single":
            fetchOptions['count'] = 1000;
        view.getSearchJobObj().setFetchOptions(**fetchOptions)

        feedCount = DEFAULT_FEED_COUNT
        if 'data.count' in props:
            feedCount = props['data.count']

        feed = toDefaultStrings(view.getSearchJobFeed(feedCount=feedCount))
        logger.debug("_renderSvgBasedViz> feed: " + str(feed) + ", " + str(type(feed)))
        
        if feed is None or len(feed.strip()) == 0:
            logger.warning("_renderSvgBasedViz> feed: " + str(feed) + ", " + str(type(feed)))

            pdfRenderer.renderText("No results found.")
            return

        feed = json.loads(feed)

        # extract columns and fields from the search results
        data = feed['columns']
        fields = feed['fields']

        if len(data) == 0:
            pdfRenderer.renderText("No results found.")
            return

        # set up the SVG viz object
        svgBasedViz = None
        if mode == "chart":
            # SPL-118166 - remove 'None' values from the '_time' column.
            if len(fields) and fields[0].get('name') == '_time':
                data[0] = list(filter(lambda x: x is not None, data[0]))
            svgBasedViz = pc.Chart(data, fields, props, self._locale, server_zoneinfo=self._server_zoneinfo)
        elif mode == "map":
            svgBasedViz = pc.Map(data, fields, props, self._locale, server_zoneinfo=self._server_zoneinfo)
        elif mode == "single":
            svgBasedViz = pc.Single(data, fields, props, self._locale, server_zoneinfo=self._server_zoneinfo)

        # build the SVG viz 
        buildSuccess = svgBasedViz.build()
        if buildSuccess:
            svgString = svgBasedViz.getSvg()
            pdfRenderer.renderSvgString(svgString, title=None)
        else:
            logger.error("SVG based viz building error")

    def _renderEvents(self, pdfRenderer, view):
        """ render a listing of events """
        # get options -- TODO: should be refactored with _renderTable (and beyond: should have a generalized system for getting options)
        options = view.getOptions()
        displayRowNumbers = False
        if "displayRowNumbers" in options:
            displayRowNumbers = normalizeBoolean(options['displayRowNumbers'])

        data = []
        # fix header for events
        header = ['Time', 'Event']
        events = view.getSearchJobEvents()

        if self._resultId >= len(list(events)):
            logger.warn('PDFrenderEvents: found result_id=%d is greater than size_of_events=%d, PDF will be generated with all of search events.'
                        % (self._resultId, len(list(events))))

        if self._resultId == -1 or self._resultId >= len(list(events)):
            for i, event in enumerate(events):
                if i >= self._maxRowsPerTable:
                    break

                if (i > 0) and ((i % 100) == 0):
                    self._keepAllSearchesAlive()

                data.append([str(event.time), event.raw])
        else:
            logger.debug('PDFrenderEvents: Generate per_result_alert for result_id=%d' % self._resultId)
            data.append([str(events[self._resultId].time), events[self._resultId].raw])

        if len(data) == 0:
            pdfRenderer.renderText("No matching events found.")
        else:
            tableData = pt.TableData(columnNames=header, data=data)
            pdfRenderer.renderTable(tableData, title=view.getTitle(), columnVAlignments=['TOP', 'TOP'],
                                    displayLineNumbers=displayRowNumbers)


    def _renderHtml(self, pdfRenderer, view):
        title = view.getTitle()
        if title is None:
            title = "Untitled panel"

        options = view.getOptions()
        logger.debug("PDFGenHandler::_renderHtml> options: " + str(options))
        if pu.PP_RAW_CONTENT not in options or options[pu.PP_RAW_CONTENT] is None or len(options[pu.PP_RAW_CONTENT]) == 0:
            logger.warning("PDFGenHandler::_renderHtml> rawContent key not in optionsDict for view: " + title)
            return

        pdfRenderer.renderHtml(options[pu.PP_RAW_CONTENT])

         










from builtins import range
import copy
import csv
from functools import cmp_to_key
import json
import logging
import os
import re
from smtplib import SMTPNotSupportedError 
import socket
import sys
if sys.version_info >= (3, 0):
    from io import (BytesIO, TextIOWrapper)
    import urllib.parse as urllib
else:
    from cStringIO import StringIO
    BytesIO = StringIO
    import urllib
import time

from email import encoders, utils
from email.header import Header
from email.mime.application import MIMEApplication
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import splunk.safe_lxml_etree as et
from mako import template
import mako.filters as filters
import splunk.entity as entity
import splunk.Intersplunk
import splunk.mining.dcutils as dcu
import splunk.pdf.pdfgen_utils as pu
import splunk.search as search
import splunk.secure_smtplib as secure_smtplib
import splunk.ssl_context as ssl_context
from splunk.rest import simpleRequest
from splunk.saved import savedSearchJSONIsAlert
from splunk.util import normalizeBoolean, unicode, format_local_tzoffset

PDF_REPORT_SERVER_TIMEOUT = 600
PDFGEN_SIMPLE_REQUEST_TIMEOUT = 3600
EMAIL_DELIM = re.compile('\s*[,;]\s*')
CHARSET = "UTF-8"
IMPORTANCE_MAP = {
    "highest": "1 (Highest)",
    "high"   : "2 (High)",
    "low"    : "4 (Low)",
    "lowest" : "5 (Lowest)",
    "1" : "1 (Highest)",
    "2" : "2 (High)",
    "4" : "4 (Low)",
    "5" : "5 (Lowest)"
}

logger = dcu.getLogger()

class PDFException(Exception):
    pass

def unquote(val):
    if val is not None and len(val) > 1 and val.startswith('"') and val.endswith('"'):
       return val[1:-1]
    return val

def numsort(x, y):
    if y[1] > x[1]:
        return -1
    elif x[1] > y[1]:
        return 1
    else:
        return 0

def renderTime(results):
   for result in results:
      if "_time" in result:
         try:
              result["_time"] = time.ctime(float(result["_time"]))
         except:
              pass

# SPL-207377 - Normalize email address separators
def normalizeEmail(email, field, recipients):
    emailList = EMAIL_DELIM.split(email[field])
    recipients.extend(emailList)
    stripped = ','.join([str(elem) for elem in emailList])
    email.replace_header(field, stripped)

def mail(email, argvals, ssContent, sessionKey):

    sender     = email['From']
    use_ssl    = normalizeBoolean(ssContent.get('action.email.use_ssl', False))
    use_tls    = normalizeBoolean(ssContent.get('action.email.use_tls', False))
    server     = ssContent.get('action.email.mailserver', 'localhost')

    username   = argvals.get('username', '')
    password   = argvals.get('password', '')
    recipients = []

    if email['To']:
        normalizeEmail(email, 'To', recipients)
    if email['Cc']:
        normalizeEmail(email, 'Cc', recipients)
    if email['Bcc']:
        recipients.extend(EMAIL_DELIM.split(email['Bcc']))
        del email['Bcc']    # delete bcc from header after adding to recipients

    # Clear leading / trailing whitespace from recipients
    recipients = [r.strip() for r in recipients]
    validRecipients = []
    if ssContent.get('action.email.allowedDomainList') != "" and ssContent.get('action.email.allowedDomainList') != None:
        domains = []
        domains.extend(EMAIL_DELIM.split(ssContent['action.email.allowedDomainList']))
        domains = [d.strip() for d in domains]
        domains = [d.lower() for d in domains]
        recipients = [r.lower() for r in recipients]
        for recipient in recipients:
            dom = recipient.partition("@")[2]
            if not dom in domains:
                logger.error("For subject=%s, email recipient=%s is not among the alowedDomainList=%s in alert_actions.conf file. Removing it from the recipients list."
                             % (ssContent.get('action.email.subject'), recipient, ssContent.get('action.email.allowedDomainList')))
            else:
                validRecipients.append(recipient)
    else:
        validRecipients = recipients


    mail_log_msg = 'Sending email. subject="%s", encoded_subject="%s", results_link="%s", recipients="%s", server="%s"' % (
        ssContent.get('action.email.subject'),
        email['Subject'],
        ssContent.get('results_link'),
        str(validRecipients),
        str(server)
    )
    try:
        # make sure the sender is a valid email address
        if sender.find("@") == -1:
            sender = sender + '@' + socket.gethostname()
            if sender.endswith("@"):
              sender = sender + 'localhost'

        # setup the Open SSL Context
        sslHelper = ssl_context.SSLHelper()
        serverConfJSON = sslHelper.getServerSettings(sessionKey)
        # Pass in settings from alert_actions.conf into context
        ctx = sslHelper.createSSLContextFromSettings(
            sslConfJSON=ssContent.get('alertActions'),
            serverConfJSON=serverConfJSON,
            isClientContext=True)

        # send the mail
        if not use_ssl:
            smtp = secure_smtplib.SecureSMTP(host=server)
        else:
            smtp = secure_smtplib.SecureSMTP_SSL(host=server, sslContext=ctx)

        # smtp.set_debuglevel(1)

        if use_tls:
            smtp.starttls(ctx)
        if len(username) > 0 and password is not None and len(password) >0:
            smtp.login(username, password)

        if ssContent.get('action.email.allowedDomainList') != "" and ssContent.get('action.email.allowedDomainList') != None:
            if len(validRecipients) == 0:
                raise Exception("The email domains of the recipients are not among those on the allowed domain list.")
        
        # Installed SMTP daemon may not support UTF8. 
        # This can only be determined if SMTPNotSupportedError is raised. 
        # Try without SMTPUTF8 option if raised.
        try:
            # mail_options SMTPUTF8 allows UTF8 message serialization
            smtp.sendmail(sender, validRecipients, email.as_string(), mail_options=["SMTPUTF8"])
        except SMTPNotSupportedError:
            # sendmail is not configured to handle UTF8
            smtp.sendmail(sender, validRecipients, email.as_string())
        
        smtp.quit()
        if ssContent.get('action.email.allowedDomainList') != "" and ssContent.get('action.email.allowedDomainList') != None:
            if validRecipients != recipients:
                raise Exception("Not all of the recipient email domains are on the allowed domain list. Sending emails only to %s" % str(validRecipients))

        logger.info(mail_log_msg)

    except Exception as e:
        logger.error(mail_log_msg)
        raise

def sendEmail(results, settings, keywords, argvals):
    for key in argvals:
        if key != 'ssname':
            argvals[key] =  unquote(argvals[key])
    

    namespace       = settings['namespace']
    owner           = settings['owner']
    sessionKey      = settings['sessionKey']
    sid             = settings['sid']
    ssname          = argvals.get('ssname')
    isScheduledView = False
    is_stream_malert = normalizeBoolean(argvals.get('is_stream_malert'))

    # Use this way to GET the correct alert_actions.conf under corresponding app.
    entityClass = ['alerts', 'alert_actions', 'email']
    uri = entity.buildEndpoint(
        entityClass,
        namespace=namespace,
        owner=owner
    )
    responseHeaders, responseBody = simpleRequest(uri, method='GET', getargs={'output_mode':'json'}, sessionKey=sessionKey)
    alertEmail = json.loads(responseBody)
    alertContent = alertEmail['entry'][0]['content']
    alertContent['allowedDomainList'] = alertContent['allowedDomainList'].strip()

    if ssname: 
        # populate content with savedsearch
        if '_ScheduledView__' in ssname or argvals.get('pdfview'):
            if '_ScheduledView__' in ssname:
                ssname = ssname.replace('_ScheduledView__', '')
            else:
                ssname = argvals.get('pdfview')

            uri = entity.buildEndpoint(
                [ 'scheduled', 'views', ssname], 
                namespace=namespace, 
                owner=owner
            )
            isScheduledView = True

        else:
            if is_stream_malert:
                entityClass = ['alerts', 'metric_alerts']
            else:
                entityClass = ['saved', 'searches']
            entityClass.append(ssname)
            uri = entity.buildEndpoint(
                entityClass,
                namespace=namespace, 
                owner=owner
            )

        responseHeaders, responseBody = simpleRequest(uri, method='GET', getargs={'output_mode':'json'}, sessionKey=sessionKey)

        savedSearch = json.loads(responseBody)
        ssContent = savedSearch['entry'][0]['content']

        # set type of saved search
        if isScheduledView: 
            ssContent['type']  = 'view'
        elif is_stream_malert or savedSearchJSONIsAlert(savedSearch):
            ssContent['type']  = 'alert'
        else:
            ssContent['type']  = 'report'

        # remap needed attributes that are not already on the content
        ssContent['name']                 = ssname
        ssContent['app']                  = savedSearch['entry'][0]['acl'].get('app')
        ssContent['owner']                = savedSearch['entry'][0]['acl'].get('owner')

        # The footer.text key will always exist for type alert and report. 
        # It may not exist for scheduled views created before 6.1 therefore the schedule view default footer.text 
        # should be set if the key does not exist.
        # This can be removed once migration has happened to ensure scheduled views always have the footer.text attribute
        ssContent['action.email.footer.text'] = ssContent.get('action.email.footer.text', "If you believe you've received this email in error, please see your Splunk administrator.\r\n\r\nsplunk > the engine for machine data")

        # The message key will always exist for type alert and report. 
        # It may not exist for scheduled views created before 6.1 therefore the schedule view default message 
        # should be set if the key does not exist.
        # This can be removed once migration has happened to ensure scheduled views always have the message.view attribute
        ssContent['action.email.message'] = ssContent.get('action.email.message.' + ssContent.get('type'), 'A PDF was generated for $name$')
        if normalizeBoolean(ssContent.get('action.email.useNSSubject', False)):
            ssContent['action.email.subject'] = ssContent['action.email.subject.' + ssContent.get('type')]

        # prior to 6.1 the results link was sent as the argval sslink, must check both results_link
        # and sslink for backwards compatibility
        ssContent['results_link'] = argvals.get('results_link', argvals.get('sslink', ''))
        if normalizeBoolean(ssContent['results_link']) and normalizeBoolean(ssContent['type']):
            split_results_path = urllib.splitquery(ssContent.get('results_link'))[0].split('/')
            view_path = '/'.join(split_results_path[:-1]) + '/'
            ssType = ssContent.get('type')
            useGoLink = False
            if '@go' in split_results_path:
                useGoLink = True
            if ssType == 'alert':
                if is_stream_malert:
                    # SPL-174186
                    # Note: this will generate link like this:  http://<host:webport>/en-US/app/search/analysis_workspace?s=/servicesNS/<user>/<app>/alerts/metric_alerts/<alert_name>
                    # but the current MAW working link is this: http://<host:webport>/en-US/app/search/analysis_workspace?s=/servicesNS/<user>/<app>/saved/searches/<alert_name>
                    # If MAW UI can create new links for stream alert, this python code will work out of the box. Otherwise, we need to fix it at here.
                    ssContent['view_link'] = view_path + 'analytics_workspace?' + urllib.urlencode({'s': savedSearch['entry'][0]['links'].get('alternate')})
                elif useGoLink:
                    ssContent['view_link'] = view_path + '@go?' + urllib.urlencode({'s': savedSearch['entry'][0]['links'].get('alternate'), 'dispatch_view': 'alert'})
                else:
                    ssContent['view_link'] = view_path + 'alert?' + urllib.urlencode({'s': savedSearch['entry'][0]['links'].get('alternate')})
            elif ssType == 'report':
                if useGoLink:
                    ssContent['view_link'] = view_path + '@go?' + urllib.urlencode({'s': savedSearch['entry'][0]['links'].get('alternate'), 'sid': sid, 'dispatch_view': 'report'})
                else:
                    ssContent['view_link'] = view_path + 'report?' + urllib.urlencode({'s': savedSearch['entry'][0]['links'].get('alternate'), 'sid': sid})
            elif ssType == 'view':
                ssContent['view_link'] = view_path + ssContent['name']
            else:
                ssContent['view_link'] = view_path + 'search'
    else:
        if is_stream_malert:
            entityClass = ['alerts', 'metric_alerts']
        else:
            entityClass = ['saved', 'searches']
        entityClass.append('_new')
        #assumes that if no ssname then called from searchbar or test email
        uri = entity.buildEndpoint(
                entityClass,
                namespace=namespace,
                owner=owner
            )

        responseHeaders, responseBody = simpleRequest(uri, method='GET', getargs={'output_mode':'json'}, sessionKey=sessionKey)

        savedSearch = json.loads(responseBody)
        ssContent = savedSearch['entry'][0]['content']
        searchCommandSSContent = {
            'type': 'searchCommand',
            'view_link': '',
            'action.email.subject': 'Splunk Results'
        }
        ssContent.update(searchCommandSSContent)

        if normalizeBoolean(argvals.get('sendtestemail')):
            ssContent['type'] = 'view'
            if argvals.get('pdfview'):
                ssContent['name'] = argvals.get('pdfview')
                isScheduledView = True
            if not argvals.get('message'):
                ssContent['action.email.message'] = 'Search results attached.'

    ssContent['trigger_date'] = None
    ssContent['trigger_timeHMS'] = None
    ssContent['trigger_time'] = argvals.get('trigger_time')
    if normalizeBoolean(ssContent['trigger_time']):
        try:
            triggerSeconds = time.localtime(float(ssContent['trigger_time']))
            ssContent['trigger_date'] = time.strftime("%B %d, %Y", triggerSeconds)
            # %Z is deprecated, it does not work consistently between OSes
            ssContent['trigger_timeHMS'] = time.strftime("%H:%M:%S ", triggerSeconds) + format_local_tzoffset()
        except Exception as e:
            logger.error(e)

    # layer in arg vals
    if argvals.get('to'):
        ssContent['action.email.to'] = argvals.get('to')
    if argvals.get('bcc'):
        ssContent['action.email.bcc'] = argvals.get('bcc')
    if argvals.get('cc'):
        ssContent['action.email.cc'] = argvals.get('cc')
    if argvals.get('format'):
        ssContent['action.email.format'] = argvals.get('format')
    if argvals.get('from'):
        ssContent['action.email.from'] = argvals.get('from')
    if argvals.get('inline'):
        ssContent['action.email.inline'] = normalizeBoolean(argvals.get('inline'))
    if argvals.get('sendresults'):
        ssContent['action.email.sendresults'] = normalizeBoolean(argvals.get('sendresults'))
    if argvals.get('sendpdf'):
        ssContent['action.email.sendpdf'] = normalizeBoolean(argvals.get('sendpdf'))
    if argvals.get('pdfview'):
        ssContent['action.email.pdfview'] = argvals.get('pdfview')
    if argvals.get('papersize') or ssContent.get('action.email.papersize'):
        ssContent['action.email.reportPaperSize'] = argvals.get('papersize') or ssContent.get('action.email.papersize')
    if argvals.get('paperorientation') or ssContent.get('action.email.paperorientation'):
        ssContent['action.email.reportPaperOrientation'] = argvals.get('paperorientation') or ssContent.get('action.email.paperorientation')
    if argvals.get('sendcsv'):
        ssContent['action.email.sendcsv'] = normalizeBoolean(argvals.get('sendcsv'))
    if argvals.get('allow_empty_attachment'):
        ssContent['action.email.allow_empty_attachment'] = normalizeBoolean(argvals.get('allow_empty_attachment'))
    if argvals.get('pdf.logo_path'):
        ssContent['action.email.pdf.logo_path'] = argvals.get('pdf.logo_path')
    if argvals.get('escapeCSVNewline'):
        ssContent['action.email.escapeCSVNewline'] = normalizeBoolean(argvals.get('escapeCSVNewline'))
    ## if 'server' in arg is different than the one set in alert_action.conf, don't use default credentials.
    ## SPL-135659
    setDefaultUserCrendentials = 1
    if argvals.get('server'):
        alert_action_server = ssContent.get('action.email.mailserver', 'localhost')
        if alertContent.get('allowedDomainList') == "":
            ssContent['action.email.mailserver'] = argvals.get('server')
        else:
            logger.warn("When 'allowedDomainList' is setup, 'server' argument is not accepted in sendemail command. "
                        "The 'server' value is obtained from 'mailserver'=%s in alert_actions.conf." % alertContent.get('mailserver'))
        assigned_server = ssContent.get('action.email.mailserver', 'localhost')
        if str(alert_action_server) != str(assigned_server):
            setDefaultUserCrendentials = 0
    if argvals.get('subject'):
        ssContent['action.email.subject'] = argvals.get('subject')
    if argvals.get('footer'):
        ssContent['action.email.footer.text'] = argvals.get('footer')
    if argvals.get('width_sort_columns'):
        ssContent['action.email.width_sort_columns'] = normalizeBoolean(argvals.get('width_sort_columns'))
    if argvals.get('message'):
        ssContent['action.email.message'] = argvals.get('message')
    else:
        if ssContent['type'] == 'searchCommand':
            # set default message for searchCommand emails
            if ssContent['action.email.sendresults'] or ssContent['action.email.sendpdf'] or ssContent['action.email.sendcsv']:
                if ssContent.get('action.email.inline') and not(ssContent.get('action.email.sendpdf') or ssContent.get('action.email.sendcsv')):
                    ssContent['action.email.message'] = 'Search results.'
                else:
                    ssContent['action.email.message'] = 'Search results attached.'
            else:
                ssContent['action.email.message'] = 'Search complete.'
    if argvals.get('priority'):
        ssContent['action.email.priority'] = argvals.get('priority')
    if argvals.get('use_ssl'):
        ssContent['action.email.use_ssl'] = normalizeBoolean(argvals.get('use_ssl'))
    if argvals.get('use_tls'):
        ssContent['action.email.use_tls'] = normalizeBoolean(argvals.get('use_tls'))
    if argvals.get('content_type'):
        ssContent['action.email.content_type'] = argvals.get('content_type')
    # parse the result id for per_result_alert
    if argvals.get('results_file'):
        dirname, fname = os.path.split(argvals.get('results_file'))
        if dirname.endswith('per_result_alert'):
            results_ids = re.findall('^tmp_(\d+)\.', fname)
            if results_ids and len(results_ids) > 0:
                ssContent['action.per_alert_result_id'] = results_ids[0]
                logger.debug('Parsed action.per_alert_result_id=%s' % (ssContent['action.per_alert_result_id']))
            else:
                logger.warn('Cannot parse results_id=%s for per result alert' % (fname))
    ssContent['graceful'] = normalizeBoolean(argvals.get('graceful', 0))

    #if there is no results_link then do not incude it
    if is_stream_malert or not normalizeBoolean(ssContent.get('results_link')):
        ssContent['action.email.include.results_link'] = False

    #need for backwards compatibility
    format = ssContent.get('action.email.format')

    if format == 'html' or format == 'plain':
        ssContent['action.email.format'] = 'table'
        ssContent['action.email.content_type'] = format
    elif format == 'text':
        ssContent['action.email.content_type'] = 'plain'
        ssContent['action.email.format'] = 'table'
    elif format == 'pdf':
        ssContent['action.email.content_type'] = 'html'
        ssContent['action.email.format'] = 'table'

    #fetch server info
    uriToServerInfo = entity.buildEndpoint(['server', 'info'])
    serverInfoHeaders, serverInfoBody = simpleRequest(uriToServerInfo, method='GET', getargs={'output_mode':'json'}, sessionKey=sessionKey)
    
    serverInfo        = json.loads(serverInfoBody)
    serverInfoContent = serverInfo['entry'][0]['content']

    #fetch job info
    jobResponseHeaders = {} 
    jobResponseBody = { 
        'entry': [
            {
                'content': {}
            }
        ]
    }
    if sid: 
        uriToJob = entity.buildEndpoint(
            [
                'search', 
                'jobs', 
                sid
            ], 
            namespace=namespace, 
            owner=owner
        )
        jobResponseHeaders, jobResponseBody = simpleRequest(uriToJob, method='GET', getargs={'output_mode':'json'}, sessionKey=sessionKey)
        searchJob         = json.loads(jobResponseBody)
        jobContent        = searchJob['entry'][0]['content']
    else:
        jobContent        = jobResponseBody['entry'][0]['content']

    #fetch view info
    viewResponseHeaders = {}
    viewResponseBody = {
        'entry': [
            {
                'content': {}
            }
        ]
    }

    if isScheduledView:
        uriToView = entity.buildEndpoint(
            [
                'data',
                'ui',
                'views',
                ssContent['name']
            ],
            namespace=namespace,
            owner=owner
        )
        viewResponseHeaders, viewResponseBody = simpleRequest(uriToView, method='GET', getargs={'output_mode':'json'}, sessionKey=sessionKey)
        viewResponseBody = json.loads(viewResponseBody)

    viewContent = viewResponseBody['entry'][0]['content']

    if ssContent.get('action.email.allowedDomainList'):
        ssContent['action.email.allowedDomainList'] = ssContent['action.email.allowedDomainList'].strip()
        if ssContent.get('action.email.allowedDomainList') != alertContent.get('allowedDomainList'):
            ssContent['action.email.allowedDomainList'] = alertContent['allowedDomainList']
            logger.warn("For alert=%s, the 'allowedDomainList' value is always obtained from alert_actions.conf."
                        "The allowedDomainList=%s" % (ssname, alertContent.get('allowedDomainList')))

    if alertContent.get('allowedDomainList') != "":
        if ssContent.get('action.email.mailserver') != alertContent.get('mailserver'):
            ssContent['action.email.mailserver'] = alertContent['mailserver']
            logger.warn("For alert=%s, if a 'allowedDomainList' is specified, it uses the 'mailserver'=%s in alert_actions.conf." %
                        (ssname, ssContent.get('action.email.mailserver')))

    valuesForTemplate = buildSafeMergedValues(ssContent, results, serverInfoContent, jobContent, viewContent, argvals.get('results_file'))
    realize(valuesForTemplate, ssContent, sessionKey, namespace, owner, argvals)
    #Creation of the email object that is to be populated in the build
    #prefixed methods.
    content_type = ssContent.get('action.email.content_type')
    isHtmlBasedContentType = content_type in ['html', 'html_pdf']

    if isHtmlBasedContentType:
        email = MIMEMultipart('mixed')
        email.preamble = 'This is a multi-part message in MIME format.'
        emailBody = MIMEMultipart('alternative')
        email.attach(emailBody)
    else:
        email = emailBody = MIMEMultipart()

    #make time user readable
    resultsWithRenderedTime = copy.deepcopy(results)
    renderTime(resultsWithRenderedTime)

    #potentially mutate argvals if username/password are empty
    if setDefaultUserCrendentials:
        setUserCrendentials(argvals, settings)

    #build all the different email components
    jobCount = getJobCount(jobContent)
    #attachments must be built before body so body can inlclude errors cause by attachments but
    #must actually be attached after body
    toAttach = buildAttachments(settings, ssContent, resultsWithRenderedTime, email, jobCount, argvals)
    buildPlainTextBody(ssContent, resultsWithRenderedTime, settings, emailBody, jobCount)

    if isHtmlBasedContentType:
        buildHTMLBody(ssContent, resultsWithRenderedTime, settings, emailBody, email, jobCount)
    buildHeaders(argvals, ssContent, email, sid, serverInfoContent)
    #attach attachments
    for attachment in toAttach:
        email.attach(attachment)

    try:
        mail(email, argvals, ssContent, sessionKey)
    except Exception as e:
        errorMessage = str(e) + ' while sending mail to: ' + ssContent.get("action.email.to")
        logger.error(errorMessage)
        results = dcu.getErrorResults(results, ssContent['graceful'], errorMessage)
    return results

def buildSafeMergedValues(ssContent, results, serverInfoContent, jobContent, viewContent, results_file):
    mergedObject = {}
     #namespace the keys
    for key, value in jobContent.items():
        mergedObject['token.job.'+key] = value
    mergedObject['token.search_id'] = jobContent.get('sid')

    for key, value in ssContent.items():
        mergedObject['token.'+key] = value

    mergedObject['token.name'] = ssContent.get('name')
    mergedObject['token.app'] = ssContent.get('app')
    mergedObject['token.owner'] = ssContent.get('owner')

    for key, value in serverInfoContent.items():
        mergedObject['token.server.'+key] = value

    if viewContent:
        mergedObject['token.dashboard.title'] = mergedObject['token.dashboard.label'] = viewContent.get('label') if viewContent.get('label') else mergedObject['token.name']
        mergedObject['token.dashboard.id'] = mergedObject['token.name']
        mergedObject['token.dashboard.description'] = getDescriptionFromXml(viewContent.get('eai:data'))

    if results:
        r = results[0]
        for k in r:
            if k.startswith('__mv_'):
                continue
            if isinstance(r[k], list):
                mergedObject['token.result.'+k] = ' '.join(map(str,r[k]))
            else:
                mergedObject['token.result.'+k] = r[k]
        mergedObject['token.results.count'] = len(results)
    mergedObject['token.results.url'] = ssContent.get('results_link')
    mergedObject['token.results.file'] = results_file

    return mergedObject

def getDescriptionFromXml(xmlString):
    if xmlString:
        dashboardNode = et.fromstring(unicode(xmlString).encode('utf-8'))
        return dashboardNode.findtext('./description')
    else:
        return None

def realize(valuesForTemplate, ssContent, sessionKey, namespace, owner, argvals):
    stringsForPost = {}
    if ssContent.get('action.email.message'):
        stringsForPost['action.email.message'] = ssContent['action.email.message']

    if ssContent.get('action.email.cc'):
        stringsForPost['action.email.cc'] = ssContent['action.email.cc']

    if ssContent.get('action.email.bcc'):
        stringsForPost['action.email.bcc'] = ssContent['action.email.bcc']

    if ssContent.get('action.email.to'):
        stringsForPost['action.email.to'] = ssContent['action.email.to']

    if ssContent.get('action.email.subject'):
        stringsForPost['action.email.subject'] = ssContent['action.email.subject']

    if ssContent.get('action.email.footer.text'):
        # SPL-144752: allow footer to have no value at all if user choose to not have it.
        # This can be done by setting footer = " " (note the space in between)
        if len(ssContent['action.email.footer.text'].strip()) > 0:
            stringsForPost['action.email.footer.text'] = ssContent['action.email.footer.text']

    realizeURI = entity.buildEndpoint([ 'template', 'realize' ])

    postargs = valuesForTemplate
    postargs['output_mode'] = 'json'
    postargs['conf.recurse'] = 0
    try:
        for key, value in stringsForPost.items():
            if len(value.strip()) == 0:
                logger.warning('Token substitution may fail due to key:%s contains only whitespaces' % key)
            postargs['name'] = value
            headers, body = simpleRequest(
                realizeURI, 
                method='POST', 
                postargs=postargs, 
                sessionKey=sessionKey
            )
            body = json.loads(body)
            ssContent[key] = body['entry'][0]['content']['eai:data']
    except Exception as e:
        logger.error(e)
        # SPL-96721: email subject didn't get replaced, reset it to ssname
        if ssContent.get('action.email.subject') == stringsForPost.get('action.email.subject'):
            ssContent['action.email.subject'] = "Splunk Alert:"+argvals['ssname']
            ssContent['action.email.message'] = ssContent['action.email.message'] + "\n\nNOTE: The dynamic substitution of the email subject failed because of failed token substitution. A generic subject has been used instead. Please check splunkd.log for additional details."

def setUserCrendentials(argvals, settings):
    username    = argvals.get("username" , "")
    password    = argvals.get("password" , "")

    # fetch credentials from the endpoint if none are supplied or password is encrypted
    if (len(username) == 0 and len(password) == 0) or (password.startswith('$1$') or password.startswith('$7$')) :
        namespace  = settings.get("namespace", None)
        sessionKey = settings['sessionKey']

        username, password = getCredentials(sessionKey, namespace)
         
        argvals['username'] = username
        argvals['password'] = password

def getJobCount(jobContent):
    if jobContent.get('statusBuckets') == 0 or (normalizeBoolean(jobContent.get('reportSearch')) and not re.match('sendemail', jobContent.get('reportSearch'))):
        return jobContent.get('resultCount')
    else:
        return jobContent.get('eventCount')

# takes header, html, text
def buildHeaders(argvals, ssContent, email, sid, serverInfoContent):

    sender  = ssContent.get("action.email.from", "splunk")
    to      = ssContent.get("action.email.to")
    cc      = ssContent.get("action.email.cc")
    bcc     = ssContent.get("action.email.bcc")
    subject = ssContent.get("action.email.subject")
    priority = ssContent.get("action.email.priority", '')

    # use the Header object to specify UTF-8 msg headers, such as subject, to, cc etc
    email['Subject'] = Header(subject, CHARSET)

    recipients = []
    if to:
        email['To'] = to
    if sender:
        email['From'] = sender
    if cc:
        email['Cc'] = cc
    if bcc:
        email['Bcc'] = bcc

    email['Date'] = utils.formatdate(localtime=True)

    if priority:
        # look up better name
        val = IMPORTANCE_MAP.get(priority.lower(), '')
        # unknown value, use value user supplied
        if not val:
            val = priority
        email['X-Priority'] = val

    # trace info
    if ssContent.get('name'):
        email['X-Splunk-Name'] = ssContent.get('name')
    if ssContent.get('owner'):
        email['X-Splunk-Owner'] = ssContent.get('owner')
    if ssContent.get('app'):
        email['X-Splunk-App'] = ssContent.get('app')
    email['X-Splunk-SID'] = sid
    email['X-Splunk-ServerName'] = serverInfoContent.get('serverName')
    email['X-Splunk-Version'] = serverInfoContent.get('version')
    email['X-Splunk-Build'] = serverInfoContent.get('build')


def buildHTMLBody(ssContent, results, settings, emailbody, email, jobCount):
    messageHTML  = re.sub(r'\r\n?|\\r\\n?|\n|\\n', '<br />\r\n', htmlMessageTemplate().render(msg=ssContent.get('action.email.message')))
    resultsHTML = ''
    metaDataHTML = ''
    errorHTML = ''
    if ssContent['type'] == 'view':
        if normalizeBoolean(ssContent.get('action.email.include.view_link')) and ssContent.get('view_link'):
            metaDataHTML = htmlMetaDataViewTemplate().render(
                view_link=ssContent.get('view_link')
            )
    else:
        if ssContent['type'] != 'searchCommand':
            metaDataHTML = htmlMetaDataSSTemplate().render(
                jobcount=jobCount,
                results_link=ssContent.get('results_link'),
                include_results_link=normalizeBoolean(ssContent.get('action.email.include.results_link')),
                view_link=ssContent.get('view_link'),
                include_view_link=normalizeBoolean(ssContent.get('action.email.include.view_link')),
                name=ssContent.get('name'),
                include_search=normalizeBoolean(ssContent.get('action.email.include.search')),
                ssquery=ssContent.get('search'),
                include_smaDefinition=normalizeBoolean(ssContent.get('action.email.include.smaDefinition')),
                smaIndexes=ssContent.get('metric_indexes'),
                smaFilter=ssContent.get('filter'),
                smaGroupby=ssContent.get('groupby'),
                smaCondition=ssContent.get('condition'),
                smaThreshold=ssContent.get('trigger.threshold'),
                smaSuppress=ssContent.get('trigger.suppress'),
                smaEvaluationPerGroup=ssContent.get('trigger.evaluation_per_group'),
                smaActionPerGroup=ssContent.get('trigger.action_per_group'),
                smaTriggerPrepare=ssContent.get('trigger.prepare'),
                alert_type=ssContent.get('alert_type'),
                include_trigger=normalizeBoolean(ssContent.get('action.email.include.trigger')),
                include_inline=normalizeBoolean(ssContent.get('action.email.inline')),
                include_trigger_time=normalizeBoolean(ssContent.get('action.email.include.trigger_time')),
                trigger_date=ssContent.get('trigger_date'),
                trigger_timeHMS=ssContent.get('trigger_timeHMS'),
                ssType=ssContent.get('type'),
            )
        # need to check aciton.email.sendresults for type searchCommand
        if normalizeBoolean(ssContent.get('action.email.inline')) and normalizeBoolean(
                ssContent.get('action.email.sendresults')):
            resultsHTML = htmlResultsTemplate().render(
                include_results_link=normalizeBoolean(ssContent.get('action.email.include.results_link')),
                results_link=ssContent.get('results_link'),
                truncated=normalizeBoolean(settings.get('truncated')),
                resultscount=len(results),
                jobcount=jobCount,
                hasjob=normalizeBoolean(settings.get('sid'))
            )
            format = ssContent.get('action.email.format')
            if format == 'table':
                resultsHTML += htmlTableTemplate().render(results=results)
            elif format == 'raw':
                resultsHTML += htmlRawTemplate().render(results=results)
            elif format == 'csv':
                resultsHTML += htmlCSVTemplate().render(results=results)

    footerHTML = htmlFooterTemplate().render(footer=ssContent.get('action.email.footer.text'), re=re, filters=filters)
    errorHTML = htmlErrorTemplate().render(errors=ssContent.get('errorArray'))
    wrapperHTML = htmlWrapperTemplate().render(body=messageHTML + metaDataHTML + errorHTML + resultsHTML + footerHTML)
    emailbody.attach(MIMEText(wrapperHTML, 'html', _charset=CHARSET))


def htmlWrapperTemplate():
    return template.Template('''
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    </head>
    <body style="font-size: 14px; font-family: helvetica, arial, sans-serif; padding: 20px 0; margin: 0; color: #333;">
        ${body}
    </body>
</html>
    ''')

def htmlMetaDataSSTemplate():
    return template.Template('''
<table cellpadding="0" cellspacing="0" border="0" class="summary" style="margin: 20px;">
    <tbody>
        % if view_link and name and include_view_link:
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">${ssType.capitalize()}:</th><td style="padding: 0 0 10px 0;"><a href="${view_link}" style=" text-decoration: none; margin: 0 40px 0 0; color: #006d9c;">${name|h}</a></td>
        </tr>
        % endif
        % if ssquery and include_search:    
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">Search String:</th><td style="padding: 0 0 10px 0;">${ssquery|h}</td>
        </tr>
        % endif
        % if smaIndexes and include_smaDefinition:    
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">metric_indexes:</th><td style="padding: 0 0 10px 0;">${smaIndexes|h}</td>
        </tr>
        % endif
        % if smaFilter and include_smaDefinition:    
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">filter:</th><td style="padding: 0 0 10px 0;">${smaFilter|h}</td>
        </tr>
        % endif
        % if smaGroupby and include_smaDefinition:    
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">groupby:</th><td style="padding: 0 0 10px 0;">${smaGroupby|h}</td>
        </tr>
        % endif
        % if smaCondition and include_smaDefinition:    
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">condition:</th><td style="padding: 0 0 10px 0;">${smaCondition|h}</td>
        </tr>
        % endif
        % if smaThreshold and include_smaDefinition:    
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">trigger.threshold:</th><td style="padding: 0 0 10px 0;">${smaThreshold|h}</td>
        </tr>
        % endif
        % if smaSuppress and include_smaDefinition:    
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">trigger.suppress:</th><td style="padding: 0 0 10px 0;">${smaSuppress|h}</td>
        </tr>
        % endif
        % if smaEvaluationPerGroup and include_smaDefinition:    
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">trigger.evaluation_per_group:</th><td style="padding: 0 0 10px 0;">${smaEvaluationPerGroup|h}</td>
        </tr>
        % endif
        % if smaActionPerGroup and include_smaDefinition:    
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">trigger.action_per_group:</th><td style="padding: 0 0 10px 0;">${smaActionPerGroup|h}</td>
        </tr>
        % endif
        % if smaTriggerPrepare and include_smaDefinition:    
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">trigger.prepare:</th><td style="padding: 0 0 10px 0;">${smaTriggerPrepare|h}</td>
        </tr>
        % endif
        % if include_trigger and name and alert_type and ssType == "alert":
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">Trigger:</th><td style="padding: 0 0 10px 0;">Saved Search [${name|h}]: ${alert_type}
                % if alert_type == "number of events":
                    (${jobcount})
                % endif
                </td>
        </tr>
        % endif
        % if include_trigger_time and trigger_timeHMS and trigger_date and ssType == "alert":
        <tr>
            <th style="font-weight: normal; text-align: left; padding: 0 20px 10px 0;">Trigger Time:</th><td style="padding: 0 0 10px 0;">${trigger_timeHMS} on ${trigger_date}.</td>
        </tr>
        % endif
    </tbody>
</table>
% if not include_inline:
    % if include_results_link:
    <a href="${results_link|h}" style=" text-decoration: none; margin: 0 20px; color: #006d9c;">View results</a>
    % endif
% endif
''')

def htmlMetaDataViewTemplate():
    return template.Template('''
 <p><a href="${view_link}" style=" text-decoration: none; margin: 20px 40px 0 20px; color: #006d9c;">View dashboard</a></p>
''')

def htmlErrorTemplate():
    return template.Template('''
% if errors:
    <div style="border-top: 1px solid #c3cbd4;"></div>
    % for error in errors:
        <p style="margin: 20px;">${error|h}</p>
    % endfor
% endif
''')

def htmlResultsTemplate():
    return template.Template('''
<div style="margin-top: 10px; padding-top: 20px; border-top: 1px solid #c3cbd4;"></div>
% if truncated:
    %if jobcount:
<p style="margin: 0 20px;">Only the first ${resultscount} of ${jobcount} results are included below.
    %else:
<p style="margin: 0 20px;">Search results in this email have been truncated. 
    %endif
    %if include_results_link:
<a href="${results_link|h}" style=" text-decoration: none; margin: 0 0; color: #006d9c;">View all results</a> in Splunk.</p>
    %else:
</p>
    %endif
% elif include_results_link:
<div style="margin: 0 20px;">
    <a href="${results_link|h}" style=" text-decoration: none; color: #006d9c;">View results in Splunk</a>
</div>
% endif
''')

def htmlMessageTemplate():
    return template.Template('<div style="margin: 0 20px;">${msg|h}</div>')

def htmlFooterTemplate():
    return template.Template('''
<div style="margin-top: 10px; border-top: 1px solid #c3cbd4;"></div>
<% footerEscaped = filters.html_entities_escape(footer) %>
<% footerBreaks = re.sub(r'\\r\\n?|\\n', '<br>', footerEscaped) %>
<p style="margin: 20px; font-size: 11px; color: #999;">${footerBreaks}</p>
''')

def htmlTableTemplate():
    return template.Template('''
% if len(results) > 0:
<div style="margin:0">
    <div style="overflow: auto; width: 100%;">
        <table cellpadding="0" cellspacing="0" border="0" class="results" style="margin: 20px;">
            <tbody>
                <% cols = [] %>
                <tr>
                % for key,val in results[0].items():
                    % if not key.startswith("_") or key == "_raw" or key == "_time":
                        <% cols.append(key) %>
                        <th style="text-align: left; padding: 4px 8px; margin-bottom: 0px; border-bottom: 1px dotted #c3cbd4;">${key|h}</th>
                    % endif
                % endfor
                </tr>
                % for result in results:
                    <tr valign="top">
                    % for col in cols:
                        <td style="text-align: left; padding: 4px 8px; margin-top: 0px; margin-bottom: 0px; border-bottom: 1px dotted #c3cbd4;">
                            % if isinstance(result.get(col), list):
                                % for val in result.get(col):
                                    <pre style="font-family: helvetica, arial, sans-serif; white-space: pre-wrap; margin:0px;">${val|h}</pre>
                                % endfor
                            % else:
                                <pre style="font-family: helvetica, arial, sans-serif; white-space: pre-wrap; margin:0px;">${result.get(col)|h}</pre>
                            % endif
                        </td>
                    % endfor
                    </tr>
                % endfor
            </tbody>
        </table>
    </div>
</div>
% else:
        <div class="results" style="margin: 20px;">No results found.</div>
% endif
''')

def htmlRawTemplate():
    return template.Template('''
% if len(results) > 0:
    % if results[0].get("_raw"):
        <div style="margin: 20px;" class="events">
        % for result in results:
            <div class="event"style="border-bottom: 1px dotted #c3cbd4; padding: 5px 0; font-family: monospace; word-break: break-all;"><pre style="white-space: pre-wrap;">${result.get("_raw", "")|h}</pre></div>
        % endfor
        </div>
    % else:
        <div> The results contain no "_raw" field.  Please choose another inline format (csv or table).</div>
    % endif
% else:
    <div class="results" style="margin: 20px;">No results found.</div>
% endif
''')

def htmlCSVTemplate():
    return template.Template('''
% if len(results) > 0:
    <div style="margin: 20px;">
    <% cols = [] %>
    % for key,val in results[0].items():
        % if not key.startswith("_") or key == "_raw" or key == "_time":
            <% cols.append(key) %>
        % endif
    % endfor
${','.join(cols)|h}<br/>
    % for result in results:
        <% vals = [] %>
        % for col in cols:
            % if isinstance(result.get(col), list):
                <% vals.append(' '.join(map(str,result.get(col)))) %>
            % else:
                <% vals.append(result.get(col))%>
            % endif
        % endfor
${','.join(vals)|h}<br/>
    % endfor
    </div>
% else:
    <div class="results" style="margin: 20px;">No results found.</div>
% endif
''')

def buildPlainTextBody(ssContent, results, settings, email, jobCount):
    plainTextMsg = buildPlainTextMessage().render(msg=ssContent.get('action.email.message'))
    plainResults = ''
    plainTextMeta = ''
    plainError = ''
    if ssContent['type'] == 'view':
        if normalizeBoolean(ssContent.get('action.email.include.view_link')) and ssContent.get('view_link'):
            plainTextMeta = buildPlainTextViewMetaData().render(
                view_link=ssContent.get('view_link')
            )
        plainError = buildPlainTextError().render(errors=ssContent.get('errorArray'))
    else:
        if ssContent['type'] != 'searchCommand':
            plainTextMeta    = buildPlainTextSSMetaData().render(
                jobcount=jobCount,
                results_link=ssContent.get('results_link'),
                include_results_link=normalizeBoolean(ssContent.get('action.email.include.results_link')),
                view_link=ssContent.get('view_link'),
                include_view_link=normalizeBoolean(ssContent.get('action.email.include.view_link')),
                name=ssContent.get('name'),
                include_search=normalizeBoolean(ssContent.get('action.email.include.search')),
                ssquery=ssContent.get('search'),
                include_smaDefinition=normalizeBoolean(ssContent.get('action.email.include.smaDefinition')),
                smaIndexes=ssContent.get('metric_indexes'),
                smaFilter=ssContent.get('filter'),
                smaGroupby=ssContent.get('groupby'),
                smaCondition=ssContent.get('condition'),
                smaThreshold=ssContent.get('trigger.threshold'),
                smaSuppress=ssContent.get('trigger.suppress'),
                smaEvaluationPerGroup=ssContent.get('trigger.evaluation_per_group'),
                smaActionPerGroup=ssContent.get('trigger.action_per_group'),
                smaTriggerPrepare=ssContent.get('trigger.prepare'),
                alert_type=ssContent.get('alert_type'),
                include_trigger=normalizeBoolean(ssContent.get('action.email.include.trigger')),
                include_inline=normalizeBoolean(ssContent.get('action.email.inline')),
                include_trigger_time=normalizeBoolean(ssContent.get('action.email.include.trigger_time')),
                trigger_date=ssContent.get('trigger_date'),
                trigger_timeHMS=ssContent.get('trigger_timeHMS'),
                ssType=ssContent.get('type')
            )
        plainError = buildPlainTextError().render(errors=ssContent.get('errorArray'))
        # need to check aciton.email.sendresults for type searchCommand
        if normalizeBoolean(ssContent.get('action.email.inline')) and normalizeBoolean(ssContent.get('action.email.sendresults')):
            plainResults = plainResultsTemplate().render(
                include_results_link=normalizeBoolean(ssContent.get('action.email.include.results_link')),
                results_link=ssContent.get('results_link'),
                truncated=normalizeBoolean(settings.get('truncated')),
                resultscount=len(results),
                jobcount=jobCount,
                hasjob=normalizeBoolean(settings.get('sid'))
            )
            format = ssContent.get('action.email.format')
            if format == 'table':
                plainResults += plainTableTemplate(results, ssContent)
            elif format == 'raw':
                plainResults += plainRawTemplate().render(results=results)
            elif format == 'csv':
                plainResults += plainCSVTemplate(results)

    plainFooter = plainFooterTemplate().render(footer=ssContent.get('action.email.footer.text'))

    email.attach(MIMEText(plainTextMsg + plainTextMeta + plainError + plainResults + plainFooter, 'plain', _charset=CHARSET))

def buildPlainTextSSMetaData():
    return template.Template('''
 % if view_link and name and include_view_link:
${ssType.capitalize()} Title:      ${name}
${ssType.capitalize()} Location:   ${view_link}
% endif
% if ssquery and include_search:    
Search String:    ${ssquery}
% endif
% if smaIndexes and include_smaDefinition:    
metric_indexes:    ${smaIndexes}
% endif
% if smaFilter and include_smaDefinition:    
filter:    ${smaFilter}
% endif
% if smaGroupby and include_smaDefinition:    
groupby:    ${smaGroupby}
% endif
% if smaCondition and include_smaDefinition:    
condition:    ${smaCondition}
% endif
% if smaThreshold and include_smaDefinition:    
trigger.threshold:    ${smaThreshold}
% endif
% if smaSuppress and include_smaDefinition:    
trigger.suppress:    ${smaSuppress}
% endif
% if smaEvaluationPerGroup and include_smaDefinition:    
trigger.evaluation_per_group:    ${smaEvaluationPerGroup}
% endif
% if smaActionPerGroup and include_smaDefinition:    
trigger.action_per_group:    ${smaActionPerGroup}
% endif
% if smaTriggerPrepare and include_smaDefinition:    
trigger.prepare:    ${smaTriggerPrepare}
% endif
% if include_trigger and name and alert_type and ssType == "alert":
    % if alert_type == "number of events":
Trigger:          Saved Search [${name}]: ${alert_type} (${jobcount})
    % else:
Trigger:          Saved Search [${name}]: ${alert_type}
    %endif
% endif
% if include_trigger_time and trigger_timeHMS and trigger_date and ssType == "alert":
Trigger Time:     ${trigger_timeHMS} on ${trigger_date}.
% endif
% if not include_inline:
    % if include_results_link:
View results:     ${results_link}
    % endif
%endif
''')

def buildPlainTextViewMetaData():
    return template.Template('''

View dashboard:     ${view_link}

''')

def buildPlainTextMessage():
    return template.Template('${msg}')

def plainFooterTemplate():
    return template.Template('''
------------------------------------------------------------------------

${footer}
''')

def buildPlainTextError():
    return template.Template('''
% if errors:
------------------------------------------------------------------------
    % for error in errors:
${error}
    % endfor
% endif
''')

def plainResultsTemplate():
    return template.Template('''
------------------------------------------------------------------------
% if truncated:
    % if jobcount:
Only the first ${resultscount} of ${jobcount} results are included below.
    % else:
Search results in this email have been truncated.
    % endif
    % if include_results_link:
View all results in Splunk: ${results_link}
    % endif
% elif include_results_link:
View results in Splunk: ${results_link}
% endif
''')

# sort columns from shortest to largest
def getSortedColumns(results, width_sort_columns):
    if len(results) == 0:
        return []

    columnMaxLens = {}
    for result in results:
        for k,v in result.items():
            # ignore attributes that start with "_"
            if k.startswith("_") and k!="_raw" and k!="_time":
                continue
            if isinstance(v, list):
                v = getLongestString(v)

            newLen = len(str(v))
            oldMax = columnMaxLens.get(k, -1)
            
            #initialize the column width to the length of header (name)
            if oldMax == -1:
                columnMaxLens[k] = oldMax = len(k)
            if newLen > oldMax:
                columnMaxLens[k] = newLen

    colsAndCounts = []
    # sort columns iff asked to
    if width_sort_columns:
       colsAndCounts = sorted(columnMaxLens.items(), key=cmp_to_key(numsort))
    else:
       for k,v in results[0].items():
          if k in columnMaxLens:
             colsAndCounts.append([k, columnMaxLens[k]])

    return colsAndCounts

def getLongestString(valuesList):
    return max(map(str,valuesList), key=len)

def plainTableTemplate(results, ssContent):
    if len(results) > 0:
        width_sort_columns = normalizeBoolean(ssContent.get('action.email.width_sort_columns', True))
        columnMaxLens = getSortedColumns(results, width_sort_columns)
        text = "\n"
        space = " "*8
        
        # output column names
        for col, maxlen in columnMaxLens:
            val = col
            padsize = maxlen - len(val)
            text += val + ' '*padsize + space

        rowBorder = "-"*len(text)
        text += "\n" + rowBorder + "\n"

        # output each result's values
        for result in results:
            # maximum number of multivalue fields in any column for a given result
            maxFields = -1
            for col, maxlen in columnMaxLens:
                val = result.get(col, "")
                if isinstance(val, list):
                    maxFields = len(val) if len(val) > maxFields else maxFields
                    val = val[0]
                padsize = maxlen - len(val)
                # left justify ALL the columns
                text += val + ' '*padsize + space
            text += "\n"

            # add remaining multivalue items, if any
            if maxFields > -1:
                for row in range(1, maxFields):
                    for col, maxlen in columnMaxLens:
                        val = result.get(col, "")
                        if isinstance(val, list) and len(val) > row:
                            val = str(val[row])
                        else:
                            # no value in this row if it isn't a list
                            val = ""
                        padsize = maxlen - len(val)
                        text += val + ' '*padsize + space
                    text += "\n"

            text += rowBorder + "\n"

    else:
        text = "No results found."
    return text

def plainCSVTemplate(results):
    text = ""
    if len(results) > 0:
        cols = []
        for key,val in results[0].items():
            if not key.startswith("_") or key == "_raw" or key == "_time":
                cols.append(key)   
        text = ','.join(cols) +'\n'   
        for result in results:
            vals = []
            for col in cols:
                val = result.get(col)
                if isinstance(val, list):
                    val = ' '.join(map(str,val))
                vals.append(val)
            text += ','.join(vals) + '\n'
    else:
        text = "No results found."
    return text

def plainRawTemplate():
    return template.Template('''
% if len(results) > 0:
    % if results[0].get('_raw'):
        % for result in results:
${result.get("_raw", "")}\n
        % endfor
    % else:
The results contain no "_raw" field.  Please choose another inline format (csv or table).
    % endif
% else:
No results found.
% endif
''')


def buildAttachments(settings, ssContent, results, email, jobCount, argvals):
    toAttach    = []
    ssContent['errorArray'] = []
    sendpdf     = normalizeBoolean(ssContent.get('action.email.sendpdf', False))
    sendcsv     = normalizeBoolean(ssContent.get('action.email.sendcsv', False))
    allowEmpty  = normalizeBoolean(ssContent.get('action.email.allow_empty_attachment', False))
    sendresults = normalizeBoolean(ssContent.get('action.email.sendresults', False))
    inline      = normalizeBoolean(ssContent.get('action.email.inline', False))
    inlineFormat= ssContent.get('action.email.format')
    type        = ssContent['type']

    namespace   = settings['namespace']
    owner       = settings['owner']
    sessionKey  = settings['sessionKey']
    searchid    = settings.get('sid')
    
    pdfview      = ssContent.get('action.email.pdfview', '')
    subject      = ssContent.get("action.email.subject")
    ssName       = ssContent.get("name")
    server       = ssContent.get('action.email.mailserver', 'localhost')
    results_link = ssContent.get('results_link')

    paperSize        = ssContent.get('action.email.reportPaperSize', 'letter')
    paperOrientation = ssContent.get('action.email.reportPaperOrientation', 'portrait')
    pdfLogoPath  = ssContent.get('action.email.pdf.logo_path')

    # Despite being generically called a "view", a pdfview is _always_ the ID of
    # a splunk dashboard. Also see src/scheduler/SavedSearchAdminHandler.cpp's
    # definition of getDefaultScheduledView()
    isDashboard  = normalizeBoolean(pdfview)
    pdf          = None
    alertActions = getAlertActions(sessionKey)
    if alertActions:
        # Take ssContent first, then fallback to alertActions.
        ss_filename = ssContent.get('action.email.reportFileName', None)
        aa_filename = alertActions.get('reportFileName', None)
        fileName = ss_filename if ss_filename else aa_filename
        # Ideally we would retrieve the alert actions conf settings in mail()
        # which is where these settings are used. But we are already making
        # a REST call to get these settings, so we save these settings for later
        ssContent['alertActions'] = alertActions
    else:
        fileName = None

    if sendpdf:
        sendtestemail = normalizeBoolean(argvals.get('sendtestemail', False))
        # Dashboard PDF export *always* overrides allowEmpty (action.email.allow_empty_attachment)
        if len(results) == 0 and not allowEmpty and not sendtestemail and not isDashboard:
            logger.info("Not attaching pdf file due to no matching results and allow_empty_attachment=%s" % str(allowEmpty))
        else:
            import splunk.pdf.availability as pdf_availability
            pdfgen_available = pdf_availability.is_available(session_key=sessionKey)
            logger.info("pdfgen_available = %s" % pdfgen_available)

            try:
                if pdfgen_available:
                    result_id = None
                    if ssContent.get('action.per_alert_result_id'):
                        result_id = ssContent.get('action.per_alert_result_id')
                    # will raise an Exception on error
                    pdf = generatePDF(server, subject, searchid, settings, pdfview, ssName, paperSize,
                                          paperOrientation, pdfLogoPath, result_id)

            except Exception as e:
                logger.error("An error occurred while generating a PDF: %s" % e)
                ssContent['errorArray'].append("An error occurred while generating the PDF. Please see python.log for details.")

            if pdf:
                # build up filename to use with attachments
                props = {
                    "owner": owner or 'nobody',
                    "app": namespace,
                    "type": "dashboard" if isDashboard else type or "report",
                    "name": pdfview or ssName
                }
                filename = pu.makeReportName(pattern=fileName, type="pdf", reportProps=props)
                pdf.add_header('content-disposition', 'attachment', filename=filename)
                toAttach.append(pdf)

    # (type == searchCommand and sendresults and not inline) needed for backwards compatibility
    # (sendresults and not(sendcsv or sendpdf or inline) and inlineFormat == 'csv') 
    #       needed for backwards compatibility when we did not have sendcsv pre 6.1 SPL-79561
    if len(results) == 0 and not allowEmpty:
        logger.info("Not attaching csv file due to no matching results and allow_empty_attachment=%s" % str(allowEmpty))
    elif (sendcsv or (type == 'searchCommand' and sendresults and not inline) or (sendresults and not(sendcsv or sendpdf or inline) and inlineFormat == 'csv')):
        csvAttachment = MIMEBase("text", "csv")
        # SPL-179427 add choice whether to escape newlines
        escapeCSVNewline = normalizeBoolean(ssContent.get('action.email.escapeCSVNewline', True))
        csvAttachment.set_payload(generateCSVResults(results, escapeCSVNewline))
        encoders.encode_base64(csvAttachment)
        props = {
            "owner": owner or 'nobody',
            "app": namespace,
            "type": type,
            "name": ssName
        }
        filename = pu.makeReportName(pattern=fileName, type="csv", reportProps=props)
        csvAttachment.add_header('Content-Disposition', 'attachment', filename=filename)
        toAttach.append(csvAttachment)
        if normalizeBoolean(settings.get('truncated')):
            if normalizeBoolean(len(results)) and normalizeBoolean(jobCount):
                ssContent['errorArray'].append("Only the first %s of %s results are included in the attached csv." %(len(results), jobCount))
            else:
                ssContent['errorArray'].append("Attached csv results have been truncated.")

    return toAttach

def esc(val):
    return val.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")

def generateCSVResults(results, escapeCSVNewline):
    if len(results) == 0:
        return 'No matching events found.'

    header = []
    s = BytesIO()
    if sys.version_info >= (3, 0):
        # SPL-204962 Scheduled Jobs sendemail csv file Generated Extra Blank Rows
        # Per Python 3 csv documentation https://docs.python.org/3/library/csv.html, csv file objects should be opened with newline=''.
        #
        # Also in the **footnotes** of the documentation
        #   If newline='' is not specified, newlines embedded inside quoted fields will not be interpreted correctly,
        #   and on platforms that use \r\n linendings on write an extra \r will be added. It should always be safe to specify
        #   newline='', since the csv module does its own (universal) newline handling.
        t = TextIOWrapper(s, write_through = True, encoding='utf-8', errors='backslashreplace', newline='')
        w = csv.writer(t)
    else:
        w = csv.writer(s)
    
    
    if "_time" in results[0] : header.append("_time")
    if "_raw"  in results[0] : header.append("_raw")
    
    # for backwards compatibility remove all internal fields except _raw and _time
    for k in results[0].keys():
       if k.startswith("_") :
          continue
       header.append(k)
        

    w.writerow(header)
    # output each result's values
    for result in results:
        row = []
        for col in header:
            val = result.get(col,"")
            if isinstance(val, list):
                val = ' '.join(map(str,val))
            if (escapeCSVNewline):
                row.append(esc(val))
            else:
                row.append(val)

        w.writerow(row)
    return s.getvalue()

def generatePDF(serverURL, subject, sid, settings, pdfViewID, ssName, paperSize, paperOrientation, pdfLogoPath, resultId):
    """
    Reach out and retrieve a PDF copy of the search results if possible
    and return the MIME attachment
    """
    sessionKey = settings.get('sessionKey', None)
    owner = settings.get('owner', 'nobody')
    if not sessionKey:
        raise PDFException("Can't attach PDF - sessionKey unavailable")

    # build up parameters to the PDF server
    parameters = {}
    parameters['namespace'] = settings["namespace"]
    parameters['owner'] = owner
    if pdfViewID:
        parameters['input-dashboard'] = pdfViewID
    else:
        if ssName:
            parameters['input-report'] = ssName
            parameters['timezone'] = settings.get('timezone')
        elif sid:
            # in the event where sendemail is called from search
            # and we need to generate pdf re-run the search 
            job = search.getJob(sid, sessionKey=sessionKey)
            jsonJob = job.toJsonable(timeFormat='unix')

            searchToRun = jsonJob.get('search').strip()
            if searchToRun.lower().startswith('search '):
                searchToRun = searchToRun[7:]

            sendemailRegex = r'\|\s*sendemail'
            if (re.findall(sendemailRegex, searchToRun)):
                parameters['input-search'] = re.split(sendemailRegex, searchToRun)[0]
                parameters['et'] = jsonJob.get('earliestTime')
                parameters['lt'] = jsonJob.get('latestTime')
            else:
                raise PDFException("Can't attach PDF - ssName and pdfViewID unavailable")

    if sid:
        if type(sid) is dict:
            for sidKey in sid:
                parameters[sidKey] = sid[sidKey]
        else:    
            parameters['sid'] = sid
    
    if paperSize and len(paperSize) > 0:
        if paperOrientation and paperOrientation != "portrait":
            parameters['paper-size'] = "%s-%s" % (paperSize, paperOrientation)
        else:
            parameters['paper-size'] = paperSize

    if pdfLogoPath:
        parameters['pdf.logo_path'] = pdfLogoPath

    if resultId:
        parameters['result_id'] = resultId

    # determine if we should set an effective dispatch "now" time for this job
    scheduledJobEffectiveTime = getEffectiveTimeOfScheduledJob(settings.get("sid", ""))
    logger.info("sendemail:mail effectiveTime=%s" % scheduledJobEffectiveTime) 
    if scheduledJobEffectiveTime != None:
        parameters['now'] = scheduledJobEffectiveTime  
 
    try:
        response, content = simpleRequest("pdfgen/render", sessionKey = sessionKey, postargs = parameters, timeout = PDFGEN_SIMPLE_REQUEST_TIMEOUT)

    except splunk.SplunkdConnectionException as e:
        raise PDFException("Failed to fetch PDF (SplunkdConnectionException): %s" % str(e))

    except Exception as e:
        raise PDFException("Failed to fetch PDF (Exception type=%s): %s" % (str(type(e)), str(e)))

    if response['status']!='200':
        raise PDFException("Failed to fetch PDF (status = %s): %s" % (str(response['status']), str(content)))

    if response['content-type']!='application/pdf':
        raise PDFException("Failed to fetch PDF (content-type = %s): %s" % (str(response['content-type']), str(content)))

    mpart = MIMEApplication(content, 'pdf')
    logger.info('Generated PDF for email')
    return mpart

def getEffectiveTimeOfScheduledJob(scheduledJobSid):
    """ parse out the effective time from the sid of a scheduled job
        if no effective time specified, then return None
        scheduledJobSid is of form: scheduler__<owner>__<namespace>_<hash>_at_<epoch seconds>_<mS> """
    scheduledJobSidParts = scheduledJobSid.split("_")
    effectiveTime = None
    if "scheduler" in scheduledJobSidParts and len(scheduledJobSidParts) > 4 and scheduledJobSidParts[-3] == "at":
        secondsStr = scheduledJobSidParts[-2]
        try:
            effectiveTime = int(secondsStr)
        except:
            pass

    return effectiveTime


def getCredentials(sessionKey, namespace):
   try:
      ent = entity.getEntity('admin/alert_actions', 'email', namespace=namespace, owner='nobody', sessionKey=sessionKey)
      if 'auth_username' in ent and 'clear_password' in ent:
          encrypted_password = ent['clear_password']
          splunkhome = os.environ.get('SPLUNK_HOME')
          if splunkhome == None:
              logger.error('getCredentials - unable to retrieve credentials; SPLUNK_HOME not set')
              return None
          #if splunk home has white spaces in path
          splunkhome='\"' + splunkhome + '\"'
          if sys.platform == "win32":
              encr_passwd_env = "\"set \"ENCRYPTED_PASSWORD=" + encrypted_password + "\" "
              commandparams = ["cmd", "/C", encr_passwd_env, "&&", os.path.join(splunkhome, "bin", "splunk"), "show-decrypted", "--value", "\"\"\""]
          else:
              encr_passwd_env = "ENCRYPTED_PASSWORD='" + encrypted_password + "'"
              commandparams = [encr_passwd_env, os.path.join(splunkhome, "bin", "splunk"), "show-decrypted", "--value", "''"]
          command = ' '.join(commandparams)
          stream = os.popen(command)
          clear_password = stream.read()
          #the decrypted password is appended with a '\n'
          if len(clear_password) >= 1:
              clear_password = clear_password[:-1]
          return ent['auth_username'], clear_password
   except Exception as e:
      logger.error("Could not get email credentials from splunk, using no credentials. Error: %s" % (str(e)))

   return '', ''


def getAlertActions(sessionKey):
    settings = None
    try:
        settings = entity.getEntity('/configs/conf-alert_actions', 'email', sessionKey=sessionKey)

        logger.debug("sendemail.getAlertActions conf file settings %s" % settings)
    except Exception as e:
        logger.error("Could not access or parse email stanza of alert_actions.conf. Error=%s" % str(e))

    return settings

def sendHealthAlertEmail(results, settings):
    """
    This function will only be called to send health report alerting emails.
    Email parameters will be passed through settings/results.
    """

    if not results or len(results) < 1:
        logger.error("There is no email content specified.")
        return

    if not settings.get('to') and not settings.get('cc') and not settings.get('bcc'):
        logger.error("There are no recipients specified")
        return

    sessionKey = ""
    alertConfig = {}
    email = MIMEMultipart()
    if settings.get('to'):
        email['To'] = settings.get('to')
    if settings.get('cc'):
        email['Cc'] = settings.get('cc')
    if settings.get('bcc'):
        email['Bcc'] = settings.get('bcc')

    if settings.get('from'):
        email['From'] = settings.get('from')
    alertConfig['action.email.use_ssl'] = normalizeBoolean(settings.get('use_ssl'))
    alertConfig['action.email.use_tls'] = normalizeBoolean(settings.get('use_tls'))
    if settings.get('mailserver'):
        alertConfig['action.email.mailserver'] = settings.get('mailserver')

    if settings.get('auth_username'):
        argvals['username'] = settings.get('auth_username')
    if settings.get('auth_password'):
        argvals['password'] = settings.get('auth_password')

    email['Subject'] = Header(results[0].get('subject'), CHARSET)
    plainMsg = results[0].get('plain_msg')
    email.attach(MIMEText(plainMsg, 'plain', _charset=CHARSET))

    try:
        mail(email, argvals, alertConfig, sessionKey)
    except Exception as e:
        errorMessage = 'Error sending Health Report alert. Error="%s".' % e
        logger.error(errorMessage)

    # For health report email alert, don't need return results.
    return None

def createOrganizedResultBuffer(buffer):
    # creates the readable buffer for reading search results into the send email script
    return TextIOWrapper(buffer, encoding='utf-8', errors='backslashreplace')

if __name__ == '__main__':
    if sys.version_info >= (3, 0):
        # We need to support data of non utf-8 encodings coming into this script, to do that,
        # we allow utf-8 errors 
        input_buf = createOrganizedResultBuffer(sys.stdin.buffer)
    else:
        input_buf = sys.stdin
    results, dummyresults, settings = splunk.Intersplunk.getOrganizedResults(input_buf)
    try:
        keywords, argvals = splunk.Intersplunk.getKeywordsAndOptions(CHARSET)

        logger.debug('SENDEMAIL keywords: %s, argvals: %s' % (keywords, argvals))

        if 'is_health_alert' in argvals:
            results = sendHealthAlertEmail(results, settings)
        else:
            if results or 'ssname' in argvals:
                results = sendEmail(results, settings, keywords, argvals)
            elif 'sendtestemail' in argvals:
                if normalizeBoolean(argvals.get('sendtestemail')):
                    results = sendEmail(results, settings, keywords, argvals)
            else:
                logger.warn("search results is empty, no email will be sent")
    except Exception as e:
        logger.exception(e)
    splunk.Intersplunk.outputResults(results)

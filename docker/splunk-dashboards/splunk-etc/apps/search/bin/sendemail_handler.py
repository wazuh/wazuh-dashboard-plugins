import re
from smtplib import SMTPNotSupportedError 
import socket

from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import splunk.admin as admin
import splunk.entity as en
import splunk.mining.dcutils as dcu
import splunk.secure_smtplib as secure_smtplib
import splunk.ssl_context as ssl_context

logger = dcu.getLogger()

charset = "UTF-8"
EMAIL_DELIM = re.compile('\s*[,;]\s*')

def isASCII(str):
    for i in str:
        if ord(i) > 127:
            return False
    return True

def toBool(strVal):
   if strVal == None:
       return False

   lStrVal = strVal.lower()
   if lStrVal == "true" or lStrVal == "t" or lStrVal == "1" or lStrVal == "yes" or lStrVal == "y" :
       return True 
   return False


class SendemailRestHandler(admin.MConfigHandler):

  def __init__(self, scriptMode, ctxInfo):
      admin.MConfigHandler.__init__(self, scriptMode, ctxInfo)
      self.shouldAutoList = False

  # get firs arg
  def gfa(self, name, defaultVal=''):
      if self.hasNonEmptyArg(name):
         val = self.callerArgs.get(name, [defaultVal])[0]
         if val != None: return val
      return defaultVal

  def hasNonEmptyArg(self, name):
      return name in self.callerArgs and self.callerArgs.get(name) != None

  def setup(self):
    if self.requestedAction == admin.ACTION_CREATE or self.requestedAction == admin.ACTION_EDIT:
      for arg in ['to', 'body']:
          self.supportedArgs.addReqArg(arg)

      for arg in ['cc', 'bcc', 'from', 'subject', 'format', 'username', 'password', 'server', 'use_ssl', 'use_tls']:
          self.supportedArgs.addOptArg(arg)

  def handleList(self, confInfo):
      pass 
  
  def handleCreate(self, confInfo):
    message = MIMEMultipart()
  
    subject    = self.gfa('subject')
    body       = self.gfa('body')
    bodyformat = self.gfa('format', 'html')

    server = self.gfa('server', 'localhost')

    username   = self.gfa('username')
    password   = self.gfa('password')

    use_ssl    = toBool(self.gfa('use_ssl'))
    use_tls    = toBool(self.gfa('use_tls'))

    sessionKey = self.getSessionKey()

    sslSettings = self.getAlertActions(sessionKey)

    # Open debate whether we should get user and password from alert actions
    # username = sslSettings.get('auth_username', '')
    # password = sslSettings.get('clear_password', '')

    if isASCII(subject):
        message['Subject'] = subject
    else:
        message['Subject'] = Header(subject, charset)

    recipients = []
    for t in self.callerArgs.get('to'):
        recipients.extend(EMAIL_DELIM.split(t))
    message['To'] = ', '.join(self.callerArgs.get('to'))

    if self.hasNonEmptyArg('cc') :
       cc = [x for x in self.callerArgs.get('cc') if x != None]
       if len(cc) > 0:
           message['Cc'] = ', '.join(cc)
           for t in cc:
               recipients.extend(EMAIL_DELIM.split(t))

    if self.hasNonEmptyArg('bcc'):
       bcc = [x for x in self.callerArgs.get('bcc') if x != None]
       if len(bcc) > 0:
          message['Bcc'] = ', '.join(bcc)
          for t in bcc:
              recipients.extend(EMAIL_DELIM.split(t))

    sender = 'splunk'
    if self.hasNonEmptyArg('from'):
       sender = self.gfa('from')

    if sender.find("@") == -1:
       sender = sender + '@' + socket.gethostname()
       if sender.endswith("@"):
          sender = sender + 'localhost'

    message['From'] = sender

    message.attach(MIMEText(body, bodyformat, _charset=charset))

    if use_ssl or use_tls:
        sslHelper = ssl_context.SSLHelper()
        serverConfJSON = sslHelper.getServerSettings(sessionKey)
        # Pass in settings from alert_actions.conf into context
        ctx = sslHelper.createSSLContextFromSettings(
            sslConfJSON=sslSettings,
            serverConfJSON=serverConfJSON,
            isClientContext=True)

    # send the mail
    if not use_ssl:
        smtp = secure_smtplib.SecureSMTP(host=server)
    else:
        smtp = secure_smtplib.SecureSMTP_SSL(host=server, sslContext=ctx)

    if use_tls:
        smtp.starttls(ctx)
    if len(username) > 0 and len(password) > 0:
        smtp.login(username, password)

    # Installed SMTP daemon may not support UTF8. 
    # This can only be determined if SMTPNotSupportedError is raised. 
    # Try without SMTPUTF8 option if raised.
    try:
        # mail_options SMTPUTF8 allows UTF8 message serialization
        smtp.sendmail(sender, recipients, message.as_string(), mail_options=["SMTPUTF8"])
    except SMTPNotSupportedError:
        # sendmail is not configured to handle UTF8
        smtp.sendmail(sender, recipients, message.as_string())
    
    smtp.quit()

  def getAlertActions(self, sessionKey):
    settings = None
    try:
        settings = en.getEntity('/configs/conf-alert_actions', 'email', sessionKey=sessionKey)
        logger.debug("sendemail_handler.getAlertActions conf file settings %s" % settings)
    except Exception as e:
        logger.error("Could not access or parse email stanza of alert_actions.conf. Error=%s" % str(e))

    return settings

# initialize the handler
admin.init(SendemailRestHandler, admin.CONTEXT_APP_AND_USER)


import appsmanager
import splunk
import splunk.admin as admin
import splunk.appbuilder as appbuilder
import re
import os
import json
from splunk.clilib.bundle_paths import make_splunkhome_path
import splunk.clilib.cli_common as cli_common

HTTP_POST_TEMPLATE   = "template"
HTTP_POST_LABEL      = "label"
HTTP_POST_DESC       = "description"
HTTP_POST_VISIBLE    = "visible"
HTTP_POST_AUTHOR     = "author"
HTTP_POST_CONFIGURED = "configured"
HTTP_POST_VERSION    = "version"

ACTION_PACKAGE = "package"
ACTION_DEPENDENCIES = "dependencies"
EDIT_LOCAL_APPS_CAP_EXPR = "edit_local_apps"
AAO_OR_EDIT_LOCAL_APPS_CAP_EXPR = "admin_all_objects or edit_local_apps"

DEFAULT_TEMPLATE = "barebones"

class LocalAppsHandler(admin.MConfigHandler):
    def __init__(self, scriptMode, ctxInfo):
        admin.MConfigHandler.__init__(self, scriptMode, ctxInfo)
        # This handler already lists upon create/edit, turn this off.
        self.shouldAutoList = False

    '''
    Set up supported arguments
    '''
    def setup(self):
        enableInstallApps = cli_common.getConfKeyValue("limits", "auth", "enable_install_apps")

        if self.requestedAction == admin.ACTION_CREATE:
            # Let the C++ handler do all the validation work.
            self.supportedArgs.addOptArg('*')
            # SPL-207748: implementing auth for localapps-python endpoint
            if (splunk.util.normalizeBoolean(enableInstallApps)):
                self.setWriteCapability(EDIT_LOCAL_APPS_CAP_EXPR)
            else:
                # default
                self.setWriteCapability(AAO_OR_EDIT_LOCAL_APPS_CAP_EXPR)

        if self.customAction == ACTION_PACKAGE:
            # SPL-158999: to support merge-local-meta and exclude-local-meta parameters
            self.supportedArgs.addOptArg('merge-local-meta')
            self.supportedArgs.addOptArg('exclude-local-meta')

            if (splunk.util.normalizeBoolean(enableInstallApps)):
                self.customActionCap = EDIT_LOCAL_APPS_CAP_EXPR
                return

            # default
            self.customActionCap = AAO_OR_EDIT_LOCAL_APPS_CAP_EXPR


    '''
    Create a new application
    '''
    def handleCreate(self, confInfo):
        args = self.callerArgs.data
        
        # Sanity checking for app ID: no special chars and shorter than 100 chars
        appName = self.callerArgs.id
        if not appName or len(appName) == 0:
            raise admin.ArgValidationException('App folder name is not set.')
        
        if re.search('[^A-Za-z0-9._-]', appName):
            raise admin.ArgValidationException('App folder name cannot contain spaces or special characters.')
            
        if len(appName) > 100:
            raise admin.ArgValidationException('App folder name cannot be longer than 100 characters.')

        kwargs = {
            'label'       : _getFieldValue(args, HTTP_POST_LABEL, appName, maxLen=100),
            'visible'     : _getFieldValue(args, HTTP_POST_VISIBLE, 'true'),
            'author'      : _getFieldValue(args, HTTP_POST_AUTHOR, '', maxLen=100),
            'description' : _getFieldValue(args, HTTP_POST_DESC, '', maxLen=500),
            'configured'  : _getFieldValue(args, HTTP_POST_CONFIGURED, '0'),
            'version'     : _getFieldValue(args, HTTP_POST_VERSION, '1.0.0')
        }
        template = _getFieldValue(args, HTTP_POST_TEMPLATE, DEFAULT_TEMPLATE)

        if re.match("^\d{1,3}\.\d{1,3}\.\d{1,3}(\s?\w[\w\d]{,9})?$", kwargs['version']) is None:
            raise admin.ArgValidationException("Version '%s' is invalid. Use the version format 'major.minor.patch', for example '1.0.0'." % kwargs['version'])
        
        try:    
            url = appbuilder.createApp(appName, template, **kwargs)
            appbuilder.addUploadAssets(appName)
        except splunk.RESTException as e:
            raise admin.InternalException(e.msg)
            
        confInfo[appName].append('name', appName)
        for field in kwargs:
            confInfo[appName].append(field, kwargs[field])
            
    '''
    Controls local applications
    '''
    def handleEdit(self, confInfo):
        appName = self.callerArgs.id
        appbuilder.addUploadAssets(appName)

    '''
    Handles other commands
    '''
    def handleCustom(self, confInfo):
        action = self.customAction
        actionType = self.requestedAction
        if self.customAction == ACTION_PACKAGE:
            if appsmanager.isCloud(self.getSessionKey()):
                raise admin.BadActionException("'package' action is not supported for Splunk Cloud.")

            # Create a package of an application
            confInfo.addWarnMsg('The package action has been deprecated.')
            appName = self.callerArgs.id
            # obtain merge-local-meta and exclude-local-meta parameters
            # if the respective arguments are not passed, we want to package local.meta and default.meta as is
            mergeLocalMeta = self.callerArgs.get('merge-local-meta', ['f'])[0]
            excludeLocalMeta = self.callerArgs.get('exclude-local-meta', ['f'])[0]
            try:
                mergeLocalMeta = splunk.util.normalizeBoolean(mergeLocalMeta, enableStrictMode=True)
                excludeLocalMeta = splunk.util.normalizeBoolean(excludeLocalMeta, enableStrictMode=True)
            except ValueError as e:
                raise admin.ArgValidationException("Incorrect parameter value. Please specify one of the following: "
                                                    "true/false, t/f, or 0/1.")
            if (mergeLocalMeta and excludeLocalMeta):
                raise admin.ArgValidationException("Invalid parameter specification. Both -merge-local-meta and "
                                                    "-exclude-local-meta cannot be \"true\" at the same time.")

            try:
                url, path = appbuilder.packageApp(appName, excludeLocalMeta=excludeLocalMeta, mergeLocalMeta=mergeLocalMeta)

                confInfo['Package'].append('name', appName)
                confInfo['Package'].append('url', url)
                confInfo['Package'].append('path', path)

            except splunk.RESTException as e:
                raise admin.ArgValidationException(e.msg)
        elif self.customAction == ACTION_DEPENDENCIES:
            self.getAppDependencies(self.callerArgs.id, confInfo)

    '''
    This handler is overridden by UIAppsHandler
    '''
    def handleList(self, confInfo):
        pass

    '''
    Get application dependencies from its manifest file
    '''

    def getAppDependencies(self, app, confInfo):
        app_location = make_splunkhome_path(['etc', 'apps', app])
        if not os.path.isdir(app_location):
            raise splunk.ResourceNotFound('App %s does not exist.' % app)

        manifestFile = os.path.join(app_location, 'app.manifest')
        if not os.path.exists(str(manifestFile)):
            # not an error, app manifest is optional
            confInfo.addInfoMsg('Application manifest file is missing.')
            return

        # read app manifest chopping possible comments (that start with '#')
        manifest = ''.join([line.split('#')[0] for line in open(manifestFile, 'r').readlines()])

        # parse manifest, possible errors will bubble to REST reply
        manifest = json.loads(manifest)

        dependencies = manifest.get('dependencies')
        if dependencies is None:
            confInfo.addInfoMsg("Application manifest doesn't include dependencies.")
            return
   
        # construct reply
        reply = confInfo[app]
        for dependency, properties in dependencies.items():
            # Convert properties to STR as it returns unicode           
            reply[dependency] = str(properties.get("version"))

def _getFieldValue(args, fieldName, defaultVal=None, maxLen=None):
    value = args[fieldName][0] or defaultVal if fieldName in args else defaultVal
    if value and maxLen and len(value) > maxLen:
        raise admin.ArgValidationException('App %(fieldName)s cannot be longer than %(maxLen)s characters.'
                % {'fieldName' : fieldName, 'maxLen' : maxLen} )
    return value

# initialize the handler, and add the actions it supports.    
admin.init(LocalAppsHandler, admin.CONTEXT_NONE)


import splunk
import splunk.admin as admin
import splunk.entity as en
import copy
#from core.manager import logger
import logging

logger = logging.getLogger("splunk")

class BaseRestHandler(admin.MConfigHandler):
    
    def __init__(self, *args, **kwargs):
        admin.MConfigHandler.__init__(self, *args, **kwargs)

    def model(self):
        return self._model

    def get_method(self, name):
        return getattr(self._model, name, None)
    
    def setup(self):

        if 0 != len(self.customAction):
            # let go while custom action is for acl.
            if self.customAction in ['acl']: return
            
        elif self.requestedAction in [admin.ACTION_CREATE, admin.ACTION_EDIT]:
            for arg in self._model.required_args:
                self.supportedArgs.addReqArg(arg)

            for arg in self._model.optional_args:
                self.supportedArgs.addOptArg(arg)

    def getSortDir(self):
        ''' return correct sort direction '''
        if self.sortAscending:
            return 'asc'
        else:
            return 'desc'
        
    def makeConfItem(self, name, obj, confInfo):
        ''' given a name and entity object, return a confItem '''
        confItem = confInfo[name]
        for key, val in obj.items():
            confItem[key] = str(val)
        acl = {}
        for k, v in obj[admin.EAI_ENTRY_ACL].items():
            if None != v:
                acl[k] = v
        confItem.setMetadata(admin.EAI_ENTRY_ACL, acl)
        
        #add links
        confItem.removeAllActions()
        
        #need to write out a bitfield to the XML that encodes the actions
        for action, link in obj.links:
            if action == 'create':
                confItem.actions |= admin.ACTION_CREATE
            elif action == 'list':
                confItem.actions |= admin.ACTION_LIST
            elif action == 'edit':
                confItem.actions |= admin.ACTION_EDIT
            elif action == 'remove':
                confItem.actions |= admin.ACTION_REMOVE
            elif action == 'members':
                confItem.actions |= admin.ACTION_MEMBERS
            elif action == '_reload':
                confItem.actions |= admin.ACTION_RELOAD
            
        return confItem

    def handleList(self, confInfo):
        if self.callerArgs.id is None:
            ent = self.all()

            for name, obj in ent.items():
                confItem = self.makeConfItem(name, obj, confInfo)
        else:
            try:
                ent = self.get()
           
                confItem = self.makeConfItem(self.callerArgs.id, ent, confInfo)
            except splunk.ResourceNotFound:
                pass

    def handleACL(self, confInfo):
        try:
            ent = self.get()
            meta = ent[admin.EAI_ENTRY_ACL]
            
            # for POST acl only.
            if self.requestedAction in [admin.ACTION_CREATE, admin.ACTION_EDIT] and len(self.callerArgs.data)>0:
                
                # control only update acl data, no more other fields
                ent.properties = dict()
                
                ent['sharing'] = meta['sharing']
                ent['owner'] = meta['owner']
                
                # SPL-69050 and SPL-68306
                ent['perms.read'] = [None]
                ent['perms.write'] = [None]
                
                '''                
                if 'perms' in meta:
                    perms = meta['perms']
                    
                    # SPL-67185
                    if perms and isinstance(perms, dict):
                        if 'write' in perms:
                            ent['perms.write'] = perms['write'] 
                        if 'read' in perms:
                            ent['perms.read'] = perms['read']
                '''
                
                # user should not POST non acl related fields, if so, it will throw errors anyway.
                for k, v in self.callerArgs.data.items():
                    ent[k] = v
                    
                en.setEntity(ent, self.getSessionKey(), uri=ent.id+'/acl')
                ent = self.get()

            confItem = confInfo[self.callerArgs.id]
            acl = copy.deepcopy(meta)
            confItem.actions = self.requestedAction
            confItem.setMetadata(admin.EAI_ENTRY_ACL, acl)

        except splunk.ResourceNotFound as ex:
            logger.exception('handleACL Failed - arguments = %s, exception = %s' % (self.callerArgs, ex))
            
    def handleCreate(self, confInfo):
        logger.debug('handleCreate is called. -- action = %s, id = %s' % (self.customAction, self.callerArgs.id))
        try:
            args = self.getCallerArgs()
            self.create(**args)
        except BaseException as ex:
            logger.exception('handleCreate Failed - arguments = %s, exception = %s' % (self.callerArgs, ex))
            #raise an exception when we fail to create!
            raise admin.AlreadyExistsException('Failed to create model: %s' % (self.callerArgs.id))

        self.handleList(confInfo)

    def handleRemove(self, confInfo):
        try:
            self.delete()
        except BaseException as ex:
            #for datamodel, throw an exception when remove fails.
            raise admin.InternalException('Failed to delete model: %s' % (self.callerArgs.id))

    def handleEdit(self, confInfo):
        logger.debug('handleEdit is called. -- action = %s, id = %s' % (self.customAction, self.callerArgs.id))

        try:
            args = self.getCallerArgs()
            self.update(**args)
            self.handleList(confInfo)
        except BaseException as ex:
            #for datamodel, throw an exception when edit fails
            raise admin.InternalException('Failed to edit model: %s' % (self.callerArgs.id))

    def getCallerArgs(self):
        callargs = dict()
        for n, v in self.callerArgs.data.items():
            callargs.update({n : v[0]})
        
        return callargs

    def handleCustom(self, confInfo):
        if self.customAction in ['acl']:
            return self.handleACL(confInfo)
        
        if self.customAction == 'disable':
            self.update(disabled='1')
        elif self.customAction == 'enable':
            self.update(disabled='0')
        else:
            meth = self.get_method(self.customAction)
            if meth:
                ctx = self.getContext()
                meth(ctx)
                self.makeConfItem(self.callerArgs.id, ctx.entity, confInfo)
            else:
                raise splunk.ResourceNotFound()
        
    def getContext(self):
        ctx = type('Context', (dict, object), {}) ()       
        ctx.entity = self.get()
        ctx.data = self.callerArgs.data
        
        return ctx
        
    @property
    def _endpoint(self):
        return self._model.endpoint
    
    @property
    def _optional_args(self):
        return self._model.optional_args

    @property
    def _required_args(self):
        return self._model.required_args
    
    def _namespace_and_owner(self):
        app  = self.context != admin.CONTEXT_NONE         and self.appName  or "-" 
        user = self.context == admin.CONTEXT_APP_AND_USER and self.userName or "nobody"
        
        return app, user
    

    def all(self):
        app, user = self._namespace_and_owner()
        
        return en.getEntities(self._endpoint,
                              namespace=app,
                              owner=user,
                              sessionKey=self.getSessionKey(),
                              count=self.maxCount+self.posOffset,
                              sort_key=self.sortByKey,
                              sort_dir=self.getSortDir(),
                              offset=self.posOffset)
    
    def get(self):
        app, user = self._namespace_and_owner()
        
        return en.getEntity(self._endpoint, 
                        self.callerArgs.id, 
                        namespace=app,
                        owner=user,
                        sessionKey=self.getSessionKey())

    def create(self, **params):
        app, user = self._namespace_and_owner()

        new = en.Entity(self._endpoint, 
                        self.callerArgs.id, 
                        namespace=app,
                        owner=user)
        
        for arg in self._required_args:
            new[arg] = params[arg]

        for arg in self._optional_args:
            try:
                new[arg] = params[arg]
            except:
                pass

        en.setEntity(new, sessionKey=self.getSessionKey(), strictCreate=True)
    
    def delete(self):
        app, user = self._namespace_and_owner()
        en.deleteEntity(self._endpoint, 
                        self.callerArgs.id, 
                        namespace=app,
                        owner=user,
                        sessionKey=self.getSessionKey())
             
    def update(self, **params):
        app, user = self._namespace_and_owner()
        
        ent = en.getEntity(self._endpoint, 
                           self.callerArgs.id, 
                           namespace=app,
                           owner=user,
                           sessionKey=self.getSessionKey())
            
        for arg in params.keys():
            if arg in self._required_args + self._optional_args:
                ent[arg] = params[arg] 

        #check which args are allowed to be posted
        allowedArgs = []
        if 'eai:attributes' in ent and 'requiredFields' in ent['eai:attributes'] and 'optionalFields' in ent['eai:attributes']:
            allowedArgs = ent['eai:attributes']['requiredFields'] + ent['eai:attributes']['optionalFields']

        #filter out args that aren't allowed
        for arg in ent.keys():
            if arg not in allowedArgs:
                del ent.properties[arg]

        en.setEntity(ent, sessionKey=self.getSessionKey())


# no longer used, but keep it here for compatibility purpose.
class BaseResource(object):
    pass
    
def ResourceHandler(model, handler=BaseRestHandler):
    handler._model = model()
    return type(model.__class__.__name__, (handler, object), {})


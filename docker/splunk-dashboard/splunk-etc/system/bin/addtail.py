# This work contains trade
#secrets and confidential material of Splunk Inc., and its use or disclosure in
#whole or in part without the express written permission of Splunk Inc. is prohibited.


import os
import logging as logger
import splunk.clilib.cli_common  as comm
import splunk.clilib.input_tail as input_tail
import splunk.clilib.bundle_paths as bundle_paths
import splunk.appserver.Template as Template
import splunk.appserver.html as html
import splunk.appserver.SearchService as SearchService

# if field is required, set default value to None
knownFields = {'source':None, 'index':'', 'sourcetype':''} 

# i.e. http://localhost:8000/v3/custom/addtail.add?...
def add(requestObject):
    # set output as html
    requestObject.setHeader('content-type', 'text/html')
    vals = {}
    message = ""
    try:
        # set field values, including default vals
        for field,defaultval in knownFields.items():
            if field in requestObject.args:
                vals[field] = requestObject.args[field][0].strip()
            elif defaultval == None:
                message = "<h1>Error: missing required field: %s</h1>" % field
                break
            else:
                vals[field] = defaultval
    
        session = requestObject.getSession()
        authString = session.sessionNamespaces['authXml']
        sourcetype = vals.get('sourcetype', '')
        source = vals.get('source', '')
        if len(sourcetype) == 0 or sourcetype == "n/a":
            del vals['sourcetype']
        vals["authstr"] = authString
        input_tail.add(vals, True)
        message = 'Source %s successfully added.' % source
    except Exception as e:
        message += 'Failed to add source: %s' % str(e)
        
    templ = Template.Template(bundle_paths.make_path('addtail_done.html'))
    templ.message = html.Raw('<p class="message">%s</p>' % message) 
    return templ.get_string()

if __name__ == '__main__':
    try:
        source = '/Users/davidcarasso/logs/exim.main.log'        
        vals = {'source': source, 'sourcetype':'', 'index':'main'}
        vals["authstr"] = comm.getAuthInfo('admin','changeme')
        input_tail.add(vals, True)
        print('Source %s successfully added.' % source)
    except Exception as e:
        print('Failed to add source: %s' % str(e))

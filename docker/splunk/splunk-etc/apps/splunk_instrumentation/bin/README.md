# app/bin/

This is where you put any scripts you want to add to this app.

This is also the only directory from the app that splunk puts on the python
module lookup path, so any supporting libraries should live here as well.


instrumentation.py
------------------


this is the main entry point to run the instrumentation script. this is called from 
the mod input with a token for splunkd.  But you can run directly with 
env INST_MODE=DEV  and it will use the splunkrc.json for creds

    INST_MODE=DEV python instrumentation.py
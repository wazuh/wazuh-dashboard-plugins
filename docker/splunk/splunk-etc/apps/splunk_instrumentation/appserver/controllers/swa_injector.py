import logging
import traceback
import cherrypy
from splunk_instrumentation.swa_injection_tool import SwaInitScriptRenderer
from splunk.appserver.mrsparkle.lib.htmlinjectiontoolfactory import HtmlInjectionToolFactory

logger = logging.getLogger(__name__)

try:

    swaInitScriptRenderer = SwaInitScriptRenderer(cherrypy)
    HtmlInjectionToolFactory.singleton().register_head_injection_hook(swaInitScriptRenderer)

except Exception:

    logger.error('ERROR while loading swa_injector.py: ' + traceback.format_exc())
    raise

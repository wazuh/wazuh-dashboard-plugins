/*
 * Wazuh app - XML mode
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import ace from 'brace';
import 'brace/mode/xml';
import { normalizeQueryEscapes } from './xml';

const oop = ace.acequire('ace/lib/oop');
const XmlMode = ace.acequire('ace/mode/xml').Mode;

/**
 * Custom XML mode
 *
 * Wazuh XML configurations can contain escaped XML inside <query> tags
 * for Windows EventChannel collection queries. The standard EuiCodeEditor's
 * Ace XML worker can't handle \> but handles \< fine. This mode normalizes
 * \<...\> to \<...> only inside <query> blocks, preserving syntax highlighting
 * and error detection while eliminating false positives.
 */
function WazuhXmlMode() {
  XmlMode.call(this);
}

oop.inherits(WazuhXmlMode, XmlMode);

WazuhXmlMode.prototype.createWorker = function (session) {
  const worker = XmlMode.prototype.createWorker.call(this, session);

  if (worker) {
    worker.$sendDeltaQueue = () => {
      worker.deltaQueue = null;
      worker.call('setValue', [normalizeQueryEscapes(session.getValue())]);
    };

    worker.call('setValue', [normalizeQueryEscapes(session.getValue())]);
  }

  return worker;
};

WazuhXmlMode.prototype.$id = 'ace/mode/wazuh-xml';

export default WazuhXmlMode;

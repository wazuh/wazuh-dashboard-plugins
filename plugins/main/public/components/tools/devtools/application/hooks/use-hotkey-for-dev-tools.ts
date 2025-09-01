import React, { useEffect } from 'react';
import { hasCtrlOrCmd, isEnter } from '../../types/keys';

interface Props {
  onSendRequestButton: () => void;
}

const useHotkeyForDevTools = ({ onSendRequestButton }: Props) => {
  useEffect(() => {
    // Key handler: CTRL/CMD + ENTER
    const handleKeyDown = (
      event: JQuery.KeyDownEvent<Document, undefined, Document, Document>,
    ) => {
      if (isEnter(event) && hasCtrlOrCmd(event)) {
        event.preventDefault();
        onSendRequestButton();
      }
    };
    $(window.document).on('keydown', handleKeyDown);

    // Cleanup listeners on unmount
    return () => {
      $(window.document).off('keydown', handleKeyDown);
    };
  }, []);
};

export default useHotkeyForDevTools;

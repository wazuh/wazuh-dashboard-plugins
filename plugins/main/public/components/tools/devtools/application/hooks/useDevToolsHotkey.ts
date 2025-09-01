import React, { useEffect } from 'react';
import { send } from '../../lib/actions';
import { hasCtrlOrCmd, isEnter, Keys } from '../../types/keys';

interface Props {
  editorInputRef: React.RefObject<any>;
  editorOutputRef: React.RefObject<any>;
  onStart: () => void;
  onEnd: (meta: any) => void;
}

const useDevToolsHotkey = ({
  editorInputRef,
  editorOutputRef,
  onStart,
  onEnd,
}: Props) => {
  useEffect(() => {
    // Key handler: CTRL/CMD + ENTER
    const handleKeyDown = (
      event: JQuery.KeyDownEvent<Document, undefined, Document, Document>,
    ) => {
      if (isEnter(event) && hasCtrlOrCmd(event)) {
        if (!editorInputRef.current || !editorOutputRef.current) return;
        event.preventDefault();
        return send(editorInputRef.current, editorOutputRef.current, false, {
          onStart,
          onEnd,
        });
      }
    };
    $(window.document).on('keydown', handleKeyDown);

    // Cleanup listeners on unmount
    return () => {
      $(window.document).off('keydown', handleKeyDown);
    };
  }, []);
};

export default useDevToolsHotkey;

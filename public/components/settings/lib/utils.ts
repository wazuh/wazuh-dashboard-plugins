import { ErrorHandler } from '../../../react-services/error-handler';


export function copyToClipBoard(msg) {
  const el = document.createElement('textarea');
  el.value = msg;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  ErrorHandler.info('Error copied to the clipboard');
}

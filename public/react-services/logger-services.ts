import { getToasts } from '../kibana-services';
import {
    UILogLevel,
    UILogSeverity
} from '../../common/constants';

export interface ILoggerOptions {
    context: string;
    level: UILogLevel;
    severity: UILogSeverity;
    display?: boolean; 
    store?: boolean;
    error: Error;
}

/**
    Use Example
    -----------------
    logger.error('Loans history page components fetch has failed', {
        context: 'agentService',
        level: mylogger.WARNING,
        severity: 'UI',
        display: true,
        log: true,
        error,
    });
 */

class LoggerService {
    constructor(){}

    /**
     * 
     * @param color 
     * @param title 
     * @param text 
     * @param time 
     */
    private showToast = (color, title, text, time) => {
        getToasts().add({
          color: color,
          title: title,
          text: text,
          toastLifeTimeMs: time
        });
    };

    /**
     * 
     * @param message 
     */
    private showErrorToast(message){
        this.showToast('danger','Error',message, 3000);
    }

    /**
     * 
     * @param message 
     * @param options 
     */
    private launchLog(message: string, options: ILoggerOptions){
        const display = options.display || false;
        const log = options.store || false;
        
        if(display){
           this.showErrorToast(`${message} ${options.error}`); 
        }

        if(log){
            // if log is true then call to endpoint to save frontend logs
            console.log('log service error', message, options);
        }

    }

    /**
     * 
     * @param message 
     * @param options 
     */
    error(message: string, options: ILoggerOptions){
        //const level : UILogLevel = 'ERROR';
        // i think is better to set level inside method, maybe in future.
        this.launchLog(message, options);
    }

    /**
     * 
     * @param message 
     * @param options 
     */
    info(message: string, options: ILoggerOptions){
        //const level : UILogLevel = 'INFO';
        this.launchLog(message, options);
    }

    /**
     * 
     * @param message 
     * @param options 
     */
    warning(message: string, options: ILoggerOptions){
        //const level : UILogLevel = 'WARNING';
        this.launchLog(message, options);
    }
}


export const loggerService = new LoggerService();
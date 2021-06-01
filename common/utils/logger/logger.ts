import { getToasts } from '../../../public/kibana-services';
import {
    LoggerCriticality,
    LoggerLevel
} from '../../constants';

export interface ILoggerOptions {
    context: string;
    level: LoggerLevel;
    criticality: LoggerCriticality;
    display?: boolean; // falta setearlo por defecto en false 
    log?: boolean; // falta setearlo por defecto en false 
    error: Error;
}

/**
 
    logger.error('Loans history page components fetch has failed', {
        context: 'agentService',
        level: mylogger.WARNING,
        criticality: 'UI',
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
        let display = options.display || false;
        let log = options.log || false;
        
        if(display){
           this.showErrorToast(`${message} ${options.error}`); 
        }

        if(log){
            // aca llamaria al servicio de log que guarda en el nuevo endpoint del backend
            console.log('log service error', message, options);
        }

    }

    /**
     * 
     * @param message 
     * @param options 
     */
    error(message: string, options: ILoggerOptions){
        //const criticality : LoggerLevel = 'ERROR';
        // yo eliminario el level del options y lo agregaria aca como parametro segun la funcion
        this.launchLog(message, options);
    }

    /**
     * 
     * @param message 
     * @param options 
     */
    info(message: string, options: ILoggerOptions){
        //const criticality : LoggerLevel = 'INFO';
        this.launchLog(message, options);
    }

    /**
     * 
     * @param message 
     * @param options 
     */
    warning(message: string, options: ILoggerOptions){
        //const criticality : LoggerLevel = 'WARNING';
        this.launchLog(message, options);
    }
}


export const loggerService = new LoggerService();
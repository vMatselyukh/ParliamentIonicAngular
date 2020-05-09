import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import * as _ from 'lodash';

@Injectable()
export class LoggingProvider {
    enableLogging: boolean = true;

    constructor(private platform: Platform) {
        if (this.enableLogging) {
            console.log("logging enabled")
        }
        else {
            console.log("logging disabled");
        }
    }

    log(text, argument = null) {
        if (!this.enableLogging) {
            return;
        }

        if (this.platform.is('ios')) {
            if (argument) {
                console.log(text, JSON.stringify(argument));
            }
            else {
                console.log(text);
            }
        }
        else {

        }
        if (argument) {
            console.log(text, argument);
        }
    }
}
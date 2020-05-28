import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import * as _ from 'lodash';

@Injectable()
export class LoggingProvider {
    enableLogging: boolean = false;

    constructor(private platform: Platform) {
        if (this.enableLogging) {
            console.log("logging enabled")
        }
        else {
            console.log("logging disabled");
        }
    }

    log(text, ...args) {
        if (!this.enableLogging) {
            return;
        }

        if (this.platform.is('ios')) {
            if (args.length > 0) {
                console.log(text, JSON.stringify(args));
            }
            else {
                console.log(text);
            }
        }
        else {
            console.log(text, ...args);
        }
    }
}
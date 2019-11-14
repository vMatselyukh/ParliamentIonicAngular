import { Injectable } from '@angular/core';
import { Person, ImageInfo, Config } from '../models/models';

@Injectable()
export class DbContext
{
    readonly configKey: string = "Config";

    constructor() {
    }

    // constructor(public storage: Storage) {
    // }

    // saveConfig(Config: Config): void {
    //     this.storage.set("Config", Config);
    // }

    // getConfig(): Promise<Config> {
    //     return new Promise((resolve, reject) => {
    //         this.storage.get("Config").then((data: Config) => {
    //             resolve(data);
    //         }).catch(e => {
    //             reject(e);
    //         });
    //     });
    // }
}
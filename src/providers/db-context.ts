import { Injectable } from '@angular/core';
import { Person, ImageInfo, Config } from '../models/models';
import { Storage } from '@ionic/storage';

@Injectable()
export class DbContext {
    readonly configKey: string = "Config";
    readonly coinsKey: string = "Coins";

    constructor(public storage: Storage) {
    }

    saveConfig(Config: Config): void {
        this.storage.set("Config", Config);
    }

    getConfig(): Promise<Config> {
        return new Promise((resolve, reject) => {
            this.storage.get(this.configKey).then((data: Config) => {
                resolve(data);
            }).catch(e => {
                reject(e);
            });
        });
    }

    async getCoinsCount(): Promise<number> {
        return await this.storage.get(this.coinsKey);
    };

    async saveCoins(count: number): Promise<any> {
        return await this.storage.set(this.coinsKey, count);
    };
}
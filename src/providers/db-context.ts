import { Injectable } from '@angular/core';
import { Person, ImageInfo, Config } from '../models/models';
import { Storage } from '@ionic/storage';
import * as _ from 'lodash';

@Injectable()
export class DbContext {
    readonly configKey: string = "Config";
    readonly coinsKey: string = "Coins";
    readonly languageKey: string = "Language";
    readonly coinsCountForWatchingAdv: number = 1;

    constructor(public storage: Storage) {
    }

    saveConfig(Config: Config): void {
        this.storage.set(this.configKey, Config);
    }

    getConfig(): Promise<Config> {
        return this.storage.get(this.configKey);
    }

    async getCoinsCount(): Promise<number> {
        return await this.storage.get(this.coinsKey);
    };

    async saveCoins(count: number): Promise<any> {
        return await this.storage.set(this.coinsKey, count);
    };

    async earnCoinsByWatchingAdv(): Promise<any> {
        let self = this;
        return await this.getCoinsCount().then(count => {
            self.storage.set(self.coinsKey, count + self.coinsCountForWatchingAdv);
        })
    }

    async unlockTrack(personId: number, trackId: number) {
        this.getConfig().then((config) => {
            for (let i = 0; i < config.Persons.length; i++) {
                if (config.Persons[i].Id != personId) {
                    continue;
                }

                for (let j = 0; j < config.Persons[i].Tracks.length; j++) {
                    if (config.Persons[i].Tracks[j].Id != trackId) {
                        continue;
                    }

                    config.Persons[i].Tracks[j].IsLocked = false;
                }
            }

            this.saveConfig(config);
        });
    }

    async getLanguage() {
        return await this.storage.get(this.languageKey);
    }

    setLanguage(language) {
        this.storage.set(this.languageKey, language);
    }
}
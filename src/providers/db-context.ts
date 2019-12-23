import { Injectable } from '@angular/core';
import { Person, ImageInfo, Config } from '../models/models';
import { Storage } from '@ionic/storage';
import * as _ from 'lodash';

@Injectable()
export class DbContext {
    readonly configKey: string = "Config";
    readonly coinsKey: string = "Coins";
    readonly languageKey: string = "Language"; // ua, ru
    readonly nextTimeForUpdatesKey: string = "TimeToDownloadUpdates";
    readonly androidSelectedStorageKey: string = "AndroidSelectedStorage"; // local, external
    readonly coinsCountForWatchingAdv: number = 1;
    //readonly postponeHours: number = 24;
    readonly postponeSeconds: number = 30;

    cachedConfig: Config = null;

    constructor(public storage: Storage) {
    }

    saveConfig(config: Config): void {
        this.cachedConfig = config
        this.storage.set(this.configKey, config);
    }

    getConfig(): Promise<Config> {
        if (this.cachedConfig) {
            return Promise.resolve(this.cachedConfig);
        }

        return new Promise((resolve, reject) => {
            this.storage.get(this.configKey)
                .then(config => {
                    this.cachedConfig = config;
                    resolve(config);
                })
                .catch(error => reject(error));
        })
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

    async getNextTimeToUpdate(): Promise<Date> {
        let nextTimeString = await this.storage.get(this.nextTimeForUpdatesKey);
        if (nextTimeString == null) {
            return null;
        }

        return new Date(nextTimeString);
    }

    async postponeUpdateTime(currentDateTime: Date) {
        //let newDate = currentDateTime.setHours(currentDateTime.getHours() + this.postponeHours);
        this.storage.remove(this.nextTimeForUpdatesKey);

        let newDate = currentDateTime.setSeconds(currentDateTime.getSeconds() + this.postponeSeconds);
        await this.storage.set(this.nextTimeForUpdatesKey, newDate);
    }

    async getAndroidSelectedStorage(): Promise<string> {
        return await this.storage.get(this.androidSelectedStorageKey);
    }

    async setAndroidSelectedStorage(value): Promise<void> {
        return await this.storage.set(this.androidSelectedStorageKey, value);
    }
}
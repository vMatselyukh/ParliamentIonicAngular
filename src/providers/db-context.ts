import { Injectable } from '@angular/core';
import { Person, ImageInfo, Config } from '../models/models';
import { Storage } from '@ionic/storage';
import * as _ from 'lodash';

@Injectable({
    providedIn: 'root'
})
export class DbContext {
    private readonly configKey: string = "Config";
    private readonly coinsKey: string = "Coins";
    private readonly languageKey: string = "Language"; // ua, ru
    private readonly nextTimeForUpdatesKey: string = "TimeToDownloadUpdates";
    private readonly androidSelectedStorageKey: string = "AndroidSelectedStorage"; // local, external
    private readonly userGuidKey: string = "UserGuid";
    private readonly coinsCountForWatchingAdv: number = 1;
    //readonly postponeHours: number = 24;
    private readonly postponeSeconds: number = 30;
    private readonly initialCoinsCount = 10;

    cachedConfig: Config = null;
    cachedLanguage: string = "";
    shouldBannerBeShown = false;
    cachedCoinsCount: number = -1;

    constructor(public storage: Storage) {
    }

    async saveConfig(config: Config): Promise<void> {
        this.cachedConfig = config;

        if(config)
        {
            config.Persons = config.Persons.sort((a: Person, b: Person) => {
                return a.OrderNumber > b.OrderNumber ? 1 : -1;
            });
        }

        await this.storage.set(this.configKey, config);
    }

    getConfig(): Promise<Config> {
        if (this.cachedConfig !== null) {
            this.updateBannerShouldBeShown(this.cachedConfig);
            return Promise.resolve(this.cachedConfig);
        }

        return new Promise((resolve, reject) => {
            this.storage.get(this.configKey)
                .then(config => {
                    this.cachedConfig = config;
                    if(config !== null)
                    {
                        this.updateBannerShouldBeShown(config);
                    }
                    
                    resolve(config);
                })
                .catch(error => reject(error));
        });
    }

    updateBannerShouldBeShown(config: Config) {
        let totalTrackCount = 0;
        let totalUnlockedTracks = 0;

        for (let i = 0; i < config.Persons.length; i++) {
            totalTrackCount += config.Persons[i].Tracks.length;

            for (let j = 0; j < config.Persons[i].Tracks.length; j++) {
                if (!config.Persons[i].Tracks[j].IsLocked) {
                    totalUnlockedTracks++;
                }
            }
        }

        if(totalTrackCount == 0)
        {
            this.shouldBannerBeShown = false;
        }
        else
        {
            this.shouldBannerBeShown = Math.floor((totalTrackCount - totalUnlockedTracks) / 10) < 1;
        }   
    }

    async getUserGuid(): Promise<string> {
        let userGuid = await this.storage.get(this.userGuidKey);
        if (userGuid == null) {
            await this.storage.set(this.userGuidKey, this.uuidv4());
        }

        return userGuid;
    }

    async getCoinsCount(): Promise<number> {
        if (this.cachedCoinsCount != -1) {
            return Promise.resolve(this.cachedCoinsCount);
        }

        return new Promise((resolve, reject) => {
            this.storage.get(this.coinsKey)
                .then(coins => {
                    if(coins == null) {
                        coins = this.initialCoinsCount;

                        this.saveCoins(coins);
                    }

                    resolve(coins);
                })
                .catch(error => reject(error));
        });
    };

    async saveCoins(count: number): Promise<any> {
        this.cachedCoinsCount = count;
        return await this.storage.set(this.coinsKey, count);
    };

    async earnCoinsByWatchingAdv(): Promise<any> {
        let self = this;
        return await this.getCoinsCount().then(count => {
            let newCount = count + self.coinsCountForWatchingAdv;
            self.saveCoins(newCount);
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


    //ru - 0, ua - 1 
    async getLanguage() {
        if (this.cachedLanguage) {
            return this.cachedLanguage;
        }

        let savedLanguage = await this.storage.get(this.languageKey);

        this.cachedLanguage = savedLanguage;

        return savedLanguage;
    }

    async getLanguageIndex(): Promise<number>{
        let countryName = await this.storage.get(this.languageKey);

        if (countryName == "ua") {
            return 1;
        }

        return 0;
    }

    setLanguage(language) {
        this.storage.set(this.languageKey, language);
        this.cachedLanguage = language;
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

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
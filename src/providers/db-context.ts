import { Injectable } from '@angular/core';
import { Person, ImageInfo, Config } from '../models/models';
import { Storage } from '@ionic/storage';
import { LoggingProvider } from './providers'
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
    private readonly defaultConfigIsUsedKey: string = "DefaultConfig";
    private readonly firstTimeLoadKey: string = "FirstTimeLoad";

    private readonly coinsCountForWatchingAdv: number = 10;
    readonly postponeHours: number = 24;
    private readonly initialCoinsCount = 10;

    cachedConfig: Config = null;
    cachedLanguage: string = "";
    shouldBannerBeShown = false;
    cachedCoinsCount: number = -1;
    cachedDefaultConfig: number = 0;

    constructor(public storage: Storage,
        private logger: LoggingProvider) {
    }

    async saveConfig(config: Config): Promise<void> {
        this.updateBannerShouldBeShown(config);

        if(config)
        {
            let configCopy = _.cloneDeep(config); 

            configCopy.Persons = configCopy.Persons.sort((a: Person, b: Person) => {
                return a.OrderNumber > b.OrderNumber ? 1 : -1;
            });
            
            configCopy.Persons.map(p => p.ListButtonDevicePathIos = null );

            this.cachedConfig = configCopy;
            await this.storage.set(this.configKey, configCopy);
        }
    }

    getConfig(): Promise<Config> {
        if (this.cachedConfig !== null) {
            this.updateBannerShouldBeShown(this.cachedConfig);

            let configCopy = _.cloneDeep(this.cachedConfig);
            return Promise.resolve(configCopy);
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

        if (config) {
            for (let i = 0; i < config.Persons.length; i++) {
                totalTrackCount += config.Persons[i].Tracks.length;

                for (let j = 0; j < config.Persons[i].Tracks.length; j++) {
                    if (!config.Persons[i].Tracks[j].IsLocked) {
                        totalUnlockedTracks++;
                    }
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
                        resolve(coins);
                    }

                    this.cachedCoinsCount = coins;
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

        if(savedLanguage == null)
        {
            this.setLanguage("ua");
            return "ua";
        }
        else
        {
            this.cachedLanguage = savedLanguage;
            return savedLanguage;
        }
    }

    async getLanguageIndex(): Promise<number>{
        let countryName = await this.storage.get(this.languageKey);

        if (countryName == "ua") {
            return 1;
        }

        return 0;
    }

    async setLanguage(language) {
        await this.storage.set(this.languageKey, language);
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
        this.logger.log("postponing. postpone date: ", currentDateTime);

        this.storage.remove(this.nextTimeForUpdatesKey);

        let newDate = currentDateTime.setHours(currentDateTime.getHours() + this.postponeHours);
        await this.storage.set(this.nextTimeForUpdatesKey, newDate);
    }

    async getAndroidSelectedStorage(): Promise<string> {
        return await this.storage.get(this.androidSelectedStorageKey);
    }

    async setAndroidSelectedStorage(value: string): Promise<void> {
        return await this.storage.set(this.androidSelectedStorageKey, value);
    }

    //1 - is used. -1 - is not used
    async getDefaultConfigIsUsed(): Promise<boolean> {
        this.logger.log("get default config cached value: ", this.cachedDefaultConfig);

        if (this.cachedDefaultConfig == 1) {
            return true;
        }
        else if (this.cachedDefaultConfig == -1) {
            return false;
        }

        let value = await this.storage.get(this.defaultConfigIsUsedKey);

        this.logger.log("get default config db value: ", value);

        if (value == 1) {
            this.cachedDefaultConfig = 1;
            return true;
        }
        else if (value == -1) {
            this.cachedDefaultConfig = -1;
            return false;
        }

        if (value == null) {
            this.cachedDefaultConfig = 1;
            await this.setDefaultConfigIsUsed(1);
            return true;
        }
    }

    async setDefaultConfigIsUsed(value: number): Promise<void> {
        this.cachedDefaultConfig = value;
        return await this.storage.set(this.defaultConfigIsUsedKey, value);
    }

    async getFirstTimeLoad(): Promise<boolean> {
        let value = await this.storage.get(this.firstTimeLoadKey);

        this.logger.log("first time load db context: ", value);

        if (value != null) {
            return value;
        }

        return true;
    }

    async setFirstTimeLoad(isFirstTime: boolean): Promise<boolean> {
        return await this.storage.set(this.firstTimeLoadKey, isFirstTime);
    }

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
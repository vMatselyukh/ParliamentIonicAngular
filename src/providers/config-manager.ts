import { DomSanitizer } from '@angular/platform-browser';
import { Platform } from '@ionic/angular';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Person, Config, Track, Resource, ImageInfo } from '../models/models';
import {
    DbContext, ParliamentApi, AlertManager,
    LoadingManager, FileManager, LanguageManager,
    LoggingProvider
} from './providers';
import { Network } from '@ionic-native/network/ngx';

@Injectable()
export class ConfigManager {

    config: Config;

    constructor(private dbContext: DbContext,
        private parliamentApi: ParliamentApi,
        private alertManager: AlertManager,
        private loadingManager: LoadingManager,
        private network: Network,
        private fileManager: FileManager,
        private languageManager: LanguageManager,
        private platform: Platform,
        private domSanitizer: DomSanitizer,
        private logger: LoggingProvider) {
    }

    getResourcesToDownload(dbConfig: Config, serverConfig: Config): string[] {

        let imagesToDownload = this.getImagesToDownload(dbConfig, serverConfig);
        let tracksToDownload = this.getTracksToDownload(dbConfig, serverConfig);

        return imagesToDownload.concat(tracksToDownload);
    }

    getResourcesToDelete(dbConfig: Config, serverConfig: Config): string[] {
        let imagesToDelete = this.getImagesToDelete(dbConfig, serverConfig);
        console.log('images to delete calculated');
        let tracksToDelete = this.getTracksToDelete(dbConfig, serverConfig);
        console.log('tracks to delete calculated');

        return imagesToDelete.concat(tracksToDelete);
    }

    getAllResources(dbConfig: Config): Resource[] {
        let resources = [];

        _.forEach(dbConfig.Persons, (dbPerson: Person) => {
            if (dbPerson.ListButtonPicPath.ImagePath) {
                resources.push({ Path: dbPerson.ListButtonPicPath.ImagePath, Md5: dbPerson.ListButtonPicPath.Md5Hash });
            }

            if (dbPerson.SmallButtonPicPath.ImagePath) {
                resources.push({ Path: dbPerson.SmallButtonPicPath.ImagePath, Md5: dbPerson.SmallButtonPicPath.Md5Hash });
            }

            if (dbPerson.MainPicPath.ImagePath) {
                resources.push({ Path: dbPerson.MainPicPath.ImagePath, Md5: dbPerson.MainPicPath.Md5Hash });
            }

            resources = resources.concat(_.filter(dbPerson.Tracks, track => {
                return track.Path;
            }).map(track => {
                return { Path: track.Path, Md5: track.Md5Hash };
            }));
        });

        return resources;
    }

    copyConfig(localConfig: Config, serverConfig: Config) {
        this.copyOrder(localConfig, serverConfig);
        this.updateLocalConfigByServerConfig(localConfig, serverConfig);
        //this.copyUnlockedTracks(localConfig, serverConfig);

    }

    async loadConfig(forceLoading: boolean = false) {
        let showNoInternetMessage = forceLoading;
        let showNoContentToDownloadMessage = forceLoading;

        return new Promise(async (resolve, reject) => {
            let promiseExecutionFlag = "not set";

            this.dbContext.getConfig().then(async dbConfig => {
                if (dbConfig == null) {
                    this.config.Persons = this.config.Persons.sort(this.comparer);
                    await this.dbContext.saveConfig(this.config);
                    resolve({ "message": "local config saved", "showMessage": false, "configLoaded": true })
                    //await this.loadingManager.closeLoading();
                    //this.alertManager.showNoConfigAlert(
                    //    async _ => {
                    //        let loadResult = await this.loadConfigFromServerNoConfig();
                    //        resolve(loadResult);
                    //    },
                    //    async () => {
                    //        await this.dbContext.saveConfig(this.config);
                    //        await this.dbContext.postponeUpdateTime(new Date());
                    //        resolve({ "message": await this.languageManager.getTranslations("postponed"), "showMessage": true });
                    //    });
                }
                else {
                    this.logger.log("db config isn't null.");

                    if (!this.config || this.config.Md5Hash != dbConfig.Md5Hash) {
                        this.logger.log("changing config to db config");
                        this.config = dbConfig;
                    }

                    this.logger.log("config before manipulations:", this.config);

                    let forceReloadImages = await this.isForcePathReload(this.config);
                    await this.loadImagesDevicePath(forceReloadImages);

                    
                    if (this.platform.is('ios') && await this.isDefaultConfigUsed()) {
                        this.reloadPathIos();
                    }

                    //console.log("config equals:", JSON.stringify(this.config));

                    if (this.network.type != 'none') {
                        // let's don't annoy the user. Give possibility to update later.
                        let nextTime = await this.dbContext.getNextTimeToUpdate();
                        let currentTime = new Date();

                        await this.parliamentApi.getCurrentDateTime().then(result => {
                            currentTime = result;
                        }).catch(() => {
                            promiseExecutionFlag = "false";
                        });

                        if (promiseExecutionFlag == "false") {
                            return resolve({ "message": await this.languageManager.getTranslations("error_happened_sorry"), "showMessage": true });
                        }

                        this.logger.log("force reloading: ", forceLoading);
                        this.logger.log("nextTime: ", nextTime);
                        this.logger.log("currentTime: ", currentTime);

                        if (forceLoading || nextTime == null || nextTime < currentTime) {
                            this.parliamentApi.getConfigHash()
                                .then(async hash => {
                                    await this.loadingManager.closeLoading();

                                    if (hash != this.config.Md5Hash) {

                                        console.log("hashes are different, showing message about config update");
                                        this.alertManager.showUpdateConfigAlert(
                                            async () => {
                                                let loadResult = await this.loadConfigFromServerNewContentAvailable();
                                                resolve(loadResult);
                                            },
                                            async () => {
                                                this.dbContext.postponeUpdateTime(new Date(currentTime));
                                                resolve({ "message": await this.languageManager.getTranslations("postponed"), "showMessage": true });
                                            });
                                    }
                                    //show renew missing files message
                                    else if (forceLoading) {
                                        this.alertManager.showRenewMissedFilesAlert(
                                            async () => {
                                                let loadResult = await this.loadConfigFromServerNewContentAvailable();
                                                resolve(loadResult);
                                            });
                                    }
                                    else {
                                        resolve({ "message": await this.languageManager.getTranslations("nothing_to_update"), "showMessage": showNoContentToDownloadMessage });
                                    }
                                })
                                .catch(async e => {
                                    console.log("Api get config error:" + e)
                                    resolve({ "message": await this.languageManager.getTranslations("error_happened_sorry"), "showMessage": true });
                                });
                        }
                        else {
                            resolve({ "message": await this.languageManager.getTranslations("postponed"), "showMessage": false });
                        }
                    }
                    else {
                        resolve({ "message": await this.languageManager.getTranslations("no_internet"), "showMessage": showNoInternetMessage });
                    }
                }
            }).catch(e => {
                console.log("error getting config", e);
                this.loadingManager.closeLoading();
                reject(e);
            });
        });
    }

    reloadPathIos(forceReload: boolean = false) {
        try {

            if (this.platform.is('ios')) {
                console.log("reloading path ios");
                for (var i = 0; i < this.config.Persons.length; i++) {
                    if (this.config.Persons[i].ListButtonDevicePathIos == null || forceReload) {
                        //console.log("reassigning safe urls");
                        if(this.isFileFromAssets(this.config.Persons[i].ListButtonDevicePath)) {
                            this.config.Persons[i].ListButtonDevicePathIos = this.config.Persons[i].ListButtonDevicePath;
                        }
                        else {
                            this.config.Persons[i].ListButtonDevicePathIos = this.domSanitizer.bypassSecurityTrustResourceUrl(this.config.Persons[i].ListButtonDevicePath);
                        }
                        
                        //console.log("new path ios", this.config.Persons[i].ListButtonDevicePathIos);
                    }
                }
            }
        }
        catch (e) {
            console.log("something went wrong", e);
        }
    }

    async loadConfigFromServer(loadingElement: HTMLIonLoadingElement, loadingFinishCallback: any, loadingFailedCallback: any) {
        if (this.network.type == 'none') {
            await loadingFinishCallback(true);
            await this.alertManager.showNoInternetAlert(
                async () => {
                    await this.loadConfig();
                },
                () => {
                    navigator['app'].exitApp();
                });
        }
        else {
            await this.parliamentApi.getConfig()
                .then(async config => {
                    this.lockAllTracksInServerConfig(config);

                    await this.downloadContent(loadingElement, config).then(() => {
                        console.log("Loading from server shoud be finished. Calling callback.");
                        loadingFinishCallback();
                    })
                    .catch(error => {
                        this.logger.log("load config from server error: ", error);
                        loadingFailedCallback();
                    });
                })
                .catch(e => {
                    console.log("getConfigError", e);
                    loadingFailedCallback();
                });
        }
    }

    async loadConfigFromServerNewContentAvailable(): Promise<any> {
        let loadingElement = await this.loadingManager.showConfigLoadingMessage();

        return new Promise(async (resolve, reject) => {
            await this.loadConfigFromServer(loadingElement, async (noInternet: boolean = false) => {
                if (!noInternet) {
                    await this.loadImagesDevicePath(true);
                    resolve({ "message": await this.languageManager.getTranslations("config_updated"), "showMessage": true, "configLoaded": true });
                }

                loadingElement.dismiss();
            },
                async () => {
                    console.log("dismilling loading message");
                    loadingElement.dismiss();
                    reject({ "message": await this.languageManager.getTranslations("error_happened_sorry"), "showMessage": true });
                }
            );
        });
    }

    async loadConfigFromServerNoConfig(): Promise<any> {
        let loadingElement = await this.loadingManager.showConfigLoadingMessage();

        return new Promise(async (resolve, reject) => {
            await this.loadConfigFromServer(loadingElement, async (noInternet: boolean = false) => {
                if (!noInternet) {
                    await this.loadImagesDevicePath(true);
                    resolve({ "message": "config downloaded", "showMessage": false, "configLoaded": true });
                }
                await loadingElement.dismiss();
            },
                async () => {
                    console.log("dismilling loading message");
                    loadingElement.dismiss();
                    resolve({ "message": await this.languageManager.getTranslations("error_happened_sorry"), "showMessage": true });
                }
            );
        });
    }

    isDefaultConfigUsed(): boolean {
        return !_.some(this.config.Persons, person => {
            return !this.isFileFromAssets(person.MainPicPath.ImagePath)
                || !this.isFileFromAssets(person.SmallButtonPicPath.ImagePath)
                || !this.isFileFromAssets(person.ListButtonPicPath.ImagePath);
        });
    }

    isFileFromAssets(path: string) {
        return path.indexOf("assets/images/") > -1 || path.indexOf("assets/tracks/") > -1;
    }

    updateProgress(oEvent, loadingElement: HTMLIonLoadingElement) {
        if (oEvent.lengthComputable) {
            let percentComplete = oEvent.loaded / oEvent.total * 100;
            this.updateProgressInLoadingMessage(loadingElement, percentComplete);
            console.log("loading progress: ", percentComplete.toFixed(2));

        } else {
            console.log("unable to track the progress");
        }
    }

    async updateProgressInLoadingMessage(loading: HTMLIonLoadingElement, percentage: number) {
        await this.loadingManager.updateLoadingProgress(loading, percentage);
    }

    private async downloadContent(loadingElement: HTMLIonLoadingElement, serverConfig: Config = null): Promise<any> {
        console.log("downloadContent started");

        //update process started
        if (serverConfig == null) {
            serverConfig = await this.parliamentApi.getConfig();
        }

        let localConfig = this.config;

        this.logger.log("download content. local config: ", localConfig);

        //get items that exist in serverConfig but don't exist in local config
        let itemsToDownload = this.getResourcesToDownload(localConfig, serverConfig).map(filePath => {
            return this.fileManager.normalizeFilePath(filePath);
        });

        console.log("items to download calculated");

        //delete items that exist in localConfig but don't exist in server config
        let itemsToDelete = this.getResourcesToDelete(localConfig, serverConfig).map(filePath => {
            console.log("delete file path", filePath);
            return this.fileManager.normalizeFilePath(filePath);
        });

        console.log("items to delete calculated");

        let allItemsInLocalConfig = this.getAllResources(localConfig);
        let allItemsInServerConfig = this.getAllResources(serverConfig);

        //items that are in both local and server configs
        let allActualLocalItems = allItemsInLocalConfig.filter(localItem => {
            let item = _.find(allItemsInServerConfig, serverItem => {
                return serverItem.Md5 == localItem.Md5;
            });

            return item;
        });

        this.logger.log("all actual local items: ", allActualLocalItems);

        console.log("all items", allItemsInLocalConfig);

        // let's download items from local config that are not present on device
        // but are available on the server. User may delete file so, let's allow
        // the user to download that file.
        let filesToCheck = allActualLocalItems
            .filter(item => !this.isFileFromAssets(item.Path))
            .map(item => item.Path);

        let missingItems = await this.fileManager.getMissingFiles(filesToCheck);

        this.logger.log("missing items: ", missingItems);

        let allItemsToDownload = missingItems.concat(itemsToDownload);

        console.log("all items to download", allItemsToDownload);
        console.log("to delete", itemsToDelete);

        return new Promise((resolve, reject) => {
            Promise.all([this.fileManager.getUdatesZip(allItemsToDownload, oEvent => this.updateProgress(oEvent, loadingElement),
                () => this.loadingManager.updateLoadingCopyingFiles(loadingElement))
                .then(() => this.loadingManager.updateLoadingConfigurationIsBeingApplied(loadingElement)),
            this.fileManager.deleteItems(itemsToDelete)])
                .then(async () => {
                    console.log("updates downloaded and unpacked");
                    this.copyConfig(this.config, serverConfig);
                    await this.dbContext.saveConfig(this.config);
                    //this.config = serverConfig;
                    resolve();
                })
                .catch((error) => {
                    this.alertManager.showSomeFilesWereNotDownloadedAlert();
                    console.log("Error happened. Some of the files were not downloaded", error);
                    reject();
                });
        });
    }

    private async isForcePathReload(config: Config) {
        if (await this.isDefaultConfigUsed()) {
            return false;
        }

        if (config.Persons.length > 0) {
            let personWithListIconFromStorage = config.Persons.find(person => !this.isFileFromAssets(person.ListButtonPicPath.ImagePath));

            if (personWithListIconFromStorage == null) {
                return false;
            }

            let testPath = await this.fileManager.getListButtonImagePath(personWithListIconFromStorage);
            let dbPath = personWithListIconFromStorage.ListButtonDevicePath;

            this.logger.log("check system path reload. test path: ", testPath);
            this.logger.log("check system path reload. db path: ", dbPath);

            return testPath !== dbPath;
        }

        return true;
    }

    //forceSystemCheck when download new content.
    private async loadImagesDevicePath(forceSystemCheck) {
        if (!this.config || await this.isDefaultConfigUsed() && !forceSystemCheck) {
            return;
        }

        this.logger.log('get image device path. force system check: ', forceSystemCheck);

        let startPersonsCount = this.config.Persons.length;
        for (var i = 0; i < this.config.Persons.length; i++) {
            let listButtonImagePath = this.config.Persons[i].ListButtonDevicePath;
            let smallButtonImagePath = this.config.Persons[i].SmallButtonDevicePath;
            let mainPicImagePath = this.config.Persons[i].MainPicDevicePath;

            if (forceSystemCheck || !listButtonImagePath || !smallButtonImagePath || !mainPicImagePath) {
                this.logger.log('performing get image path for person: ', this.config.Persons[i].Name);

                if (!this.isFileFromAssets(this.config.Persons[i].ListButtonPicPath.ImagePath)) {
                    listButtonImagePath = await this.fileManager.getListButtonImagePath(this.config.Persons[i]);
                    this.config.Persons[i].ListButtonDevicePath = listButtonImagePath;
                }

                if (!this.isFileFromAssets(this.config.Persons[i].SmallButtonPicPath.ImagePath)) {
                    smallButtonImagePath = await this.fileManager.getSmallButtonImagePath(this.config.Persons[i]);
                    this.config.Persons[i].SmallButtonDevicePath = smallButtonImagePath;
                }

                if (!this.isFileFromAssets(this.config.Persons[i].MainPicPath.ImagePath)) {
                    mainPicImagePath = await this.fileManager.getMainPicImagePath(this.config.Persons[i]);
                    this.config.Persons[i].MainPicDevicePath = mainPicImagePath;
                }
            }

            if (!listButtonImagePath || !smallButtonImagePath || !mainPicImagePath) {
                this.dbContext.postponeUpdateTime(new Date("01/01/2019"));
                continue;
            }
        }

        this.config.Persons = this.config.Persons.sort(this.comparer);

        this.logger.log("device path has been reloaded. force reload: ", forceSystemCheck);

        if (this.platform.is('ios')) {
            this.reloadPathIos(forceSystemCheck);
        }

        //let self = this;

        return new Promise(async (resolve, reject) => {
            if (startPersonsCount != this.config.Persons.length) {
                this.config.Md5Hash = this.config.Md5Hash + "need to be updated";
            }

            //console.log("saving db config----------------------");
            //console.log("config before saving:", JSON.stringify(this.config));

            await this.dbContext.saveConfig(this.config);


            //console.log("db config saved-----------------------");
            //console.log("config after saving:", JSON.stringify(this.config));

            resolve();
        });
    }

    public comparer(person1: Person, person2: Person) {
        let comparison = 0;
        if (person1.OrderNumber > person2.OrderNumber) {
            comparison = 1;
        } else if (person1.OrderNumber < person2.OrderNumber) {
            comparison = -1;
        }
        return comparison;
    }

    private lockAllTracksInServerConfig(serverConfig: Config) {
        for (let i = 0; i < serverConfig.Persons.length; i++) {
            for (let j = 0; j < serverConfig.Persons[i].Tracks.length; j++) {
                serverConfig.Persons[i].Tracks[j].IsLocked = true;
            }
        }

        console.log("all tracks should be locked");
    }

    private copyUnlockedTracks(localConfig: Config, serverConfig: Config) {
        if (localConfig == null) {
            return;
        }

        _.forEach(localConfig.Persons, localPerson => {
            let serverPerson = serverConfig.Persons.find(serverPerson => {
                if (serverPerson.Id == localPerson.Id) {
                    return true;
                }

                return false;
            });

            if (serverPerson == null) {
                return;
            }

            let serverPersonIndex = serverConfig.Persons.indexOf(serverPerson);

            _.forEach(localPerson.Tracks, localTrack => {
                if (!localTrack.IsLocked) {
                    let serverTrack = serverConfig.Persons[serverPersonIndex].Tracks.find(serverTrack => {
                        if (serverTrack.Id == localTrack.Id) {
                            return true;
                        }

                        return false;
                    });

                    if (serverTrack == null) {
                        return;
                    }

                    let serverTrackIndex = serverConfig.Persons[serverPersonIndex].Tracks.indexOf(serverTrack);
                    serverConfig.Persons[serverPersonIndex].Tracks[serverTrackIndex].IsLocked = false;
                }
            });
        });
    }

    private updateLocalConfigByServerConfig(localConfig: Config, serverConfig: Config) {
        for (let i = 0; i < serverConfig.Persons.length; i++) {
            let serverPerson = serverConfig.Persons[i];
            let localPerson = localConfig.Persons.find(person => person.Id === serverPerson.Id);

            if (localPerson == null) {
                localConfig.Persons.push(serverPerson);
                continue;
            }

            localPerson.Name = serverPerson.Name;
            localPerson.OrderNumber = serverPerson.OrderNumber;

            localPerson.Infos = [];

            for (let j = 0; j < serverPerson.Infos.length; j++) {
                let newLocalInfo = serverPerson.Infos[j];

                localPerson.Infos.push(newLocalInfo);
            }

            if (localPerson.ListButtonPicPath.Md5Hash !== serverPerson.ListButtonPicPath.Md5Hash) {
                localPerson.ListButtonPicPath = new ImageInfo();
                localPerson.ListButtonPicPath.ImagePath = serverPerson.ListButtonPicPath.ImagePath;
                localPerson.ListButtonPicPath.Md5Hash = serverPerson.ListButtonPicPath.Md5Hash;
            }

            if (localPerson.MainPicPath.Md5Hash !== serverPerson.MainPicPath.Md5Hash) {
                localPerson.MainPicPath = new ImageInfo();
                localPerson.MainPicPath.ImagePath = serverPerson.MainPicPath.ImagePath;
                localPerson.MainPicPath.Md5Hash = serverPerson.MainPicPath.Md5Hash;
            }

            if (localPerson.SmallButtonPicPath.Md5Hash !== serverPerson.SmallButtonPicPath.Md5Hash) {
                localPerson.SmallButtonPicPath = new ImageInfo();
                localPerson.SmallButtonPicPath.ImagePath = serverPerson.SmallButtonPicPath.ImagePath;
                localPerson.SmallButtonPicPath.Md5Hash = serverPerson.SmallButtonPicPath.Md5Hash;
            }

            let newLocalPersonTracks = [];

            for (let j = 0; j < serverPerson.Tracks.length; j++) {
                let serverPersonTrack = serverPerson.Tracks[j];

                let localTrack = localPerson.Tracks.find(track => track.Id === serverPersonTrack.Id);

                if (localTrack == null) {
                    serverPersonTrack.IsLocked = true;
                    newLocalPersonTracks.push(serverPersonTrack);
                    continue;
                }

                if (localTrack.Md5Hash !== serverPersonTrack.Md5Hash) {
                    localTrack.Path = serverPersonTrack.Path;
                }
                    
                localTrack.Name = serverPersonTrack.Name;
                localTrack.Date = new Date(serverPersonTrack.Date);

                let localTrackIndex = localPerson.Tracks.indexOf(localTrack);
                localPerson.Tracks[localTrackIndex] = localTrack;
            }

            localPerson.Tracks = localPerson.Tracks.concat(newLocalPersonTracks);

            //delete tracks that are not in server config but is in local
            let localPersonTracksToDelete = [];
            for (let i = 0; i < localPerson.Tracks.length; i++) {
                let localPersonTrack = localPerson.Tracks[i];
                let serverPersonTrack = serverPerson.Tracks.find(track => track.Id === localPersonTrack.Id);

                if (serverPersonTrack == null) {
                    localPersonTracksToDelete.push(localPersonTrack.Id);
                }
            }

            for (let i = 0; i < localPersonTracksToDelete.length; i++) {
                let localPersonTrack = localPerson.Tracks.find(track => track.Id === localPersonTracksToDelete[i]);
                let localPersonTrackIndex = localPerson.Tracks.indexOf(localPersonTrack);
                localPerson.Tracks.splice(localPersonTrackIndex, 1);
            }

            let localPersonIndex = localConfig.Persons.indexOf(localPerson);
            localConfig.Persons[localPersonIndex] = localPerson;
        }

        //delete persons who is not in server config but is in local
        let localPersonsToDelete = [];
        for (let i = 0; i < localConfig.Persons.length; i++) {
            let localPerson = localConfig.Persons[i];
            let serverPerson = serverConfig.Persons.find(person => person.Id === localPerson.Id);

            if (serverPerson == null) {
                localPersonsToDelete.push(localPerson.Id);
            }
        }

        for (let i = 0; i < localPersonsToDelete.length; i++) {
            let localPerson = localConfig.Persons.find(person => person.Id === localPersonsToDelete[i]);
            let localPersonIndex = localConfig.Persons.indexOf(localPerson);
            localConfig.Persons.splice(localPersonIndex, 1);
        }

        localConfig.Md5Hash = serverConfig.Md5Hash;
    }

    private copyOrder(localConfig: Config, serverConfig: Config) {
        localConfig.Persons.map(person => {
            let serverPerson = serverConfig.Persons.find(serverPerson => serverPerson.Id == person.Id);

            if (serverPerson != null) {
                person.OrderNumber = serverPerson.OrderNumber;
            }

            return person;
        });
    }

    private getImagesToDelete(dbConfig: Config, serverConfig: Config): string[] {
        let imagesList = [];

        //go through each person of db config
        _.forEach(dbConfig.Persons, async (dbPerson: Person) => {
            //find appropriate person in server config
            let serverPerson = _.find(serverConfig.Persons, (personFromServer: Person) => {
                return personFromServer.Id === dbPerson.Id;
            })

            let isDefaultConfigUsed = await this.isDefaultConfigUsed();

            if (serverPerson == null && !isDefaultConfigUsed) {
                imagesList.push(dbPerson.ListButtonPicPath.ImagePath);
                imagesList.push(dbPerson.MainPicPath.ImagePath);
                imagesList.push(dbPerson.SmallButtonPicPath.ImagePath);
            }
        });

        return imagesList;
    }

    private getImagesToDownload(dbConfig: Config, serverConfig: Config): string[] {
        let imagesList = [];

        //go through each person of server config
        _.forEach(serverConfig.Persons, (webServicePerson: Person) => {
            //find appropriate person in local config
            let dbPerson = _.find(dbConfig.Persons, (dbPerson: Person) => {
                return dbPerson.Id === webServicePerson.Id;
            })

            if (dbPerson != null) {
                this.logger.log("dbPerson != null: ", dbPerson.Name);
                imagesList = imagesList.concat(this.getPersonImagesToUpdate(webServicePerson, dbPerson));
            }
            else {
                imagesList.push(webServicePerson.ListButtonPicPath.ImagePath);
                imagesList.push(webServicePerson.MainPicPath.ImagePath);
                imagesList.push(webServicePerson.SmallButtonPicPath.ImagePath);
            }
        });

        return imagesList;
    }

    private getTracksToDelete(dbConfig: Config, serverConfig: Config): string[] {

        let tracksList = [];

        //go through each person of server config
        _.forEach(dbConfig.Persons, (dbConfigPerson: Person) => {
            //find appropriate person in local config
            let serverConfigPerson = _.find(serverConfig.Persons, (serverPerson: Person) => {
                return dbConfigPerson.Id === serverPerson.Id;
            })

            if (serverConfigPerson != null) {

                _.forEach(dbConfigPerson.Tracks, (dbTrack) => {
                    let serverTrack = _.find(serverConfigPerson.Tracks, (serverPersonTrack) => {
                        return serverPersonTrack.Id === dbTrack.Id;
                    });

                    if (serverTrack == null) {
                        tracksList.push(dbTrack.Path);
                    }
                })
            }
            else {
                tracksList = tracksList.concat(dbConfigPerson.Tracks.map(track => {
                    return track.Path;
                }));
            }
        });

        return tracksList;
    }

    private getTracksToDownload(dbConfig: Config, serverConfig: Config): string[] {

        let tracksList = [];

        //go through each person of server config
        _.forEach(serverConfig.Persons, (webServicePerson: Person) => {
            //find appropriate person in local config
            let dbPerson = _.find(dbConfig.Persons, (dbPerson: Person) => {
                return dbPerson.Id === webServicePerson.Id;
            })

            if (dbPerson != null) {
                tracksList = tracksList.concat(this.getPersonTracksToUpdate(webServicePerson, dbPerson));
            }
            else {
                tracksList = tracksList.concat(webServicePerson.Tracks.map(track => {
                    return track.Path;
                }));
            }
        });

        return tracksList;
    }

    private getPersonImagesToUpdate(webServicePerson: Person, dbPerson: Person): string[] {

        let imagesToUpdate = [];

        if (dbPerson.ListButtonPicPath == null || dbPerson.ListButtonPicPath.Md5Hash !== webServicePerson.ListButtonPicPath.Md5Hash) {
            this.logger.log("listbuttonpic path should be updated");

            this.logger.log("db listbuttonpic hash: ", dbPerson.ListButtonPicPath.Md5Hash);
            this.logger.log("server listbuttonpic hash: ", webServicePerson.ListButtonPicPath.Md5Hash);

            imagesToUpdate.push(webServicePerson.ListButtonPicPath.ImagePath);
        }
        if (dbPerson.MainPicPath == null || dbPerson.MainPicPath.Md5Hash !== webServicePerson.MainPicPath.Md5Hash) {
            this.logger.log("mainpic path should be updated");

            this.logger.log("db mainpic hash: ", dbPerson.MainPicPath.Md5Hash);
            this.logger.log("server mainpic hash: ", webServicePerson.MainPicPath.Md5Hash);

            imagesToUpdate.push(webServicePerson.MainPicPath.ImagePath);
        }
        if (dbPerson.SmallButtonPicPath == null || dbPerson.SmallButtonPicPath.Md5Hash !== webServicePerson.SmallButtonPicPath.Md5Hash) {
            this.logger.log("smallbuttonpic path should be updated");

            this.logger.log("db smallbuttonpic hash: ", dbPerson.SmallButtonPicPath.Md5Hash);
            this.logger.log("server smallbuttonpic hash: ", webServicePerson.SmallButtonPicPath.Md5Hash);

            imagesToUpdate.push(webServicePerson.SmallButtonPicPath.ImagePath);
        }

        return imagesToUpdate;
    }

    private getPersonTracksToUpdate(webServicePerson: Person, dbPerson: Person): string[] {
        let tracksToUpdate = [];

        //loop through each webserver track
        _.forEach(webServicePerson.Tracks, (webServiceTrack: Track) => {
            //get appropriate track from db
            let dbTrack: Track = _.find(dbPerson.Tracks, (dbTrack: Track) => {
                return webServiceTrack.Id === dbTrack.Id;
            });

            if (dbTrack != null) {
                if (dbTrack.Md5Hash !== webServiceTrack.Md5Hash) {
                    tracksToUpdate.push(webServiceTrack.Path);
                }
            }
            else {
                tracksToUpdate.push(webServiceTrack.Path);
            }
        });

        return tracksToUpdate;
    }

    private async downloadFiles(allItemsToDownload): Promise<any[]> {
        if (!allItemsToDownload || allItemsToDownload.length <= 0) {
            return;
        }

        //getting permission
        let firstItemToDownload = allItemsToDownload[0];

        await this.fileManager.downloadFile(firstItemToDownload);

        allItemsToDownload = allItemsToDownload.filter(item => {
            return item != firstItemToDownload;
        })

        let allPromises = [];

        _.forEach(allItemsToDownload, (filePathToDownload) => {
            allPromises.push(this.fileManager.downloadFile(filePathToDownload));
        });

        return await Promise.all(allPromises);
    }
}
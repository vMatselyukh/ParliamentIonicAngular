import { DomSanitizer } from '@angular/platform-browser';
import { Platform } from '@ionic/angular';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Person, Config, Track } from '../models/models';
import {
    DbContext, ParliamentApi, AlertManager,
    LoadingManager, FileManager, LanguageManager
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
        private domSanitizer: DomSanitizer) {
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

    getAllResources(dbConfig: Config): string[] {
        let resources = [];

        _.forEach(dbConfig.Persons, (dbPerson: Person) => {
            if (dbPerson.ListButtonPicPath.ImagePath) {
                resources.push(dbPerson.ListButtonPicPath.ImagePath);
            }

            if (dbPerson.SmallButtonPicPath.ImagePath) {
                resources.push(dbPerson.SmallButtonPicPath.ImagePath);
            }

            if (dbPerson.MainPicPath.ImagePath) {
                resources.push(dbPerson.MainPicPath.ImagePath);
            }

            resources = resources.concat(_.filter(dbPerson.Tracks, track => {
                return track.Path;
            }).map(track => {
                return track.Path;
            }));
        });

        return resources;
    }

    copyConfig(localConfig: Config, serverConfig: Config) {
        this.copyOrder(localConfig, serverConfig);
        this.copyUnlockedTracks(localConfig, serverConfig);
    }

    async loadConfig(forceLoading: boolean = false) {
        let showNoInternetMessage = forceLoading;
        let showNoContentToDownloadMessage = forceLoading;

        return new Promise((resolve, reject) => {
            let promiseExecutionFlag = "not set";

            this.dbContext.getConfig().then(async dbConfig => {

                if (dbConfig == null) {
                    let loadingElement = null;

                    this.alertManager.showNoConfigAlert(
                        async _ => {
                            loadingElement = await this.loadingManager.showConfigLoadingMessage();
                            await this.loadConfigFromServer(loadingElement, async () => {
                                    await this.loadImagesDevicePath(true);
                                    loadingElement.dismiss();
                                    resolve({ "message": "config downloaded", "showMessage": false }); //config downloaded
                                },
                                async () => {
                                    console.log("dismilling loading message");
                                    loadingElement.dismiss();
                                    resolve({ "message": await this.languageManager.getTranslations("error_happened_sorry"), "showMessage": true });
                                }
                            );
                        },
                        async () => {
                            navigator['app'].exitApp();
                            resolve({ "message": await this.languageManager.getTranslations("exit_from_app"), "showMessage": true });
                        });
                }
                else {
                    console.log("db config isn't null.");

                    //console.log("config before manipulations:", JSON.stringify(this.config));

                    if(!this.config || this.config.Md5Hash != dbConfig.Md5Hash)
                    {
                        console.log("config md5", this.config.Md5Hash);
                        console.log("dbConfig md5", dbConfig.Md5Hash);

                        console.log("changing config to db config");
                        this.config = dbConfig;
                    }
                    
                    //console.log("config", JSON.stringify(this.config));

                    await this.loadImagesDevicePath(false);

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

                        if (forceLoading || nextTime == null || nextTime < currentTime) {
                            this.parliamentApi.getConfigHash()
                                .then(async hash => {
                                    if (hash != this.config.Md5Hash) {

                                        console.log("hashes are different, showing message about config update");
                                        this.alertManager.showUpdateConfigAlert(
                                            async () => {
                                                let loadingElement = await this.loadingManager.showConfigLoadingMessage();

                                                await this.downloadContent(loadingElement)
                                                    .then(async () => {
                                                        await this.loadImagesDevicePath(true);
                                                        loadingElement.dismiss();
                                                        resolve({ "message": await this.languageManager.getTranslations("config_updated"), "showMessage": true });
                                                    })
                                                    .catch(async (error) => {
                                                        console.log("load content error", error);
                                                        loadingElement.dismiss();
                                                        reject(error);
                                                    });
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
                                                let loadingElement = await this.loadingManager.showConfigLoadingMessage();

                                                await this.downloadContent(loadingElement)
                                                    .then(async () => {
                                                        await this.loadImagesDevicePath(true);
                                                        await this.loadingManager.closeLoading();
                                                        resolve({ "message": await this.languageManager.getTranslations("config_updated"), "showMessage": true });
                                                    })
                                                    .catch(async (error) => {
                                                        console.log("load content error", error);
                                                        await this.loadingManager.closeLoading();
                                                        reject(error);
                                                    });
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

    reloadPathIos(forceReload: boolean = false){
        try{
        
            if(this.platform.is('ios')){
                console.log("reloading path ios");
                for (var i = 0; i < this.config.Persons.length; i++) {
                    if(this.config.Persons[i].ListButtonDevicePathIos == null || forceReload)
                    {
                        //console.log("reassigning safe urls");
                        this.config.Persons[i].ListButtonDevicePathIos = this.domSanitizer.bypassSecurityTrustResourceUrl(this.config.Persons[i].ListButtonDevicePath);
                        //console.log("new path ios", this.config.Persons[i].ListButtonDevicePathIos);
                    }
                }
            }
        }
        catch(e)
        {
            console.log("something went wrong", e);
        }
    }

    async loadConfigFromServer(loadingElement: HTMLIonLoadingElement, loadingFinishCallback: any, loadingFailedCallback: any) {
        if (this.network.type == 'none') {
            await this.alertManager.showNoInternetAlert(
                async () => {
                    await this.loadConfig();
                },
                () => {
                    navigator['app'].exitApp();
                });
            loadingFinishCallback();
        }
        else {
            await this.parliamentApi.getConfig()
                .then(async config => {
                    this.lockAllTracksInServerConfig(config);
                    //await this.dbContext.saveConfig(config);
                    await this.downloadContent(loadingElement, config);
                    console.log("Loading from server shoud be finished. Calling callback.");
                    loadingFinishCallback();
                })
                .catch(e => {
                    console.log("getConfigError", e);
                    loadingFailedCallback();
                });
        }
    }

    isDefaultConfigUsed(): boolean {
        return this.config.Persons.length == 5 && this.config.Persons[0].Infos[0].Name == 'Incognito';
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
        if(serverConfig == null) {
            serverConfig = await this.parliamentApi.getConfig();
        }

        let localConfig = this.config;

        if (this.isDefaultConfigUsed())
        {
            localConfig = new Config();
        }

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
        let allActualLocalItems = allItemsInServerConfig.filter(serverItem => {
            let item = _.find(allItemsInLocalConfig, localItem => {
                return localItem == serverItem;
            });

            return item;
        });

        console.log("all items", allItemsInLocalConfig);

        // let's download items from local config that are not present on device
        // but are available on the server. User may delete file so, let's allow
        // the user to download that file.
        let missingItems = await this.fileManager.getMissingFiles(allActualLocalItems);

        let allItemsToDownload = missingItems.concat(itemsToDownload).sort();

        console.log("all items to download", allItemsToDownload);
        console.log("to delete", itemsToDelete);

        return Promise.all([this.fileManager.getUdatesZip(allItemsToDownload, oEvent => this.updateProgress(oEvent, loadingElement),
            () => this.loadingManager.updateLoadingCopyingFiles(loadingElement))
            .then(() => this.loadingManager.updateLoadingConfigurationIsBeingApplied(loadingElement)),
            this.fileManager.deleteItems(itemsToDelete)])
                .then(async () => {
                    console.log("updates downloaded and unpacked");
                    this.copyConfig(this.config, serverConfig);
                    await this.dbContext.saveConfig(serverConfig);
                    this.config = serverConfig;
                })
                .catch((error) => {
                    this.alertManager.showSomeFilesWereNotDownloadedAlert();
                    console.log("Error happened. Some of the files were not downloaded", error);
                }).finally(async () => {
                });
    }

    //forceSystemCheck when download new content.
    private async loadImagesDevicePath(forceSystemCheck) {
        if (!this.config || this.isDefaultConfigUsed())
        {
            return;
        }

        let startPersonsCount = this.config.Persons.length;
        for (var i = 0; i < this.config.Persons.length; i++) {
            let listButtonImagePath = this.config.Persons[i].ListButtonDevicePath;
            let smallButtonImagePath = this.config.Persons[i].SmallButtonDevicePath;
            let mainPicImagePath = this.config.Persons[i].MainPicDevicePath;

            if (forceSystemCheck || !listButtonImagePath || !smallButtonImagePath || !mainPicImagePath) {
                listButtonImagePath = await this.fileManager.getListButtonImagePath(this.config.Persons[i]);
                smallButtonImagePath = await this.fileManager.getSmallButtonImagePath(this.config.Persons[i]);
                mainPicImagePath = await this.fileManager.getMainPicImagePath(this.config.Persons[i]);

                this.config.Persons[i].ListButtonDevicePath = listButtonImagePath;
                //console.log("list path:", listButtonImagePath);
                this.config.Persons[i].MainPicDevicePath = mainPicImagePath;
                //console.log("main path:", mainPicImagePath);
                this.config.Persons[i].SmallButtonDevicePath = smallButtonImagePath;
                //console.log("small path:", smallButtonImagePath);
            }

            if (!listButtonImagePath || !smallButtonImagePath || !mainPicImagePath) {
                //this.config.Persons.splice(i, 1);
                this.dbContext.postponeUpdateTime(new Date("01/01/2019"));
                continue;
            }
        }
        console.log("device path has been reloaded");

        this.reloadPathIos(forceSystemCheck);

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

    private lockAllTracksInServerConfig(serverConfig: Config) {
        for (let i = 0; i < serverConfig.Persons.length; i++) {
            for (let j = 0; j < serverConfig.Persons[i].Tracks.length; j++) {
                serverConfig.Persons[i].Tracks[j].IsLocked = true;
            }
        }

        console.log("all tracks should be locked");
    }

    private copyUnlockedTracks(localConfig: Config, serverConfig: Config) {
        if(localConfig == null)
        {
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
        _.forEach(dbConfig.Persons, (dbPerson: Person) => {
            //find appropriate person in server config
            let serverPerson = _.find(serverConfig.Persons, (personFromServer: Person) => {
                return personFromServer.Id === dbPerson.Id;
            })

            if (serverPerson == null && !this.isDefaultConfigUsed()) {
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
            imagesToUpdate.push(webServicePerson.ListButtonPicPath.ImagePath);
        }
        if (dbPerson.MainPicPath == null || dbPerson.MainPicPath.Md5Hash !== webServicePerson.MainPicPath.Md5Hash) {
            imagesToUpdate.push(webServicePerson.MainPicPath.ImagePath);
        }
        if (dbPerson.SmallButtonPicPath == null || dbPerson.SmallButtonPicPath.Md5Hash !== webServicePerson.SmallButtonPicPath.Md5Hash) {
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
                    tracksToUpdate.push(dbTrack.Path);
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
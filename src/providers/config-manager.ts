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
        private languageManager: LanguageManager) {
    }

    getResourcesToDownload(dbConfig: Config, serverConfig: Config): string[] {

        let imagesToDownload = this.getImagesToDownload(dbConfig, serverConfig);
        let tracksToDownload = this.getTracksToDownload(dbConfig, serverConfig);

        return imagesToDownload.concat(tracksToDownload);
    }

    getResourcesToDelete(dbConfig: Config, serverConfig: Config): string[] {

        let imagesToDelete = this.getImagesToDelete(dbConfig, serverConfig);
        let tracksToDelete = this.getTracksToDelete(dbConfig, serverConfig);

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
        this.copyUnlockedTracks(localConfig, serverConfig);
    }

    async loadConfig(forceLoading: boolean = false) {
        return new Promise((resolve, reject) => {
            let promiseExecutionFlag = "not set";

            this.dbContext.getConfig().then(async dbConfig => {
                console.log("config equals", dbConfig);

                if (dbConfig == null) {
                    this.alertManager.showNoConfigAlert(
                        async _ => {
                            await this.loadingManager.showConfigLoadingMessage();
                            this.loadConfigFromServer(async () => {
                                await this.downloadContent();
                                await this.loadImagesDevicePath(true);
                                this.loadingManager.closeLoading();
                                resolve({ "status": true, "message": "" }); //config downloaded
                            },
                                async () => {
                                    resolve({ "status": false, "message": await this.languageManager.getTranslations("error_happened_sorry") });
                                }
                            );
                        },
                        async () => {
                            navigator['app'].exitApp();
                            resolve({ "status": false, "message": await this.languageManager.getTranslations("exit_from_app") });
                        })
                }
                else {
                    console.log("db config isn't null.");
                    this.config = dbConfig;

                    console.log("config", this.config);

                    await this.loadImagesDevicePath(false);

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
                            return resolve({ "status": true, "message": await this.languageManager.getTranslations("error_happened_sorry") });
                        }

                        if (forceLoading || nextTime == null || nextTime < currentTime) {
                            this.parliamentApi.getConfigHash()
                                .then(async hash => {
                                    if (hash != this.config.Md5Hash) {

                                        console.log("hashes are different, showing message about config update");
                                        this.alertManager.showUpdateConfigAlert(
                                            async () => {
                                                await this.loadingManager.showConfigLoadingMessage();

                                                this.downloadContent()
                                                    .then(async () => {
                                                        this.loadImagesDevicePath(true);
                                                        await this.loadingManager.closeLoading();
                                                        resolve({ "status": true, "message": await this.languageManager.getTranslations("config_updated") });
                                                    })
                                                    .catch(async (error) => {
                                                        console.log("load content error", error);
                                                        await this.loadingManager.closeLoading();
                                                        reject(error);
                                                    });
                                            },
                                            async () => {
                                                this.dbContext.postponeUpdateTime(new Date(currentTime));
                                                resolve({ "status": true, "message": await this.languageManager.getTranslations("postponed") });
                                            });
                                    }
                                    //show renew missing files message
                                    else if (forceLoading) {
                                        this.alertManager.showRenewMissedFilesAlert(
                                            async () => {
                                                await this.loadingManager.showConfigLoadingMessage();

                                                this.downloadContent()
                                                    .then(async () => {
                                                        this.loadImagesDevicePath(true);
                                                        await this.loadingManager.closeLoading();
                                                        resolve({ "status": true, "message": await this.languageManager.getTranslations("config_updated") });
                                                    })
                                                    .catch(async (error) => {
                                                        console.log("load content error", error);
                                                        await this.loadingManager.closeLoading();
                                                        reject(error);
                                                    });
                                            });
                                    }
                                    else {
                                        resolve({ "status": true, "message": await this.languageManager.getTranslations("nothing_to_update") }); // nothing to update
                                    }
                                })
                                .catch(async e => {
                                    console.log("Api get config error:" + e)
                                    resolve({ "status": false, "message": await this.languageManager.getTranslations("error_happened_sorry") });
                                });
                        }
                        else {
                            resolve({ "status": true, "message": await this.languageManager.getTranslations("postponed") });
                        }
                    }
                    else {
                        resolve({ "status": false, "message": await this.languageManager.getTranslations("no_internet") });
                    }
                }
            }).catch(e => {
                console.log("error getting config", e);
                this.loadingManager.closeLoading();
                reject(e);
            });
        });
    }

    loadConfigFromServer(loadingFinishCallback: any, loadingFailedCallback: any) {
        if (this.network.type == 'none') {
            this.alertManager.showNoInternetAlert(
                () => {
                    this.loadConfig();
                },
                () => {
                    navigator['app'].exitApp();
                });
            loadingFinishCallback();
        }
        else {
            this.parliamentApi.getConfig()
                .then(config => {
                    this.config = config;
                    this.dbContext.saveConfig(config);
                    loadingFinishCallback();
                })
                .catch(e => {
                    console.log("getConfigError", e);
                    loadingFailedCallback();
                });
        }
    }

    private async downloadContent(): Promise<any> {
        //update process started
        let serverConfig = await this.parliamentApi.getConfig();

        //get items that exist in serverConfig but don't exist in local config
        let itemsToDownload = this.getResourcesToDownload(this.config, serverConfig).map(filePath => {
            return this.fileManager.normalizeFilePath(filePath);
        });

        //delete items that exist in localConfig but don't exist in server config
        let itemsToDelete = this.getResourcesToDelete(this.config, serverConfig).map(filePath => {
            return this.fileManager.normalizeFilePath(filePath);
        });

        let allItemsInLocalConfig = this.getAllResources(this.config);
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

        return Promise.all([this.downloadFiles(allItemsToDownload), this.fileManager.deleteItems(itemsToDelete)])
            .then(() => {
                this.copyConfig(this.config, serverConfig);
                this.dbContext.saveConfig(serverConfig);
                this.config = serverConfig;
            })
            .catch((error) => {
                console.log("error happened", error);
            });
    }

    private async loadImagesDevicePath(forceSystemCheck) {

        let startPersonsCount = this.config.Persons.length;
        for (var i = 0; i < this.config.Persons.length; i++) {
            let listButtonImagePath = this.config.Persons[i].ListButtonDevicePath;
            let smallButtonImagePath = this.config.Persons[i].SmallButtonDevicePath;
            let mainPicImagePath = this.config.Persons[i].MainPicDevicePath;

            if (forceSystemCheck || !listButtonImagePath || !smallButtonImagePath || !mainPicImagePath) {
                listButtonImagePath = await this.fileManager.getListButtonImagePath(this.config.Persons[i]);
                smallButtonImagePath = await this.fileManager.getSmallButtonImagePath(this.config.Persons[i]);
                mainPicImagePath = await this.fileManager.getMainPicImagePath(this.config.Persons[i]);
            }

            if (!listButtonImagePath || !smallButtonImagePath || !mainPicImagePath) {
                //this.config.Persons.splice(i, 1);
                this.dbContext.postponeUpdateTime(new Date("01/01/2019"));
                continue;
            }

            this.config.Persons[i].ListButtonDevicePath = listButtonImagePath;
            this.config.Persons[i].MainPicDevicePath = mainPicImagePath;
            this.config.Persons[i].SmallButtonDevicePath = smallButtonImagePath;
        }
        console.log("device path has been reloaded");

        return new Promise(async (resolve, reject) => {
            if (startPersonsCount != this.config.Persons.length) {
                this.config.Md5Hash = this.config.Md5Hash + "need to be updated";
            }

            await this.dbContext.saveConfig(this.config);

            resolve();
        });
    }

    private copyUnlockedTracks(localConfig: Config, serverConfig: Config) {
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

    private getImagesToDelete(dbConfig: Config, serverConfig: Config): string[] {
        let imagesList = [];

        //go through each person of db config
        _.forEach(dbConfig.Persons, (dbPerson: Person) => {
            //find appropriate person in server config
            let serverPerson = _.find(serverConfig.Persons, (personFromServer: Person) => {
                return personFromServer.Id === dbPerson.Id;
            })

            if (serverPerson == null) {
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
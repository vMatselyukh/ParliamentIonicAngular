import { Component } from '@angular/core';
import {
    DbContext, ParliamentApi, AlertManager,
    LoadingManager, ConfigManager,
    FileManager
} from '../../providers/providers';
import { Config, Person } from '../../models/models';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { Platform, Events } from '@ionic/angular';
import { Network } from '@ionic-native/network/ngx';
import * as _ from 'lodash';
import { WebView } from '@ionic-native/ionic-webview/ngx';


@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {

    config: Config;
    configToDownload: Config;
    coinsCount: number = 0;

    constructor(private dbContext: DbContext,
        private parliamentApi: ParliamentApi,
        private router: Router,
        private dataService: DataService,
        private platform: Platform,
        private events: Events,
        private alertManager: AlertManager,
        private loadingManager: LoadingManager,
        private network: Network,
        private configManager: ConfigManager,
        private fileManager: FileManager,
        private webview: WebView) {
    }

    ionViewDidEnter() {

        let seft = this;

        this.events.subscribe("reward:received", () => {
            seft.loadCoinsCount();
        });

        this.platform.ready().then(() => {
            this.loadCoinsCount();
            this.loadConfig();
        });
    }

    async loadConfig() {
        this.dbContext.getConfig().then(async dbConfig => {
            if (dbConfig == null) {
                this.alertManager.showNoConfigAlert(
                    async _ => {
                        await this.loadingManager.showConfigLoadingMessage();
                        this.loadConfigFromServer(() => {
                            this.loadingManager.closeLoading();
                        });
                    },
                    () => {
                        navigator['app'].exitApp();
                    })

            }
            else {
                console.log("db config isn't null.");
                this.config = dbConfig;

                for (var i = 0; i < this.config.Persons.length; i++) {
                    this.config.Persons[i].ListButtonDevicePath = await this.getListButtonImagePath(this.config.Persons[i]);
                }
                //this.loadingManager.closeLoading();

                if (this.network.type != 'none') {
                    // let's don't annouy the user. Give possibility to update later.
                    let nextTime = await this.dbContext.getNextTimeToUpdate();
                    let currentTime = await this.parliamentApi.getCurrentDateTime();

                    if (nextTime == null || nextTime < currentTime) {
                        this.parliamentApi.getConfigHash()
                            .then(hash => {
                                if (hash != this.config.Md5Hash) {
                                    this.alertManager.showUpdateConfigAlert(
                                        async () => {
                                            //update process started
                                            let serverConfig = await this.parliamentApi.getConfig();

                                            let itemsToDownload = this.configManager.getResourcesToDownload(this.config, serverConfig).map(filePath => {
                                                return this.fileManager.normalizeFilePath(filePath);
                                            });

                                            let itemsToDelete = this.configManager.getResourcesToDelete(this.config, serverConfig).map(filePath => {
                                                return this.fileManager.normalizeFilePath(filePath);
                                            });

                                            let allItemsInLocalConfig = this.configManager.getAllResources(this.config);
                                            let allItemsInServerConfig = this.configManager.getAllResources(serverConfig);

                                            //items that are in both local and server configs
                                            let allActualLocalItems = allItemsInServerConfig.filter(serverItem => {
                                                let item = _.find(allItemsInLocalConfig, localItem => {
                                                    return localItem == serverItem;
                                                });

                                                return item;
                                            })

                                            console.log("all items", allItemsInLocalConfig);

                                            // let's download items from local config that are not present on device
                                            // but are available on the server.
                                            let missingItems = await this.fileManager.getFilesToBeDownloaded(allActualLocalItems);

                                            let allItemsToDownload = missingItems.concat(itemsToDownload).sort();

                                            console.log("all items to download", allItemsToDownload);
                                            console.log("to delete", itemsToDelete);

                                            let firstItemToDownload = allItemsToDownload[0];

                                            await this.fileManager.downloadFile(firstItemToDownload);

                                            allItemsToDownload = allItemsToDownload.filter(item => {
                                                return item != firstItemToDownload;
                                            })

                                            let allPromises = [];

                                            _.forEach(allItemsToDownload, (filePathToDownload) => {
                                                allPromises.push(this.fileManager.downloadFile(filePathToDownload));
                                            });

                                            await Promise.all(allPromises);

                                            this.configManager.copyConfig(this.config, serverConfig);

                                            this.dbContext.saveConfig(serverConfig);
                                        },
                                        () => {
                                            this.dbContext.postponeUpdateTime(new Date(currentTime));
                                        })
                                }
                            })
                            .catch(e => console.log("Api get config error:" + e));
                    }
                }
            }
        }).catch(e => {
            console.log("error getting config", e);
            this.loadingManager.closeLoading();
        });
    }

    loadConfigFromServer(loadingFinishCallback: any) {
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
                    loadingFinishCallback();
                });
        }
    }

    loadCoinsCount() {

        //this.dbContext.saveCoins(0);
        this.dbContext.getCoinsCount().then((count?: number) => {
            if (count == null) {
                count = 10;

                this.dbContext.saveCoins(count)
                    .then(() =>
                        console.log('save'))
                    .catch((error) =>
                        console.log('app component error ' + JSON.stringify(error)));
            }

            this.coinsCount = count;
        });
    }


    itemClick(person: Person) {
        console.log('click');
        this.dataService.setData(person.Id, person);
        this.router.navigateByUrl(`/details/${person.Id}`);
    }

    async getListButtonImagePath(person: Person): Promise<string> {
        //console.log(person.ListButtonPicPath.ImagePath);
        let path = await this.fileManager.getFileUrl(person.ListButtonPicPath.ImagePath);
        path = this.webview.convertFileSrc(path);
        return path;
        //return person.ListButtonPicPath.ImagePath;
    }
}

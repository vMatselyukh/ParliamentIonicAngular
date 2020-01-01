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
        private fileManager: FileManager) {
        this.config = new Config();

        let fakePersons = [];

        for (let i = 0; i < 5; i++) {
            let fakePerson = new Person();
            fakePerson.ListButtonDevicePath = "assets/images/incognito.png";
            fakePerson.Name = "Incognito";
            fakePerson.Post = "-//-";

            fakePersons.push(fakePerson);
        }

        this.config.Persons = fakePersons;
    }

    ionViewDidEnter() {

        let seft = this;

        this.events.subscribe("reward:received", () => {
            seft.loadCoinsCount();
        });

        this.platform.ready().then(() => {
            this.loadCoinsCount();
            this.loadConfig();

            this.platform.resume.subscribe(() => {
                this.loadConfig();
            });

            this.platform.pause.subscribe(() => {
                console.log("pause");
            });
        });

        console.log("view did enter");
    }

    ionViewWillLeave() {
        console.log("view will leave");
    }

    ionViewDidLeave() {
        console.log("view did leave");
    }

    onPageWillLeave() {
        console.log("page will leave");
    }

    async loadConfig() {
        this.dbContext.getConfig().then(async dbConfig => {
            if (dbConfig == null) {
                this.alertManager.showNoConfigAlert(
                    async _ => {
                        await this.loadingManager.showConfigLoadingMessage();
                        this.loadConfigFromServer(async () => {
                            await this.downloadContent();

                            await this.loadImagesDevicePath(true);
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

                await this.loadImagesDevicePath(false);

                if (this.network.type != 'none') {
                    // let's don't annoy the user. Give possibility to update later.
                    let nextTime = await this.dbContext.getNextTimeToUpdate();
                    let currentTime = await this.parliamentApi.getCurrentDateTime();

                    if (nextTime == null || nextTime < currentTime) {
                        this.parliamentApi.getConfigHash()
                            .then(hash => {
                                if (hash != this.config.Md5Hash) {
                                    this.alertManager.showUpdateConfigAlert(
                                        async () => {
                                            await this.loadingManager.showConfigLoadingMessage();

                                            this.downloadContent()
                                                .then(() => {
                                                    this.loadImagesDevicePath(true);
                                                    this.loadingManager.closeLoading();
                                                })
                                                .catch((error) => {
                                                    console.log("load content error", error);
                                                    this.loadingManager.closeLoading();
                                                });
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

    getTracksCount(person: Person): number {
        if (person && person.Tracks) {
            return person.Tracks.length;
        }

        return 0;
    }

    private async downloadFiles(allItemsToDownload): Promise<any[]> {
        if (!allItemsToDownload || allItemsToDownload.length <= 0) {
            return;
        }

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

    private async downloadContent(): Promise<any> {
        //update process started
        let serverConfig = await this.parliamentApi.getConfig();

        //get items that exist in serverConfig but don't exist in local config
        let itemsToDownload = this.configManager.getResourcesToDownload(this.config, serverConfig).map(filePath => {
            return this.fileManager.normalizeFilePath(filePath);
        });

        //delete items that exist in localConfig but don't exist in server config
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
                this.configManager.copyConfig(this.config, serverConfig);
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
                this.config.Persons.splice(i, 1);
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
}

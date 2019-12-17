import { Component } from '@angular/core';
import { DbContext, ParliamentApi, AlertManager, LoadingManager } from '../../providers/providers';
import { Config, Person } from '../../models/models';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { Platform, Events } from '@ionic/angular';


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
        private loadingManager: LoadingManager) {
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
        await this.loadingManager.showConfigLoadingMessage();

        this.dbContext.getConfig().then(dbConfig => {
            if (dbConfig == null) {
                this.loadConfigFromServer(() => {
                    this.loadingManager.closeLoading();
                });
            }
            else {
                console.log("db config isn't null.");
                this.config = dbConfig;
                this.loadingManager.closeLoading();

                this.parliamentApi.getConfigHash()
                    .then(hash => {
                        if (hash != this.config.Md5Hash) {
                            this.alertManager.showUpdateConfigAlert(
                                () => {
                                    //this.configToDownload = this.configManager.getConfigToDownload(this.config, config);
                                    //this.fileManager.downloadFilesByConfig(this.configToDownload);

                                    //console.log("Config to download:" + this.configToDownload);
                                },
                                () => {
                                //later
                            })
                        }
                    })
                    .catch(e => console.log("Api get config error:" + e));
            }
        }).catch(e => {
            console.log("error getting config", e);
            this.loadingManager.closeLoading();
        });
    }

    loadConfigFromServer(loadingFinishCallback: any) {
        this.parliamentApi.getConfig()
            .then(config => {
                this.config = config;
                this.dbContext.saveConfig(config);
                loadingFinishCallback();
            })
            .catch(e => {
                this.alertManager.showNoInternetAlert(() => {
                    this.loadConfig();
                },
                () => {
                    navigator['app'].exitApp();
                });
                console.log("getConfigError", e);
                loadingFinishCallback();
            });
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
}

import { Component } from '@angular/core';
import { DbContext, ParliamentApi, ConfigManager } from '../../providers/providers';
import { Config, Person } from '../../models/models';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { MenuController, Platform, Events } from '@ionic/angular';


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
        private events: Events) {
    }

    ionViewDidEnter() {

        let seft = this;

        this.events.subscribe("reward:received", () => {
            seft.loadCoinsCount();
        });

        this.platform.ready().then(() => {
            this.loadCoinsCount();

            this.dbContext.getConfig().then(dbConfig => {
                if (dbConfig == null) {
                    this.parliamentApi.getConfig()
                        .then(config => {
                            this.config = config;
                            this.dbContext.saveConfig(config);
                        })
                        .catch(e => console.log("getConfigError:" + JSON.stringify(e)));
                }
                else {
                    console.log("db config isn't null.");
                    this.config = dbConfig;

                    //this.parliamentApi.getConfig()
                    //    .then(config => {
                    //        this.configToDownload = this.configManager.getConfigToDownload(this.config, config);
                    //        this.fileManager.downloadFilesByConfig(this.configToDownload);

                    //        console.log("Config to download:" + this.configToDownload);
                    //    })
                    //    .catch(e => console.log("Api get config error:" + e));
                }
            }); 
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

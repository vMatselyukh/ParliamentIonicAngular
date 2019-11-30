import { Component } from '@angular/core';
import { DbContext, ParliamentApi, ConfigManager } from '../../providers/providers';
import { Config, Person } from '../../models/models';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { MenuController } from '@ionic/angular';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

    config: Config;
    configToDownload: Config;

    constructor(private dbContext: DbContext,
        private parliamentApi: ParliamentApi,
        private configManager: ConfigManager,
        private router: Router,
        private dataService: DataService,
        private menu: MenuController) {
    }

    ionViewDidEnter()
    {
        //this.dbContext.getConfig().then(dbConfig => {
          //  if (dbConfig == null) {
                this.parliamentApi.getConfig()
                    .then(config => {
                        this.config = config;
                        //this.dbContext.saveConfig(config);
                    })
                    .catch(e => console.log("getConfigError:" + JSON.stringify(e)));
        //     }
        //     else {
        //         console.log("db config isn't null.");
        //         this.config = dbConfig;

        //         this.parliamentApi.getConfig()
        //             .then(config => {
        //                 this.configToDownload = this.configManager.getConfigToDownload(this.config, config);
        //                 this.fileManager.downloadFilesByConfig(this.configToDownload);

        //                 console.log("Config to download:" + this.configToDownload);
        //             })
        //             .catch(e => console.log("Api get config error:" + e));
        //     }
        // });
    }

    itemClick(person: Person)
    {
        console.log('click');
        this.dataService.setData(person.Id, person);
        this.router.navigateByUrl(`/details/${person.Id}`);
    }
}

import { Component } from '@angular/core';
import {
    DbContext, ConfigManager,
    LanguageManager
} from '../../providers/providers';
import { Config, Person, PersonInfo } from '../../models/models';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { Platform, Events } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import * as _ from 'lodash';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {

    config: Config;
    coinsCount: number = 0;

    constructor(private dbContext: DbContext,
        private router: Router,
        private dataService: DataService,
        private platform: Platform,
        private events: Events,
        private configManager: ConfigManager,
        private languageManager: LanguageManager,
        private toast: ToastController) {
        this.config = new Config();

        this.dbContext.getLanguageIndex().then(index => {
            this.languageManager.languageIndex = index;
        });

        let fakePersons = [];

        for (let i = 0; i < 5; i++) {
            let fakePerson = new Person();
            fakePerson.ListButtonDevicePath = "assets/images/incognito.png";

            let personInfo = new PersonInfo();
            personInfo.Name = "Incognito";
            personInfo.Post = "-//-";

            fakePerson.Infos = [personInfo];

            fakePersons.push(fakePerson);
        }

        this.config.Persons = fakePersons;
    }

    ionViewDidEnter() {
        let self = this;

        this.events.subscribe("reward:received", () => {
            self.loadCoinsCount();
        });

        this.events.subscribe("config:update", () => {
            self.configManager.loadConfig(true).then((result: any) => {
                if (result.status) {
                    self.config = self.configManager.config;
                    self.presentConfigUpdatedToast();
                }
                else {
                    self.presentConfigUpdatedToast(result.message);
                }
            });
        });

        this.platform.ready().then(() => {
            this.assignUserId();
            this.loadCoinsCount();
            this.configManager.loadConfig().then(() =>
            {
                this.config = this.configManager.config;
            });

            this.platform.resume.subscribe(() => {
                this.configManager.loadConfig().then(() => {
                    this.config = this.configManager.config;
                });
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

    assignUserId() {
        this.dbContext.getUserGuid();
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

    async presentConfigUpdatedToast(message: string = "Config up to date.") {
        const toast = await this.toast.create({
            message: message,
            duration: 2000,
            color: "primary"
        });
        toast.present();
    }
}

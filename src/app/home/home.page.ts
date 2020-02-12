import { Component, ViewChild, ElementRef } from '@angular/core';
import {
    DbContext, ConfigManager,
    LanguageManager, AlertManager
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

    @ViewChild('MainList', { static: false }) mainList: ElementRef;

    listItemWidth: number = 0;

    constructor(private dbContext: DbContext,
        private router: Router,
        private dataService: DataService,
        private platform: Platform,
        private events: Events,
        private configManager: ConfigManager,
        private languageManager: LanguageManager,
        private toast: ToastController,
        private alertManager: AlertManager) {
        this.config = new Config();

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

        this.platform.ready().then(() => {
            this.dbContext.getLanguageIndex().then(index => {
                this.languageManager.languageIndex = index;
            });

            this.dbContext.getConfig().then(config => {
                this.config = config;
            });
        });
    }

    ionViewDidEnter() {
        let self = this;

        this.events.subscribe("reward:received", () => {
            self.loadCoinsCount();
        });

        this.events.subscribe("config:update", () => {
            self.configManager.loadConfig(true).then((result: any) => {
                this.loadConfigProcessResult(result, true);
            });
        });

        this.platform.ready().then(() => {
            this.assignUserId();
            this.loadCoinsCount();
            this.configManager.loadConfig().then((result: any) => {
                this.loadConfigProcessResult(result, false);
            });

            this.platform.resume.subscribe(() => {
                this.configManager.loadConfig().then((result: any) => {
                    this.loadConfigProcessResult(result, false);
                });
            });

            this.platform.pause.subscribe(() => {
                console.log("pause");
            });
        });

        console.log("view did enter");
        console.log("main list height", this.mainList.nativeElement.clientHeight);

        let mainListHeight = this.mainList.nativeElement.clientHeight;
        let itemImageHeight = (mainListHeight - 2) * 0.7;
        this.listItemWidth = Math.floor(itemImageHeight * 129 / 183);
    }

    loadConfigProcessResult(result: any, showMessage: boolean = true) {
        if (result.status) {
            this.config = this.configManager.config;
            if (showMessage) {
                this.presentConfigStatusMessageAlert(result.message);
            }
        }
        else {
            this.alertManager.showInfoAlert(result.message);
        }
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

    async presentConfigStatusMessageAlert(message: string = "") {
        if (!message) {
            return;
        }

        await this.alertManager.showInfoAlert(message);
    }
}

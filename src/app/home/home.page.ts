import { Component, ViewChild, ElementRef } from '@angular/core';
import {
    DbContext, ConfigManager,
    LanguageManager, AlertManager,
    AdvProvider, FileManager
} from '../../providers/providers';
import { Config, Person, PersonInfo, Track } from '../../models/models';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { Platform, Events } from '@ionic/angular';
import * as _ from 'lodash';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {

    coinsCount: number = 0;
    configUpdateSubscribed: boolean = false;
    rewardReceivedSubscribed: boolean = false;
    platformResumeSubscribed: boolean = false;

    isIos: boolean = false;

    translations: any = null;

    @ViewChild('MainList', { static: false }) mainList: ElementRef;

    listItemWidth: number = 0;

    constructor(private dbContext: DbContext,
        private router: Router,
        private dataService: DataService,
        private platform: Platform,
        private events: Events,
        private configManager: ConfigManager,
        private languageManager: LanguageManager,
        private alertManager: AlertManager,
        private advProvider: AdvProvider,
        private fileManager: FileManager) {
    
        this.configManager.config = new Config();

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

        this.configManager.config.Persons = fakePersons;

        this.platform.ready().then(() => {
            if (this.platform.is('ios')) {
                this.isIos = true;
            }

            this.dbContext.getLanguageIndex().then(index => {
                this.languageManager.languageIndex = index;
            });

            // this.dbContext.getConfig().then(config => {

            //     console.log("config from constructor", config);
            //     this.config = config;
            // });
        });

        (async () => {
            this.translations = {
                "list": await this.languageManager.getTranslations("list")
            }
        })();
    }

    ionViewDidEnter() {
        let self = this;

        this.advProvider.hideBanner().then(() => {
            this.recalcListImagesWidthHeight();
        });

        if (!this.rewardReceivedSubscribed) {
            this.events.subscribe("reward:received", () => {
                self.loadCoinsCount();
            });

            this.rewardReceivedSubscribed = true;
        }

        //user taps update config from menu
        if (!this.configUpdateSubscribed) {
            this.events.subscribe("config:update", () => {
                console.log("config:update");
                self.configManager.loadConfig(true).then((result: any) => {
                    this.loadConfigProcessResult(result);
                });
            });

            this.configUpdateSubscribed = true;
        }

        this.platform.ready().then(async () => {
            this.assignUserId();
            this.loadCoinsCount();
            console.log("platform.ready");

            if (!this.platformResumeSubscribed) {

                await this.fileManager.getDownloadPath().then(() => {
                    //user gets back into the app
                    this.platform.resume.subscribe(() => {
                        console.log("resume");
                        this.configManager.loadConfig().then((result: any) => {
                            this.loadConfigProcessResult(result);
                        });
                    });
                });

                this.platformResumeSubscribed = true;
            }

            //happens on the initial page loading
            this.configManager.loadConfig().then((result: any) => {
                this.loadConfigProcessResult(result);
            });
        });

        this.recalcListImagesWidthHeight();

        console.log("view did enter");
        console.log("main list height", this.mainList.nativeElement.clientHeight);
    }

    loadConfigProcessResult(result: any) {
        if (result.showMessage) {
            this.presentConfigStatusMessageAlert(result.message);
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

    areUnlockedTracksAvailable(person: Person): boolean {
        if (person && person.Tracks) {

            var lockedTracks = person.Tracks.filter((track: Track) => {
                return track.IsLocked;
            });

            return lockedTracks.length > 0;
        }

        return false;
    }

    async presentConfigStatusMessageAlert(message: string = "") {
        if (!message) {
            return;
        }

        await this.alertManager.showInfoAlert(message);
    }

    recalcListImagesWidthHeight() {
        setTimeout(() => {
            let mainListHeight = this.mainList.nativeElement.clientHeight;
            let itemImageHeight = (mainListHeight - 2) * 0.7;
            this.listItemWidth = Math.floor(itemImageHeight * 129 / 183);
        }, 1);
    }
}

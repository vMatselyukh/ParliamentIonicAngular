import { Component, ViewChild, ElementRef } from '@angular/core';
import {
    DbContext, ConfigManager,
    LanguageManager, AlertManager,
    AdvProvider, FileManager,
    LoggingProvider
} from '../../providers/providers';
import { Config, Person, Track, ImageInfo } from '../../models/models';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { Platform, Events } from '@ionic/angular';
import { INITIAL_CONFIG } from './initialConfig';
import { LOCAL_CONFIG } from './config';
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

    platformClass: string = '';

    @ViewChild('MainList', { static: false }) mainList: ElementRef;

    listItemWidth: number = 0;
    homeImageUrl: string = '';

    constructor(public dbContext: DbContext,
        private router: Router,
        private dataService: DataService,
        private platform: Platform,
        private events: Events,
        public configManager: ConfigManager,
        public languageManager: LanguageManager,
        private alertManager: AlertManager,
        private advProvider: AdvProvider,
        private fileManager: FileManager,
        private logger: LoggingProvider) {
    
        this.platform.ready().then(() => {
            if (this.platform.is('ios')) {
                this.isIos = true;
            }

            if (this.platform.is('ios')) {
                this.platformClass = "ios";
            }
            else {
                this.platformClass = "android";
            }
        });

        (async () => {
            let isFirstTimeLoad = await this.dbContext.getFirstTimeLoad();

            this.logger.log("first time load: ", isFirstTimeLoad);

            if (isFirstTimeLoad) {
                this.loadLocalConfig();

                await this.dbContext.setFirstTimeLoad(false);
            }
        })();

        (async () => {
            this.translations = {
                "list": await this.languageManager.getTranslations("list")
            }
        })();
    }

    ionViewDidEnter() {
        let self = this;

        if (!this.rewardReceivedSubscribed) {
            this.events.subscribe("reward:received", () => {
                self.loadCoinsCount();
            });

            this.rewardReceivedSubscribed = true;
        }

        //user taps update config from menu
        if (!this.configUpdateSubscribed) {
            this.events.subscribe("config:update", async () => {
                console.log("config:update");
                await self.configManager.loadConfig(true).then(async (result: any) => {
                    await this.loadConfigProcessResult(result);
                });
            });

            this.configUpdateSubscribed = true;
        }

        this.platform.ready().then(async () => {
            this.assignUserId();
            this.loadCoinsCount();
            this.logger.log("platform.ready");

            this.logger.log("display width:", window.innerWidth);
            this.logger.log("display height:", window.innerHeight);

            this.dbContext.getLanguage().then(async lang => {
                if (lang === null) {
                    await this.dbContext.setLanguage("ua");
                }

                this.languageManager.languageIndex = await this.dbContext.getLanguageIndex();
            });

            if (!this.platformResumeSubscribed) {

                await this.fileManager.getDownloadPath().then(() => {
                    //user gets back into the app
                    this.platform.resume.subscribe(async () => {
                        if (!await this.configManager.isDefaultConfigUsed()) {
                            this.logger.log("resume");
                            await this.configManager.loadConfig().then(async (result: any) => {
                                await this.loadConfigProcessResult(result);
                            });
                        }
                    });
                });

                this.platformResumeSubscribed = true;
            }

            //happens on the initial page loading
            await this.configManager.loadConfig().then(async (result: any) => {
                await this.loadConfigProcessResult(result);
            });

            this.advProvider.hideBanner().then(() => {
                this.recalcListImagesWidthHeight();
            });
        });

        this.recalcListImagesWidthHeight();

        this.logger.log("view did enter");
        this.logger.log("main list height", this.mainList.nativeElement.clientHeight);
    }

    async loadConfigProcessResult(result: any) {
        this.logger.log("load config process result: ", result);

        if (result.showMessage) {
            this.presentConfigStatusMessageAlert(result.message);
        }
    }

    assignUserId() {
        this.dbContext.getUserGuid();
    }

    loadCoinsCount() {
        this.dbContext.getCoinsCount().then((count?: number) => {
            this.coinsCount = count;    
        });
    }

    async itemClick(person: Person) {
        this.logger.log('click');

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

    loadLocalConfig() {
        this.configManager.config = new Config();
        this.configManager.config.Persons = this.loadPersons(LOCAL_CONFIG);
        this.configManager.config.Md5Hash = LOCAL_CONFIG.Md5Hash
    }

    loadPersons(localConfig: any): Person[] {
        let localPersons = [];

        for (let i = 0; i < localConfig.Persons.length; i++) {
            let localPerson = new Person();
            let personFromLocalJson = localConfig.Persons[i];

            localPerson.Id = personFromLocalJson.Id;
            localPerson.Name = personFromLocalJson.Name;
            localPerson.OrderNumber = personFromLocalJson.OrderNumber;

            localPerson.MainPicPath = new ImageInfo();
            localPerson.MainPicPath.ImagePath = personFromLocalJson.MainPicPath.ImagePath;

            localPerson.SmallButtonPicPath = new ImageInfo();
            localPerson.SmallButtonPicPath.ImagePath = personFromLocalJson.SmallButtonPicPath.ImagePath;

            localPerson.ListButtonPicPath = new ImageInfo();
            localPerson.ListButtonPicPath.ImagePath = personFromLocalJson.ListButtonPicPath.ImagePath;

            localPerson.ListButtonDevicePath = personFromLocalJson.ListButtonPicPath.ImagePath;
            localPerson.ListButtonDevicePathIos = personFromLocalJson.ListButtonPicPath.ImagePath;

            localPerson.MainPicDevicePath = personFromLocalJson.MainPicPath.ImagePath;

            localPerson.SmallButtonDevicePath = personFromLocalJson.SmallButtonPicPath.ImagePath;

            localPerson.Infos = [];

            for (let j = 0; j < personFromLocalJson.Infos.length; j++) {
                let fakeInfo = personFromLocalJson.Infos[j];

                localPerson.Infos.push(fakeInfo);
            }

            localPerson.Tracks = [];

            for (let t = 0; t < personFromLocalJson.Tracks.length; t++) {
                let localTrack = new Track();
                localTrack.Path = personFromLocalJson.Tracks[t].Path;
                localTrack.Id = personFromLocalJson.Tracks[t].Id;
                localTrack.Name = personFromLocalJson.Tracks[t].Name;
                localTrack.Date = new Date(personFromLocalJson.Tracks[t].Date);
                localTrack.IsLocked = true;

                localPerson.Tracks.push(localTrack);
            }

            localPersons.push(localPerson);
        }

        return localPersons.sort(this.configManager.comparer);
    }
}

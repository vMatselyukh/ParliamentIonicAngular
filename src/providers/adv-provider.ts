import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { AdMobFree } from "@ionic-native/admob-free/ngx";
import { DbContext, AlertManager } from '../providers/providers'
import { Network } from '@ionic-native/network/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class AdvProvider {

    rewardedAndroid: string = "ca-app-pub-3291616985383560/7058759376";
    bannerAndroid: string = "ca-app-pub-3291616985383560/2201604199";
    testBannerAndroid: string = "ca-app-pub-3940256099942544/6300978111";

    rewardedIos: string = "ca-app-pub-3291616985383560/9452138367";


    requireAdvClicked: boolean = false;
    advLoadingFailed: boolean = false;
    advLoaded: boolean = false;
    advLoadingStarted: boolean = false;

    //handlers booleans
    rewardedVideoLoadedEventListenerAdded = false;
    rewardedVideoLoadFailEventListenerAdded = false;
    rewardedVideoCloseEventListenerAdded = false;
    rewardedVideoRewardEventListenerAdded = false;
    rewardedVideoLoadingStartedEventListenerAdded = false;


    constructor(private admob: AdMobFree,
        private platform: Platform,
        private dbContext: DbContext,
        private alertManager: AlertManager,
        private network: Network) {
    }

    loadAdv(rewardCallback: any = null) {
        let self = this;
        
        if (self.platform.is('cordova')) {

            console.log("init add");
            self.admob.rewardVideo.config({
                //id: 'ca-app-pub-3291616985383560/7058759376', //my adv
                id: 'ca-app-pub-3940256099942544/5224354917', //test adv
                isTesting: true,
                autoShow: false
            });

            self.admob.banner.config({
                id: this.testBannerAndroid,
                isTesting: true,
                autoShow: false
            });

            // Create banner
            self.admob.banner.prepare().then(() => {
                console.log("admob banner prepared");

                if (self.platform.is('ios')) {
                    this.hideBanner();
                }
            });

            self.admob.rewardVideo.prepare().then(() => {
                console.log("rewarded video prepared");
            });

            //document.addEventListener('admob.reward_video.complete', () => {
            //    console.log("add more coins here");
            //});

            //document.addEventListener('admob.rewardvideo.events.OPEN', function (data) { console.log('admob.banner.reward_video.OPEN', data); });

            //if (!self.rewardedVideoStartedEventListenerAdded) {
            //    document.addEventListener('admob.rewardvideo.events.START', function (data) {
            //        self.alertManager.closeAlerts();
            //        console.log('admob.reward_video.events.START', data);
            //    });

            //    self.rewardedVideoStartedEventListenerAdded = true;
            //}

            if (!self.rewardedVideoLoadedEventListenerAdded) {
                document.addEventListener('admob.rewardvideo.events.LOAD', function (data) {
                    self.advLoaded = true;
                    self.advLoadingFailed = false;

                    self.showAdvOrAlert();
                    console.log('admob.reward_video.events.LOAD', data);
                });

                self.rewardedVideoLoadedEventListenerAdded = true;
            }

            if (!self.rewardedVideoLoadFailEventListenerAdded) {
                document.addEventListener('admob.rewardvideo.events.LOAD_FAIL', function (data) {
                    self.advLoadingFailed = true;

                    self.showAdvOrAlert();
                    console.log('admob.reward_video.events.LOAD_FAIL', data);
                });

                self.rewardedVideoLoadFailEventListenerAdded = true;
            }

            if (!self.rewardedVideoCloseEventListenerAdded) {
                document.addEventListener('admob.rewardvideo.events.CLOSE', function () {
                    self.admob.rewardVideo.prepare().then(() => {
                        console.log("admob.rewardvideo.events.CLOSE");
                    });
                });

                self.rewardedVideoCloseEventListenerAdded = true;
            }

            if (!self.rewardedVideoRewardEventListenerAdded) {
                document.addEventListener('admob.rewardvideo.events.REWARD', function () {
                    console.log("admob.rewardvideo.events.REWARD");
                    self.dbContext.earnCoinsByWatchingAdv();

                    if (rewardCallback) {
                        rewardCallback();
                    }
                });

                self.rewardedVideoRewardEventListenerAdded = true;
            }
        }
    }

    showRewardedVideo() {
        this.requireAdvClicked = true;
        this.showAdvOrAlert();
    }

    showBanner() {
        console.log("show banner");
        this.admob.banner.show();
    }

    hideBanner() {
        console.log("hide banner");
        return this.admob.banner.hide();
    }

    //requireAdvClicked means the user tapped require more coins.
    showAdvOrAlert() {
        if (this.requireAdvClicked && this.advLoadingFailed && this.network.type == 'none') {
            this.alertManager.showAdNotAvailableAlert();
            this.resetValues();
        }
        else if (this.requireAdvClicked) {
            if (this.advLoaded) {
                this.alertManager.closeAlerts();
                this.showAdv();
                this.resetValues();
            }
            else if (this.network.type != 'none') {
                this.alertManager.showAddLoadingAlert();
                this.loadAdv();
            }
        }
    }

    showAdv() {
        this.admob.rewardVideo.isReady().then(() => {
            this.admob.rewardVideo.show().catch(error => {
                console.log(error);
                console.log("add show error happened " + JSON.stringify(error));
            });
        }).catch((error) => {
            console.log(error);
            console.log("ready error " + JSON.stringify(error));
        });
    }

    resetValues() {
        this.requireAdvClicked = false;
        this.advLoadingFailed = false;
        this.advLoaded = false;
    }
}
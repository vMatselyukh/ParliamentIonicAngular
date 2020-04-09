import { Component } from '@angular/core';

import { Platform, ModalController, Events } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { ProposeQuotePage } from './propose-quote/propose-quote.page';
import { LanguagePage } from './language/language.page';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { ToastController } from '@ionic/angular';
//import { Market } from '@ionic-native/market/ngx';
import { AdvProvider, AlertManager, DbContext, LanguageManager } from '../providers/providers';
import { Network } from '@ionic-native/network/ngx';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent {
    canShareUsingModileApp: boolean;

    translations: any = null;

    showExitButton: boolean = false;

    linkToShare: string = '';

    facebookAppName: string = '';

    isIos: boolean = false;

    appStoreName = "1506544870";
    googlePlayName = ""; //"com.infinite.shooting.galaxy.attack";

    constructor(
        private platform: Platform,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar,
        private modalController: ModalController,
        private socialSharing: SocialSharing,
        private toast: ToastController,
        private advProvider: AdvProvider,
        private alertManager: AlertManager,
        private events: Events,
        private dbContext: DbContext,
        private languageManager: LanguageManager,
        //private market: Market,
        private network: Network
    ) {
        this.initializeApp();

        this.reloadLanguage();
    }

    initializeApp() {
        this.platform.ready().then(async () => {
            this.statusBar.styleDefault();
            this.splashScreen.hide();

            if (this.platform.is("android")) {
                this.showExitButton = true;
                this.isIos = false;
                this.facebookAppName = 'com.facebook.katana';
            }
            else {
                this.isIos = true;
                this.facebookAppName = 'com.apple.social.facebook';
            }

            this.dbContext.getLanguage().then(async lang => {
                if (lang === null) {
                    await this.dbContext.setLanguage("ua");
                }
            });

            this.socialSharing.canShareVia(this.facebookAppName).then(
                async (result) => {
                    this.canShareUsingModileApp = true;
                    console.log("can share via mobile", result);
                }).catch(
                    (error) => {
                        console.log("can't share via mobile", error);
                        this.canShareUsingModileApp = false;
                    }
                );

            let currentLanguage = await this.dbContext.getLanguage();

            if (currentLanguage === "ru") {
                this.linkToShare = "https://parliament.matseliukh.com?language=ru";
            }
            else {
                this.linkToShare = "https://parliament.matseliukh.com";
            }

            this.advProvider.loadAdv();
        }).catch((error) => {
            console.log("platform ready error " + JSON.stringify(error));
        });
    }

    reloadLanguage() {
        (async () => {
            this.translations = {
                "propose_quotes": await this.languageManager.getTranslations("propose_quotes"),
                "check_for_updates": await this.languageManager.getTranslations("check_for_updates"),
                "get_coins": await this.languageManager.getTranslations("get_coins"),
                "chose_languge": await this.languageManager.getTranslations("chose_languge"),
                "put_mark_for_app": await this.languageManager.getTranslations("put_mark_for_app"),
                "share_in_fb": await this.languageManager.getTranslations("share_in_fb"),
                "exit": await this.languageManager.getTranslations("exit"),
                "menu": await this.languageManager.getTranslations("menu")
            };
        })();
    }

    async presentProposeQuotesModal() {
        const modal = await this.modalController.create({
            component: ProposeQuotePage
        });

        modal.onDidDismiss().then(data => {
            if (data.data.submitted) {
                this.presentThankYouToast();
            }
            else if (data.data.error) {
                this.presentErrorToast(data.data.error);
            }

            console.log(data);
        });

        return await modal.present();
    }

    async rateApp() {
        if (this.network.type == 'none') {
            await this.alertManager.showPlainNoInternetMessage();

            return;
        }

        if (this.isIos) {
            window.open(`itms-apps://itunes.apple.com/app/${this.appStoreName}`, '_self');
            //this.market.open(this.appStoreName).then(() => {
            //    console.log("successfully open app store page");
            //}).catch(() => {
            //    console.log("error opening app store page");
            //});
        }
        else {

            window.open(`market://details?id=${this.googlePlayName}`);
            //this.market.open(this.googlePlayName).then(() => {
            //    console.log("successfully open app store page");
            //}).catch(() => {
            //    console.log("error opening app store page");
            //});
        }
    }

    async presentChooseLanguageModal() {
        const modal = await this.modalController.create({
            component: LanguagePage
        });

        modal.onDidDismiss().then(async data => {
            if (data.data.language) {
                await this.dbContext.setLanguage(data.data.language);
                this.languageManager.languageIndex = await this.dbContext.getLanguageIndex();

                this.reloadLanguage();
            }
            //reload ui translations
            console.log(data);
        });

        return await modal.present();
    }

    async shareInFbClick() {
        if (this.network.type == 'none') {
            await this.alertManager.showPlainNoInternetMessage();

            return;
        }

        this.socialSharing.canShareVia(this.facebookAppName).then(
            async () => {
                let shareText = await this.languageManager.getTranslations("share_text");
                let currentLanguage = await this.dbContext.getLanguage();

                if (currentLanguage === "ru") {
                    await this.socialSharing.shareViaFacebook(shareText, null, this.linkToShare);
                }
                else {
                    await this.socialSharing.shareViaFacebook(shareText, null, this.linkToShare);
                }

            }).catch(
                (e) => console.log("Error social sharing ", e)
            );
    }

    async shareInFbClickBrowser() {
        if (this.network.type == 'none') {
            await this.alertManager.showPlainNoInternetMessage();

            return;
        }

        let fbShareLink = document.querySelector("#FbHidden") as HTMLElement;
        fbShareLink.click();
    }

    async presentThankYouToast() {
        const toast = await this.toast.create({
            message: await this.languageManager.getTranslations("thank_you"),
            duration: 2000,
            color: "dark"
        });
        toast.present();
    }

    async presentErrorToast(error) {
        const toast = await this.toast.create({
            message: error,
            duration: 2000,
            color: "warning"
        });
        toast.present();
    }

    updateConfig() {
        this.events.publish("config:update");
    }

    showGetCoinsAlert() {
        let self = this;

        this.alertManager.showGetCoinsAlert(() => {
            self.advProvider.showRewardedVideo();
        });
    }

    exitApp() {
        this.alertManager.showExitConfirmationAlert(() => {
            navigator['app'].exitApp();
        });
    }
}

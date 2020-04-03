import { Component } from '@angular/core';

import { Platform, ModalController, Events } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { ProposeQuotePage } from './propose-quote/propose-quote.page';
import { LanguagePage } from './language/language.page';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { ToastController } from '@ionic/angular';

import { AdvProvider, AlertManager, DbContext, LanguageManager } from '../providers/providers';

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

    isIos: boolean = false;

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
        private languageManager: LanguageManager
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
            }
            else {
                this.isIos = true;
            }

            this.dbContext.getLanguage().then(lang => {
                if (lang === null) {
                    this.dbContext.setLanguage("ua");
                }
            });

            this.socialSharing.canShareVia("com.apple.social.facebook").then(
                async () => {
                    this.canShareUsingModileApp = true;
                    console.log("can share via mobile");
                }).catch(
                    () => {
                        console.log("can't share via mobile");
                        this.canShareUsingModileApp = false;
                    }
                );

            let currentLanguage = await this.dbContext.getLanguage();

            if (currentLanguage === "ru") {
                this.linkToShare = "https://parliament.matseliukh.com?available=true&language=ru";
            }
            else {
                this.linkToShare = "https://parliament.matseliukh.com?available=true";
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
        this.socialSharing.canShareVia("com.apple.social.facebook").then(
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
        let fbShareLink = document.querySelector("#FbHidden") as HTMLElement;

        fbShareLink.click();

        //window.navigator.share({ title: shareText, url: this.linkToShare });

        //this.socialSharing.shareViaFacebook(shareText, null, this.linkToShare);
    }

    Test() {
        console.log("Test button clicked");
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

import { Component } from '@angular/core';

import { Platform, ModalController, Events } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { ProposeQuotePage } from './propose-quote/propose-quote.page';
import { LanguagePage } from './language/language.page';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { ShareService } from '@ngx-share/core';
import { ToastController } from '@ionic/angular';

import { AdvProvider, AlertManager, DbContext, LanguageManager } from '../providers/providers';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent {
    canShareUsingModileApp: boolean;

    constructor(
        public share: ShareService,
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
    }

    initializeApp() {
        this.platform.ready().then(() => {
            this.statusBar.styleDefault();
            this.splashScreen.hide();

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
        }).catch((error) => {
            console.log("platform ready error " + JSON.stringify(error));
        });
    }

    async presentProposeQuotesModal() {
        const modal = await this.modalController.create({
            component: ProposeQuotePage
        });

        modal.onDidDismiss().then(data => {
            if (data.data.submitted) {
                this.presentThankYouToast();
            }
            else {
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
            }
            //reload ui translations
            console.log(data);
        });

        return await modal.present();
    }

    async shareInFbClick() {
        this.socialSharing.canShareVia("com.apple.social.facebook").then(
            async () => {
                await this.socialSharing.shareViaFacebook("Some message here", null, "https://matseliukh.com");
            }).catch(
                (e) => console.log("Error social sharing ", e)
            );
    }

    async presentThankYouToast() {
        const toast = await this.toast.create({
            message: 'Thank you.',
            duration: 2000,
            color: "primary"
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

    showGetCoinsAlert() {
        let self = this;

        this.advProvider.loadAdv(() => {
            this.events.publish("reward:received");
        });

        this.alertManager.showGetCoinsAlert(() => {
            self.advProvider.showRewardedVideo();
        });
    }

    showExitButton() {
        return this.platform.is("android");
    }

    exitApp() {
        this.alertManager.showExitConfirmationAlert(() => {
            navigator['app'].exitApp();
        });
    }
}

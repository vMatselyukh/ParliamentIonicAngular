import { Component } from '@angular/core';

import { Platform, ModalController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { ProposeQuotePage } from './propose-quote/propose-quote.page';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { ShareService } from '@ngx-share/core';
import { ToastController } from '@ionic/angular';

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
        private toast: ToastController
    ) {
        this.initializeApp();
    }

    initializeApp() {
        this.platform.ready().then(() => {
            this.statusBar.styleDefault();
            this.splashScreen.hide();

            this.socialSharing.canShareVia("facebook").then(
                async () => {
                    this.canShareUsingModileApp = true;
                }).catch(
                    () => {
                        this.canShareUsingModileApp = false;
                    }
            );
        }).catch((error) => {
            console.log("platform ready error " + JSON.stringify(error));
        });
    }

    async presentModal() {
        const modal = await this.modalController.create({
            component: ProposeQuotePage
        });

        modal.onDidDismiss().then(data => {
            if (data.data.submitted) {
                this.presentThankYouToast();
            }

            console.log(data);
        });

        return await modal.present();
    }

    async shareInFbClick() {
        this.socialSharing.canShareVia("facebook").then(
            async () => {
                await this.socialSharing.shareViaFacebook("Some message here", null, "https://matseliukh.com");
            }).catch(
                (e) => console.log("Error social sharing " + JSON.stringify(e))
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
}

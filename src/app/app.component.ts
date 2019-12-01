import { Component, OnInit } from '@angular/core';

import { Platform, ModalController, PopoverController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { ProposeQuotePage } from './propose-quote/propose-quote.page';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { ShareService } from '@ngx-share/core';

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
        private socialSharing: SocialSharing
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
        });
    }

    async presentModal() {
        const modal = await this.modalController.create({
            component: ProposeQuotePage
        });
        return await modal.present();
    }

    dismiss() {
        this.modalController.dismiss({
            'dismissed': true
        });
    }

    async shareInFbClick() {
        this.socialSharing.canShareVia("facebook").then(
            async () => {
                await this.socialSharing.shareViaFacebook("Some message here", null, "https://matseliukh.com");
            }).catch(
                (e) => console.log("Error social sharing " + JSON.stringify(e))
            );
    }
}

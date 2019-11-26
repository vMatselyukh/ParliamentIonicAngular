import { Component, OnInit } from '@angular/core';

import { Platform, ModalController, PopoverController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { ProposeQuotePage } from './propose-quote/propose-quote.page';
import { SocialPopoverComponent } from './social-popover/social-popover.component';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(
        private platform: Platform,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar,
        private modalController: ModalController,
        private popoverController: PopoverController
    ) {
        this.initializeApp();
    }

    initializeApp() {
        this.platform.ready().then(() => {
            this.statusBar.styleDefault();
            this.splashScreen.hide();
        });
    }

    ngOnInit() {
        
    }

    async presentModal() {
        const modal = await this.modalController.create({
            component: ProposeQuotePage
        });
        return await modal.present();
    }

    async presentPopover(ev: any) {
        const popover = await this.popoverController.create({
            component: SocialPopoverComponent,
            event: ev,
            translucent: true
        });
        return await popover.present();
    }

    dismiss() {
        this.modalController.dismiss({
            'dismissed': true
        });
    }
}

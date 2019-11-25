import { Component } from '@angular/core';

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
export class AppComponent {
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
      this.loadFbSdk();
    });
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

  loadFbSdk(){
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }
}

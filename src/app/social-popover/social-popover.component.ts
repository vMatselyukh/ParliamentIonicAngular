import { Component, OnInit } from '@angular/core';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';

@Component({
    selector: 'app-social-popover',
    templateUrl: './social-popover.component.html',
    styleUrls: ['./social-popover.component.scss'],
})
export class SocialPopoverComponent implements OnInit {

    constructor(private socialSharing: SocialSharing) {
    }

    ngOnInit() {
        //this.loadFbSdk();
    }

    ionViewDidLeave() {
        var elementToDelete = document.getElementById('facebook-jssdk');
        elementToDelete.remove();
    }

    async shareInFbClick() {
        await this.socialSharing.shareViaFacebook("Some message here", null, "https://matseliukh.com");
    }

    loadFbSdk() {
        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }

    shareInVkClick() {

    }
}
